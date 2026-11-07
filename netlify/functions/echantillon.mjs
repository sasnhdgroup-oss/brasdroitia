// Demande des « 3 publications offertes » (page brasdroitia.com/echantillon/, prospection, décision du 08/11/2026).
//   POST { commerce, metier, metier_autre, ville, reseau, pronom, style, email, consentement, site, s }
// Enregistre la demande (Netlify Blobs, magasin « echantillon », clé demandes/<horodatage>_<aléa>.json, statut « a_livrer »),
// ajoute le contact à la liste Brevo « Échantillons » (SOURCE=echantillon), envoie la confirmation au demandeur et une
// alerte à contact@. Livraison : script nhd-qg tools/echantillon/echantillon.mjs (--export puis --livrer), via
// /api/echantillon-export.
// Anti-abus : champ piège « site », 3 demandes au plus par adresse e-mail (pour toujours), 5 par visiteur et par jour,
// plafond du site par jour (BDIA_PLAFOND_ECHANTILLONS, défaut 60).
// Variables d'environnement Netlify : BREVO_API_KEY, BREVO_LISTE_ECHANTILLON (défaut 6, liste « Échantillons »).
import { getStore } from "@netlify/blobs";
import { createHash, randomBytes } from "node:crypto";
import { signerEmail } from "../lib/signature.mjs";
import { json, esc, gabarit, envoyer, majContact, heureParis, tampon, EMAIL_OK, CONTACT } from "../lib/brevo.mjs";

const LISTE = Number(process.env.BREVO_LISTE_ECHANTILLON || 6);
const PLAFOND_JOUR = Number(process.env.BDIA_PLAFOND_ECHANTILLONS || 60);
const PLAFOND_EMAIL = 3; // demandes par adresse e-mail, toutes dates confondues
const PLAFOND_VISITEUR = 5; // demandes par visiteur (empreinte d'IP non conservée en clair) et par jour
const METIERS = ["Coiffeur", "Barbier", "Esthéticienne", "Garage", "Artisan du bâtiment", "Auto-école", "Mandataire immobilier", "Restaurant", "Autre"];
const TONS = { vous: "vouvoiement", tu: "tutoiement" };
const STYLES = { serieux: "sérieux", detendu: "détendu" };
const MESSAGE_OK = "C'est noté. Vos 3 publications arrivent par e-mail, en général dans l'heure (au plus tard sous 24 h).";

const champ = (v, n) => String(v ?? "").replace(/[<>\u0000-\u001f]/g, " ").replace(/\s+/g, " ").trim().slice(0, n);
const empreinte = (txt) => createHash("sha256").update(txt).digest("hex").slice(0, 24);

