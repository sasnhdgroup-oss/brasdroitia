// Signatures HMAC partagées par les fonctions (clé : BREVO_API_KEY, jamais exposée au navigateur).
import { createHmac, timingSafeEqual } from "node:crypto";

const cle = () => process.env.BREVO_API_KEY || "";
export const signerPlan = (texte) => createHmac("sha256", cle()).update("plan:" + texte).digest("hex").slice(0, 40);
export const signerEmail = (email) => createHmac("sha256", cle()).update(email).digest("hex").slice(0, 32);
export const egal = (a, b) => { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && timingSafeEqual(x, y); };
// Lien personnel du client vers /demarrage/ (questionnaire de démarrage et formulaire du mois).
// Préfixe « client: » : ne peut pas être confondu avec signerEmail (désinscription) ni signerPlan.
export const signerClient = (email, client) =>
  createHmac("sha256", cle()).update("client:" + String(email).trim().toLowerCase() + "|" + client).digest("hex").slice(0, 40);
// Requêtes du script d'export (nhd-qg) : horodatage + chemin et paramètres, valable 10 minutes.
export const signerExport = (ts, chemin) => createHmac("sha256", cle()).update("export:" + ts + "\n" + chemin).digest("hex");
export const FENETRE_EXPORT = 600; // secondes
