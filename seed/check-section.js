const admin = require("firebase-admin");
const path = require("path");
const serviceAccount = require(path.join(__dirname, "serviceAccountKey.json"));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

async function run() {
  const ref = db.collection("catalog").doc(process.argv[2] || "brunch");
  const snap = await ref.get();
  if (!snap.exists) { console.error("no existe"); process.exit(1); }
  const data = snap.data();
  (data.sections || []).forEach((s) => {
    console.log(s.id, "|", JSON.stringify(s.name), "|", JSON.stringify(s.subtitle));
  });
}
run().then(() => process.exit(0)).catch((e) => { console.error("ERR", e.message); process.exit(1); });
