// Compteur anonyme des étapes du parcours (sans cookie ni donnée personnelle) : /api/suivi.
// Usage : bdiaSuivi('accueil'). Chaque étape n'est comptée qu'une fois par page vue.
(function () {
  var q = new URLSearchParams(location.search), vu = {};
  var src = /facebook|instagram|meta|fb|ig/i.test(q.get('utm_source') || '') || q.get('fbclid') ? 'meta' : 'autre';
  try { if (src === 'meta') sessionStorage.setItem('bdia_src', 'meta'); else if (sessionStorage.getItem('bdia_src') === 'meta') src = 'meta'; } catch (e) {}
  window.bdiaSuivi = function (etape) {
    if (vu[etape]) return; vu[etape] = 1;
    try {
      fetch('/api/suivi', { method: 'POST', keepalive: true, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ etape: etape, src: src }) }).catch(function () {});
    } catch (e) {}
  };
})();
