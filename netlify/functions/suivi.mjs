// Compteur anonyme du parcours du plan gratuit (brasdroitia.com/plan/), décidé par Abdellah le 10/11/2026.
// Aucune donnée personnelle : ni cookie, ni e-mail, ni adresse IP conservée. Une empreinte du jour (IP hachée avec la date)
// sert seulement à compter une fois chaque visiteur par étape et par jour ; elle change chaque jour.
//   POST /api/suivi {etape, src}   compte une étape (src : « meta » pour les visiteurs venus des pubs, sinon « autre »)
//   GET  /api/suivi?jours=14       lecture réservée au script nhd-qg tools/bras_droit_ia_site/suivi_plan.mjs
//                                  (en-têtes x-bdia-ts et x-bdia-sig, comme /api/echantillon-export)
import { getStore } from "@netlify/blobs";
import { createHash } from "node:crypto";
import { signerExport, egal, FENETRE_EXPORT } from "../lib/signature.mjs";
import { json } from "../lib/brevo.mjs";

const ETAPES = ["arrivee", "q2", "q3", "q4", "q5", "q6", "q7", "q8", "attente", "plan", "erreur", "email", "paiement"];
const SOURCES = ["meta", "autre"];

// Empreintes de plus de 30 jours supprimées (engagement de la page Confidentialité) ; totaux gardés 25 mois.
async function purger(store) {
  const limite = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const limiteTotaux = new Date(Date.now() - 760 * 86400000).toISOString().slice(0, 10);
  const { blobs } = await store.list({ prefix: "d/" });
  for (const { key } of blobs) if (key.split("/")[1] < limite) await store.delete(key);
  const t = await store.list({ prefix: "c/" });
  for (const { key } of t.blobs) if (key.split("/")[1] < limiteTotaux) await store.delete(key);
}

export default async (req, context) => {
  const store = getStore({ name: "suivi", consistency: "strong" });

  if (req.method === "GET") {
    const url = new URL(req.url);
    const ts = Number(req.headers.get("x-bdia-ts") || 0);
    const sig = req.headers.get("x-bdia-sig") || "";
    if (!process.env.BREVO_API_KEY || !ts || Math.abs(Date.now() / 1000 - ts) > FENETRE_EXPORT || !egal(sig, signerExport(ts, url.pathname + url.search))) {
      return json({ ok: false, message: "Accès refusé." }, 403);
    }
    await purger(store);
    const n = Math.min(60, Math.max(1, Number(url.searchParams.get("jours") || 14)));
    const depuis = new Date(Date.now() - (n - 1) * 86400000).toISOString().slice(0, 10);
    const { blobs } = await store.list({ prefix: "c/" });
    const jours = {};
    for (const { key } of blobs) {
      const [, jour, src, etape] = key.split("/");
      if (!jour || jour < depuis) continue;
      const v = Number((await store.get(key)) || 0);
      ((jours[jour] ??= {})[src] ??= {})[etape] = v;
    }
    return json({ ok: true, etapes: ETAPES, jours });
  }

  if (req.method !== "POST") return json({ ok: false }, 405);
  let e = {};
  try { e = await req.json(); } catch {}
  const etape = String(e.etape || ""), src = SOURCES.includes(e.src) ? e.src : "autre";
  if (!ETAPES.includes(etape)) return json({ ok: false }, 400);

  const jour = new Date().toISOString().slice(0, 10);
  const visiteur = createHash("sha256").update(jour + (context.ip || "inconnu") + "suivi").digest("hex").slice(0, 16);
  const dejaCle = `d/${jour}/${visiteur}/${etape}`;
  if (await store.get(dejaCle)) return json({ ok: true });
  const cle = `c/${jour}/${src}/${etape}`;
  const v = Number((await store.get(cle)) || 0);
  await Promise.all([store.set(dejaCle, "1"), store.set(cle, String(v + 1))]);
  if (etape === "arrivee" && Math.random() < 0.02) await purger(store).catch(() => {});
  return json({ ok: true });
};

export const config = { path: "/api/suivi" };
