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

  function renderMenuItem(item) {
    const img = item.images && item.images[0];
    return `
      <div class="menu-item">
        ${
          img
            ? `<div class="menu-item__thumb"><img src="${img}" alt="${item.name}" loading="lazy"></div>`
            : `<div></div>`
        }
        <div>
          <h4 class="menu-item__name">${item.name}</h4>
          ${item.description ? `<p class="menu-item__desc">${item.description}</p>` : ""}
        </div>
        <div class="menu-item__price">${priceMarkup(item)}</div>
      </div>
    `;
  }

  // Tarjeta grande (imagen arriba, info abajo) — para secciones con fotos,
  // como Para el hambre / Para el antojo. Reutiliza el mismo componente
  // visual que el catálogo de plantas (.product-card).
  function renderProductCard(item) {
    const img = item.images && item.images[0];
    return `
      <article class="product-card">
        <div class="product-card__media">
          <img src="${img}" alt="${item.name}" loading="lazy">
        </div>
        <div class="product-card__body">
          <h3 class="product-card__title">${item.name}</h3>
          ${item.description ? `<p class="product-card__desc">${item.description}</p>` : ""}
          <div class="product-card__footer">
            <span class="product-card__price">${priceMarkup(item)}</span>
          </div>
        </div>
      </article>
    `;
  }

  function renderSection(section) {
    const items = (section.items || [])
      .filter((item) => item.active !== false)
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    if (items.length === 0) return "";

    const hasSubgroups = items.some((item) => item.subgroup);
    const hasPhotos = items.some((item) => item.images && item.images.length);

    let body;
    if (hasSubgroups) {
      // Bebidas y similares: siempre en lista compacta agrupada, tengan o no foto.
      const groups = {};
      items.forEach((item) => {
        const key = item.subgroup || "Otros";
        groups[key] = groups[key] || [];
        groups[key].push(item);
      });
      body = Object.entries(groups)
        .map(
          ([groupName, groupItems]) => `
            <h4 class="menu-subgroup-title">${groupName}</h4>
            <div class="menu-list">${groupItems.map(renderMenuItem).join("")}</div>
          `
        )
        .join("");
    } else if (hasPhotos) {
      // Platos con foto (sal, dulce): tarjetas grandes en grilla.
      body = `<div class="product-grid">${items.map(renderProductCard).join("")}</div>`;
    } else {
      // Sin foto (adiciones): lista compacta.
      body = `<div class="menu-list">${items.map(renderMenuItem).join("")}</div>`;
    }

    return `
      <section class="menu-section" id="cat-${section.id}">
        <div class="section-title">
          ${section.subtitle ? `<span class="eyebrow">${section.subtitle}</span>` : ""}
          <h2>${section.name}</h2>
        </div>
        ${body}
      </section>
    `;
  }

  async function init() {
    if (!container) return;
    container.innerHTML = `<p class="state-message">Cargando la carta…</p>`;

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

      const html = sections.map(renderSection).join("");
      container.innerHTML = html || `<p class="state-message">La carta estará disponible pronto.</p>`;
    } catch (err) {
      console.error("Error cargando la carta de brunch:", err);
      container.innerHTML = `<p class="state-message">No pudimos cargar la carta. Intenta de nuevo en un momento.</p>`;
    }
  }

  init();
})();
