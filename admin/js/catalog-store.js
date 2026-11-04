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
  // updatedAt del servidor en el último loadCatalog, para detectar escrituras concurrentes
  const _serverTime = {};

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
    // Siempre leer del servidor en el admin, nunca de caché offline (Lección 4 Beer Garden)
    const snap = await window.CATTLEYA_DB.collection("catalog").doc(catalogId).get({ source: "server" });
    cache[catalogId] = snap.exists ? snap.data() : { sections: [] };
    if (!cache[catalogId].sections) cache[catalogId].sections = [];
    _serverTime[catalogId] = snap.exists ? (snap.data().updatedAt?.toMillis?.() || 0) : 0;
    return cache[catalogId];
  }

  function getCachedCatalog(catalogId) {
    return cache[catalogId];
  }

  async function saveCatalog(catalogId) {
    const data = cache[catalogId];
    if (!data) throw new Error(`No hay datos en memoria para el catálogo "${catalogId}"`);

    const ref = window.CATTLEYA_DB.collection("catalog").doc(catalogId);

    // Detectar escrituras concurrentes: re-leer del servidor y comparar timestamps (Lección 2 Beer Garden)
    const serverSnap = await ref.get({ source: "server" });
    if (serverSnap.exists) {
      const serverTime = serverSnap.data().updatedAt?.toMillis?.() || 0;
      const knownTime = _serverTime[catalogId] || 0;
      if (serverTime > knownTime) {
        throw new Error(
          "Hay cambios más recientes en el servidor.\n" +
          "Recargá la página para ver la versión actualizada antes de guardar."
        );
      }
    }

    await ref.set({
      ...data,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
    // Re-leer para sincronizar _serverTime con el timestamp real del servidor
    // (evita falsos positivos de "cambios más recientes" por diferencia de relojes cliente/servidor)
    const freshSnap = await ref.get({ source: "server" });
    _serverTime[catalogId] = freshSnap.exists ? (freshSnap.data().updatedAt?.toMillis?.() || 0) : 0;
    cache[catalogId] = freshSnap.exists ? freshSnap.data() : { sections: [] };
    if (!cache[catalogId].sections) cache[catalogId].sections = [];
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
