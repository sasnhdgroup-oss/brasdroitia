// /api/stripe-bienvenue : e-mail de bienvenue envoyé dans la minute qui suit le paiement (décision d'Abdellah du 04/11/2026).
// Stripe appelle cette adresse (webhook « checkout.session.completed ») avec un jeton dans l'URL (?t=…), dérivé de la
// clé Brevo : seul Stripe le connaît. Le script horaire de nhd-qg reste en secours : il ne renvoie rien si l'attribut
// Brevo BIENVENUE_ENVOYEE est déjà rempli.
// Une seule bienvenue par client : marque dans Netlify Blobs (magasin « bienvenue ») et attribut Brevo.
// Prestation unique « Fiche Google complète » (39 € TTC, 05/11/2026) : session en mode « payment » avec la métadonnée
// offre=fiche_google → e-mail avec le lien du questionnaire en mode fiche (/demarrage/?…&fiche=1), une seule fois par
// session (magasin « fiche »), alerte à contact@. Un paiement unique ne crée un client Stripe que si le lien de paiement
// a customer_creation = « always » (sinon s.customer est vide) : le lien utilise alors l'id de la session (cs_…).
import { createHmac } from "node:crypto";
import { getStore } from "@netlify/blobs";
import { CONTACT, EMAIL_OK, envoyer, esc, json, majContact } from "../lib/brevo.mjs";
import { egal, signerClient } from "../lib/signature.mjs";

const SITE = "https://brasdroitia.com";
const PORTAIL = "https://billing.stripe.com/p/login/00w14odWDdx7bTCfMP4gg00";
const LISTE_CLIENTS = Number(process.env.BREVO_LISTE_CLIENTS || 5);
const jeton = () => createHmac("sha256", process.env.BREVO_API_KEY || "").update("webhook:stripe-bienvenue").digest("hex").slice(0, 40);

const lien = (email, client) =>
  `${SITE}/demarrage/?${new URLSearchParams({ e: email, c: client, t: signerClient(email, client) })}`;

const gabarit = (corps, pied) => `<!doctype html><html lang="fr"><body style="margin:0;background:#F6F5F0;font-family:Arial,Helvetica,sans-serif;color:#0E1530">
<div style="max-width:620px;margin:0 auto;background:#fff;padding:26px 22px;line-height:1.55">${corps}
<p style="font-size:12px;color:#8A8E9A;margin-top:28px">${pied}</p></div></body></html>`;

const pied = `Bras Droit IA, une marque de SCALINEA · <a href="${SITE}/cgv.html" style="color:#8A8E9A">Conditions générales de vente</a> · <a href="${PORTAIL}" style="color:#8A8E9A">Résilier mon abonnement</a> · Service réservé aux professionnels · Nous ne vous demanderons jamais vos mots de passe.`;
const piedFiche = `Bras Droit IA, une marque de SCALINEA · <a href="${SITE}/cgv.html#options" style="color:#8A8E9A">Conditions générales de vente</a> · Prestation unique, sans abonnement · Service réservé aux professionnels · Nous ne vous demanderons jamais vos mots de passe.`;

function mailBienvenue(c) {
  const bonjour = c.nom ? `Bonjour ${esc(c.nom)},` : "Bonjour,";
  return {
    objet: "Bienvenue chez Bras Droit IA : 5 minutes pour lancer votre premier pack",
    html: gabarit(`<p style="font-size:13px;color:#5B6070;margin:0">Bras Droit IA · Contenus du mois</p>
<h1 style="font-size:23px;margin:8px 0 14px">Bienvenue chez Bras Droit IA !</h1>
<p>${bonjour}</p>
<p>Merci pour votre confiance. Il ne reste qu'une étape : notre questionnaire de 5 minutes (votre métier, vos services, vos prix, votre ton, et si vous le souhaitez votre logo et quelques photos).</p>
<p style="margin:22px 0"><a href="${lien(c.email, c.id)}" style="display:inline-block;background:#D4FF3F;color:#0E1530;font-weight:bold;text-decoration:none;border-radius:10px;padding:14px 20px">Remplir mon questionnaire</a></p>
<p>Votre premier pack arrive par e-mail <b>dans les 24 heures</b> qui suivent vos réponses : 20 publications Instagram et Facebook avec leurs visuels, dont 6 reels vidéo, 8 posts pour votre fiche Google et votre plan du mois (quoi publier, quel jour, à quelle heure).</p>
<p>Ce lien est personnel : il vous servira aussi chaque mois pour nous transmettre votre offre du moment. Ne le transférez pas.</p>
<p>Pour répondre à vos avis Google, notre <a href="${SITE}/outils/generateur-reponse-avis-google/">générateur gratuit</a> vous propose une réponse en quelques secondes.</p>
<p>Nos <a href="${SITE}/cgv.html">conditions générales de vente</a>, réservées aux professionnels, restent accessibles à tout moment. Vous pouvez résilier quand vous le souhaitez depuis le lien en bas de cet e-mail.</p>
<p>Une question ? Répondez simplement à cet e-mail.</p>
<p>À très vite,<br>L'équipe Bras Droit IA</p>`, pied),
  };
}

