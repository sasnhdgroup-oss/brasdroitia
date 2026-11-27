/* Bouton principal du site (accueil, guides, astuces) : réglé ici, une seule fois.
   - OUVERT = false : l'appli n'est pas encore ouverte. Chaque bouton ouvre l'e-mail
     « Être prévenu de l'ouverture » (même e-mail que l'accueil provisoire en ligne).
   - OUVERT = true  : chaque bouton s'appelle « Essayer 14 jours, sans carte » et mène à LIEN_ESSAI.
   Le jour de l'ouverture : mettre l'adresse de l'appli dans LIEN_ESSAI, puis OUVERT = true.
   Les éléments [data-ferme] ne s'affichent qu'avant l'ouverture, [data-ouvert] qu'après.
   Compteur anonyme (suivi.js) : accueil_cta, accueil_cta_<position> sur l'accueil ; guide_cta ailleurs. */
var OUVERT = false;
var LIEN_ESSAI = ''; // adresse de l'appli, par exemple https://…/essai
/* Lien « Gérer mon abonnement » (pieds de page) : masqué tant que personne n'est abonné. */
var ABONNES = false;
var BDIA_MAILTO = 'mailto:contact@brasdroitia.com?subject=Pr%C3%A9venez-moi%20de%20l%27ouverture&body=M%C3%A9tier%20%3A%20%0AVille%20%3A%20';

(function () {
  var ouvert = OUVERT && !!LIEN_ESSAI; // sans adresse, jamais de bouton vers nulle part
  var libelle = ouvert ? 'Essayer 14 jours, sans carte' : 'Être prévenu de l’ouverture';
  function appliquer() {
    document.querySelectorAll('[data-essai]').forEach(function (a) {
      a.href = ouvert ? LIEN_ESSAI : BDIA_MAILTO;
      a.textContent = libelle;
      if (a.getAttribute('data-branche')) return;
      a.setAttribute('data-branche', '1');
      a.addEventListener('click', function () {
        var pos = a.getAttribute('data-cta') || '';
        if (window.bdiaSuivi) {
          if (pos === 'guide') bdiaSuivi('guide_cta');
          else { bdiaSuivi('accueil_cta'); if (pos) bdiaSuivi('accueil_cta_' + pos); }
        }
        if (window.bdiaEvenement) bdiaEvenement(ouvert ? 'clic_essai' : 'clic_ouverture', {});
      });
    });
    document.querySelectorAll('[data-ferme]').forEach(function (e) { e.hidden = ouvert; });
    document.querySelectorAll('[data-ouvert]').forEach(function (e) { e.hidden = !ouvert; });
    document.querySelectorAll('[data-abonnes]').forEach(function (e) { e.hidden = !ABONNES; });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', appliquer); else appliquer();
})();
