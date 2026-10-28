// Inscription à la lettre « L'astuce du mardi » (Brevo, double confirmation par e-mail).
// Variables d'environnement Netlify : BREVO_API_KEY (obligatoire), BREVO_MODELE_CONFIRMATION (id du modèle
// d'e-mail de confirmation), BREVO_LISTE (id de la liste, défaut 3).
import { getStore } from "@netlify/blobs";
import { createHash } from "node:crypto";

const LISTE = Number(process.env.BREVO_LISTE || 3);
const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });

export default async (req, context) => {
  if (req.method !== "POST") return json({ ok: false, message: "Méthode non autorisée." }, 405);
  let e;
  try { e = await req.json(); } catch { return json({ ok: false, message: "Requête illisible." }, 400); }
  if (e.site) return json({ ok: true, message: "Merci !" }); // champ piège pour les robots
  const email = String(e.email || "").trim().toLowerCase();
  if (!/^[^\s@]{1,64}@[^\s@]{1,190}\.[a-z]{2,}$/.test(email)) return json({ ok: false, message: "Adresse e-mail invalide." }, 400);
  if (e.consentement !== true) return json({ ok: false, message: "Cochez la case pour accepter de recevoir l'astuce du mardi." }, 400);
  if (!process.env.BREVO_API_KEY || !process.env.BREVO_MODELE_CONFIRMATION) {
    return json({ ok: false, message: "Les inscriptions ouvrent très bientôt." }, 503);
  }

  // 3 inscriptions par jour et par visiteur (empreinte d'IP non conservée en clair).
  const jour = new Date().toISOString().slice(0, 10);
  const cle = "i-" + jour + "-" + createHash("sha256").update(jour + (context.ip || "inconnu") + "bdia").digest("hex").slice(0, 16);
  const store = getStore("inscriptions");
  const n = Number((await store.get(cle)) || 0);
  if (n >= 3) return json({ ok: false, message: "Trop de tentatives aujourd'hui. Réessayez demain." }, 429);
  await store.set(cle, String(n + 1));

  const source = String(e.source || "site").replace(/[^a-z0-9/_-]/gi, "").slice(0, 60);
  const r = await fetch("https://api.brevo.com/v3/contacts/doubleOptinConfirmation", {
    method: "POST",
    headers: { "api-key": process.env.BREVO_API_KEY, "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({
      email,
      includeListIds: [LISTE],
      templateId: Number(process.env.BREVO_MODELE_CONFIRMATION),
      redirectionUrl: "https://brasdroitia.com/astuces/?inscription=ok",
      attributes: { SOURCE: source, DATE_INSCRIPTION: jour, ETAPE_BIENVENUE: 0 },
    }),
  });
  if (r.ok || r.status === 204) return json({ ok: true, message: "C'est presque fini : ouvrez l'e-mail que nous venons d'envoyer et cliquez sur le lien de confirmation." });
  console.error("Brevo", r.status, await r.text());
  return json({ ok: false, message: "L'inscription n'a pas pu aboutir. Réessayez dans quelques minutes." }, 502);
};

export const config = { path: "/api/inscription" };