// ---------- Fiche Google complète (paiement unique) ----------
const SESSION_OK = /^cs_(live|test)_[A-Za-z0-9]{10,120}$/;

function mailFiche(c) {
  const bonjour = c.nom ? `Bonjour ${esc(c.nom)},` : "Bonjour,";
  return {
    objet: "Votre Fiche Google complète : 5 minutes pour démarrer",
    html: gabarit(`<p style="font-size:13px;color:#5B6070;margin:0">Bras Droit IA · Fiche Google complète</p>
<h1 style="font-size:23px;margin:8px 0 14px">Merci pour votre commande !</h1>
<p>${bonjour}</p>
<p>Votre Fiche Google complète est commandée. Il ne reste qu'une étape : notre questionnaire de 5 minutes (votre métier, vos services, vos horaires, vos jours fériés et les questions que vos clients vous posent).</p>
<p style="margin:22px 0"><a href="${c.lien}" style="display:inline-block;background:#D4FF3F;color:#0E1530;font-weight:bold;text-decoration:none;border-radius:10px;padding:14px 20px">Remplir mon questionnaire</a></p>
<p>Votre fiche arrive par e-mail, en PDF, <b>sous 24 heures</b> après vos réponses : description longue et courte, présentation de vos services, catégories et attributs recommandés, plan de vos 10 photos, horaires exceptionnels de l'année, FAQ de 8 questions et contrôle de votre nom.</p>
<p>Vous saisissez vous-même les textes dans votre fiche : nous n'avons jamais accès à votre compte Google. Une correction est incluse si vous la demandez dans les 7 jours qui suivent la livraison. Il s'agit d'un paiement unique, sans abonnement.</p>
<p>Ce lien est personnel : ne le transférez pas.</p>
<p>Nos <a href="${SITE}/cgv.html">conditions générales de vente</a>, réservées aux professionnels, restent accessibles à tout moment.</p>
<p>Une question ? Répondez simplement à cet e-mail.</p>
<p>À très vite,<br>L'équipe Bras Droit IA</p>`, piedFiche),
  };
}

// Champs personnalisés du lien de paiement (SIREN, raison sociale) : texte, nombre ou liste.
const champs = (s) => (Array.isArray(s.custom_fields) ? s.custom_fields : [])
  .map((f) => [f.label?.custom || f.key, f.text?.value ?? f.numeric?.value ?? f.dropdown?.value ?? ""]);

async function fiche(s) {
  const email = String(s.customer_details?.email || s.customer_email || "").trim().toLowerCase();
  const cus = typeof s.customer === "string" ? s.customer : s.customer?.id;
  // Client Stripe si le lien en crée un (customer_creation = « always »), sinon l'id de la session.
  const id = /^cus_[A-Za-z0-9]{6,40}$/.test(cus || "") ? cus : SESSION_OK.test(s.id || "") ? s.id : "";
  if (!id || !EMAIL_OK.test(email)) return json({ ok: true, ignore: "fiche sans identifiant ou e-mail" });

  const magasin = getStore("fiche");
  if (await magasin.get(s.id)) return json({ ok: true, deja: true, offre: "fiche_google" });

  const c = {
    id, email, nom: s.customer_details?.name || "", lien: `${lien(email, id)}&fiche=1`,
    paye: new Date((s.created || Date.now() / 1000) * 1000).toLocaleString("fr-FR", { timeZone: "Europe/Paris" }),
    montant: `${((s.amount_total || 0) / 100).toFixed(2)} ${String(s.currency || "eur").toUpperCase()}`,
  };
  const m = mailFiche(c);
  const ok = await envoyer({ a: email, objet: m.objet, html: m.html, tags: ["bdia-fiche-google-client"] });
  if (!ok) return json({ ok: false }, 502); // Stripe réessaiera.
  await magasin.set(s.id, JSON.stringify({ quand: new Date().toISOString(), client: id, email }));

  const infos = champs(s).map(([k, v]) => `${esc(k)} : <b>${esc(v || "(vide)")}</b>`).join("<br>");
  const societe = s.customer_details?.business_name || champs(s).find(([k]) => /raison|soci/i.test(k))?.[1] || "";
  await envoyer({
    a: CONTACT, repondreA: email, tags: ["bdia-alerte-fiche-google"],
    objet: `[Fiche Google] ${societe || c.nom || email} · ${id} · commande payée`,
    html: gabarit(`<h1 style="font-size:20px">Fiche Google complète commandée (39 € TTC)</h1>
<p><b>${esc(c.nom || "(sans nom)")}</b> · ${esc(email)} · ${esc(id)}${id === s.id ? " (pas de client Stripe : id de la session)" : ""}<br>Payé le ${esc(c.paye)} · ${esc(c.montant)} · session ${esc(s.id)}</p>
${infos ? `<p>${infos}</p>` : ""}
<p>E-mail avec le lien du questionnaire envoyé dans la minute. À suivre : questionnaire (copie automatique à contact@, type « fiche » dans l'export), puis PDF livré sous 24 h (CGV art. 5 bis : 3 jours au plus), production avec <code>prompt_fiche_google.md</code> (nhd-qg). Pas de relance automatique : relancer à la main sans réponse sous 3 jours.</p>
<p><a href="${c.lien}">Questionnaire Fiche Google du client</a></p>`, "Alerte automatique de /api/stripe-bienvenue (brasdroitia.com)."),
  });
  return json({ ok: true, offre: "fiche_google" });
}

