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

function buildAllergenChecks() {
  const container = document.getElementById("allergen-checks");
  const fieldset = document.getElementById("allergen-fieldset");
  if (!container || !window.CATTLEYA_ALLERGENS) return;
  container.innerHTML = Object.entries(window.CATTLEYA_ALLERGENS)
    .map(([id, a]) =>
      `<label class="allergen-check-label" title="${a.label}">` +
        `<input type="checkbox" class="allergen-cb" value="${id}">` +
        a.icon +
        `<span>${a.label}</span>` +
      `</label>`
    )
    .join("");
  if (fieldset) fieldset.style.display = "";
}

function setAllergenChecks(allergens) {
  const checked = new Set(allergens || []);
  document.querySelectorAll(".allergen-cb").forEach((cb) => {
    cb.checked = checked.has(cb.value);
  });
}

function getAllergenChecks() {
  return Array.from(document.querySelectorAll(".allergen-cb:checked")).map((cb) => cb.value);
}

// Comprime un File de imagen usando Canvas. Devuelve una Promise<Blob>.
function compressImage(file, maxW, maxH, quality) {
  maxW = maxW || 1200; maxH = maxH || 1200; quality = quality || 0.82;
  return new Promise(function (resolve, reject) {
    var reader = new FileReader();
    reader.onerror = reject;
    reader.onload = function (e) {
      var img = new Image();
      img.onerror = reject;
      img.onload = function () {
        var w = img.width, h = img.height;
        if (w > maxW) { h = Math.round(h * maxW / w); w = maxW; }
        if (h > maxH) { w = Math.round(w * maxH / h); h = maxH; }
        var canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        canvas.toBlob(function (blob) {
          blob ? resolve(blob) : reject(new Error("Canvas toBlob falló"));
        }, "image/jpeg", quality);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

// Comprime y sube a Firebase Storage. Devuelve Promise<downloadURL>.
function uploadImageFile(file, onProgress) {
  var storage = window.CATTLEYA_STORAGE;
  if (!storage) return Promise.reject(new Error("Firebase Storage no inicializado"));
  var ext = "jpg";
  var name = Date.now() + "-" + file.name.replace(/[^a-z0-9.\-_]/gi, "_").replace(/\.[^.]+$/, "") + "." + ext;
  return compressImage(file).then(function (blob) {
    var ref = storage.ref("cattleya/brunch/" + name);
    var task = ref.put(blob, { contentType: "image/jpeg" });
    return new Promise(function (resolve, reject) {
      task.on("state_changed",
        function (snap) { onProgress && onProgress(Math.round(snap.bytesTransferred / snap.totalBytes * 100)); },
        reject,
        function () { task.snapshot.ref.getDownloadURL().then(resolve, reject); }
      );
    });
  });
}

function imageRowHTML(value) {
  value = value || "";
  return `
    <div class="image-url-row">
      <input type="text" class="image-url-input" placeholder="URL o subí con ↑" value="${value}">
      <button type="button" class="btn btn-sm upload-image-btn" title="Subir imagen desde tu dispositivo">↑</button>
      <button type="button" class="btn btn-sm remove-image-btn" style="background:var(--color-border);">✕</button>
    </div>
    <div class="upload-progress-bar" style="display:none;"><div class="upload-progress-fill"></div></div>
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
    setAllergenChecks(item.allergens);
  } else {
    f.stock.value = "disponible";
    f.active.checked = true;
    f.order.value = 0;
    setImageRows([]);
    f.promoDiscountType.value = "percent";
    setAllergenChecks([]);
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
    allergens: getAllergenChecks(),
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

  try {
    await window.CatalogStore.saveCatalog(catalogId);
  } catch (err) {
    alert(err.message);
    return;
  }
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

  try {
    await window.CatalogStore.saveCatalog(catalogId);
  } catch (err) {
    alert(err.message);
    return;
  }
  renderProductsTable();
}

function initProductsView() {
  const body = prodTableBody();
  if (!body) return;

  buildAllergenChecks();
  document.getElementById("add-product-btn")?.addEventListener("click", () => openProductModal(null));
  document.getElementById("product-modal-cancel")?.addEventListener("click", closeProductModal);
  document.getElementById("add-image-row-btn")?.addEventListener("click", () => {
    document.getElementById("image-url-list").insertAdjacentHTML("beforeend", imageRowHTML());
  });
  // Input de archivo oculto, compartido por todas las filas de imagen
  var fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = "image/*";
  fileInput.style.display = "none";
  document.body.appendChild(fileInput);

  var _uploadTargetRow = null;
  fileInput.addEventListener("change", function () {
    var file = fileInput.files[0];
    if (!file || !_uploadTargetRow) return;
    var urlInput = _uploadTargetRow.querySelector(".image-url-input");
    var bar = _uploadTargetRow.nextElementSibling; // .upload-progress-bar
    var fill = bar ? bar.querySelector(".upload-progress-fill") : null;
    var uploadBtn = _uploadTargetRow.querySelector(".upload-image-btn");
    if (bar) bar.style.display = "block";
    if (uploadBtn) { uploadBtn.disabled = true; uploadBtn.textContent = "…"; }
    urlInput.value = "";
    uploadImageFile(file, function (pct) {
      if (fill) fill.style.width = pct + "%";
    }).then(function (url) {
      urlInput.value = url;
      if (bar) bar.style.display = "none";
      if (uploadBtn) { uploadBtn.disabled = false; uploadBtn.textContent = "↑"; }
    }).catch(function (err) {
      console.error("Upload error:", err);
      alert("Error al subir la imagen: " + err.message);
      if (bar) bar.style.display = "none";
      if (uploadBtn) { uploadBtn.disabled = false; uploadBtn.textContent = "↑"; }
    });
    fileInput.value = "";
  });

  document.getElementById("image-url-list")?.addEventListener("click", (e) => {
    if (e.target.classList.contains("remove-image-btn")) {
      var row = e.target.closest(".image-url-row");
      var bar = row.nextElementSibling;
      if (bar && bar.classList.contains("upload-progress-bar")) bar.remove();
      row.remove();
    }
    if (e.target.classList.contains("upload-image-btn")) {
      _uploadTargetRow = e.target.closest(".image-url-row");
      fileInput.click();
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
      try {
        await window.CatalogStore.saveCatalog(catalogId);
      } catch (err) {
        alert(err.message);
        return;
      }
      renderProductsTable();
    }

    if (e.target.closest(".prod-delete-btn")) {
      if (confirm(`¿Eliminar "${found.item.name}"? Esta acción no se puede deshacer.`)) {
        found.section.items = found.section.items.filter((it) => it.id !== itemId);
        try {
          await window.CatalogStore.saveCatalog(catalogId);
        } catch (err) {
          alert(err.message);
          return;
        }
        renderProductsTable();
      }
    }
  });

  renderProductsTable();
}
