/**
 * Cattleya Admin — Productos (items dentro de las secciones de
 * catalog/{brunch|plantas}). SDK compat, sin módulos.
 * Usa window.CatalogStore (catalog-store.js).
 */

const prodTableBody = () => document.getElementById("products-table-body");
const prodModal = () => document.getElementById("product-modal");
const prodForm = () => document.getElementById("product-form");
const categoryFilterSelect = () => document.getElementById("product-category-filter");
const categorySelectInForm = () => document.getElementById("product-category-select");
const prodCatalogSelect = () => document.getElementById("catalog-select");

function prodCurrentCatalogId() {
  return prodCatalogSelect()?.value || "brunch";
}

function formatCOPAdmin(value) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(value || 0);
}

function flattenItems(data) {
  const rows = [];
  (data.sections || []).forEach((section) => {
    (section.items || []).forEach((item) => {
      rows.push({ item, sectionId: section.id, sectionName: section.name });
    });
  });
  return rows;
}

function findItem(data, sectionId, itemId) {
  const section = data.sections.find((s) => s.id === sectionId);
  if (!section) return null;
  const item = (section.items || []).find((it) => it.id === itemId);
  return item ? { section, item } : null;
}

function renderProductRow({ item, sectionId, sectionName }) {
  const img = (item.images && item.images[0]) || "../assets/img/plantas/placeholder.svg";
  const tags = [];
  if (item.promo && item.promo.active) tags.push(`<span class="adm-tag">${item.promo.label || "Promo"}</span>`);
  if (item.stock === "agotado") tags.push(`<span class="adm-tag">Agotado</span>`);
  const isActive = item.active !== false;

  return `
    <div class="adm-item ${isActive ? "" : "inactive"}" data-section-id="${sectionId}" data-item-id="${item.id}">
      <img class="adm-thumb" src="${img}" alt="">
      <div class="adm-info">
        <div class="adm-item-name">${item.name}</div>
        <div class="adm-item-meta">${sectionName}</div>
        ${tags.length ? `<div class="adm-tags">${tags.join("")}</div>` : ""}
      </div>
      <div class="adm-item-price">${formatCOPAdmin(item.price)}</div>
      <div class="adm-actions">
        <button class="btn-icon prod-toggle-btn" title="${isActive ? "Ocultar" : "Mostrar"}">${isActive ? "👁️" : "🚫"}</button>
        <button class="btn-icon prod-edit-btn" title="Editar">✏️</button>
        <button class="btn-icon prod-duplicate-btn" title="Duplicar">⧉</button>
        <button class="btn-icon prod-delete-btn" title="Eliminar">🗑️</button>
      </div>
    </div>
  `;
}

async function renderProductsTable() {
  const body = prodTableBody();
  if (!body) return;
  body.innerHTML = `<div class="state-message">Cargando…</div>`;

  const catalogId = prodCurrentCatalogId();
  const data = await window.CatalogStore.loadCatalog(catalogId);
  populateCategoryDropdowns(data);

  let rows = flattenItems(data);
  const filterValue = categoryFilterSelect()?.value || "all";
  if (filterValue !== "all") rows = rows.filter((r) => r.sectionId === filterValue);

  body.innerHTML = rows.map(renderProductRow).join("") || `<div class="state-message">Sin productos todavía en este catálogo.</div>`;
}

function populateCategoryDropdowns(data) {
  const sections = [...(data.sections || [])].sort((a, b) => (a.order || 0) - (b.order || 0));

  const filterSel = categoryFilterSelect();
  if (filterSel) {
    filterSel.innerHTML = [`<option value="all">Todas las categorías</option>`]
      .concat(sections.map((s) => `<option value="${s.id}">${s.name}</option>`))
      .join("");
  }

  const formSel = categorySelectInForm();
  if (formSel) {
    formSel.innerHTML =
      [`<option value="" disabled selected>Selecciona una categoría</option>`]
        .concat(sections.map((s) => `<option value="${s.id}">${s.name}</option>`))
        .join("");
  }
}

function imageRowHTML(value) {
  value = value || "";
  return `
    <div class="image-url-row">
      <input type="text" class="image-url-input" placeholder="https://…" value="${value}">
      <button type="button" class="btn btn-sm remove-image-btn" style="background:var(--color-border);">✕</button>
    </div>
  `;
}

function setImageRows(images) {
  const list = document.getElementById("image-url-list");
  list.innerHTML = (images && images.length ? images : [""]).map(imageRowHTML).join("");
}

function getImageRowsValues() {
  return Array.from(document.querySelectorAll(".image-url-input"))
    .map((input) => input.value.trim())
    .filter(Boolean);
}

