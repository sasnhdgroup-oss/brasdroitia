/* Bras Droit IA : bandeau de consentement et traceurs publicitaires.
   Aucun traceur n'est chargé avant l'accord du visiteur (article 82 de la loi
   Informatique et Libertés, recommandations CNIL de 2020). Le choix est conservé
   6 mois, puis redemandé. Lien « Gérer les cookies » dans chaque pied de page.

   Identifiants à renseigner (laisser vide = traceur désactivé) : */
var BDIA_TRACEURS = {
  metaPixel: '',     // Meta (Facebook, Instagram) : Gestionnaire d'événements > Sources de données
  tiktokPixel: '',   // TikTok Ads Manager > Outils > Événements > Pixel web
  googleTag: '',     // Google Ads (publicités YouTube) : identifiant AW-XXXXXXXXX
  googleConversion: '' // action de conversion Google Ads : AW-XXXXXXXXX/YYYYYYYY
};

(function () {
  var CLE = 'bdia_consentement';
  var DUREE = 182 * 24 * 3600 * 1000; // 6 mois
  var file = []; // événements émis avant le chargement des traceurs

  function lire() {
    try {
      var c = JSON.parse(localStorage.getItem(CLE) || 'null');
      if (c && Date.now() - c.date < DUREE) return c;
    } catch (e) {}
    return null;
  }
  function ecrire(pub) {
    try { localStorage.setItem(CLE, JSON.stringify({ pub: pub, date: Date.now() })); } catch (e) {}
  }
  function actifs() {
    return BDIA_TRACEURS.metaPixel || BDIA_TRACEURS.tiktokPixel || BDIA_TRACEURS.googleTag;
  }

  function chargerMeta(id) {
    !function (f, b, e, v, n, t, s) { if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments) }; if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = []; t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s) }(window, document, 'script', 'https://connect.facebook.net/fr_FR/fbevents.js');
    fbq('init', id);
    fbq('track', 'PageView');
  }
  function chargerTiktok(id) {
    !function (w, d, t) { w.TiktokAnalyticsObject = t; var ttq = w[t] = w[t] || []; ttq.methods = ['page', 'track', 'identify', 'instances', 'debug', 'on', 'off', 'once', 'ready', 'alias', 'group', 'enableCookie', 'disableCookie', 'holdConsent', 'revokeConsent', 'grantConsent']; ttq.setAndDefer = function (t, e) { t[e] = function () { t.push([e].concat(Array.prototype.slice.call(arguments, 0))) } }; for (var i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(ttq, ttq.methods[i]); ttq.instance = function (t) { for (var e = ttq._i[t] || [], n = 0; n < ttq.methods.length; n++) ttq.setAndDefer(e, ttq.methods[n]); return e }; ttq.load = function (e, n) { var r = 'https://analytics.tiktok.com/i18n/pixel/events.js'; ttq._i = ttq._i || {}; ttq._i[e] = []; ttq._i[e]._u = r; ttq._t = ttq._t || {}; ttq._t[e] = +new Date; ttq._o = ttq._o || {}; ttq._o[e] = n || {}; var o = d.createElement('script'); o.type = 'text/javascript'; o.async = !0; o.src = r + '?sdkid=' + e + '&lib=' + t; var a = d.getElementsByTagName('script')[0]; a.parentNode.insertBefore(o, a) }; ttq.load(id); ttq.page(); }(window, document, 'ttq');
  }
  function chargerGoogle(id) {
    var s = document.createElement('script');
    s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + id;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { dataLayer.push(arguments); };
    gtag('js', new Date());
    gtag('config', id);
  }

  var charges = false;
  function charger() {
    if (charges) return;
    charges = true;
    if (BDIA_TRACEURS.metaPixel) chargerMeta(BDIA_TRACEURS.metaPixel);
    if (BDIA_TRACEURS.tiktokPixel) chargerTiktok(BDIA_TRACEURS.tiktokPixel);
    if (BDIA_TRACEURS.googleTag) chargerGoogle(BDIA_TRACEURS.googleTag);
    file.splice(0).forEach(function (e) { emettre(e[0], e[1]); });
  }

  // Événements de conversion : « debut_paiement » (clic sur le bouton de paiement)
  // et « abonnement » (page merci, après le paiement Stripe).
  function emettre(nom, params) {
    params = params || {};
    if (window.fbq) fbq('track', nom === 'abonnement' ? 'Purchase' : 'InitiateCheckout', params);
    if (window.ttq) ttq.track(nom === 'abonnement' ? 'CompletePayment' : 'InitiateCheckout', params);
    if (window.gtag && nom === 'abonnement' && BDIA_TRACEURS.googleConversion) {
      gtag('event', 'conversion', { send_to: BDIA_TRACEURS.googleConversion, value: params.value, currency: params.currency });
    }
  }
  window.bdiaEvenement = function (nom, params) {
    var c = lire();
    if (!c || !c.pub) return;
    if (charges) emettre(nom, params); else file.push([nom, params]);
  };

  function bandeau() {
    if (document.getElementById('bdia-cmp')) return;
    var css = document.createElement('style');
    css.textContent =
      '#bdia-cmp{position:fixed;left:16px;right:16px;bottom:16px;z-index:1000;max-width:560px;margin:0 auto;background:#0E1530;color:#F6F5F0;border:1px solid rgba(246,245,240,.18);border-radius:16px;padding:18px 18px 16px;font:15px/1.5 Inter,system-ui,sans-serif;box-shadow:0 12px 40px rgba(0,0,0,.45)}' +
      '#bdia-cmp p{margin:0 0 12px}#bdia-cmp a{color:#D4FF3F}' +
      '#bdia-cmp .r{display:flex;gap:10px;flex-wrap:wrap}' +
      '#bdia-cmp button{flex:1 1 140px;font:800 15px Inter,system-ui,sans-serif;border-radius:11px;padding:11px 14px;cursor:pointer;border:2px solid #D4FF3F;background:#D4FF3F;color:#0E1530}' +
      '#bdia-cmp button.n{background:transparent;color:#F6F5F0;border-color:#F6F5F0}';
    document.head.appendChild(css);
    var d = document.createElement('div');
    d.id = 'bdia-cmp';
    d.setAttribute('role', 'dialog');
    d.setAttribute('aria-label', 'Votre choix sur les cookies');
    d.innerHTML =
      '<p><b>Cookies publicitaires</b><br>Avec votre accord, nous utilisons les traceurs de Meta, TikTok et Google pour mesurer l\'efficacité de nos publicités. Refuser n\'a aucune conséquence sur votre visite. <a href="confidentialite.html#cookies">En savoir plus</a></p>' +
      '<div class="r"><button type="button" class="n" data-c="0">Refuser</button><button type="button" data-c="1">Accepter</button></div>';
    d.addEventListener('click', function (e) {
      var v = e.target.getAttribute && e.target.getAttribute('data-c');
      if (v === null) return;
      var ok = v === '1';
      var avant = lire();
      ecrire(ok);
      d.remove();
      if (ok) charger();
      else if (avant && avant.pub && charges) location.reload(); // retrait : décharger les traceurs
    });
    document.body.appendChild(d);
    d.querySelector('button').focus();
  }

  window.bdiaGererCookies = function () { if (actifs()) bandeau(); else alert('Ce site n\'utilise actuellement aucun cookie publicitaire.'); };

  function init() {
    // Lien « Gérer les cookies » ajouté dans chaque pied de page.
    var liens = document.querySelector('footer .links');
    if (liens && !document.getElementById('bdia-gerer')) {
      var a = document.createElement('a');
      a.href = '#'; a.id = 'bdia-gerer'; a.textContent = 'Gérer les cookies';
      a.addEventListener('click', function (e) { e.preventDefault(); bdiaGererCookies(); });
      liens.appendChild(a);
    }
    if (!actifs()) return;
    var c = lire();
    if (!c) bandeau();
    else if (c.pub) charger();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
