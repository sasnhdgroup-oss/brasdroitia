# brasdroitia.com

Site de Bras Droit IA, une marque de SCALINEA : page de vente, guides pratiques (`guides/`), CGV et pages légales.

- Mise en ligne automatique par Netlify à chaque modification de la branche `main` (réglages dans `netlify.toml`).
- Contrôle SEO des guides, page `/guides/` et `sitemap.xml` : `python3 _outils/seo_build.py .`
- Les fichiers `*.md`, `guides/_*` et `_outils/` ne sont pas publiés sur le site.
