/**
 * Cattleya — Cambios del 2026-11-05 (reunión con Ángeles)
 *
 * Aplica en un solo pase todos los cambios acordados:
 *   1. Subtitle de bebidas: "para enamorarte" → "Para enamorarte" (P mayúscula)
 *   2. Nombre de espejo-cherry: elimina el " 2" si alguien lo agregó manualmente
 *   3. Desactiva brownie-helado y encanto-arequipe (salen del menú)
 *   4. Desactiva los 5 ítems de subgroup "Infusiones calientes" (sección desaparece)
 *
 * Uso: node apply-cambios-nov2026.js
 */

const admin = require("firebase-admin");
const path = require("path");

const serviceAccountPath = path.join(__dirname, "serviceAccountKey.json");
let serviceAccount;
try {
  serviceAccount = require(serviceAccountPath);
} catch {
  console.error("\n❌ No se encontró seed/serviceAccountKey.json.\n");
  process.exit(1);
}

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const INFUSIONES_IDS = new Set([
  "beb-infusion-frutos-rojos",
  "beb-infusion-frutos-amarillos",
  "beb-infusion-frutos-verdes",
  "beb-te-chai",
  "beb-canelazo",
]);

async function run() {
  const ref = db.collection("catalog").doc("brunch");
  const snap = await ref.get();
  if (!snap.exists) {
    console.error("\n❌ No existe catalog/brunch\n");
    process.exit(1);
  }

  const data = snap.data();
  let changes = 0;

  for (const section of data.sections || []) {
    // 1. P mayúscula en subtitle de bebidas
    if (section.id === "brunch-bebidas" && section.subtitle === "para enamorarte") {
      section.subtitle = "Para enamorarte";
      console.log(`  ✓ brunch-bebidas subtitle: "para enamorarte" → "Para enamorarte"`);
      changes++;
    }

    for (const item of section.items || []) {
      // 2. Nombre espejo-cherry (quitar " 2" si alguien lo puso)
      if (item.id === "espejo-cherry" && item.name !== "Espejo de Cherry") {
        const before = item.name;
        item.name = "Espejo de Cherry";
        console.log(`  ✓ espejo-cherry nombre: "${before}" → "Espejo de Cherry"`);
        changes++;
      }

      // 3. Desactivar brownie-helado y encanto-arequipe
      if ((item.id === "brownie-helado" || item.id === "encanto-arequipe") && item.active !== false) {
        item.active = false;
        console.log(`  ✓ ${item.id}: active → false`);
        changes++;
      }

      // 4. Desactivar infusiones calientes
      if (INFUSIONES_IDS.has(item.id) && item.active !== false) {
        item.active = false;
        console.log(`  ✓ ${item.id} (infusión): active → false`);
        changes++;
      }
    }
  }

  if (changes === 0) {
    console.log("\n⚠ No hubo nada que cambiar (ya están aplicados).\n");
    process.exit(0);
  }

  await ref.set({ ...data, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
  console.log(`\n✅ ${changes} cambio(s) aplicado(s) en catalog/brunch.\n`);
}

run().catch((err) => {
  console.error("\n❌ Error:", err.message, "\n");
  process.exit(1);
});
