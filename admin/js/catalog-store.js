/**
 * Cattleya Admin — Almacén compartido de catálogos (SDK compat, sin módulos)
 *
 * Esquema "documento único" (igual a Beer Garden): catalog/brunch y
 * catalog/plantas contienen todas las secciones e items anidados en un
 * solo documento cada uno. Este objeto global centraliza el fetch/save
 * para que products.js y categories.js trabajen sobre la misma copia en
 * memoria y siempre escriban el documento completo de vuelta.
 */

window.CatalogStore = (function () {
  const cache = { plantas: null, brunch: null };

  function slugify(text) {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  async function loadCatalog(catalogId, force) {
    if (cache[catalogId] && !force) return cache[catalogId];
    const snap = await window.CATTLEYA_DB.collection("catalog").doc(catalogId).get();
    cache[catalogId] = snap.exists ? snap.data() : { sections: [] };
    if (!cache[catalogId].sections) cache[catalogId].sections = [];
    return cache[catalogId];
  }

  function getCachedCatalog(catalogId) {
    return cache[catalogId];
  }

  async function saveCatalog(catalogId) {
    const data = cache[catalogId];
    if (!data) throw new Error(`No hay datos en memoria para el catálogo "${catalogId}"`);
    await window.CATTLEYA_DB.collection("catalog").doc(catalogId).set({
      ...data,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
  }

  function uniqueSectionId(catalogId, baseSlug) {
    const data = cache[catalogId];
    let slug = baseSlug;
    let i = 2;
    while (data.sections.some((s) => s.id === slug)) {
      slug = `${baseSlug}-${i}`;
      i += 1;
    }
    return slug;
  }

  function uniqueItemId(catalogId, baseSlug) {
    const data = cache[catalogId];
    const allIds = new Set(data.sections.flatMap((s) => (s.items || []).map((it) => it.id)));
    let slug = baseSlug;
    let i = 2;
    while (allIds.has(slug)) {
      slug = `${baseSlug}-${i}`;
      i += 1;
    }
    return slug;
  }

  return { slugify, loadCatalog, getCachedCatalog, saveCatalog, uniqueSectionId, uniqueItemId };
})();
