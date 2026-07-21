/**
 * Cattleya Admin — Categorías (secciones dentro de catalog/{brunch|plantas})
 * SDK compat, sin módulos. Usa window.CatalogStore (catalog-store.js).
 * Esquema "documento único": cada categoría es un objeto dentro del array
 * `sections` de un documento. Cualquier cambio reescribe el documento
 * completo del catálogo.
 */

const tableBody = () => document.getElementById("categories-table-body");
const catModal = () => document.getElementById("category-modal");
const catForm = () => document.getElementById("category-form");
const catalogSelect = () => document.getElementById("catalog-select");

function currentCatalogId() {
  return catalogSelect()?.value || "plantas";
}

async function renderCategoriesTable() {
  const body = tableBody();
  if (!body) return;
  body.innerHTML = `<div class="state-message">Cargando…</div>`;

  const catalogId = currentCatalogId();
  const data = await window.CatalogStore.loadCatalog(catalogId);
  const sections = [...(data.sections || [])].sort((a, b) => (a.order || 0) - (b.order || 0));

  body.innerHTML =
    sections
      .map((s) => {
        const isActive = s.active !== false;
        const metaParts = [catalogId === "plantas" ? "Plantas" : "Brunch", `orden ${s.order ?? 0}`];
        if (s.subtitle) metaParts.push(s.subtitle);
        return `
      <div class="adm-item ${isActive ? "" : "inactive"}" data-id="${s.id}">
        <div class="adm-info">
          <div class="adm-item-name">${s.name}</div>
          <div class="adm-item-meta">${metaParts.join(" · ")}</div>
        </div>
        <div class="adm-actions">
          <button class="btn-icon cat-toggle-btn" title="${isActive ? "Ocultar" : "Mostrar"}">${isActive ? "👁️" : "🚫"}</button>
          <button class="btn-icon cat-edit-btn" title="Editar">✏️</button>
          <button class="btn-icon cat-delete-btn" title="Eliminar">🗑️</button>
        </div>
      </div>
    `;
      })
      .join("") || `<div class="state-message">Sin categorías todavía en este catálogo.</div>`;
}

function openCategoryModal(section) {
  const m = catModal();
  const f = catForm();
  f.reset();
  f.dataset.editingId = section ? section.id : "";
  document.getElementById("category-modal-title").textContent = section ? "Editar categoría" : "Nueva categoría";

  const data = window.CatalogStore.getCachedCatalog(currentCatalogId());

  if (section) {
    f.name.value = section.name || "";
    f.subtitle.value = section.subtitle || "";
    f.order.value = section.order ?? 0;
    f.active.checked = section.active !== false;
  } else {
    f.order.value = (data?.sections?.length || 0) + 1;
    f.active.checked = true;
  }
  m.classList.remove("is-hidden");
}

function closeCategoryModal() {
  catModal().classList.add("is-hidden");
}

async function handleCategorySubmit(e) {
  e.preventDefault();
  const f = catForm();
  const editingId = f.dataset.editingId;
  const catalogId = currentCatalogId();
  const data = window.CatalogStore.getCachedCatalog(catalogId);

  const name = f.name.value.trim();
  if (!name) return;

  const payload = {
    name,
    subtitle: f.subtitle.value.trim() || null,
    order: Number(f.order.value) || 0,
    active: f.active.checked,
  };

  if (editingId) {
    const section = data.sections.find((s) => s.id === editingId);
    Object.assign(section, payload);
  } else {
    const id = window.CatalogStore.uniqueSectionId(catalogId, window.CatalogStore.slugify(name));
    data.sections.push({ id, ...payload, items: [] });
  }

  await window.CatalogStore.saveCatalog(catalogId);
  closeCategoryModal();
  renderCategoriesTable();
}

function initCategoriesView() {
  const body = tableBody();
  if (!body) return;

  document.getElementById("add-category-btn")?.addEventListener("click", () => openCategoryModal(null));
  document.getElementById("category-modal-cancel")?.addEventListener("click", closeCategoryModal);
  catForm()?.addEventListener("submit", handleCategorySubmit);

  body.addEventListener("click", async (e) => {
    const row = e.target.closest(".adm-item");
    if (!row) return;
    const id = row.dataset.id;
    const catalogId = currentCatalogId();
    const data = window.CatalogStore.getCachedCatalog(catalogId);
    const section = data?.sections?.find((s) => s.id === id);
    if (!section) return;

    if (e.target.closest(".cat-edit-btn")) {
      openCategoryModal(section);
    }

    if (e.target.closest(".cat-toggle-btn")) {
      section.active = section.active === false;
      await window.CatalogStore.saveCatalog(catalogId);
      renderCategoriesTable();
    }

    if (e.target.closest(".cat-delete-btn")) {
      const itemCount = (section.items || []).length;
      const warning = itemCount ? ` Tiene ${itemCount} producto(s) adentro — también se eliminarán.` : "";
      if (confirm(`¿Eliminar la categoría "${section.name}"?${warning}`)) {
        data.sections = data.sections.filter((s) => s.id !== id);
        await window.CatalogStore.saveCatalog(catalogId);
        renderCategoriesTable();
      }
    }
  });

  renderCategoriesTable();
}
