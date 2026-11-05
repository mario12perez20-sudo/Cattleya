(function () {
  var DELAY_MS = 2 * 60 * 1000;

  function buildModal() {
    if (document.getElementById('ig-modal-overlay')) return;

    var overlay = document.createElement('div');
    overlay.id = 'ig-modal-overlay';
    overlay.className = 'ig-modal-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'ig-modal-title');
    overlay.setAttribute('hidden', '');
    overlay.innerHTML =
      '<div class="ig-modal">' +
        '<button class="ig-modal__close" aria-label="Cerrar">&#x2715;</button>' +
        '<img class="ig-modal__img" src="assets/img/brunch/web/jardin-morita.jpg" alt="" loading="lazy">' +
        '<div class="ig-modal__body">' +
          '<p class="ig-modal__eyebrow">¿Te gustó la visita?</p>' +
          '<h2 class="ig-modal__title" id="ig-modal-title">Etiquétanos y te damos un descuento</h2>' +
          '<p class="ig-modal__text">Comparte tu momento Cattleya en Instagram, etiqueta <strong>@cattleya_plantas</strong> y te regalamos un descuento en tu próxima reserva.</p>' +
          '<a class="btn btn-primary" href="https://www.instagram.com/cattleya_plantas/" target="_blank" rel="noopener noreferrer">Ver @cattleya_plantas</a>' +
        '</div>' +
      '</div>';

    document.body.appendChild(overlay);

    function openModal() {
      overlay.removeAttribute('hidden');
      requestAnimationFrame(function () {
        overlay.classList.add('is-open');
        overlay.querySelector('.ig-modal__close').focus();
      });
    }

    function closeModal() {
      overlay.classList.remove('is-open');
    }

    overlay.querySelector('.ig-modal__close').addEventListener('click', closeModal);
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeModal();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && overlay.classList.contains('is-open')) closeModal();
    });

    setTimeout(openModal, DELAY_MS);
    setInterval(openModal, DELAY_MS * 2);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildModal);
  } else {
    buildModal();
  }
})();
