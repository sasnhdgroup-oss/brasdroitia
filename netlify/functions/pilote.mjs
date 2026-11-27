// Demande d'installation pilote du service artisans (brasdroitia.com/pilote/, 25/11/2026).
//   POST /api/pilote {prenom, entreprise, metier, taille, telephone, email?, codePostal, jour, moment, message?, accord, site}
// Enregistre la demande (Netlify Blobs, magasin « pilotes »), prévient contact@brasdroitia.com par e-mail (Brevo)
// et envoie un accusé de réception à l'artisan s'il a donné son e-mail. Aucun SMS, aucun paiement.
//   GET /api/pilote?jours=30  lecture réservée au script nhd-qg (en-têtes x-bdia-ts et x-bdia-sig, comme /api/suivi).
// Données conservées 3 ans après le dernier contact (prospects professionnels), voir la page Confidentialité.
import { getStore } from "@netlify/blobs";
import { createHash, randomBytes } from "node:crypto";
import { json, esc, envoyer, gabarit, heureParis, tampon, EMAIL_OK, CONTACT } from "../lib/brevo.mjs";
import { signerExport, egal, FENETRE_EXPORT } from "../lib/signature.mjs";

export const METIERS = ["Électricien", "Plombier-chauffagiste", "Plombier", "Chauffagiste", "Autre métier du bâtiment"];
export const TAILLES = ["Seul", "2 à 5 personnes", "6 à 15 personnes", "Plus de 15 personnes"];
export const JOURS = ["Dès que possible", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi matin"];
export const MOMENTS = ["7 h - 9 h", "9 h - 12 h", "12 h - 14 h", "14 h - 18 h", "18 h - 20 h"];

const propre = (v, max) => String(v ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);

export function telephoneFr(v) {
  const m = String(v || "").replace(/[\s.()-]/g, "");
  if (/^0[1-9]\d{8}$/.test(m)) return "+33" + m.slice(1);
  if (/^0033[1-9]\d{8}$/.test(m)) return "+" + m.slice(2);
  if (/^\+33[1-9]\d{8}$/.test(m)) return m;
  if (/^\+(32|41|352)\d{8,10}$/.test(m)) return m; // Belgique, Suisse, Luxembourg
  return "";
}

/** Contrôle d'une demande ; renvoie { erreurs, d } (d : la demande nettoyée). */
export function valider(e) {
  const erreurs = [];
  const d = {
    prenom: propre(e.prenom, 60),
    entreprise: propre(e.entreprise, 80),
    metier: METIERS.includes(e.metier) ? e.metier : "",
    taille: TAILLES.includes(e.taille) ? e.taille : "",
    telephone: telephoneFr(e.telephone),
    email: propre(e.email, 120).toLowerCase(),
    codePostal: propre(e.codePostal, 10),
    jour: JOURS.includes(e.jour) ? e.jour : "",
    moment: MOMENTS.includes(e.moment) ? e.moment : "",
    message: propre(e.message, 600),
    source: propre(e.source, 80).replace(/[^a-z0-9/_.:-]/gi, ""),
  };
  if (d.prenom.length < 2) erreurs.push("Indiquez votre prénom.");
  if (d.entreprise.length < 2) erreurs.push("Indiquez le nom de votre entreprise.");
  if (!d.metier) erreurs.push("Choisissez votre métier.");
  if (!d.taille) erreurs.push("Indiquez la taille de votre entreprise.");
  if (!d.telephone) erreurs.push("Numéro de téléphone invalide (ex. 06 12 34 56 78).");
  if (d.email && !EMAIL_OK.test(d.email)) erreurs.push("Adresse e-mail invalide (ou laissez la case vide).");
  if (!/^\d{5}$/.test(d.codePostal)) erreurs.push("Code postal à 5 chiffres.");
  if (!d.jour || !d.moment) erreurs.push("Choisissez quand nous pouvons vous appeler.");
  if (e.accord !== true) erreurs.push("Cochez la case pour que nous puissions vous rappeler.");
  return { erreurs, d };
}

export default async (req, context) => {
  const store = getStore({ name: "pilotes", consistency: "strong" });

  if (req.method === "GET") {
    const url = new URL(req.url);
    const ts = Number(req.headers.get("x-bdia-ts") || 0);
    const sig = req.headers.get("x-bdia-sig") || "";
    if (!process.env.BREVO_API_KEY || !ts || Math.abs(Date.now() / 1000 - ts) > FENETRE_EXPORT || !egal(sig, signerExport(ts, url.pathname + url.search))) {
      return json({ ok: false, message: "Accès refusé." }, 403);
    }
    const n = Math.min(365, Math.max(1, Number(url.searchParams.get("jours") || 30)));
    const depuis = tampon(new Date(Date.now() - n * 86400000));
    const { blobs } = await store.list({ prefix: "p/" });
    const demandes = [];
    for (const { key } of blobs) if (key.slice(2) >= depuis) demandes.push(await store.get(key, { type: "json" }));
    return json({ ok: true, demandes });
  }

  if (req.method !== "POST") return json({ ok: false, erreurs: ["Méthode non autorisée."] }, 405);
  let e;
  try { e = await req.json(); } catch { return json({ ok: false, erreurs: ["Requête illisible."] }, 400); }
  if (!e || typeof e !== "object") return json({ ok: false, erreurs: ["Requête illisible."] }, 400);
  if (e.site) return json({ ok: true }); // champ piège pour les robots

  const { erreurs, d } = valider(e);
  if (erreurs.length) return json({ ok: false, erreurs }, 400);

  // 5 demandes par jour et par visiteur (empreinte d'IP du jour, jamais l'IP en clair).
  const jour = new Date().toISOString().slice(0, 10);
  const cle = `l/${jour}/` + createHash("sha256").update(jour + (context.ip || "inconnu") + "pilote").digest("hex").slice(0, 16);
  const n = Number((await store.get(cle)) || 0);
  if (n >= 5) return json({ ok: false, erreurs: ["Trop de demandes aujourd'hui. Écrivez-nous à " + CONTACT + "."] }, 429);
  await store.set(cle, String(n + 1));

  const id = tampon() + "-" + randomBytes(3).toString("hex");
  const demande = { id, recuLe: new Date().toISOString(), ...d, statut: "nouvelle" };
  await store.setJSON("p/" + id, demande);

  if (process.env.BREVO_API_KEY) {
    const lignes = [
      ["Prénom", d.prenom], ["Entreprise", d.entreprise], ["Métier", d.metier], ["Taille", d.taille],
      ["Téléphone", d.telephone], ["E-mail", d.email || "non indiqué"], ["Code postal", d.codePostal],
      ["À rappeler", d.jour + ", " + d.moment], ["Message", d.message || "aucun"], ["Origine", d.source || "site"],
    ];
    const tab = `<table style="width:100%;border-collapse:collapse;font-size:14px">${lignes.map(([k, v]) =>
      `<tr><td style="padding:6px 8px;border-bottom:1px solid #E4E2DA;color:#5B6070;width:35%">${esc(k)}</td><td style="padding:6px 8px;border-bottom:1px solid #E4E2DA">${esc(v)}</td></tr>`).join("")}</table>`;
    await envoyer({
      a: CONTACT, objet: `Pilote : ${d.entreprise} (${d.metier}, ${d.codePostal}) à rappeler ${d.jour}`,
      html: gabarit("Nouvelle demande d'installation pilote", `<p>Reçue le ${esc(heureParis())}.</p>${tab}<p>Règle : rappeler dans le créneau choisi, au plus tard le jour ouvré suivant.</p>`),
      repondreA: d.email || undefined, tags: ["pilote-interne"],
    });
    if (d.email) {
      await envoyer({
        a: d.email, objet: "Votre demande d'installation Bras Droit IA",
        html: gabarit(`Merci ${d.prenom}, c'est bien reçu`,
          `<p>Nous vous appelons au ${esc(d.telephone)} : <b>${esc(d.jour)}, ${esc(d.moment)}</b>. L'appel dure 10 minutes : nous regardons ensemble comment arrivent vos demandes et vos devis, puis nous fixons l'installation (30 minutes, à distance).</p>
<p>Merci pour votre demande : nous vous écrivons dès l'ouverture des inscriptions. Rien n'est payé ni prélevé.</p>
<p>Un empêchement ? Répondez simplement à cet e-mail.</p>`),
        repondreA: CONTACT, tags: ["pilote-accuse"],
      });
    }
  } else {
    console.error("pilote : BREVO_API_KEY absente, demande enregistrée sans e-mail", id);
  }
  return json({ ok: true, id });
};

export const config = { path: "/api/pilote" };