// Lien Instagram ou Facebook : URL https de ces réseaux, ou @pseudo. Facultatif.
function reseauPropre(v) {
  const t = champ(v, 200);
  if (!t) return "";
  if (/^@[A-Za-z0-9._]{1,40}$/.test(t)) return t;
  try {
    const u = new URL(/^https?:\/\//i.test(t) ? t : "https://" + t);
    const hote = u.hostname.toLowerCase().replace(/^(www|m|web)\./, "");
    if (!["instagram.com", "facebook.com", "fb.com", "fb.me"].includes(hote)) return null;
    return "https://" + hote + u.pathname.replace(/\/+$/, "").slice(0, 120);
  } catch { return null; }
}

function valider(e) {
  const r = {
    commerce: champ(e.commerce, 80), metier: champ(e.metier, 40), metier_autre: champ(e.metier_autre, 60),
    ville: champ(e.ville, 60), pronom: TONS[e.pronom] ? e.pronom : "", style: STYLES[e.style] ? e.style : "",
    email: String(e.email || "").trim().toLowerCase(), prospect: /^[A-Za-z0-9_-]{1,40}$/.test(String(e.s || "")) ? String(e.s) : "",
  };
  const erreurs = {};
  if (r.commerce.length < 2) erreurs.commerce = "Indiquez le nom de votre commerce.";
  if (!METIERS.includes(r.metier)) erreurs.metier = "Choisissez votre métier dans la liste.";
  if (r.ville.length < 2) erreurs.ville = "Indiquez votre ville.";
  if (!r.pronom) erreurs.pronom = "Choisissez vous ou tu.";
  if (!r.style) erreurs.style = "Choisissez un ton.";
  if (!EMAIL_OK.test(r.email) || r.email.length > 254) erreurs.email = "Adresse e-mail invalide.";
  if (e.consentement !== true) erreurs.accord = "Cochez la case pour recevoir vos publications.";
  const res = reseauPropre(e.reseau);
  if (res === null) erreurs.reseau = "Indiquez un lien Instagram ou Facebook, ou laissez vide.";
  r.reseau = res || "";
  if (r.metier !== "Autre") r.metier_autre = "";
  return { r, erreurs };
}

async function compter(store, cle, plafond) {
  const n = Number((await store.get(cle)) || 0);
  if (n >= plafond) return false;
  await store.set(cle, String(n + 1));
  return true;
}

const metierLu = (r) => (r.metier === "Autre" ? r.metier_autre || "Autre" : r.metier);

function mailConfirmation(r) {
  const lienD = `https://brasdroitia.com/api/desinscription?e=${encodeURIComponent(r.email)}&t=${signerEmail(r.email)}`;
  return {
    objet: `C'est noté : vos 3 publications pour ${r.commerce} arrivent`,
    html: gabarit("C'est noté, vos 3 publications arrivent", `<p>Bonjour,</p>
<p>Merci pour votre demande. Nous préparons 3 publications pour <b>${esc(r.commerce)}</b> (${esc(metierLu(r))}, ${esc(r.ville)}) : 3 visuels et leurs légendes prêtes à copier.</p>
<p style="background:#EEF6D0;border-radius:10px;padding:12px 14px"><b>Vous les recevez par e-mail, en général dans l'heure</b>, et au plus tard sous 24 heures.</p>
<p>C'est gratuit et sans engagement : aucune carte bancaire, aucun abonnement. Une précision à nous donner (une prestation à mettre en avant, une info pratique) ? Répondez simplement à cet e-mail.</p>
<p>À très vite,<br>L'équipe Bras Droit IA</p>`,
      `Vous recevez cet e-mail parce que vous avez demandé vos 3 publications offertes sur brasdroitia.com. Nous vous écrirons une fois pour la livraison et une fois pour le suivi. <a href="${lienD}" style="color:#8A8E9A">Se désinscrire</a> · <a href="https://brasdroitia.com/confidentialite.html" style="color:#8A8E9A">Confidentialité</a><br>`),
  };
}

function mailAlerte(r, cle, quand) {
  const l = [["Commerce", r.commerce], ["Métier", metierLu(r)], ["Ville", r.ville], ["Réseau", r.reseau || "non indiqué"],
    ["Ton", `${TONS[r.pronom]}, ${STYLES[r.style]}`], ["E-mail", r.email], ["Prospect", r.prospect || "aucun (visite directe)"], ["Enregistrement", cle]];
  return {
    objet: `[Échantillon] ${r.commerce} · ${metierLu(r)} · ${r.ville}`,
    html: gabarit("Nouvelle demande d'échantillon", `<p><b>Reçue le :</b> ${esc(quand)}. Délai annoncé : dans l'heure, 24 h au plus.</p>
<table style="width:100%;border-collapse:collapse;font-size:14px">${l.map(([k, v]) => `<tr><td style="padding:6px 8px;border-bottom:1px solid #E4E2DA;width:32%;color:#5B6070">${esc(k)}</td><td style="padding:6px 8px;border-bottom:1px solid #E4E2DA">${esc(v)}</td></tr>`).join("")}</table>
<p>Circuit : <code>node tools/echantillon/echantillon.mjs --export</code>, visuels et légendes, puis <code>--livrer &lt;dossier&gt;</code> (nhd-qg). Répondre à cet e-mail écrit directement au demandeur.</p>`),
  };
}

export default async (req, context) => {
  if (req.method !== "POST") return json({ ok: false, message: "Méthode non autorisée." }, 405);
  let e;
  try { e = await req.json(); } catch { return json({ ok: false, message: "Requête illisible." }, 400); }
  if (!e || typeof e !== "object" || Array.isArray(e)) return json({ ok: false, message: "Requête illisible." }, 400);
  if (e.site) return json({ ok: true, message: MESSAGE_OK }); // champ piège pour les robots
  const { r, erreurs } = valider(e);
  if (Object.keys(erreurs).length) return json({ ok: false, message: "Quelques informations sont à compléter.", erreurs }, 400);
  if (!process.env.BREVO_API_KEY) return json({ ok: false, message: "Les demandes ouvrent très bientôt. Écrivez-nous en attendant : contact@brasdroitia.com." }, 503);

  const store = getStore("echantillon");
  const jour = new Date().toISOString().slice(0, 10);
  const visiteur = empreinte(jour + (context.ip || "inconnu") + "bdia");
  if (!(await compter(store, `compteurs/${jour}/total`, PLAFOND_JOUR))) return json({ ok: false, message: "Nous avons reçu beaucoup de demandes aujourd'hui. Réessayez demain, ou écrivez-nous : contact@brasdroitia.com." }, 429);
  if (!(await compter(store, `compteurs/${jour}/v-${visiteur}`, PLAFOND_VISITEUR))) return json({ ok: false, message: "Trop de demandes aujourd'hui depuis cette connexion. Réessayez demain." }, 429);
  if (!(await compter(store, `compteurs/email/${empreinte("email:" + r.email)}`, PLAFOND_EMAIL))) return json({ ok: false, message: "Vous avez déjà demandé vos publications offertes avec cette adresse. Pour une question, écrivez-nous : contact@brasdroitia.com." }, 429);

  const maintenant = new Date();
  const cle = `demandes/${tampon(maintenant)}_${randomBytes(3).toString("hex")}.json`;
  const quand = heureParis(maintenant);
  const enreg = {
    statut: "a_livrer", recu: maintenant.toISOString(), commerce: r.commerce, metier: metierLu(r), metier_liste: r.metier,
    ville: r.ville, reseau: r.reseau, ton: { pronom: r.pronom, style: r.style }, email: r.email, prospect: r.prospect,
    consentement: { texte: "J'accepte de recevoir mes 3 publications et un e-mail de suivi de Bras Droit IA. Désinscription en un clic.", le: maintenant.toISOString() },
  };
  await store.setJSON(cle, enreg);

  const c = mailConfirmation(r), a = mailAlerte(r, cle, quand);
  const [okClient] = await Promise.all([
    envoyer({ a: r.email, objet: c.objet, html: c.html, tags: ["bdia-echantillon-confirmation"] }),
    envoyer({ a: CONTACT, objet: a.objet, html: a.html, repondreA: r.email, tags: ["bdia-echantillon-alerte"] }),
    majContact(r.email, { SOURCE: "echantillon", METIER: metierLu(r).slice(0, 80), VILLE: r.ville, COMMERCE: r.commerce, DATE_INSCRIPTION: jour }, [LISTE])
      .catch((x) => console.error("Brevo contact", x?.message)),
  ]);
  return json({ ok: true, message: MESSAGE_OK + (okClient ? "" : " L'e-mail de confirmation n'a pas pu partir, mais votre demande est bien enregistrée.") });
};

export const config = { path: "/api/echantillon" };
