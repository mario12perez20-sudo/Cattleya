/**
 * Cattleya — Asigna las fotos nuevas del subgrupo "A base de café y
 * chocolate" (2026-09-08), una por ítem, en un solo commit a Firestore.
 *
 * Uso: node apply-cafe-images.js
 * (Sin argumentos — script puntual para este lote de fotos, igual que
 * apply-bebidas-descriptions.js.)
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
  "beb-americano": "assets/img/brunch/web/americano.jpg",
  "beb-cappuccino": "assets/img/brunch/web/cappuccino.jpg",
  "beb-cappuccino-vainilla": "assets/img/brunch/web/cappuccino-vainilla.jpg",
  "beb-cappuccino-crema": "assets/img/brunch/web/cappuccino-crema.jpg",
  "beb-mocaccino": "assets/img/brunch/web/mocaccino.jpg",
  "beb-mojito-coldbrew": "assets/img/brunch/web/mojito-coldbrew.jpg",
  "beb-granizado-cafe": "assets/img/brunch/web/granizado-cafe.jpg",
  "beb-malteada-cafe": "assets/img/brunch/web/malteada-cafe.jpg",
  "beb-affogato": "assets/img/brunch/web/affogato.jpg",
  "beb-affogato-crema": "assets/img/brunch/web/affogato-crema.jpg",
  "beb-chocolate-caliente": "assets/img/brunch/web/chocolate-caliente.jpg",
  "beb-milo": "assets/img/brunch/web/milo.jpg",
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
  console.log(`\n✅ Listo — fotos aplicadas en catalog/${CATALOG_ID}.\n`);
}

run().catch((err) => {
  console.error("\n❌ Error:", err.message, "\n");
  process.exit(1);
});
