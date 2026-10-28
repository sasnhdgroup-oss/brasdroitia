#!/usr/bin/env python3
"""Site Bras Droit IA : contrôle qualité SEO des guides, page /guides/, sitemap.xml et robots.txt.

Usage (depuis la racine du dépôt brasdroitia) : python3 _outils/seo_build.py .
"""
import html, json, re, sys
from pathlib import Path

SITE = 'https://brasdroitia.com'
racine = Path(sys.argv[1])
guides = racine / 'guides'

def texte(s):
    s = re.sub(r'<script.*?</script>|<style.*?</style>', ' ', s, flags=re.S)
    return html.unescape(re.sub(r'<[^>]+>', ' ', s))

def balise(s, motif):
    m = re.search(motif, s, flags=re.S)
    return html.unescape(m.group(1).strip()) if m else ''

pages, erreurs = [], []
slugs = sorted(p.parent.name for p in guides.glob('*/index.html'))
for slug in slugs:
    s = (guides / slug / 'index.html').read_text(encoding='utf-8')
    title = balise(s, r'<title>(.*?)</title>')
    desc = balise(s, r'<meta name="description" content="(.*?)">')
    h1 = balise(s, r'<h1>(.*?)</h1>')
    article = balise(s, r'<article>(.*?)</article>')
    mots = len(texte(article).split())
    e = []
    if '{{' in s: e.append('balise {{ restante')
    if s.count('<h1') != 1: e.append(f"{s.count('<h1')} h1")
    if not 30 <= len(title) <= 65: e.append(f'title {len(title)} car.')
    if not 120 <= len(desc) <= 160: e.append(f'description {len(desc)} car.')
    if s.count('<h2') < 5: e.append('moins de 5 h2')
    if mots < 1000: e.append(f'{mots} mots')
    if f'/guides/{slug}/' not in balise(s, r'<link rel="canonical" href="(.*?)">'): e.append('canonical')
    for bloc in re.findall(r'<script type="application/ld\+json">(.*?)</script>', s, flags=re.S):
        try: json.loads(bloc)
        except Exception as x: e.append(f'JSON-LD invalide ({x})')
    for lien in set(re.findall(r'href="/guides/([^"/#]+)/', s)):
        if lien not in slugs: e.append(f'lien mort /guides/{lien}/')
    if e: erreurs.append((slug, e))
    pages.append({'slug': slug, 'title': title, 'desc': desc, 'h1': h1, 'mots': mots})

# Contenu dupliqué : phrases de plus de 12 mots présentes sur plusieurs pages.
vues = {}
for p in pages:
    s = texte(balise((guides / p['slug'] / 'index.html').read_text(encoding='utf-8'), r'<article>(.*?)</article>'))
    for phrase in set(x.strip() for x in re.split(r'[.!?]\s', s) if len(x.split()) > 12):
        vues.setdefault(phrase, set()).add(p['slug'])
doublons = [(ph, sorted(sl)) for ph, sl in vues.items() if len(sl) > 1]

# Page /guides/ : classement par cocon, d'après le plan.
plan = (guides / '_plan_seo.md').read_text(encoding='utf-8')
cocon = {m.group(1): m.group(2).split(',')[0].strip() for m in re.finditer(r'^\| [A-E] \| \d+ \| ([a-z0-9-]+) \| [^|]+\| ([^|]+)\|', plan, flags=re.M)}
ordre = ['Avis', 'Fiche Google', 'Réseaux', 'Prospection', 'Méthode', 'Prix', 'IA']
noms = {'Avis': 'Avis Google : répondre, obtenir, gérer', 'Fiche Google': 'Fiche Google et référencement local', 'Réseaux': 'Idées de publications par métier', 'Prospection': 'Trouver des clients', 'Méthode': 'Organiser sa communication', 'Prix': 'Combien ça coûte ?', 'IA': "L'IA au service des pros"}
blocs = []
for c in ordre:
    items = [p for p in pages if cocon.get(p['slug'], 'Méthode') == c]
    if not items: continue
    lis = '\n'.join(f'  <li><a href="/guides/{p["slug"]}/"><b>{html.escape(p["h1"])}</b></a><br><span>{html.escape(p["desc"])}</span></li>' for p in items)
    blocs.append(f'<h2 id="{c.lower().replace(" ", "-")}">{noms[c]}</h2>\n<ul class="hub">\n{lis}\n</ul>')
gabarit = (guides / '_gabarit.html').read_text(encoding='utf-8')
tete = gabarit.split('<script type="application/ld+json">')[0]
tete = (tete.replace('{{TITLE}}', 'Guides pour les pros : avis Google, posts, fiche Google | Bras Droit IA')
            .replace('{{DESCRIPTION}}', 'Guides gratuits pour artisans, commerçants et indépendants : répondre aux avis Google, idées de posts par métier, fiche Google, calendrier éditorial.')
            .replace('https://brasdroitia.com/guides/{{SLUG}}/', 'https://brasdroitia.com/guides/')
            .replace('content="article"', 'content="website"'))
hub = tete + f'''<style>.hub{{list-style:none;padding:0}}.hub li{{padding:12px 0;border-bottom:1px solid var(--line)}}.hub span{{color:var(--muted);font-size:15px}}</style>
</head>
<body>
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-MDXSWKZP" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<header><div class="wrap">
 <a class="brand" href="/"><img src="/logo.png" alt="" width="34" height="34">Bras Droit <span class="tag">IA</span></a>
 <a class="btn" href="/#metier">Voir un exemple</a>
</div></header>
<main class="wrap">
<nav class="fil" aria-label="Fil d'Ariane"><a href="/">Accueil</a> › Guides</nav>
<article>
<h1>Guides pratiques pour les pros : avis, posts et fiche Google</h1>
<p class="chapo">Des modèles prêts à copier et des méthodes simples pour les artisans, commerçants et indépendants qui veulent être visibles sans y passer leurs soirées.</p>
{chr(10).join(blocs)}
</article>
</main>
<footer><div class="wrap">
 <div><b>Bras Droit IA</b> est une marque de SCALINEA SARL.</div>
 <div class="links"><a href="/">Accueil</a><a href="/mentions-legales.html">Mentions légales</a><a href="/cgv.html">CGV</a><a href="/confidentialite.html">Confidentialité</a></div>
</div></footer>
<script src="/consent.js"></script>
</body>
</html>
'''
(guides / 'index.html').write_text(hub, encoding='utf-8')

urls = [('/', '1.0'), ('/guides/', '0.8')] + [(f'/guides/{p["slug"]}/', '0.7') for p in pages] + [('/cgv.html', '0.2'), ('/mentions-legales.html', '0.1'), ('/confidentialite.html', '0.1')]
(racine / 'sitemap.xml').write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + ''.join(f'<url><loc>{SITE}{u}</loc><lastmod>2026-10-27</lastmod><priority>{pr}</priority></url>\n' for u, pr in urls) + '</urlset>\n', encoding='utf-8')
(racine / 'robots.txt').write_text(f'User-agent: *\nAllow: /\nDisallow: /merci.html\nDisallow: /guides/_gabarit.html\n\nSitemap: {SITE}/sitemap.xml\n', encoding='utf-8')

print(f'{len(pages)} guides, {sum(p["mots"] for p in pages)} mots au total')
for slug, e in erreurs: print('ERREUR', slug, ':', '; '.join(e))
print(f'{len(doublons)} phrases dupliquées entre pages')
for ph, sl in doublons[:15]: print('  DOUBLON', sl, ':', ph[:110])
