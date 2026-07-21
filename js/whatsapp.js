/**
 * Cattleya — Helper de WhatsApp
 * Arma links wa.me con mensaje prellenado para pedidos de plantas
 * (vitrina + WhatsApp, sin carrito por ahora — ver docs/ARCHITECTURE.md).
 *
 * Script normal (sin módulos): las funciones quedan disponibles de forma
 * global para el resto de scripts de la página.
 */

function formatCOP(value) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);
}

function buildWhatsappLink(phoneNumber, message) {
  const cleanPhone = String(phoneNumber).replace(/\D/g, "");
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encoded}`;
}

function buildProductInquiryLink(phoneNumber, product) {
  const message = `Hola Cattleya! 🌸 Quiero preguntar por: *${product.name}* (${formatCOP(product.price)}). ¿Está disponible?`;
  return buildWhatsappLink(phoneNumber, message);
}

function buildGeneralInquiryLink(phoneNumber) {
  const message = "Hola Cattleya! 🌸 Quisiera más información.";
  return buildWhatsappLink(phoneNumber, message);
}
