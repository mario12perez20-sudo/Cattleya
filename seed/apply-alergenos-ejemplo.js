/**
 * Cattleya — Carga alérgenos de ejemplo en catalog/brunch.
 * Solo toca los items listados; no modifica el resto.
 * Uso: node seed/apply-alergenos-ejemplo.js
 */
const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const ALLERGENS_BY_ITEM = {
  // Sal
  "jardin-morita":       ["huevo", "lacteos", "gluten"],
  "eden-holandes":       ["huevo", "lacteos", "gluten", "cerdo"],
  "chicken-bacon-club":  ["gluten", "lacteos", "cerdo", "tomate"],
  "monito-york":         ["gluten", "lacteos", "cerdo"],
  "nido-montana":        ["huevo", "lacteos", "gluten"],
  "espejo-cherry":       ["gluten", "lacteos", "huevo"],
  // Dulce
  "waffles-pandebono":   ["gluten", "lacteos", "huevo"],
  "encanto-canela":      ["gluten", "lacteos", "huevo"],
  "encanto-nutella":     ["gluten", "lacteos", "frutos-secos"],
};

async function run() {
  const ref = db.collection("catalog").doc("brunch");
  const snap = await ref.get();
  if (!snap.exists) { console.error("catalog/brunch no existe"); process.exit(1); }

  const data = snap.data();
  let changes = 0;

  (data.sections || []).forEach((section) => {
    (section.items || []).forEach((item) => {
      const allergens = ALLERGENS_BY_ITEM[item.id];
      if (allergens) {
        item.allergens = allergens;
        changes++;
        console.log(`  ✓ ${item.id}: [${allergens.join(", ")}]`);
      }
    });
  });

  if (changes === 0) { console.log("Ningún item coincidió. Revisá los IDs."); process.exit(0); }

  await ref.set({ ...data, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
  console.log(`\n✅ ${changes} items actualizados con alérgenos de ejemplo.`);
  process.exit(0);
}

run().catch((err) => { console.error(err); process.exit(1); });
