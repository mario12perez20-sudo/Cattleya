/**
 * Cattleya — Script de carga de datos semilla a Firestore.
 *
 * Esquema "documento único" (mismo patrón que Beer Garden): este script
 * sobreescribe por completo los documentos catalog/brunch y
 * catalog/plantas con lo que haya en seed-data.js. Si vuelves a correrlo
 * después de haber editado productos desde el panel de admin, esos
 * cambios manuales se PERDERÁN — este script es para la carga inicial,
 * no para sincronizar.
 *
 * Uso:
 *   1. Descarga la clave de cuenta de servicio (Firebase Console →
 *      Configuración del proyecto → Cuentas de servicio → Generar nueva
 *      clave privada) y guárdala como seed/serviceAccountKey.json.
 *   2. cd seed && npm install
 *   3. node seed.js
 */

const admin = require("firebase-admin");
const path = require("path");
const { brunchCatalog, plantasCatalog, settings } = require("./seed-data");

const serviceAccountPath = path.join(__dirname, "serviceAccountKey.json");

let serviceAccount;
try {
  serviceAccount = require(serviceAccountPath);
} catch (err) {
  console.error(
    "\n❌ No se encontró seed/serviceAccountKey.json.\n" +
    "   Descárgalo desde Firebase Console → Configuración del proyecto →\n" +
    "   Cuentas de servicio → Generar nueva clave privada, y guárdalo ahí.\n"
  );
  process.exit(1);
}

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

async function run() {
  const now = admin.firestore.FieldValue.serverTimestamp();

  console.log("→ Cargando catalog/brunch...");
  await db.collection("catalog").doc("brunch").set({ ...brunchCatalog, updatedAt: now });
  console.log(`  ✓ ${brunchCatalog.sections.length} secciones, ${brunchCatalog.sections.reduce((n, s) => n + s.items.length, 0)} items`);

  console.log("→ Cargando catalog/plantas...");
  await db.collection("catalog").doc("plantas").set({ ...plantasCatalog, updatedAt: now });
  console.log(`  ✓ ${plantasCatalog.sections.length} secciones, ${plantasCatalog.sections.reduce((n, s) => n + s.items.length, 0)} items`);

  console.log("→ Cargando settings/site...");
  await db.collection("settings").doc("site").set({ ...settings, updatedAt: now }, { merge: true });

  console.log("\n✅ Seed completo.");
  process.exit(0);
}

run().catch((err) => {
  console.error("❌ Error cargando el seed:", err);
  process.exit(1);
});
