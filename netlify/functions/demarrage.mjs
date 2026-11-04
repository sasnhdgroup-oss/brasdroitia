// Questionnaire de démarrage et formulaire du mois des clients Bras Droit IA (page brasdroitia.com/demarrage/).
// Accès par lien personnel signé : ?e=<email>&c=<id client Stripe>&t=<signerClient(email, id)>, envoyé par
// le script nhd-qg tools/stripe/bienvenue_clients.mjs. Sans signature valide, rien n'est lu ni enregistré.
//   GET  /api/demarrage?e&c&t[&mois=1]        vérifie le lien, renvoie les questions à afficher
//   POST { e, c, t, action: "fichier", ... }   dépose une photo ou le logo (déjà réduit par le navigateur)
//   POST { e, c, t, mode, reponses, site }     enregistre les réponses, accusé de réception au client, copie à contact@
// Stockage : Netlify Blobs, magasin « clients » (reponses/…, fichiers/<client>/…), lu par /api/demarrage-export.
// Variables d'environnement Netlify : BREVO_API_KEY (envoi et clé de signature), BREVO_LISTE (lettre, défaut 3),
// BDIA_PLAFOND_QUESTIONNAIRES (facultatif, défaut 200 envois par jour pour tout le site).
import { getStore } from "@netlify/blobs";
import { randomBytes } from "node:crypto";
import { signerClient, egal } from "../lib/signature.mjs";
import { ACCUEIL, MOIS, valider, lignes } from "../lib/questionnaire.mjs";
import { json, esc, gabarit, tableau, envoyer, majContact, heureParis, tampon, EMAIL_OK, CONTACT } from "../lib/brevo.mjs";

const PLAFOND_JOUR = Number(process.env.BDIA_PLAFOND_QUESTIONNAIRES || 200);
const PLAFOND_CLIENT = 6; // envois de formulaire par jour et par client
const PLAFOND_FICHIERS = 30; // fichiers par jour et par client
const TAILLE_MAX = 2.5 * 1024 * 1024; // octets, après réduction par le navigateur
const TYPES = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const CLIENT_OK = /^cus_[A-Za-z0-9]{6,40}$/;
const PORTAIL = "https://billing.stripe.com/p/login/00w14odWDdx7bTCfMP4gg00";
const REFUS = "Ce lien n'est pas valide ou a été copié de façon incomplète. Ouvrez à nouveau le lien reçu par e-mail, ou écrivez-nous à contact@brasdroitia.com : nous vous renvoyons votre lien personnel.";

const magasin = () => getStore("clients");

function identite(src) {
  const email = String(src.e || "").trim().toLowerCase();
  const client = String(src.c || "").trim();
  const t = String(src.t || "");
  if (!process.env.BREVO_API_KEY || !EMAIL_OK.test(email) || !CLIENT_OK.test(client) || !t) return null;
  return egal(t, signerClient(email, client)) ? { email, client } : null;
}

// Compteur journalier (lecture puis écriture : suffisant pour un plafond anti-abus).
async function compter(store, cle, plafond) {
  const n = Number((await store.get(cle)) || 0);
  if (n >= plafond) return false;
  await store.set(cle, String(n + 1));
  return true;
}

// Dernières réponses au questionnaire de démarrage de ce client (pour le métier dans le formulaire du mois).
async function dernierAccueil(store, client) {
  const { blobs } = await store.list({ prefix: "reponses/" });
  const cles = blobs.map((b) => b.key).filter((k) => k.includes(`_${client}_accueil`)).sort();
  if (!cles.length) return null;
  return store.get(cles[cles.length - 1], { type: "json" });
}

const ajouterJours = (n) => new Date(Date.now() + n * 864e5).toLocaleDateString("fr-FR", { timeZone: "Europe/Paris", weekday: "long", day: "numeric", month: "long" });

function signatureMagique(octets, type) {
  const b = octets;
  if (type === "image/jpeg") return b[0] === 0xff && b[1] === 0xd8;
  if (type === "image/png") return b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47;
  if (type === "image/webp") return String.fromCharCode(...b.slice(0, 4)) === "RIFF" && String.fromCharCode(...b.slice(8, 12)) === "WEBP";
  return false;
}

