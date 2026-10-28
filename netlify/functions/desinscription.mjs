// Désinscription en un clic de « L'astuce du mardi » (lien présent dans les e-mails de bienvenue).
// Le lien contient l'adresse et une signature HMAC calculée avec BREVO_API_KEY : personne ne peut désinscrire un tiers.
import { createHmac, timingSafeEqual } from "node:crypto";

const LISTE = Number(process.env.BREVO_LISTE || 3);
const page = (titre, texte) => new Response(`<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${titre}</title><link rel="stylesheet" href="/guides/guides.css"></head><body><main class="wrap"><article><h1 style="margin-top:40px">${titre}</h1><p>${texte}</p><p><a href="/">Retour au site</a></p></article></main></body></html>`, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });

export default async (req) => {
  const url = new URL(req.url);
  const email = (url.searchParams.get("e") || "").trim().toLowerCase();
  const jeton = url.searchParams.get("t") || "";
  const cle = process.env.BREVO_API_KEY;
  if (!email || !jeton || !cle) return page("Lien incomplet", "Ce lien de désinscription est incomplet. Écrivez-nous à contact@brasdroitia.com et nous vous désinscrirons.");
  const attendu = createHmac("sha256", cle).update(email).digest("hex").slice(0, 32);
  const a = Buffer.from(jeton), b = Buffer.from(attendu);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return page("Lien invalide", "Ce lien de désinscription n'est pas valide. Écrivez-nous à contact@brasdroitia.com.");
  const r = await fetch(`https://api.brevo.com/v3/contacts/${encodeURIComponent(email)}`, {
    method: "PUT",
    headers: { "api-key": cle, "content-type": "application/json" },
    body: JSON.stringify({ unlinkListIds: [LISTE] }),
  });
  if (r.ok || r.status === 204 || r.status === 404) return page("Vous êtes désinscrit", "Vous ne recevrez plus « L'astuce du mardi ». Les astuces restent disponibles sur brasdroitia.com/astuces/.");
  console.error("Brevo", r.status, await r.text());
  return page("Désinscription à réessayer", "Un incident technique a empêché la désinscription. Réessayez plus tard ou écrivez-nous à contact@brasdroitia.com.");
};

export const config = { path: "/api/desinscription" };
