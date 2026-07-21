/**
 * Cattleya — Inicialización de Firebase (versión "compat")
 *
 * Se usa el SDK "compat" de Firebase (namespace global `firebase`,
 * cargado con <script> normales, sin type="module") — el mismo mecanismo
 * que usa Beer Garden. Ventaja principal: el sitio se puede abrir directo
 * con doble clic (file:///...) sin necesitar un servidor local, porque no
 * hay módulos de JavaScript involucrados (los navegadores solo bloquean
 * los imports de módulos bajo file://, no los scripts normales).
 *
 * Requiere, en este orden, en el <head> o antes de este archivo:
 *   1. js/firebase-config.js
 *   2. https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js
 *   3. https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore-compat.js
 *   4. https://www.gstatic.com/firebasejs/10.12.0/firebase-auth-compat.js
 *   5. este archivo (js/firebase-init.js)
 *
 * Expone window.CATTLEYA_DB y window.CATTLEYA_AUTH para el resto del
 * código del sitio y del admin.
 */

(function () {
  const app = firebase.initializeApp(window.CATTLEYA_FIREBASE_CONFIG);
  window.CATTLEYA_APP = app;
  window.CATTLEYA_DB = firebase.firestore();
  window.CATTLEYA_AUTH = firebase.auth();
})();