async function deposerFichier(store, id, e, jour) {
  const champ = e.champ === "logo" ? "logo" : "photos";
  const type = String(e.type || "");
  if (!TYPES[type]) return json({ ok: false, message: "Format accepté : JPG, PNG ou WebP." }, 400);
  let octets;
  try { octets = Buffer.from(String(e.donnees || ""), "base64"); } catch { octets = Buffer.alloc(0); }
  if (octets.length < 100 || octets.length > TAILLE_MAX || !signatureMagique(octets, type)) return json({ ok: false, message: "Cette image n'a pas pu être lue (2,5 Mo au plus)." }, 400);
  if (!(await compter(store, `compteurs/${jour}/${id.client}-fichiers`, PLAFOND_FICHIERS))) return json({ ok: false, message: "Trop de fichiers envoyés aujourd'hui. Envoyez les autres en répondant à notre e-mail." }, 429);
  const nom = String(e.nom || "image").replace(/[^\p{L}\p{N} ._-]/gu, "").slice(0, 80) || "image";
  const fid = `${tampon()}-${randomBytes(4).toString("hex")}-${champ}.${TYPES[type]}`;
  await store.set(`fichiers/${id.client}/${fid}`, octets, { metadata: { type, nom, champ, taille: octets.length } });
  return json({ ok: true, id: fid, nom });
}

function mailClient(mode, propres, quand, id) {
  const lien = (p) => `https://brasdroitia.com${p}`;
  const recap = tableau(lignes(mode === "mois" ? MOIS : ACCUEIL, propres, () => "reçu"));
  const pied = `<a href="${lien("/cgv.html")}" style="color:#8A8E9A">CGV</a> · <a href="${PORTAIL}" style="color:#8A8E9A">Gérer ou résilier mon abonnement</a> · Service réservé aux professionnels<br>`;
  if (mode === "mois") {
    return {
      objet: "Bien reçu : vos informations pour le pack du mois prochain",
      html: gabarit("Merci, c'est bien reçu", `<p>Bonjour,</p>
<p>Nous avons bien reçu votre formulaire du mois le ${esc(quand)}. Nous en tenons compte pour votre prochain pack, préparé après votre prochain paiement et livré dans les 24 heures qui suivent.</p>
<p>Un oubli ou une correction ? Répondez simplement à cet e-mail.</p>${recap}
<p>À très vite,<br>L'équipe Bras Droit IA</p>`, pied),
    };
  }
  return {
    objet: "Questionnaire bien reçu : votre premier pack arrive sous 24 h",
    html: gabarit("Merci, votre questionnaire est bien reçu", `<p>Bonjour,</p>
<p>Nous avons bien reçu votre questionnaire de démarrage le ${esc(quand)}.</p>
<p style="background:#EEF6D0;border-radius:10px;padding:12px 14px"><b>Votre premier pack arrive par e-mail dans les 24 heures</b>, au plus tard le ${esc(ajouterJours(1))} : 20 publications Instagram et Facebook avec leurs visuels, dont 6 reels, 8 posts pour votre fiche Google et votre plan du mois.</p>
<p>Un oubli ou une correction ? Répondez simplement à cet e-mail. Pour vos avis Google, notre <a href="${lien("/outils/generateur-reponse-avis-google/")}">générateur gratuit</a> vous propose une réponse en quelques secondes.</p>
<p style="font-size:14px;color:#5B6070">Vos réponses, pour mémoire :</p>${recap}
<p>À très vite,<br>L'équipe Bras Droit IA</p>`, pied),
  };
}

function mailCopie(mode, propres, quand, id, cle, fichiers) {
  const nomF = Object.fromEntries(fichiers.map((f) => [f.id, `${f.nom} (${Math.round(f.taille / 1024)} ko)`]));
  const etab = propres.etablissement || "";
  return {
    objet: `[${mode === "mois" ? "Formulaire du mois" : "Questionnaire"}] ${etab || id.email}${propres.ville ? " · " + propres.ville : ""} · ${id.client}`,
    html: gabarit(mode === "mois" ? "Formulaire du mois reçu" : "Questionnaire de démarrage reçu", `
<p><b>Client :</b> ${esc(id.email)} · ${esc(id.client)}<br><b>Reçu le :</b> ${esc(quand)}<br><b>Enregistrement :</b> ${esc(cle)}</p>
${mode === "accueil" ? `<p style="background:#EEF6D0;border-radius:10px;padding:10px 12px"><b>Délai annoncé : 24 h (CGV A.5 : 3 jours au plus). Livrer au plus tard le ${esc(ajouterJours(1))}.</b> Noter <code>questionnaire_recu</code> dans Stripe.</p>` : ""}
${fichiers.length ? `<p>${fichiers.length} fichier(s) joint(s) : à récupérer avec <code>node tools/stripe/bienvenue_clients.mjs --export</code> (nhd-qg).</p>` : ""}
${tableau(lignes(mode === "mois" ? MOIS : ACCUEIL, propres, (x) => nomF[x] || x))}
<p>Répondre à cet e-mail écrit directement au client.</p>`),
  };
}

