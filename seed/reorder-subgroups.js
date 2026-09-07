/**
 * Cattleya — Reordenar los subgrupos de una sección (ej. "Bebidas": Café,
 * Sodas, Infusiones, Agua) sin tocar nada más del documento.
 *
 * No cambia el orden DENTRO de cada subgrupo (los ítems de un mismo
 * subgrupo conservan su orden relativo actual), solo el orden en que
 * aparecen los subgrupos entre sí. Reescribe el campo `order` de todos los
 * ítems de la sección de forma secuencial (1, 2, 3, ...) según la lista de
 * subgrupos que se pase. Un subgrupo que no aparezca en la lista se deja
 * al final, en el orden en que ya estaba.
 *
 * Usa el mismo seed/serviceAccountKey.json que seed.js y set-item-images.js.
 * Solo toca `items` de la sección indicada — el resto del documento
 * (otras secciones, ediciones hechas desde el admin) queda intacto.
 *
 * Uso:
 *   node reorder-subgroups.js <brunch|plantas> <sectionId> "<subgrupo1>|<subgrupo2>|..."
 *
 * Ejemplo (Café/chocolate -> Sodas -> Infusiones -> Agua):
 *   node reorder-subgroups.js brunch brunch-bebidas "A base de café y chocolate|Sodas|Infusiones calientes|Agua"
 */

const admin = require("firebase-admin");
const path = require("path");

const serviceAccountPath = path.join(__dirname, "serviceAccountKey.json");
let serviceAccount;
try {
  serviceAccount = require(serviceAccountPath);
} catch {
  console.error("\n❌ No se encontró seed/serviceAccountKey.json (el mismo que usa seed.js).\n");
  process.exit(1);
}

const [, , catalogId, sectionId, subgroupOrderRaw] = process.argv;

if (!catalogId || !sectionId || !subgroupOrderRaw) {
  console.error('\nUso: node reorder-subgroups.js <brunch|plantas> <sectionId> "<subgrupo1>|<subgrupo2>|..."\n');
  process.exit(1);
}

const subgroupPriority = subgroupOrderRaw.split("|").map((s) => s.trim());

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

async function run() {
  const ref = db.collection("catalog").doc(catalogId);
  const snap = await ref.get();
  if (!snap.exists) {
    console.error(`\n❌ No existe catalog/${catalogId}\n`);
    process.exit(1);
  }

  const data = snap.data();
  const section = (data.sections || []).find((s) => s.id === sectionId);
  if (!section) {
    console.error(`\n❌ No existe la sección "${sectionId}" en catalog/${catalogId}`);
    console.error("   Secciones disponibles:", (data.sections || []).map((s) => s.id).join(", "), "\n");
    process.exit(1);
  }

  const items = section.items || [];

  const priorityIndex = (item) => {
    const idx = subgroupPriority.indexOf(item.subgroup || "");
    return idx === -1 ? subgroupPriority.length : idx;
  };

  const sorted = [...items].sort((a, b) => {
    const pa = priorityIndex(a);
    const pb = priorityIndex(b);
    if (pa !== pb) return pa - pb;
    return (a.order || 0) - (b.order || 0);
  });

  console.log("\nOrden nuevo de subgrupos:");
  let lastSubgroup;
  sorted.forEach((item, i) => {
    const newOrder = i + 1;
    if (item.subgroup !== lastSubgroup) {
      console.log(`\n  ${item.subgroup || "(sin subgrupo)"}:`);
      lastSubgroup = item.subgroup;
    }
    console.log(`    ${newOrder}. ${item.name} (era order=${item.order})`);
    item.order = newOrder;
  });

  section.items = sorted;

  await ref.set({ ...data, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
  console.log(`\n✅ Listo — subgrupos de "${sectionId}" reordenados en catalog/${catalogId}.\n`);
}

run().catch((err) => {
  console.error("\n❌ Error:", err.message, "\n");
  process.exit(1);
});
