// Export des questionnaires reçus, pour le script nhd-qg. Le type « retractations » ne lit plus que
// d'anciennes demandes : la fonction /api/renoncer a été retirée le 02/11/2026 (offre réservée aux professionnels).
// tools/stripe/bienvenue_clients.mjs --export (qui les écrit hors du dépôt Git).
// Accès réservé : en-têtes x-bdia-ts (secondes) et x-bdia-sig = signerExport(ts, chemin + paramètres),
// clé BREVO_API_KEY, valable 10 minutes. Lecture seule.
//   GET /api/demarrage-export?type=reponses|retractations&depuis=2026-11-01T00:00:00Z   liste (JSON) ; chaque réponse a un
//       champ type : « accueil » (démarrage), « mois » (formulaire du mois) ou « fiche » (Fiche Google complète, 05/11/2026)
//   GET /api/demarrage-export?fichier=fichiers/cus_…/….jpg                               un fichier (binaire)
import { getStore } from "@netlify/blobs";
import { signerExport, egal, FENETRE_EXPORT } from "../lib/signature.mjs";
import { json, tampon } from "../lib/brevo.mjs";

export default async (req) => {
  if (req.method !== "GET") return json({ ok: false }, 405);
  const url = new URL(req.url);
  const ts = Number(req.headers.get("x-bdia-ts") || 0);
  const sig = req.headers.get("x-bdia-sig") || "";
  if (!process.env.BREVO_API_KEY || !ts || Math.abs(Date.now() / 1000 - ts) > FENETRE_EXPORT || !egal(sig, signerExport(ts, url.pathname + url.search))) {
    return json({ ok: false, message: "Accès refusé." }, 403);
  }
  const store = getStore("clients");

  const fichier = url.searchParams.get("fichier");
  if (fichier) {
    if (!/^fichiers\/(cus_[A-Za-z0-9]{6,40}|cs_(live|test)_[A-Za-z0-9]{10,120})\/[A-Za-z0-9_.-]{1,120}$/.test(fichier)) return json({ ok: false }, 400);
    const r = await store.getWithMetadata(fichier, { type: "arrayBuffer" });
    if (!r) return json({ ok: false, message: "Fichier introuvable." }, 404);
    return new Response(r.data, { headers: { "content-type": r.metadata?.type || "application/octet-stream", "cache-control": "no-store" } });
  }

  const type = url.searchParams.get("type") === "retractations" ? "retractations" : "reponses";
  const d = new Date(url.searchParams.get("depuis") || 0);
  const depuis = tampon(isNaN(d) ? new Date(0) : d);
  const { blobs } = await store.list({ prefix: `${type}/` });
  const cles = blobs.map((b) => b.key).filter((k) => k.slice(type.length + 1, type.length + 17) >= depuis).sort().slice(0, 500);
  const elements = [];
  for (const cle of cles) {
    const v = await store.get(cle, { type: "json" }).catch(() => null);
    if (v) elements.push({ cle, ...v });
  }
  return json({ ok: true, type, depuis, nombre: elements.length, elements });
};

export const config = { path: "/api/demarrage-export" };
