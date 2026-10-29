// Visuels d'une astuce : couverture du site (1200 x 630) et visuel Instagram/Facebook (1080 x 1350).
// Usage : node _outils/couverture.cjs astuces/<slug>/visuel.json
// visuel.json : {"categorie":"Fiche Google","titre":"…","points":["…","…","…"],"accroche":"…"}
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const src = path.resolve(process.argv[2]);
const dossier = path.dirname(src);
const v = JSON.parse(fs.readFileSync(src, 'utf8'));
const fonts = 'file://' + path.resolve(__dirname, '..', 'fonts');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

const base = `
@font-face{font-family:I;font-weight:400;src:url(${fonts}/Inter-Regular.woff2)}
@font-face{font-family:I;font-weight:700;src:url(${fonts}/Inter-Bold.woff2)}
@font-face{font-family:I;font-weight:900;src:url(${fonts}/Inter-Black.woff2)}
*{margin:0;box-sizing:border-box}body{font-family:I,sans-serif;background:#0E1530;color:#F6F5F0;overflow:hidden}
.cat{align-self:flex-start;display:inline-block;background:#D4FF3F;color:#0E1530;font-weight:900;text-transform:uppercase;letter-spacing:.06em;border-radius:999px}
.marque{display:flex;align-items:center;gap:12px;font-weight:900}
.marque i{font-style:normal;background:#D4FF3F;color:#0E1530;border-radius:999px;padding:2px 12px}
.halo{position:absolute;border-radius:50%;background:radial-gradient(circle,rgba(212,255,63,.22),rgba(212,255,63,0) 70%)}`;

const couverture = `<html><head><style>${base}
body{width:1200px;height:630px;padding:64px 72px 130px;position:relative;display:flex;flex-direction:column;justify-content:center}
.halo{width:700px;height:700px;right:-220px;top:-260px}
.cat{font-size:22px;padding:8px 18px}
h1{font-size:${v.titre.length > 40 ? 70 : 84}px;line-height:1.04;font-weight:900;letter-spacing:-.03em;margin-top:26px;max-width:1040px}
.marque{position:absolute;left:72px;bottom:56px;font-size:30px}
.site{position:absolute;right:72px;bottom:60px;font-size:24px;color:#A9B0CC}
</style></head><body><div class="halo"></div><span class="cat">Astuce · ${esc(v.categorie)}</span><h1>${esc(v.titre)}</h1>
<div class="marque">Bras Droit <i>IA</i></div><div class="site">brasdroitia.com/astuces</div></body></html>`;

const reseaux = `<html><head><style>${base}
body{width:1080px;height:1350px;padding:84px 80px 190px;position:relative;display:flex;flex-direction:column}
.halo{width:900px;height:900px;right:-360px;top:-320px}
.cat{font-size:26px;padding:10px 22px}
h1{font-size:${v.titre.length > 40 ? 78 : 92}px;line-height:1.04;font-weight:900;letter-spacing:-.03em;margin:40px 0 0}
ol{list-style:none;padding:0;counter-reset:n;margin-top:auto;margin-bottom:auto}
li{counter-increment:n;display:flex;gap:28px;align-items:center;font-size:44px;line-height:1.22;font-weight:700;margin-bottom:40px;background:rgba(246,245,240,.06);border-radius:24px;padding:22px 26px}
li:before{content:counter(n);flex:0 0 76px;height:76px;border-radius:20px;background:#D4FF3F;color:#0E1530;font-weight:900;font-size:40px;display:flex;align-items:center;justify-content:center}
.bas{position:absolute;left:80px;right:80px;bottom:76px;display:flex;justify-content:space-between;align-items:center}
.marque{font-size:34px}.ab{font-size:26px;color:#0E1530;background:#F6F5F0;border-radius:14px;padding:14px 22px;font-weight:900}
</style></head><body><div class="halo"></div><span class="cat">Astuce · ${esc(v.categorie)}</span><h1>${esc(v.titre)}</h1>
<ol>${(v.points || []).slice(0, 4).map((p) => `<li>${esc(p)}</li>`).join('')}</ol>
<div class="bas"><div class="marque">Bras Droit <i>IA</i></div><div class="ab">${esc(v.accroche || 'Enregistrez · Abonnez-vous')}</div></div></body></html>`;

(async () => {
  const b = await chromium.launch();
  for (const [html, w, h, nom] of [[couverture, 1200, 630, 'couverture.jpg'], [reseaux, 1080, 1350, 'reseaux.jpg']]) {
    const p = await b.newPage({ viewport: { width: w, height: h } });
    // Page écrite sur disque : une page about:blank ne peut pas charger les polices locales.
    const tmp = path.join(dossier, '.rendu.html');
    fs.writeFileSync(tmp, html);
    await p.goto('file://' + tmp, { waitUntil: 'load' });
    await p.evaluate(() => document.fonts.ready);
    await p.screenshot({ path: path.join(dossier, nom), type: 'jpeg', quality: 88 });
    await p.close();
    fs.unlinkSync(tmp);
  }
  await b.close();
  console.log('visuels créés dans', dossier);
})();
