// Bras Droit IA, site vitrine : liens vers l'essai (app.brasdroitia.com/essai) et barre fixe du bouton principal sur téléphone.
// 1. Chaque lien [data-essai] reçoit les paramètres de campagne de la page (utm_*, fbclid, gclid…) ; s'il n'y en a aucun,
//    il garde ceux écrits dans son href (source « site »). Rien n'est stocké.
// 2. La barre fixe (#barre) n'apparaît que lorsqu'aucun autre bouton jaune n'est visible : un seul bouton jaune à l'écran.
(function () {
  'use strict';
  var recus = new URLSearchParams(location.search), garder = [];
  recus.forEach(function (v, k) { if (/^(utm_[a-z]+|fbclid|gclid|gbraid|wbraid|ttclid|msclkid)$/i.test(k) && v) garder.push([k, v]); });
  document.querySelectorAll('a[data-essai]').forEach(function (a) {
    if (!garder.length) return;
    try {
      var u = new URL(a.getAttribute('href'), location.href);
      Array.from(u.searchParams.keys()).forEach(function (k) { if (/^utm_/i.test(k)) u.searchParams.delete(k); });
      garder.forEach(function (p) { u.searchParams.set(p[0], p[1]); });
      a.setAttribute('href', u.toString());
    } catch (e) {}
  });
  document.querySelectorAll('a[data-essai]').forEach(function (a) {
    a.addEventListener('click', function () {
      if (window.bdiaSuivi) bdiaSuivi(a.getAttribute('data-etape') || 'accueil_cta');
      if (window.bdiaEvenement) bdiaEvenement('clic_pilote', {});
    });
  });
  var barre = document.getElementById('barre');
  if (!barre || !('IntersectionObserver' in window)) return;
  var visibles = new Set(), vus = document.querySelectorAll('[data-essai]:not(#barre a)');
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) visibles.add(e.target); else visibles.delete(e.target); });
    var montrer = visibles.size === 0 && window.scrollY > 200;
    barre.classList.toggle('on', montrer);
    barre.setAttribute('aria-hidden', montrer ? 'false' : 'true');
    barre.querySelector('a').tabIndex = montrer ? 0 : -1;
  }, { threshold: 0 });
  vus.forEach(function (el) { io.observe(el); });
  addEventListener('scroll', function () { if (window.scrollY <= 200) { barre.classList.remove('on'); barre.setAttribute('aria-hidden', 'true'); } }, { passive: true });
})();
