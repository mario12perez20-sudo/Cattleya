/**
 * Cattleya — Aplica las descripciones cortas de Bebidas (2026-09-07) y el
 * ajuste de "Agua" (una sola "Botella de agua" con "Con gas o sin gas" como
 * descripción; "Botella sin gas" queda desactivada, no borrada).
 *
 * Uso: node apply-bebidas-descriptions.js
 * (No recibe argumentos — es un script puntual para este cambio específico,
 * igual que set-item-image.js se corrió una vez por ícono.)
 *
 * Solo toca la sección "brunch-bebidas" de catalog/brunch — el resto del
 * documento (otras secciones, ediciones del admin) queda intacto.
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

const DESCRIPTIONS = {
  "beb-espresso": "Trago corto e intenso, para iniciar el día.",
  "beb-americano": "Suave y aromático, el clásico de toda mañana.",
  "beb-cappuccino": "Espuma cremosa sobre café intenso, equilibrio perfecto.",
  "beb-cappuccino-vainilla": "Un toque dulce que abraza cada sorbo.",
  "beb-cappuccino-crema": "Doble placer de café, cremoso de principio a fin.",
  "beb-mocaccino": "Café y chocolate en la mezcla perfecta.",
  "beb-mojito-coldbrew": "Café frío con un giro refrescante y herbal.",
  "beb-granizado-cafe": "Frío, dulce e intenso, el break ideal.",
  "beb-malteada-cafe": "Cremosa, fría y deliciosa.",
  "beb-affogato": "Helado bañado en espresso caliente, contraste delicioso.",
  "beb-affogato-crema": "El clásico affogato, ahora aún más cremoso.",
  "beb-chocolate-caliente": "Reconfortante y espeso, como un abrazo en taza.",
  "beb-milo": "Dulce, malteado y nostálgico, a tu gusto.",
  "beb-soda-maracuya": "Burbujeante y tropical, un golpe de frescura.",
  "beb-soda-lulo": "Ácida, frutal y refrescante hasta el fondo.",
  "beb-soda-granadina": "Dulce, colorida y perfecta para el calor.",
  "beb-infusion-frutos-rojos": "Infusión cálida y frutal, ideal para el frío.",
  "beb-infusion-frutos-amarillos": "Suave y aromática, un té para relajarte.",
  "beb-infusion-frutos-verdes": "Ligera y herbal, perfecta para cualquier momento.",
  "beb-te-chai": "Especiado y cálido, con carácter oriental.",
  "beb-canelazo": "Tradicional, dulce y con el toque justo de canela.",
  "beb-agua-con-gas": "Con gas o sin gas.",
};

// Agua: consolidar en un solo ítem visible ("Botella de agua"),
// desactivar el otro sin borrarlo.
const RENAMES = {
  "beb-agua-con-gas": "Botella de agua",
};
const DEACTIVATE = ["beb-agua-sin-gas"];

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
    if (DESCRIPTIONS[item.id]) {
      item.description = DESCRIPTIONS[item.id];
      console.log(`  ✓ ${item.name}: "${item.description}"`);
    }
    if (RENAMES[item.id]) {
      console.log(`  ✓ renombrado "${item.name}" → "${RENAMES[item.id]}"`);
      item.name = RENAMES[item.id];
    }
    if (DEACTIVATE.includes(item.id)) {
      item.active = false;
      console.log(`  ✓ "${item.name}" desactivado`);
    }
  });

  await ref.set({ ...data, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
  console.log(`\n✅ Listo — descripciones y ajuste de Agua aplicados en catalog/${CATALOG_ID}.\n`);
}

run().catch((err) => {
  console.error("\n❌ Error:", err.message, "\n");
  process.exit(1);
});
