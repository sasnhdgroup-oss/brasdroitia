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
cocon = {m.group(1): m.group(2).split(',')[0].strip() for m in re.finditer(r'^\| [A-Z] \| \d+ \| ([a-z0-9-]+) \| [^|]+\| ([^|]+)\|', plan, flags=re.M)}
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
 <nav class="menu" aria-label="Menu principal"><a href="/#offre">L\'offre</a><a href="/#metier">Exemples</a><a href="/#prix">Prix</a><a href="/guides/" class="g">Guides</a><a href="/astuces/" class="g">Astuces</a><a href="/#faq">FAQ</a></nav>
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

# ---------- Astuces (blog) ----------
import datetime
astuces_dir = racine / 'astuces'
astuces = []
mois = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre']
for f in sorted(astuces_dir.glob('*/index.html')):
    slug = f.parent.name
    s2 = f.read_text(encoding='utf-8')
    date = balise(s2, r'<meta property="article:published_time" content="(.*?)">')
    a = {'slug': slug, 'title': balise(s2, r'<title>(.*?)</title>'), 'desc': balise(s2, r'<meta name="description" content="(.*?)">'),
         'h1': balise(s2, r'<h1>(.*?)</h1>'), 'cat': balise(s2, r'<meta property="article:section" content="(.*?)">'), 'date': date,
         'mots': len(texte(balise(s2, r'<article>(.*?)</article>')).split())}
    e = []
    if '{{' in s2: e.append('balise {{ restante')
    if s2.count('<h1') != 1: e.append('h1')
    if not 30 <= len(a['title']) <= 65: e.append(f"title {len(a['title'])} car.")
    if not 120 <= len(a['desc']) <= 160: e.append(f"description {len(a['desc'])} car.")
    if not re.match(r'\d{4}-\d{2}-\d{2}$', date): e.append('date de publication')
    if a['mots'] < 350: e.append(f"{a['mots']} mots")
    if not (f.parent / 'couverture.jpg').exists(): e.append('couverture.jpg absente')
    for bloc in re.findall(r'<script type="application/ld\+json">(.*?)</script>', s2, flags=re.S):
        try: json.loads(bloc)
        except Exception as x: e.append(f'JSON-LD invalide ({x})')
    for lien in set(re.findall(r'href="/guides/([^"/#]+)/', s2)):
        if lien not in slugs: e.append(f'lien mort /guides/{lien}/')
    autres = [d.name for d in astuces_dir.iterdir() if d.is_dir()]
    for lien in set(re.findall(r'href="/astuces/([^"/#]+)/', s2)):
        if lien not in autres: e.append(f'lien mort /astuces/{lien}/')
    if e: erreurs.append(('astuces/' + slug, e))
    astuces.append(a)
astuces.sort(key=lambda a: a['date'], reverse=True)
def date_txt(d):
    y, m, j = d.split('-'); return f'{int(j)} {mois[int(m)-1]} {y}'
cartes = '\n'.join(f'  <li><a href="/astuces/{a["slug"]}/"><img src="/astuces/{a["slug"]}/couverture.jpg" alt="" width="1200" height="630" loading="lazy"><div class="t"><b>{html.escape(a["h1"])}</b><span>{html.escape(a["cat"])} · {date_txt(a["date"])}</span></div></a></li>' for a in astuces)
tete_a = (gabarit.split('<script type="application/ld+json">')[0]
          .replace('{{TITLE}}', 'Astuces pour les pros : images, avis, fiche Google | Bras Droit IA')
          .replace('{{DESCRIPTION}}', 'Une astuce concrète chaque mardi et chaque jeudi pour les artisans, commerçants et indépendants : photos, fiche Google, avis, réseaux sociaux.')
          .replace('https://brasdroitia.com/guides/{{SLUG}}/', 'https://brasdroitia.com/astuces/')
          .replace('content="article"', 'content="website"'))
