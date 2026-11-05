/**
 * Cattleya — Definición de alérgenos compartida entre el sitio público y el admin.
 * Cada clave es el ID que se guarda en Firestore (item.allergens = ["gluten", "lacteos", ...]).
 * Los SVG usan stroke="currentColor" para heredar el color del contenedor.
 */
window.CATTLEYA_ALLERGENS = {
  gluten: {
    label: "Gluten",
    color: "#8B6914", bg: "rgba(139,105,20,0.11)",
    icon: '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="8" y1="15" x2="8" y2="2"/><path d="M8 11C6 10 4 8.5 4.5 7C5 5.5 7 6 8 7.5"/><path d="M8 11C10 10 12 8.5 11.5 7C11 5.5 9 6 8 7.5"/><path d="M8 7.5C6.5 6.5 5 5 5.5 3.5C6 2 7.5 2.5 8 4"/><path d="M8 7.5C9.5 6.5 11 5 10.5 3.5C10 2 8.5 2.5 8 4"/></svg>'
  },
  lacteos: {
    label: "Lácteos",
    color: "#2060A8", bg: "rgba(32,96,168,0.11)",
    icon: '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" aria-hidden="true"><path d="M8 1.5C8 1.5 13 7.5 13 10.5C13 13.3 10.8 15 8 15C5.2 15 3 13.3 3 10.5C3 7.5 8 1.5 8 1.5Z"/></svg>'
  },
  huevo: {
    label: "Huevo",
    color: "#A07010", bg: "rgba(160,112,16,0.11)",
    icon: '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" aria-hidden="true"><path d="M8 1.5C10.8 1.5 13 5.5 13 9.5C13 12.5 10.8 14.5 8 14.5C5.2 14.5 3 12.5 3 9.5C3 5.5 5.2 1.5 8 1.5Z"/></svg>'
  },
  "frutos-secos": {
    label: "Frutos secos",
    color: "#6B3E20", bg: "rgba(107,62,32,0.11)",
    icon: '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" aria-hidden="true"><path d="M8 2C10.5 2 12.5 5 12.5 8.5C12.5 12 10.5 14 8 14C5.5 14 3.5 12 3.5 8.5C3.5 5 5.5 2 8 2Z"/><line x1="8" y1="2" x2="8" y2="14" stroke-width="0.9"/></svg>'
  },
  tomate: {
    label: "Tomate",
    color: "#B02020", bg: "rgba(176,32,32,0.11)",
    icon: '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="8" cy="10" r="5"/><line x1="8" y1="5" x2="8" y2="2.5"/><path d="M5.5 4C5 2.5 5.5 1 8 1C10.5 1 11 2.5 10.5 4"/><path d="M5.5 3.5C4.5 2 3 2 3 2.5"/></svg>'
  },
  cerdo: {
    label: "Cerdo",
    color: "#A03060", bg: "rgba(160,48,96,0.11)",
    icon: '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="8" cy="8.5" r="6"/><ellipse cx="8" cy="10.5" rx="3.5" ry="2.5"/><circle cx="6.5" cy="10.5" r="0.9" fill="currentColor" stroke="none"/><circle cx="9.5" cy="10.5" r="0.9" fill="currentColor" stroke="none"/><path d="M3.5 6.5C3 4.5 4 3 5.5 3.5C6 3.7 5.5 5.5 5 6.5"/><path d="M12.5 6.5C13 4.5 12 3 10.5 3.5C10 3.7 10.5 5.5 11 6.5"/></svg>'
  },
  mani: {
    label: "Maní",
    color: "#8B4E14", bg: "rgba(139,78,20,0.11)",
    icon: '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" aria-hidden="true"><path d="M8 1.5C10 1.5 11.5 3 11.5 5C11.5 6.5 10.5 7 10.5 8C10.5 9 11.5 9.5 11.5 11C11.5 13 10 14.5 8 14.5C6 14.5 4.5 13 4.5 11C4.5 9.5 5.5 9 5.5 8C5.5 7 4.5 6.5 4.5 5C4.5 3 6 1.5 8 1.5Z"/><line x1="4.5" y1="8" x2="11.5" y2="8" stroke-width="0.9"/></svg>'
  },
  soya: {
    label: "Soya",
    color: "#2E6E20", bg: "rgba(46,110,32,0.11)",
    icon: '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="8" y1="15" x2="8" y2="6"/><path d="M8 11C8 11 5 10 4 7.5C3 5 5 2.5 8 4C8 4 7 7.5 8 11Z"/><path d="M8 9C8 9 11 8 12 5.5C13 3 11 0.5 8 2C8 2 9 5.5 8 9Z"/></svg>'
  }
};
