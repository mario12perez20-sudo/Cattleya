/**
 * Cattleya — Carta de brunch
 * Esquema "documento único" (igual a Beer Garden): un solo get() a
 * catalog/brunch trae todas las secciones e items anidados. El orden y
 * el filtrado de "activo" se resuelven en JavaScript, no en la consulta
 * — por eso nunca hace falta crear índices en Firestore.
 *
 * Script normal (SDK compat, sin módulos) — usa window.CATTLEYA_DB.
 */

(function () {
  const container = document.getElementById("brunch-menu");

  function priceMarkup(item) {
    const promo = item.promo;
    if (promo && promo.active) {
      let finalPrice = item.price;
      if (promo.discountType === "percent") {
        finalPrice = Math.round(item.price * (1 - promo.discountValue / 100));
      } else if (promo.discountType === "fixed") {
        finalPrice = Math.max(item.price - promo.discountValue, 0);
      }
      return `<span class="product-card__price--old">${formatCOP(item.price)}</span>${formatCOP(finalPrice)}`;
    }
    return formatCOP(item.price);
  }

  // headingTag: h4 dentro de un subgrupo (h2 > h3 > h4); h3 si cuelga directo de la sección (h2 > h3).
  function renderMenuItem(item, headingTag = "h3") {
    const img = item.images && item.images[0];
    return `
      <div class="menu-item">
        ${
          img
            ? `<div class="menu-item__thumb"><img src="${img}" alt="" loading="lazy"></div>`
            : `<div></div>`
        }
        <div>
          <${headingTag} class="menu-item__name">${escapeHTML(item.name)}</${headingTag}>
          ${item.description ? `<p class="menu-item__desc">${escapeHTML(item.description)}</p>` : ""}
        </div>
        <div class="menu-item__price">${priceMarkup(item)}</div>
      </div>
    `;
  }

  // Tarjeta grande (imagen arriba, info abajo) — para secciones con fotos,
  // como Para el hambre / Para el antojo. Reutiliza el mismo componente
  // visual que el catálogo de plantas (.product-card).
  function renderProductCard(item, headingTag = "h3") {
    const img = item.images && item.images[0];
    return `
      <article class="product-card">
        <div class="product-card__media">
          <img src="${img || "assets/img/orquidea-tile.svg"}" alt="" loading="lazy">
        </div>
        <div class="product-card__body">
          <${headingTag} class="product-card__title">${escapeHTML(item.name)}</${headingTag}>
          ${item.description ? `<p class="product-card__desc">${escapeHTML(item.description)}</p>` : ""}
          <div class="product-card__footer">
            <span class="product-card__price">${priceMarkup(item)}</span>
          </div>
        </div>
      </article>
    `;
  }

  // Subgrupos de Bebidas que se muestran como tarjeta de producto (foto
  // arriba, info abajo, grilla de a 2 en mobile) en vez de lista compacta
  // con ícono chico. Decisión de Mario (2026-09-07): Café/chocolate y Sodas
  // en tarjeta; Infusiones y Agua se quedan como lista compacta (como
  // Adiciones). No hay campo para esto en Firestore — es una convención de
  // nombre de subgrupo definida acá; si cambia el criterio, ajustar este set.
  const CARD_SUBGROUPS = new Set(["A base de café y chocolate", "Sodas"]);

  function renderSection(section) {
    const items = (section.items || [])
      .filter((item) => item.active !== false)
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    if (items.length === 0) return "";

    const hasSubgroups = items.some((item) => item.subgroup);
    // Solo cuenta como "tiene foto" (layout de tarjeta grande) si es una foto
    // real del plato (assets/img/brunch/web/...). Los íconos de Adiciones
    // (assets/img/brunch/icons/...) NO deben activar el layout de tarjeta —
    // son miniaturas para la lista compacta, no fotos de producto.
    const isDishPhoto = (url) => typeof url === "string" && url.includes("/web/");
    const hasPhotos = items.some((item) => (item.images || []).some(isDishPhoto));

    let body;
    if (hasSubgroups) {
      // Bebidas: por subgrupo, tarjeta de producto (CARD_SUBGROUPS) o lista
      // compacta con ícono (el resto) — ver comentario de CARD_SUBGROUPS arriba.
      const groups = {};
      items.forEach((item) => {
        const key = item.subgroup || "Otros";
        groups[key] = groups[key] || [];
        groups[key].push(item);
      });
      body = Object.entries(groups)
        .map(([groupName, groupItems]) => {
          const list = CARD_SUBGROUPS.has(groupName)
            ? `<div class="product-grid product-grid--compact">${groupItems.map((i) => renderProductCard(i, "h4")).join("")}</div>`
            : `<div class="menu-list">${groupItems.map((i) => renderMenuItem(i, "h4")).join("")}</div>`;
          return `
            <h3 class="menu-subgroup-title">${escapeHTML(groupName)}</h3>
            ${list}
          `;
        })
        .join("");
    } else if (hasPhotos) {
      // Platos con foto (sal, dulce): tarjetas grandes en grilla.
      body = `<div class="product-grid">${items.map((i) => renderProductCard(i)).join("")}</div>`;
    } else {
      // Sin foto (adiciones): lista compacta.
      body = `<div class="menu-list">${items.map((i) => renderMenuItem(i)).join("")}</div>`;
    }

    return `
      <section class="menu-section" id="cat-${section.id}">
        <div class="section-title">
          ${section.subtitle ? `<span class="eyebrow">${escapeHTML(section.subtitle)}</span>` : ""}
          <h2>${escapeHTML(section.name)}</h2>
        </div>
        ${body}
      </section>
    `;
  }

  // Etiquetas cortas para la barra de secciones: los nombres de Firestore son
  // frases poéticas ("de un brunch que enamora"), no sirven como chip.
  const JUMP_LABELS = { "brunch-sal": "Salado", "brunch-dulce": "Dulce", "brunch-bebidas": "Bebidas", "brunch-adiciones": "Adiciones" };

  async function init() {
    if (!container) return;
    container.innerHTML = `<p class="state-message" role="status">Cargando la carta…</p>`;

    try {
      const snap = await window.CATTLEYA_DB.collection("catalog").doc("brunch").get();
      if (!snap.exists) {
        container.innerHTML = `<p class="state-message">La carta estará disponible pronto.</p>`;
        return;
      }

      const data = snap.data();
      const sections = (data.sections || [])
        .filter((s) => s.active !== false)
        .sort((a, b) => (a.order || 0) - (b.order || 0));

      const html = sections.map(renderSection).filter(Boolean).join("");
      const jump = sections.length > 1 ? `<nav class="menu-jump" aria-label="Secciones de la carta">${sections.map((s) => `<a class="category-chip" href="#cat-${escapeHTML(s.id)}">${escapeHTML(JUMP_LABELS[s.id] || s.name)}</a>`).join("")}</nav>` : "";
      container.innerHTML = html ? jump + html : `<p class="state-message">La carta estará disponible pronto.</p>`;
    } catch (err) {
      console.error("Error cargando la carta de brunch:", err);
      container.innerHTML = `<p class="state-message">No pudimos cargar la carta. Intenta de nuevo en un momento.</p>`;
    }
  }

  init();
})();
