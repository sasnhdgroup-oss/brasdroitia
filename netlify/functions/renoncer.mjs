// Fonction de rétractation en ligne (« Renoncer au contrat ici », page brasdroitia.com/renoncer/).
// Article L221-21 du Code de la consommation (ordonnance n° 2026-2 du 5 janvier 2026) et article 11 bis de la
// directive 2011/83/UE (directive (UE) 2023/2673), applicables depuis le 19 juin 2026 : le consommateur indique
// son nom, le contrat et l'adresse e-mail de confirmation, confirme, et reçoit sans délai un accusé de réception
// sur support durable (e-mail) avec le contenu de sa déclaration, la date et l'heure de son envoi.
// Aucun compte ni lien signé n'est exigé. Stockage : Netlify Blobs « clients », retractations/… (preuve, export nhd-qg).
import { getStore } from "@netlify/blobs";
import { createHash, randomBytes } from "node:crypto";
import { json, esc, gabarit, envoyer, heureParis, tampon, EMAIL_OK, CONTACT } from "../lib/brevo.mjs";

const DECLARATION = "Je vous notifie par la présente ma rétractation du contrat d'abonnement Bras Droit IA « Contenus du mois » (prestation de services numériques) conclu avec SCALINEA.";
const PLAFOND_VISITEUR = 5, PLAFOND_JOUR = 100;
const champ = (v, n) => String(v ?? "").replace(/[\u0000-\u001F<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, n);

export default async (req, context) => {
  if (req.method !== "POST") return json({ ok: false, message: "Méthode non autorisée." }, 405);
  let e;
  try { e = await req.json(); } catch { return json({ ok: false, message: "Requête illisible." }, 400); }
  if (!e || typeof e !== "object") return json({ ok: false, message: "Requête illisible." }, 400);
  if (e.site) return json({ ok: true, message: "Demande enregistrée." }); // champ piège pour les robots

  const d = {
    nom: champ(e.nom, 120),
    email: champ(e.email, 200).toLowerCase(),
    date_commande: champ(e.date_commande, 10),
    reference: champ(e.reference, 200),
  };
  const erreurs = {};
  if (d.nom.length < 2) erreurs.nom = "Indiquez votre nom.";
  if (!EMAIL_OK.test(d.email)) erreurs.email = "Indiquez une adresse e-mail valide : l'accusé de réception y sera envoyé.";
  const dc = /^\d{4}-\d{2}-\d{2}$/.test(d.date_commande) ? new Date(d.date_commande + "T12:00:00Z") : null;
  if (!dc || isNaN(dc) || dc > new Date(Date.now() + 864e5) || dc < new Date("2026-01-01")) erreurs.date_commande = "Indiquez la date de votre commande (même approximative).";
  if (e.declaration !== true) erreurs.declaration = "Cochez la déclaration de rétractation.";
  if (e.confirme !== true) erreurs.confirme = "Confirmez la rétractation.";
  if (Object.keys(erreurs).length) return json({ ok: false, message: "Quelques informations sont à compléter.", erreurs }, 400);
  if (!process.env.BREVO_API_KEY) return json({ ok: false, message: "Un incident technique empêche l'envoi. Écrivez-nous à contact@brasdroitia.com : votre demande sera traitée à la date de votre e-mail." }, 503);

  const store = getStore("clients");
  const jour = new Date().toISOString().slice(0, 10);
  const visiteur = createHash("sha256").update(jour + (context?.ip || "inconnu") + "bdia-r").digest("hex").slice(0, 16);
  const [total, perso] = await Promise.all([`compteurs/${jour}/retractations`, `compteurs/${jour}/r-${visiteur}`].map((k) => store.get(k).then((v) => Number(v || 0))));
  if (perso >= PLAFOND_VISITEUR || total >= PLAFOND_JOUR) return json({ ok: false, message: "Trop de demandes depuis cette connexion aujourd'hui. Écrivez-nous à contact@brasdroitia.com : votre demande sera traitée à la date de votre e-mail." }, 429);
  await Promise.all([store.set(`compteurs/${jour}/retractations`, String(total + 1)), store.set(`compteurs/${jour}/r-${visiteur}`, String(perso + 1))]);

  const maintenant = new Date();
  const quand = heureParis(maintenant);
  const numero = `R-${tampon(maintenant).slice(0, 8)}-${randomBytes(3).toString("hex").toUpperCase()}`;
  const cle = `retractations/${tampon(maintenant)}_${numero}.json`;
  const dateFr = dc.toLocaleDateString("fr-FR", { timeZone: "UTC", day: "numeric", month: "long", year: "numeric" });
  await store.setJSON(cle, { type: "retractation", numero, recu: maintenant.toISOString(), recu_paris: quand, ...d, declaration: DECLARATION });

  const contenu = `<table style="width:100%;border-collapse:collapse;font-size:14px">
<tr><td style="padding:6px 8px;border-bottom:1px solid #E4E2DA;color:#5B6070;width:38%">Numéro de la demande</td><td style="padding:6px 8px;border-bottom:1px solid #E4E2DA"><b>${esc(numero)}</b></td></tr>
<tr><td style="padding:6px 8px;border-bottom:1px solid #E4E2DA;color:#5B6070">Reçue le</td><td style="padding:6px 8px;border-bottom:1px solid #E4E2DA"><b>${esc(quand)}</b></td></tr>
<tr><td style="padding:6px 8px;border-bottom:1px solid #E4E2DA;color:#5B6070">Nom</td><td style="padding:6px 8px;border-bottom:1px solid #E4E2DA">${esc(d.nom)}</td></tr>
<tr><td style="padding:6px 8px;border-bottom:1px solid #E4E2DA;color:#5B6070">Adresse e-mail</td><td style="padding:6px 8px;border-bottom:1px solid #E4E2DA">${esc(d.email)}</td></tr>
<tr><td style="padding:6px 8px;border-bottom:1px solid #E4E2DA;color:#5B6070">Contrat</td><td style="padding:6px 8px;border-bottom:1px solid #E4E2DA">Abonnement Bras Droit IA « Contenus du mois », commandé le ${esc(dateFr)}${d.reference ? `<br>Référence indiquée : ${esc(d.reference)}` : ""}</td></tr>
<tr><td style="padding:6px 8px;border-bottom:1px solid #E4E2DA;color:#5B6070">Déclaration</td><td style="padding:6px 8px;border-bottom:1px solid #E4E2DA">« ${esc(DECLARATION)} »</td></tr>
</table>`;
  const okClient = await envoyer({
    a: d.email,
    objet: `Accusé de réception de votre rétractation (${numero})`,
    html: gabarit("Accusé de réception de votre rétractation", `<p>Bonjour ${esc(d.nom)},</p>
<p>Nous accusons réception de votre demande de rétractation, envoyée depuis la fonction « Renoncer au contrat ici » du site brasdroitia.com. Voici son contenu :</p>
${contenu}
<p>Comme prévu par nos conditions générales de vente, l'abonnement prend fin et le remboursement intégral est effectué sur le moyen de paiement utilisé, au plus tard 14 jours après la réception de cette demande. Aucune autre démarche n'est nécessaire de votre part.</p>
<p>Conservez cet e-mail : il vaut preuve de la date et de l'heure de votre demande. Une question ? Répondez simplement à cet e-mail.</p>
<p>L'équipe Bras Droit IA</p>`),
    tags: ["bdia-retractation-accuse"],
  });
  await envoyer({
    a: CONTACT,
    objet: `[RÉTRACTATION] ${d.nom} <${d.email}> · ${numero} · rembourser sous 14 jours`,
    html: gabarit("Demande de rétractation reçue", `<p><b>À faire :</b> retrouver le client dans Stripe (e-mail ${esc(d.email)}), rembourser intégralement et résilier immédiatement, au plus tard 14 jours après le ${esc(quand)}. Envoyer ensuite le modèle 6.</p>
<p>Accusé de réception au client : ${okClient ? "envoyé" : "<b>ÉCHEC, à renvoyer à la main</b>"}.</p>${contenu}<p>Enregistrement : ${esc(cle)}</p>`),
    repondreA: d.email,
    tags: ["bdia-retractation-copie"],
  });
  return json({ ok: true, numero, recu: quand, envoye: okClient, nom: d.nom, email: d.email, date_commande: dateFr, reference: d.reference, declaration: DECLARATION });
};

export const config = { path: "/api/renoncer" };
