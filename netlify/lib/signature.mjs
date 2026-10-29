// Signatures HMAC partagées par les fonctions (clé : BREVO_API_KEY, jamais exposée au navigateur).
import { createHmac, timingSafeEqual } from "node:crypto";

const cle = () => process.env.BREVO_API_KEY || "";
export const signerPlan = (texte) => createHmac("sha256", cle()).update("plan:" + texte).digest("hex").slice(0, 40);
export const signerEmail = (email) => createHmac("sha256", cle()).update(email).digest("hex").slice(0, 32);
export const egal = (a, b) => { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && timingSafeEqual(x, y); };
