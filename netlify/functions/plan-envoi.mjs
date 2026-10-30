// Envoi par e-mail du plan IA complet (brasdroitia.com/plan/) et ajout du contact à la liste « Plan IA ».
// Seul un plan signé par /api/plan peut être envoyé : le formulaire ne peut pas servir à envoyer un texte libre.
// Variables d'environnement Netlify : BREVO_API_KEY (obligatoire), BREVO_LISTE_PLAN (défaut 4).
import { getStore } from "@netlify/blobs";
import { createHash } from "node:crypto";
import { signerPlan, signerEmail, egal } from "../lib/signature.mjs";

const LISTE = Number(process.env.BREVO_LISTE_PLAN || 4);
const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
const esc = (s) => String(s || "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const br = (s) => esc(s).replace(/\n/g, "<br>");

function corps(p, metier, ville, email) {
  const lienD = `https://brasdroitia.com/api/desinscription?e=${encodeURIComponent(email)}&t=${signerEmail(email)}`;
  const utm = "utm_source=brevo&utm_medium=email&utm_campaign=plan_ia";
  const semaines = (p.semaines || []).map((s) => `
    <h3 style="margin:22px 0 6px;font-size:17px">Semaine ${esc(s.numero)} : ${esc(s.theme)}</h3>
    <table style="width:100%;border-collapse:collapse;font-size:14px">${(s.publications || []).map((x) => `
      <tr><td style="padding:6px 8px;border-bottom:1px solid #E4E2DA;white-space:nowrap;vertical-align:top"><b>${esc(x.jour)}</b><br>${esc(x.heure)}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #E4E2DA;vertical-align:top"><b>${esc(x.reseau)} · ${esc(x.format)}</b><br>${esc(x.idee)}</td></tr>`).join("")}
    </table>`).join("");
  const posts = (p.posts_rediges || []).map((x) => `
    <div style="background:#F6F5F0;border-left:4px solid #D4FF3F;border-radius:8px;padding:12px 14px;margin:12px 0">
    <b style="font-size:12px;text-transform:uppercase;color:#5B6070">${esc(x.reseau)} · ${esc(x.format)}</b><p style="margin:6px 0 0">${br(x.texte)}</p></div>`).join("");
  return `<!doctype html><html lang="fr"><body style="margin:0;background:#F6F5F0;font-family:Arial,Helvetica,sans-serif;color:#0E1530">
  <div style="max-width:620px;margin:0 auto;background:#fff;padding:26px 22px;line-height:1.5">
  <p style="font-size:13px;color:#5B6070;margin:0">Bras Droit IA · votre plan gratuit</p>
  <h1 style="font-size:24px;margin:8px 0 12px">Votre plan de 4 semaines : ${esc(metier)} à ${esc(ville)}</h1>
  <p>${br(p.diagnostic)}</p>
  <p><b>Le rythme conseillé :</b> ${br(p.rythme)}</p>
  ${semaines}
  <h2 style="font-size:19px;margin:28px 0 6px">2 publications prêtes à copier</h2>
  <p style="font-size:14px;color:#5B6070">Remplacez les éléments entre crochets, ajoutez votre photo, publiez.</p>
  ${posts}
  <h2 style="font-size:19px;margin:28px 0 6px">Le conseil pour votre fiche Google</h2>
  <p>${br(p.conseil_google)}</p>
  <p style="font-size:13px;color:#5B6070">Les heures sont des points de départ : regardez vos statistiques au bout de 2 semaines et gardez les créneaux qui marchent le mieux chez vous.</p>
  <div style="background:#0E1530;color:#F6F5F0;border-radius:14px;padding:20px;margin:26px 0">
  <p style="margin:0 0 8px;font-size:18px"><b>Pas le temps de tout écrire ?</b></p>
  <p style="margin:0 0 14px;color:#C9CEE3">Chaque mois, Bras Droit IA vous livre 20 publications dont 6 reels vidéo, 8 posts Google et le plan du mois, écrits pour votre métier et votre ville, relus avant envoi. 9 € le premier mois, puis 29 € TTC par mois, sans engagement.</p>
  <a href="https://brasdroitia.com/?${utm}#prix" style="display:inline-block;background:#D4FF3F;color:#0E1530;font-weight:bold;text-decoration:none;border-radius:10px;padding:12px 18px">Démarrer à 9 €</a></div>
  <p style="font-size:12px;color:#8A8E9A">Plan rédigé par une intelligence artificielle à partir de vos réponses : relisez-le avant de l'appliquer. Vous recevez cet e-mail parce que vous avez demandé votre plan sur brasdroitia.com. Nous pourrons vous écrire 2 ou 3 fois au sujet de Bras Droit IA. <a href="${lienD}" style="color:#8A8E9A">Se désinscrire</a>.<br>Bras Droit IA, une marque de SCALINEA.</p>
  </div></body></html>`;
}

export default async (req, context) => {
  if (req.method !== "POST") return json({ ok: false, message: "Méthode non autorisée." }, 405);
  let e;
  try { e = await req.json(); } catch { return json({ ok: false, message: "Requête illisible." }, 400); }
  if (e.site) return json({ ok: true, message: "Envoyé !" }); // champ piège pour les robots
  const email = String(e.email || "").trim().toLowerCase();
  if (!/^[^\s@]{1,64}@[^\s@]{1,190}\.[a-z]{2,}$/.test(email)) return json({ ok: false, message: "Adresse e-mail invalide." }, 400);
  if (!process.env.BREVO_API_KEY) return json({ ok: false, message: "L'envoi par e-mail ouvre très bientôt." }, 503);
  // Le plan arrive en 5 parties signées (a à e) : chacune est vérifiée, puis elles sont réunies.
  const p = { semaines: [] };
  try {
    for (const k of ["a", "b", "c", "d", "e"]) {
      const part = (e.parties || {})[k] || {};
      const texte = String(part.texte || "");
      if (texte.length > 20000 || !egal(part.sig || "", signerPlan(k + texte))) throw new Error("signature");
      const d = JSON.parse(texte);
      p.semaines.push(...(d.semaines || []));
      for (const c of ["diagnostic", "rythme", "conseil_google", "posts_rediges"]) if (d[c] !== undefined) p[c] = d[c];
    }
  } catch { return json({ ok: false, message: "Ce plan ne peut pas être envoyé. Préparez-en un nouveau." }, 400); }
  p.semaines.sort((x, y) => x.numero - y.numero);
  const metier = String(e.metier || "").slice(0, 60), ville = String(e.ville || "").slice(0, 60);

  const jour = new Date().toISOString().slice(0, 10);
  const cle = "e-" + jour + "-" + createHash("sha256").update(jour + (context.ip || "inconnu") + "bdia").digest("hex").slice(0, 16);
  const store = getStore("plan-ia");
  const n = Number((await store.get(cle)) || 0);
  if (n >= 3) return json({ ok: false, message: "Trop d'envois aujourd'hui. Réessayez demain." }, 429);
  await store.set(cle, String(n + 1));

  const h = { "api-key": process.env.BREVO_API_KEY, "content-type": "application/json", accept: "application/json" };
  const envoi = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST", headers: h,
    body: JSON.stringify({
      sender: { name: "L'équipe Bras Droit IA", email: "contact@brasdroitia.com" },
      to: [{ email }],
      subject: `Votre plan de 4 semaines : ${metier || "votre commerce"}${ville ? " à " + ville : ""}`,
      htmlContent: corps(p, metier, ville, email),
      tags: ["plan-ia"],
    }),
  });
  if (!envoi.ok) {
    console.error("Brevo envoi", envoi.status, await envoi.text());
    return json({ ok: false, message: "L'envoi n'a pas pu aboutir. Réessayez dans quelques minutes." }, 502);
  }
  const contact = await fetch("https://api.brevo.com/v3/contacts", {
    method: "POST", headers: h,
    body: JSON.stringify({ email, listIds: [LISTE], updateEnabled: true, attributes: { METIER: metier, VILLE: ville, SOURCE: "plan-ia", DATE_INSCRIPTION: jour } }),
  });
  if (!contact.ok && contact.status !== 204) console.error("Brevo contact", contact.status, await contact.text());
  return json({ ok: true, message: "C'est envoyé ! Votre plan complet arrive dans votre boîte mail (pensez à regarder dans les indésirables)." });
};

export const config = { path: "/api/plan-envoi" };
