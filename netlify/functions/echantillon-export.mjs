// Export des demandes d'échantillon (« 3 publications offertes »), pour le script nhd-qg tools/echantillon/echantillon.mjs.
// Accès réservé, comme /api/demarrage-export : en-têtes x-bdia-ts (secondes) et x-bdia-sig = signerExport(ts, chemin + paramètres),
// clé BREVO_API_KEY, valable 10 minutes.
//   GET  /api/echantillon-export                          demandes non livrées (statut « a_livrer »), les plus anciennes d'abord
//   GET  /api/echantillon-export?tout=1                   toutes les demandes (livrées comprises)
//   POST /api/echantillon-export?livree=demandes/….json   marque la demande « livree » (date de livraison)
//   POST /api/echantillon-export?supprimer=demandes/….json supprime la demande (essai, ou fin de conservation : 6 mois sans suite)
import { getStore } from "@netlify/blobs";
import { signerExport, egal, FENETRE_EXPORT } from "../lib/signature.mjs";
import { json } from "../lib/brevo.mjs";

const CLE_OK = /^demandes\/\d{8}T\d{6}Z_[0-9a-f]{6}\.json$/;

export default async (req) => {
  if (req.method !== "GET" && req.method !== "POST") return json({ ok: false }, 405);
  const url = new URL(req.url);
  const ts = Number(req.headers.get("x-bdia-ts") || 0);
  const sig = req.headers.get("x-bdia-sig") || "";
  if (!process.env.BREVO_API_KEY || !ts || Math.abs(Date.now() / 1000 - ts) > FENETRE_EXPORT || !egal(sig, signerExport(ts, url.pathname + url.search))) {
    return json({ ok: false, message: "Accès refusé." }, 403);
  }
  const store = getStore({ name: "echantillon", consistency: "strong" });

  if (req.method === "POST") {
    const livree = url.searchParams.get("livree"), supprimer = url.searchParams.get("supprimer");
    const cle = livree || supprimer || "";
    if (!CLE_OK.test(cle)) return json({ ok: false, message: "Clé invalide." }, 400);
    const v = await store.get(cle, { type: "json" });
    if (!v) return json({ ok: false, message: "Demande introuvable." }, 404);
    if (supprimer) { await store.delete(cle); return json({ ok: true, cle, supprimee: true }); }
    const maj = { ...v, statut: "livree", livree_le: new Date().toISOString() };
    await store.setJSON(cle, maj);
    return json({ ok: true, cle, statut: maj.statut, livree_le: maj.livree_le });
  }

  const tout = url.searchParams.get("tout") === "1";
  const { blobs } = await store.list({ prefix: "demandes/" });
  const elements = [];
  for (const cle of blobs.map((b) => b.key).sort().slice(-1000)) {
    const v = await store.get(cle, { type: "json" }).catch(() => null);
    if (v && (tout || v.statut !== "livree")) elements.push({ cle, ...v });
  }
  return json({ ok: true, nombre: elements.length, elements });
};

export const config = { path: "/api/echantillon-export" };