export default async (req, context) => {
  const store = magasin();
  if (req.method === "GET") {
    const url = new URL(req.url);
    const id = identite(Object.fromEntries(url.searchParams));
    if (!id) return json({ ok: false, message: REFUS }, 403);
    const mode = url.searchParams.get("mois") ? "mois" : "accueil";
    let metier = null, deja = null;
    try {
      const d = await dernierAccueil(store, id.client);
      if (d) { metier = d.reponses?.metier || null; deja = d.recu; }
    } catch (x) { console.error("Blobs lecture", x?.message); }
    return json({ ok: true, mode, metier, deja, etapes: mode === "mois" ? MOIS : ACCUEIL });
  }
  if (req.method !== "POST") return json({ ok: false, message: "Méthode non autorisée." }, 405);
  let e;
  try { e = await req.json(); } catch { return json({ ok: false, message: "Requête illisible." }, 400); }
  if (!e || typeof e !== "object") return json({ ok: false, message: "Requête illisible." }, 400);
  if (e.site) return json({ ok: true, message: "Merci !" }); // champ piège pour les robots
  const id = identite(e);
  if (!id) return json({ ok: false, message: REFUS }, 403);
  const jour = new Date().toISOString().slice(0, 10);

  if (e.action === "fichier") return deposerFichier(store, id, e, jour);

  const mode = e.mode === "mois" ? "mois" : "accueil";
  const etapes = mode === "mois" ? MOIS : ACCUEIL;
  const { blobs } = await store.list({ prefix: `fichiers/${id.client}/` });
  const fichiersClient = new Map(blobs.map((b) => [b.key.split("/").pop(), b.key]));
  const brut = { ...(e.reponses || {}) };
  if (mode === "mois") {
    const d = await dernierAccueil(store, id.client).catch(() => null);
    brut.metier = d?.reponses?.metier || "*";
  }
  const { propres, erreurs } = valider(etapes, brut, (x) => fichiersClient.has(x));
  if (mode === "mois") delete propres.metier;
  if (Object.keys(erreurs).length) return json({ ok: false, message: "Quelques réponses sont à compléter.", erreurs }, 400);

  if (!(await compter(store, `compteurs/${jour}/total`, PLAFOND_JOUR))) return json({ ok: false, message: "Un incident nous empêche d'enregistrer votre réponse. Réessayez dans une heure ou écrivez-nous : contact@brasdroitia.com." }, 429);
  if (!(await compter(store, `compteurs/${jour}/${id.client}-envois`, PLAFOND_CLIENT))) return json({ ok: false, message: "Vous avez déjà envoyé ce formulaire plusieurs fois aujourd'hui. Pour une correction, répondez à notre e-mail." }, 429);

  // Fichiers rattachés à ces réponses (métadonnées pour l'e-mail interne et l'export).
  const fichiers = [];
  for (const k of ["logo", "photos"]) for (const fid of propres[k] || []) {
    const m = await store.getMetadata(fichiersClient.get(fid)).catch(() => null);
    fichiers.push({ id: fid, cle: fichiersClient.get(fid), champ: k, nom: m?.metadata?.nom || fid, taille: Number(m?.metadata?.taille || 0) });
  }
  const maintenant = new Date();
  const cle = `reponses/${tampon(maintenant)}_${id.client}_${mode}.json`;
  const enreg = { type: mode, client: id.client, email: id.email, recu: maintenant.toISOString(), reponses: propres, fichiers };
  await store.setJSON(cle, enreg);
  const quand = heureParis(maintenant);

  const c = mailClient(mode, propres, quand, id);
  const k = mailCopie(mode, propres, quand, id, cle, fichiers);
  const [okClient] = await Promise.all([
    envoyer({ a: id.email, objet: c.objet, html: c.html, tags: [`bdia-${mode}-accuse`] }),
    envoyer({ a: CONTACT, objet: k.objet, html: k.html, repondreA: id.email, tags: [`bdia-${mode}-copie`] }),
  ]);
  if (mode === "accueil") {
    const attributs = { QUESTIONNAIRE_RECU: jour, METIER: (propres.metier_precis || propres.metier || "").slice(0, 80), VILLE: (propres.ville || "").slice(0, 80) };
    let listes;
    if (propres.conseils_email) { listes = [Number(process.env.BREVO_LISTE || 3)]; attributs.DATE_INSCRIPTION = jour; }
    await majContact(id.email, attributs, listes).catch((x) => console.error("Brevo contact", x?.message));
  }
  const delai = mode === "accueil" ? ` Votre premier pack arrive par e-mail dans les 24 heures, au plus tard le ${ajouterJours(1)}.` : " Nous en tenons compte pour votre prochain pack.";
  return json({
    ok: true,
    message: `Merci, c'est bien reçu (${quand}).${delai}` + (okClient ? " Un e-mail de confirmation vient de partir : pensez à regarder dans les indésirables." : " L'e-mail de confirmation n'a pas pu partir, mais vos réponses sont bien enregistrées."),
  });
};

export const config = { path: "/api/demarrage" };
