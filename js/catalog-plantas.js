/**
 * Cattleya — Catálogo de plantas y orquídeas
 * Esquema "documento único" (igual a Beer Garden): un solo get() a
 * catalog/plantas trae todas las secciones (categorías) e items
 * (productos) anidados. Filtrado y orden se resuelven en JavaScript.
 * Vitrina + WhatsApp por ahora (sin carrito) — ver docs/ARCHITECTURE.md.
 *
 * Script normal (SDK compat, sin módulos) — usa window.CATTLEYA_DB.
 */

(function () {
  const FALLBACK_IMG = "assets/img/plantas/placeholder.svg";

  const grid = document.getElementById("plantas-grid");
  const filtersEl = document.getElementById("plantas-filters");
  const generalWaBtn = document.getElementById("plantas-wa-general");

  let sections = [];
  let activeSectionId = "all";
  let whatsappNumber = "";

  async function loadSettings() {
    try {
      const snap = await window.CATTLEYA_DB.collection("settings").doc("site").get();
      if (snap.exists) {
        whatsappNumber = snap.data().whatsappNumber || "";
        if (generalWaBtn && whatsappNumber) {
          generalWaBtn.href = buildGeneralInquiryLink(whatsappNumber);
        }
      }
    } catch (err) {
      console.error("No se pudo cargar settings/site:", err);
    }
  }

  async function loadCatalog() {
    const snap = await window.CATTLEYA_DB.collection("catalog").doc("plantas").get();
    if (!snap.exists) return [];
    const data = snap.data();
    return (data.sections || [])
      .filter((s) => s.active !== false)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  function renderFilters() {
    if (!filtersEl) return;
    filtersEl.innerHTML = "";

    const allChip = document.createElement("button");
    allChip.className = "category-chip is-active";
    allChip.textContent = "Todas";
    allChip.dataset.sectionId = "all";
    filtersEl.appendChild(allChip);

    sections.forEach((section) => {
      const chip = document.createElement("button");
      chip.className = "category-chip";
      chip.textContent = section.name;
      chip.dataset.sectionId = section.id;
      filtersEl.appendChild(chip);
    });

    filtersEl.addEventListener("click", (e) => {
      const btn = e.target.closest(".category-chip");
      if (!btn) return;
      filtersEl.querySelectorAll(".category-chip").forEach((c) => c.classList.remove("is-active"));
      btn.classList.add("is-active");
      activeSectionId = btn.dataset.sectionId;
      renderGrid();
    });
  }

  function priceMarkup(item) {
    const promo = item.promo;
    if (promo && promo.active) {
      let finalPrice = item.price;
      if (promo.discountType === "percent") {
        finalPrice = Math.round(item.price * (1 - promo.discountValue / 100));
      } else if (promo.discountType === "fixed") {
        finalPrice = Math.max(item.price - promo.discountValue, 0);
      }
      return `
        <span class="product-card__price--old">${formatCOP(item.price)}</span>
        <span class="product-card__price">${formatCOP(finalPrice)}</span>
      `;
    }
    return `<span class="product-card__price">${formatCOP(item.price)}</span>`;
  }

  function renderGrid() {
    if (!grid) return;

    const visibleSections = activeSectionId === "all" ? sections : sections.filter((s) => s.id === activeSectionId);

    const items = visibleSections
      .flatMap((s) => s.items || [])
      .filter((item) => item.active !== false)
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    if (items.length === 0) {
      grid.innerHTML = `<p class="state-message">No hay plantas disponibles en esta categoría por ahora.</p>`;
      return;
    }

    grid.innerHTML = items
      .map((item) => {
        const img = (item.images && item.images[0]) || FALLBACK_IMG;
        const isAgotado = item.stock === "agotado";
        const badges = [];
        if (item.promo && item.promo.active) {
          badges.push(`<span class="badge badge-promo">${item.promo.label || "Promo"}</span>`);
        }
        badges.push(
          isAgotado
            ? `<span class="badge badge-agotado">Agotado</span>`
            : `<span class="badge badge-disponible">Disponible</span>`
        );

        const waLink = whatsappNumber ? buildProductInquiryLink(whatsappNumber, item) : "#";

        return `
          <article class="product-card">
            <div class="product-card__media">
              <div class="product-card__badges">${badges.join("")}</div>
              <img src="${img}" alt="${item.name}" loading="lazy" onerror="this.src='${FALLBACK_IMG}'">
            </div>
            <div class="product-card__body">
              <h3 class="product-card__title">${item.name}</h3>
              ${item.description ? `<p class="product-card__desc">${item.description}</p>` : ""}
              <div class="product-card__footer">
                ${priceMarkup(item)}
                <a class="btn btn-whatsapp btn-sm" href="${waLink}" target="_blank" rel="noopener">
                  Pedir
                </a>
              </div>
            </div>
          </article>
        `;
      })
      .join("");
  }

  async function init() {
    if (!grid) return;
    grid.innerHTML = `<p class="state-message">Cargando plantas…</p>`;

    try {
      const [loadedSections] = await Promise.all([loadCatalog(), loadSettings()]);
      sections = loadedSections;
      renderFilters();
      renderGrid();
    } catch (err) {
      console.error("Error cargando el catálogo de plantas:", err);
      grid.innerHTML = `<p class="state-message">No pudimos cargar el catálogo. Intenta de nuevo en un momento.</p>`;
    }
  }

  init();
})();
