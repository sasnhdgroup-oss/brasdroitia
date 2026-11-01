// Envois transactionnels Brevo et petites aides communes aux fonctions clients (/api/demarrage, /api/renoncer).
export const EXPEDITEUR = { name: "L'équipe Bras Droit IA", email: "contact@brasdroitia.com" };
export const CONTACT = "contact@brasdroitia.com";

export const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
export const br = (s) => esc(s).replace(/\n/g, "<br>");
export const EMAIL_OK = /^[^\s@<>"]{1,64}@[^\s@<>"]{1,190}\.[a-z]{2,}$/i;

// Horodatage lisible, heure de Paris (accusés de réception).
export const heureParis = (d = new Date()) =>
  d.toLocaleString("fr-FR", { timeZone: "Europe/Paris", dateStyle: "full", timeStyle: "medium" }) + " (heure de Paris)";
// Horodatage compact et triable pour les clés Netlify Blobs : 20261101T102233Z.
export const tampon = (d = new Date()) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");

// Gabarit commun des e-mails (même style que l'e-mail du plan IA).
export const gabarit = (titre, corps, pied = "") => `<!doctype html><html lang="fr"><body style="margin:0;background:#F6F5F0;font-family:Arial,Helvetica,sans-serif;color:#0E1530">
<div style="max-width:620px;margin:0 auto;background:#fff;padding:26px 22px;line-height:1.5">
<p style="font-size:13px;color:#5B6070;margin:0">Bras Droit IA</p>
<h1 style="font-size:22px;margin:8px 0 14px">${esc(titre)}</h1>
${corps}
<p style="font-size:12px;color:#8A8E9A;margin-top:28px">${pied}Bras Droit IA, une marque de SCALINEA · contact@brasdroitia.com · Nous ne vous demanderons jamais vos mots de passe.</p>
</div></body></html>`;

// Tableau « question : réponse » à partir de lignes() de questionnaire.mjs.
export const tableau = (sections) => sections.map((s) => `
<h2 style="font-size:16px;margin:20px 0 6px">${esc(s.titre)}</h2>
<table style="width:100%;border-collapse:collapse;font-size:14px">${s.lignes.map((l) => `
<tr><td style="padding:6px 8px;border-bottom:1px solid #E4E2DA;vertical-align:top;width:40%;color:#5B6070">${esc(l.n)} · ${esc(l.label)}</td>
<td style="padding:6px 8px;border-bottom:1px solid #E4E2DA;vertical-align:top">${br(l.valeur)}</td></tr>`).join("")}
</table>`).join("");

const entetes = () => ({ "api-key": process.env.BREVO_API_KEY, "content-type": "application/json", accept: "application/json" });

export async function envoyer({ a, objet, html, repondreA, tags = [] }) {
  const r = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST", headers: entetes(),
    body: JSON.stringify({ sender: EXPEDITEUR, to: [{ email: a }], subject: objet, htmlContent: html, tags, ...(repondreA ? { replyTo: { email: repondreA } } : {}) }),
  });
  if (!r.ok) console.error("Brevo envoi", tags.join(","), r.status, (await r.text()).slice(0, 300));
  return r.ok;
}

export async function majContact(email, attributs, listIds) {
  const r = await fetch("https://api.brevo.com/v3/contacts", {
    method: "POST", headers: entetes(),
    body: JSON.stringify({ email, updateEnabled: true, attributes: attributs, ...(listIds ? { listIds } : {}) }),
  });
  if (!r.ok && r.status !== 204) console.error("Brevo contact", r.status, (await r.text()).slice(0, 300));
  return r.ok || r.status === 204;
}
