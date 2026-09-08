/**
 * Cattleya — Asigna en un solo commit:
 * - los 5 íconos nuevos de "Infusiones calientes" (Frutos rojos, Frutos
 *   amarillos, Frutos verdes, Té chai, Canelazo)
 * - las 2 fotos nuevas de "Sodas" que ya llegaron (maracuyá, lulo — falta
 *   granadina, esa se agrega después con set-item-image.js cuando llegue)
 *
 * Uso: node apply-infusiones-sodas-media.js
 *
 * Solo toca `images` de los ítems listados abajo, dentro de la sección
 * "brunch-bebidas" — el resto del documento queda intacto.
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

const CATALOG_ID = "brunch";
const SECTION_ID = "brunch-bebidas";

const IMAGES = {
  "beb-infusion-frutos-rojos": "assets/img/brunch/icons/frutos-rojos.png",
  "beb-infusion-frutos-amarillos": "assets/img/brunch/icons/frutos-amarillos.png",
  "beb-infusion-frutos-verdes": "assets/img/brunch/icons/frutos-verdes.png",
  "beb-te-chai": "assets/img/brunch/icons/te-chai.png",
  "beb-canelazo": "assets/img/brunch/icons/canelazo.png",
  "beb-soda-maracuya": "assets/img/brunch/web/soda-maracuya.jpg",
  "beb-soda-lulo": "assets/img/brunch/web/soda-lulo.jpg",
};

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

async function run() {
  const ref = db.collection("catalog").doc(CATALOG_ID);
  const snap = await ref.get();
  if (!snap.exists) {
    console.error(`\n❌ No existe catalog/${CATALOG_ID}\n`);
    process.exit(1);
  }

  const data = snap.data();
  const section = (data.sections || []).find((s) => s.id === SECTION_ID);
  if (!section) {
    console.error(`\n❌ No existe la sección "${SECTION_ID}" en catalog/${CATALOG_ID}\n`);
    process.exit(1);
  }

  console.log("");
  (section.items || []).forEach((item) => {
    if (IMAGES[item.id]) {
      item.images = [IMAGES[item.id]];
      console.log(`  ✓ ${item.name}: ${IMAGES[item.id]}`);
    }
  });

  await ref.set({ ...data, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
  console.log(`\n✅ Listo — íconos de Infusiones y fotos de Sodas aplicados en catalog/${CATALOG_ID}.\n`);
}

run().catch((err) => {
  console.error("\n❌ Error:", err.message, "\n");
  process.exit(1);
});
