/**
 * Cattleya — Formulario de reservas (brunch)
 * Arma un mensaje de WhatsApp prellenado con los datos de la reserva
 * y lo abre para que el cliente se lo envíe directo a Ángeles.
 * Mismo patrón que js/whatsapp.js: vitrina + WhatsApp, sin backend.
 */

(function () {
  let whatsappNumber = null;

  async function loadWhatsappNumber() {
    try {
      const snap = await window.CATTLEYA_DB.collection("settings").doc("site").get();
      if (snap.exists) {
        whatsappNumber = snap.data().whatsappNumber || null;
      }
    } catch (err) {
      console.error("Reservas: no se pudo cargar el WhatsApp de Cattleya:", err);
    }
  }

  function formatFecha(isoDate) {
    const [y, m, d] = isoDate.split("-");
    return `${d}/${m}/${y}`;
  }

  function formatHora(time24) {
    let [h, m] = time24.split(":").map(Number);
    const suffix = h >= 12 ? "p.m." : "a.m.";
    h = h % 12 || 12;
    return `${h}:${String(m).padStart(2, "0")} ${suffix}`;
  }

  function showStatus(el, message) {
    el.textContent = message;
    el.hidden = false;
  }

  function todayISO() {
    return new Date().toISOString().split("T")[0];
  }

  function initReservationForm() {
    const form = document.getElementById("reservation-form");
    if (!form) return;

    const dateInput = document.getElementById("reservation-date");
    if (dateInput) dateInput.min = todayISO();

    const statusEl = document.getElementById("reservation-status");

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (statusEl) statusEl.hidden = true;

      if (!whatsappNumber) {
        if (statusEl) {
          showStatus(statusEl, "Un momento, cargando datos de contacto... intenta de nuevo en unos segundos.");
        }
        return;
      }

      const name = document.getElementById("reservation-name").value.trim();
      const dateVal = document.getElementById("reservation-date").value;
      const timeVal = document.getElementById("reservation-time").value;
      const people = document.getElementById("reservation-people").value;

      const link = buildReservationLink(whatsappNumber, {
        name,
        dateLabel: formatFecha(dateVal),
        timeLabel: formatHora(timeVal),
        people,
      });

      window.open(link, "_blank", "noopener");
      form.reset();
      if (dateInput) dateInput.min = todayISO();
    });
  }

  loadWhatsappNumber();
  document.addEventListener("DOMContentLoaded", initReservationForm);
})();