const mailAlerte = (c) => ({
  objet: `[Nouveau client] ${c.nom || c.email} · ${c.id} · bienvenue envoyée`,
  html: gabarit(`<h1 style="font-size:20px">Nouvel abonné Bras Droit IA</h1>
<p><b>${esc(c.nom || "(sans nom)")}</b> · ${esc(c.email)} · ${esc(c.id)}<br>Payé le ${esc(c.paye)} · ${esc(c.montant)}</p>
<p>E-mail de bienvenue envoyé dans la minute (webhook Stripe). À suivre : questionnaire (copie automatique à contact@), puis livraison sous 24 h (CGV : 3 jours au plus). Sans questionnaire : relances automatiques J+2, J+5, J+12.</p>
<p><a href="${SITE}/demarrage/?${new URLSearchParams({ e: c.email, c: c.id, t: signerClient(c.email, c.id) })}&amp;mois=1">Formulaire du mois du client</a></p>`, "Alerte automatique de /api/stripe-bienvenue (brasdroitia.com)."),
});

export default async (req) => {
  if (req.method !== "POST") return json({ ok: false }, 405);
  const t = new URL(req.url).searchParams.get("t") || "";
  if (!process.env.BREVO_API_KEY || !egal(t, jeton())) return json({ ok: false }, 403);

  let ev;
  try { ev = await req.json(); } catch { return json({ ok: false }, 400); }
  const s = ev?.data?.object;
  // Fiche Google complète : paiement unique abouti (traité avant le filtre des abonnements).
  if (ev?.type === "checkout.session.completed" && s && s.mode === "payment" && s.payment_status === "paid" && s.metadata?.offre === "fiche_google") {
    return fiche(s);
  }
  // Seuls les paiements d'abonnement aboutis nous intéressent ; le reste est accusé sans rien faire.
  if (ev?.type !== "checkout.session.completed" || !s || s.mode !== "subscription" || !["paid", "no_payment_required"].includes(s.payment_status)) {
    return json({ ok: true, ignore: true });
  }
  if (s.metadata?.offre === "kit_vitrine") { // option Kit vitrine (05/11/2026) : pas de bienvenue, une alerte à contact@
    const em = String(s.customer_details?.email || "").trim().toLowerCase();
    await envoyer({ a: CONTACT, objet: `[Option Kit vitrine] ${s.customer_details?.name || em}`, repondreA: EMAIL_OK.test(em) ? em : undefined, tags: ["bdia-alerte-option-kit"],
      html: gabarit(`<h1 style="font-size:20px">Option Kit vitrine souscrite</h1><p><b>${esc(s.customer_details?.name || "(sans nom)")}</b> · ${esc(em)} · ${esc(s.customer || "")}</p><p>À produire avec le prochain pack : affiche A4/A3, flyer A5, chevalet avec QR code, version story (PDF).</p>`, "Alerte automatique de /api/stripe-bienvenue (brasdroitia.com).") });
    return json({ ok: true, option: "kit_vitrine" });
  }
  const id = typeof s.customer === "string" ? s.customer : s.customer?.id;
  const email = String(s.customer_details?.email || s.customer_email || "").trim().toLowerCase();
  if (!/^cus_[A-Za-z0-9]+$/.test(id || "") || !EMAIL_OK.test(email)) return json({ ok: true, ignore: "sans client ou e-mail" });

  const magasin = getStore("bienvenue");
  if (await magasin.get(id)) return json({ ok: true, deja: true });

  const c = {
    id, email, nom: s.customer_details?.name || "",
    paye: new Date((s.created || Date.now() / 1000) * 1000).toLocaleString("fr-FR", { timeZone: "Europe/Paris" }),
    montant: `${((s.amount_total || 0) / 100).toFixed(2)} ${String(s.currency || "eur").toUpperCase()}`,
  };
  const m = mailBienvenue(c);
  const ok = await envoyer({ a: email, objet: m.objet, html: m.html, tags: ["bdia-bienvenue-client"] });
  if (!ok) return json({ ok: false }, 502); // Stripe réessaiera ; le script horaire reste en secours.

  const quand = new Date().toISOString().slice(0, 10);
  await magasin.set(id, JSON.stringify({ quand: new Date().toISOString(), session: s.id }));
  await majContact(email, { CLIENT_DEPUIS: quand, BIENVENUE_ENVOYEE: quand }, [LISTE_CLIENTS]);
  const a = mailAlerte(c);
  await envoyer({ a: CONTACT, objet: a.objet, html: a.html, repondreA: email, tags: ["bdia-alerte-nouveau-client"] });
  return json({ ok: true });
};

export const config = { path: "/api/stripe-bienvenue" };
