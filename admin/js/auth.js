/**
 * Cattleya Admin — Autenticación (SDK compat, sin módulos)
 * Login (admin/index.html) y protección de rutas (admin/dashboard.html).
 * Autorización real: existencia de un doc en admins/{uid} (ver
 * firebase/firestore.rules). Auth por sí solo NO basta para escribir datos.
 */

async function isAdminUser(user) {
  if (!user) return false;
  try {
    const snap = await window.CATTLEYA_DB.collection("admins").doc(user.uid).get();
    return snap.exists;
  } catch (err) {
    console.error("Error verificando permisos de admin:", err);
    return false;
  }
}

/**
 * Se usa en admin/index.html (login).
 */
function initLoginForm() {
  const form = document.getElementById("login-form");
  const errorEl = document.getElementById("login-error");
  if (!form) return;

  // Si ya hay sesión y es admin, saltar directo al dashboard.
  window.CATTLEYA_AUTH.onAuthStateChanged(async (user) => {
    if (user && (await isAdminUser(user))) {
      window.location.href = "dashboard.html";
    }
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorEl.textContent = "";
    const email = form.email.value.trim();
    const password = form.password.value;

    try {
      const cred = await window.CATTLEYA_AUTH.signInWithEmailAndPassword(email, password);
      const ok = await isAdminUser(cred.user);
      if (!ok) {
        await window.CATTLEYA_AUTH.signOut();
        errorEl.textContent = "Esta cuenta no tiene permisos de administrador en Cattleya.";
        return;
      }
      window.location.href = "dashboard.html";
    } catch (err) {
      console.error(err);
      errorEl.textContent = "Correo o contraseña incorrectos.";
    }
  });
}

/**
 * Se usa en admin/dashboard.html. Llama a onReady(user) solo cuando hay
 * un usuario admin válido; si no, redirige a index.html.
 */
function guardDashboard(onReady) {
  window.CATTLEYA_AUTH.onAuthStateChanged(async (user) => {
    if (!user) {
      window.location.href = "index.html";
      return;
    }
    const ok = await isAdminUser(user);
    if (!ok) {
      await window.CATTLEYA_AUTH.signOut();
      window.location.href = "index.html";
      return;
    }
    onReady(user);
  });

  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await window.CATTLEYA_AUTH.signOut();
      window.location.href = "index.html";
    });
  }
}