hub_a = tete_a + f'''<link rel="alternate" type="application/rss+xml" title="Astuces Bras Droit IA" href="/astuces/rss.xml">
</head>
<body>
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-MDXSWKZP" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
''' + hub.split('<body>\n',1)[1].split('<main class="wrap">')[0].split('</noscript>\n',1)[-1] + f'''<main class="wrap">
<nav class="fil" aria-label="Fil d'Ariane"><a href="/">Accueil</a> › Astuces</nav>
<article>
<h1>Astuces pour les pros : visibles en 5 minutes</h1>
<p class="chapo">Une astuce concrète, chaque mardi et chaque jeudi : photos à publier, fiche Google, avis, réseaux sociaux. À appliquer tout de suite, sans agence.</p>
<ul class="blog">
{cartes}
</ul>
<div data-lettre="astuces"></div>
<p>Pour aller plus loin, consultez nos <a href="/guides/">guides complets</a>.</p>
</article>
</main>
''' + '<footer>' + hub.split('<footer>',1)[1]
hub_a = hub_a.replace('<script src="/consent.js"></script>', '<script src="/consent.js"></script>\n<script src="/lettre.js" defer></script>', 1)
(astuces_dir / 'index.html').write_text(hub_a, encoding='utf-8')
def rfc822(d):
    dt = datetime.datetime.strptime(d, '%Y-%m-%d').replace(hour=8, tzinfo=datetime.timezone.utc)
    return dt.strftime('%a, %d %b %Y %H:%M:%S +0000')
items = ''.join(f'<item><title>{html.escape(a["h1"])}</title><link>{SITE}/astuces/{a["slug"]}/</link><guid>{SITE}/astuces/{a["slug"]}/</guid><pubDate>{rfc822(a["date"])}</pubDate><category>{html.escape(a["cat"])}</category><description>{html.escape(a["desc"])}</description></item>\n' for a in astuces)
(astuces_dir / 'rss.xml').write_text(f'<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel><title>Astuces Bras Droit IA</title><link>{SITE}/astuces/</link><description>Une astuce concrète chaque mardi et chaque jeudi pour les pros.</description><language>fr-FR</language>\n{items}</channel></rss>\n', encoding='utf-8')

# ---------- Sitemap ----------
def mod_guide(slug):
    s3 = (guides / slug / 'index.html').read_text(encoding='utf-8')
    m = re.search(r'"dateModified":"(\d{4}-\d{2}-\d{2})"', s3)
    return m.group(1) if m else '2026-10-27'
derniere = max([a['date'] for a in astuces] + ['2026-10-27'])
urls = [('/', '1.0', derniere), ('/plan/', '0.9', '2026-10-29'), ('/outils/generateur-reponse-avis-google/', '0.9', '2026-10-28'), ('/guides/', '0.8', max(mod_guide(p['slug']) for p in pages)), ('/astuces/', '0.8', derniere)]
urls += [(f'/guides/{p["slug"]}/', '0.7', mod_guide(p['slug'])) for p in pages]
urls += [(f'/astuces/{a["slug"]}/', '0.6', a['date']) for a in astuces]
urls += [('/cgv.html', '0.2', '2026-10-29'), ('/mentions-legales.html', '0.1', '2026-10-27'), ('/confidentialite.html', '0.1', '2026-10-28')]
(racine / 'sitemap.xml').write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + ''.join(f'<url><loc>{SITE}{u}</loc><lastmod>{d}</lastmod><priority>{pr}</priority></url>\n' for u, pr, d in urls) + '</urlset>\n', encoding='utf-8')
(racine / 'robots.txt').write_text(f'User-agent: *\nAllow: /\nDisallow: /merci.html\nDisallow: /guides/_gabarit.html\nDisallow: /astuces/_gabarit.html\n\nSitemap: {SITE}/sitemap.xml\n', encoding='utf-8')
print(f'{len(astuces)} astuces')

print(f'{len(pages)} guides, {sum(p["mots"] for p in pages)} mots au total')
for slug, e in erreurs: print('ERREUR', slug, ':', '; '.join(e))
print(f'{len(doublons)} phrases dupliquées entre pages')
for ph, sl in doublons[:15]: print('  DOUBLON', sl, ':', ph[:110])