function openProductModal(entry) {
  const m = prodModal();
  const f = prodForm();
  f.reset();
  f.dataset.editingSectionId = entry ? entry.sectionId : "";
  f.dataset.editingItemId = entry ? entry.item.id : "";
  document.getElementById("product-modal-title").textContent = entry ? "Editar producto" : "Nuevo producto";

  if (entry) {
    const { item, sectionId } = entry;
    f.name.value = item.name || "";
    f.description.value = item.description || "";
    f.price.value = item.price || 0;
    f.categoryId.value = sectionId;
    f.stock.value = item.stock || "disponible";
    f.order.value = item.order ?? 0;
    f.active.checked = item.active !== false;
    f.featured.checked = !!item.featured;
    setImageRows(item.images);

    const promo = item.promo || {};
    f.promoActive.checked = !!promo.active;
    f.promoLabel.value = promo.label || "";
    f.promoDiscountType.value = promo.discountType || "percent";
    f.promoDiscountValue.value = promo.discountValue || 0;
  } else {
    f.stock.value = "disponible";
    f.active.checked = true;
    f.order.value = 0;
    setImageRows([]);
    f.promoDiscountType.value = "percent";
  }
  m.classList.remove("is-hidden");
}

function closeProductModal() {
  prodModal().classList.add("is-hidden");
}

async function handleProductSubmit(e) {
  e.preventDefault();
  const f = prodForm();
  const catalogId = prodCurrentCatalogId();
  const data = window.CatalogStore.getCachedCatalog(catalogId);

  const name = f.name.value.trim();
  const targetSectionId = f.categoryId.value;

  if (!name || !targetSectionId) {
    alert("Nombre y categoría son obligatorios.");
    return;
  }

  const payload = {
    name,
    description: f.description.value.trim(),
    price: Number(f.price.value) || 0,
    images: getImageRowsValues(),
    stock: f.stock.value,
    order: Number(f.order.value) || 0,
    active: f.active.checked,
    featured: f.featured.checked,
    promo: {
      active: f.promoActive.checked,
      label: f.promoLabel.value.trim(),
      discountType: f.promoDiscountType.value,
      discountValue: Number(f.promoDiscountValue.value) || 0,
    },
  };

  const editingSectionId = f.dataset.editingSectionId;
  const editingItemId = f.dataset.editingItemId;

  if (editingItemId) {
    const oldSection = data.sections.find((s) => s.id === editingSectionId);
    const idx = oldSection.items.findIndex((it) => it.id === editingItemId);
    const existing = oldSection.items[idx];
    oldSection.items.splice(idx, 1);

    const newSection = data.sections.find((s) => s.id === targetSectionId);
    newSection.items.push({ ...existing, ...payload });
  } else {
    const newSection = data.sections.find((s) => s.id === targetSectionId);
    const id = window.CatalogStore.uniqueItemId(catalogId, window.CatalogStore.slugify(name));
    newSection.items.push({ id, ...payload });
  }

  await window.CatalogStore.saveCatalog(catalogId);
  closeProductModal();
  renderProductsTable();
}

async function duplicateItem(sectionId, itemId) {
  const catalogId = prodCurrentCatalogId();
  const data = window.CatalogStore.getCachedCatalog(catalogId);
  const found = findItem(data, sectionId, itemId);
  if (!found) return;

  const newId = window.CatalogStore.uniqueItemId(catalogId, `${found.item.id}-copia`);
  found.section.items.push({ ...found.item, id: newId, name: `${found.item.name} (copia)`, active: false });

  await window.CatalogStore.saveCatalog(catalogId);
  renderProductsTable();
}

function initProductsView() {
  const body = prodTableBody();
  if (!body) return;

  document.getElementById("add-product-btn")?.addEventListener("click", () => openProductModal(null));
  document.getElementById("product-modal-cancel")?.addEventListener("click", closeProductModal);
  document.getElementById("add-image-row-btn")?.addEventListener("click", () => {
    document.getElementById("image-url-list").insertAdjacentHTML("beforeend", imageRowHTML());
  });
  document.getElementById("image-url-list")?.addEventListener("click", (e) => {
    if (e.target.classList.contains("remove-image-btn")) {
      e.target.closest(".image-url-row").remove();
    }
  });
  prodForm()?.addEventListener("submit", handleProductSubmit);
  categoryFilterSelect()?.addEventListener("change", renderProductsTable);

  body.addEventListener("click", async (e) => {
    const row = e.target.closest(".adm-item");
    if (!row) return;
    const sectionId = row.dataset.sectionId;
    const itemId = row.dataset.itemId;
    const catalogId = prodCurrentCatalogId();
    const data = window.CatalogStore.getCachedCatalog(catalogId);
    const found = findItem(data, sectionId, itemId);
    if (!found) return;

    if (e.target.closest(".prod-edit-btn")) {
      openProductModal({ item: found.item, sectionId });
    }

    if (e.target.closest(".prod-duplicate-btn")) {
      await duplicateItem(sectionId, itemId);
    }

    if (e.target.closest(".prod-toggle-btn")) {
      found.item.active = found.item.active === false;
      await window.CatalogStore.saveCatalog(catalogId);
      renderProductsTable();
    }

    if (e.target.closest(".prod-delete-btn")) {
      if (confirm(`¿Eliminar "${found.item.name}"? Esta acción no se puede deshacer.`)) {
        found.section.items = found.section.items.filter((it) => it.id !== itemId);
        await window.CatalogStore.saveCatalog(catalogId);
        renderProductsTable();
      }
    }
  });

  renderProductsTable();
}
