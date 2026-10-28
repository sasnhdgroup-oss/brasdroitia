/* Bloc d'inscription à « L'astuce du mardi » : <div data-lettre="source"></div> dans une page. */
(function () {
  var css = '.lettre{background:#0E1530;color:#F6F5F0;border-radius:18px;padding:24px;margin:30px 0}.lettre h2{color:#F6F5F0;margin:0 0 6px;font-size:24px}.lettre p{color:#C9CEE3;margin:0 0 14px}.lettre form{display:flex;flex-wrap:wrap;gap:10px}.lettre input[type=email]{flex:1 1 220px;font:inherit;padding:12px 14px;border-radius:10px;border:0}.lettre button{font:800 16px Inter,sans-serif;background:#D4FF3F;color:#0E1530;border:0;border-radius:10px;padding:12px 18px;cursor:pointer}.lettre label{display:block;font-size:14px;color:#C9CEE3;width:100%;line-height:1.45}.lettre label input{margin-right:8px;vertical-align:-2px}.lettre label a{color:#D4FF3F}.lettre .piege{position:absolute;left:-9999px}.lettre .msg{width:100%;font-weight:700;color:#D4FF3F;margin:6px 0 0}';
  var s = document.createElement('style'); s.textContent = css; document.head.appendChild(s);
  document.querySelectorAll('[data-lettre]').forEach(function (bloc) {
    bloc.className = 'lettre';
    bloc.innerHTML = '<h2>Une astuce de 2 minutes, chaque mardi</h2><p>Photos, avis, fiche Google, réseaux sociaux : une idée concrète à appliquer tout de suite. Gratuit, sans pub, désinscription en un clic.</p>' +
      '<form novalidate><input type="email" name="email" placeholder="Votre adresse e-mail" required aria-label="Votre adresse e-mail"><input class="piege" name="site" tabindex="-1" autocomplete="off" aria-hidden="true"><button type="submit">Recevoir l\'astuce du mardi</button>' +
      '<label><input type="checkbox" name="ok"> J\'accepte de recevoir l\'astuce du mardi par e-mail. Désinscription en un clic. <a href="/confidentialite.html">Confidentialité</a></label><p class="msg" aria-live="polite"></p></form>';
    var f = bloc.querySelector('form'), m = bloc.querySelector('.msg');
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!f.ok.checked) { m.textContent = 'Cochez la case pour accepter de recevoir l\'astuce du mardi.'; return; }
      m.textContent = 'Envoi…';
      fetch('/api/inscription', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: f.email.value, site: f.site.value, consentement: true, source: bloc.getAttribute('data-lettre') }) })
        .then(function (r) { return r.json(); })
        .then(function (d) { m.textContent = d.message; if (d.ok) { f.email.value = ''; try { (window.dataLayer = window.dataLayer || []).push({ event: 'bdia_inscription_lettre' }); } catch (x) {} } })
        .catch(function () { m.textContent = 'L\'inscription n\'a pas pu aboutir. Réessayez.'; });
    });
  });
  if (location.search.indexOf('inscription=ok') > -1) {
    var b = document.querySelector('[data-lettre]');
    var ok = document.createElement('p'); ok.className = 'astuce'; ok.style.cssText = 'background:#EEF6D0;border-radius:12px;padding:14px 18px;margin:16px 0';
    ok.textContent = 'Inscription confirmée : votre première astuce arrive dans votre boîte mail.';
    var h = document.querySelector('h1'); if (h) h.parentNode.insertBefore(ok, h.nextSibling);
  }
})();
