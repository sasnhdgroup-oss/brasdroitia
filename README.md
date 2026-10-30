# brasdroitia.com

Site de Bras Droit IA, une marque de SCALINEA : page de vente, guides pratiques (`guides/`), CGV et pages légales.

- Mise en ligne automatique par Netlify à chaque modification de la branche `main` (réglages dans `netlify.toml`).
- Contrôle SEO des guides, page `/guides/` et `sitemap.xml` : `python3 _outils/seo_build.py .`
- Les fichiers `*.md`, `guides/_*` et `_outils/` ne sont pas publiés sur le site.

## Fonctions et variables d'environnement (Netlify)
- `/api/reponse-avis` : générateur de réponses aux avis Google (IA fournie par Netlify ; `BDIA_MODELE`, `BDIA_PLAFOND_JOUR` facultatifs).
- `/api/inscription` et `/api/desinscription` : lettre « L'astuce du mardi » (Brevo). Variables : `BREVO_API_KEY` (secrète), `BREVO_MODELE_CONFIRMATION` (modèle n° 1), `BREVO_LISTE` (défaut 3).
- Toute variable ajoutée ou modifiée dans Netlify ne s'applique qu'au déploiement suivant.

## Hébergement

Netlify, offre Personal (1 000 crédits par mois) depuis le 30/10/2026 : chaque mise en ligne coûte 15 crédits, donc regrouper les modifications en une mise en ligne par jour.
