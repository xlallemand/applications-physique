/* ============================================================
   BULLE : bulles d'aide ⓘ (même principe que ORGA.info)
   Un bouton ⓘ ouvre une bulle au toucher ou au clic ; un second
   appui, un appui ailleurs ou la touche Échap la ferment. Rien au survol.
   Plusieurs bulles par page, une seule ouverte à la fois.

   BULLE.info(html, label) → code HTML du bouton (à insérer dans une page)
     html  : contenu de la bulle (une bulle « hors programme » commence par <b>Hors programme.</b>)
     label : texte lu par les lecteurs d'écran (« Rappel », « Que veut dire… »)
   Styles : assets/bulle.css (classes bul-).
   ============================================================ */
(function () {
  'use strict';

  function info(html, label) {
    return `<button type="button" class="bul-info" aria-label="${(label || 'Aide').replace(/"/g, '&quot;')}" aria-expanded="false"><span aria-hidden="true">i</span></button><span class="bul-txt" hidden>${html}</span>`;
  }

  let ouverte = null;
  function fermer() {
    if (!ouverte) return;
    ouverte.b.setAttribute('aria-expanded', 'false');
    ouverte.el.remove();
    ouverte = null;
  }
  // ouverture au toucher ou au clic, placée sous le bouton, dans la largeur de l'écran
  document.addEventListener('click', ev => {
    const b = ev.target.closest && ev.target.closest('.bul-info');
    if (!b) return;
    ev.preventDefault();
    if (ouverte && ouverte.b === b) { fermer(); return; }
    fermer();
    const t = b.nextElementSibling && b.nextElementSibling.classList.contains('bul-txt') ? b.nextElementSibling.innerHTML : '';
    const el = document.createElement('div');
    el.className = 'bul-bulle';
    el.setAttribute('role', 'note');
    el.innerHTML = t;
    document.body.appendChild(el);
    const r = b.getBoundingClientRect(), w = el.offsetWidth;
    el.style.left = (Math.max(8, Math.min(document.documentElement.clientWidth - w - 8, r.left + r.width / 2 - w / 2)) + window.scrollX) + 'px';
    el.style.top = (r.bottom + 6 + window.scrollY) + 'px';
    b.setAttribute('aria-expanded', 'true');
    ouverte = { b, el };
  });
  document.addEventListener('pointerdown', ev => { if (ouverte && !ouverte.el.contains(ev.target) && !ouverte.b.contains(ev.target)) fermer(); }, true);
  document.addEventListener('keydown', ev => { if (ev.key === 'Escape') fermer(); });

  window.BULLE = { info, fermer };
})();
