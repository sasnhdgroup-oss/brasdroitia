// Questions du questionnaire de démarrage et du formulaire du mois (source : questionnaire_client.md v2.0, 29/10/2026).
// Une seule définition, utilisée par la page /demarrage/ (affichage) et par /api/demarrage (validation).
// Types : un (choix unique), plusieurs (choix multiple), texte, long, lien, case, fichiers.
// « si » : la question n'est affichée (et validée) que si la condition est vraie.

const JOURS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
const METIERS = ["Coiffure / barbier", "Agent ou mandataire immobilier", "Auto-école", "Garage / mécanique auto", "Artisan du bâtiment", "Coach sportif", "Autre métier"];
const siMetier = (...m) => ({ k: "metier", dans: m });

export const ACCUEIL = [
  {
    titre: "Votre activité",
    questions: [
      { k: "metier", n: "A1", type: "un", req: true, label: "Votre métier", options: METIERS },
      { k: "metier_precis", n: "A1b", type: "texte", req: true, max: 80, label: "Précisez votre métier", aide: "Par exemple « plombier-chauffagiste », « électricien », « esthéticienne », « fleuriste ».", si: siMetier("Autre métier", "Artisan du bâtiment") },
      { k: "etablissement", n: "A2", type: "texte", req: true, max: 100, label: "Nom de votre établissement", aide: "Tel qu'il apparaît sur votre fiche Google." },
      { k: "ville", n: "A3", type: "texte", req: true, max: 80, label: "Ville" },
      { k: "quartier", n: "A4", type: "texte", max: 120, label: "Quartier ou secteur", aide: "Par exemple « Lyon 7e, Jean Macé ». Si vous vous déplacez, indiquez votre zone d'intervention." },
      { k: "fiche_google", n: "A5", type: "lien", max: 400, label: "Lien de votre fiche Google", aide: "Sur Google Maps : ouvrez votre fiche, « Partager », « Copier le lien ». Pas de fiche ? Laissez vide, nous vous dirons comment la créer." },
      { k: "reseaux", n: "A6", type: "texte", max: 300, label: "Lien de votre page Facebook et/ou de votre compte Instagram" },
      { k: "lien_rdv", n: "A7", type: "lien", max: 400, label: "Lien de prise de rendez-vous ou de contact", aide: "Planity, Treatwell, Calendly, site, WhatsApp Business… C'est le lien que vos publications mettront en avant." },
    ],
  },
  {
    titre: "Vos services et vos prix",
    questions: [
      { k: "services", n: "B1", type: "long", req: true, max: 3000, label: "Vos 3 à 8 services principaux, avec leur prix", aide: "Une ligne par service. Exemple : « Coupe femme, 38 € » ou « Vidange + filtre, à partir de 89 € ». Vous pouvez coller votre grille de prix telle quelle : nous reprenons vos prix à l'identique." },
      { k: "priorite", n: "B2", type: "texte", max: 150, label: "Le service que vous voulez vendre en priorité ce trimestre" },
      { k: "jours_ouverture", n: "B3", type: "plusieurs", req: true, label: "Jours d'ouverture", options: JOURS },
      { k: "horaires", n: "B3", type: "texte", req: true, max: 200, label: "Horaires", aide: "Par exemple « 9 h–19 h, nocturne le jeudi jusqu'à 21 h »." },
      { k: "points_forts", n: "B4", type: "plusieurs", maxChoix: 3, label: "Vos points forts réels (3 au plus)", options: ["Ouvert le samedi / tard le soir", "Sans rendez-vous possible", "Devis gratuit", "Intervention rapide", "Parking / facile d'accès", "Spécialiste de… (précisez ci-dessous)", "Produits / matériaux choisis (bio, locaux, marques…)", "Accueil des enfants / des seniors", "Paiement en plusieurs fois sans frais", "Autre (précisez ci-dessous)"] },
      { k: "points_forts_precis", n: "B4b", type: "texte", max: 200, label: "Précisez si besoin" },
    ],
  },
  {
    titre: "Votre ton",
    questions: [
      { k: "adresse", n: "C1", type: "un", req: true, label: "Vous parlez à vos clients en…", options: ["Vouvoiement", "Tutoiement"] },
      { k: "ton", n: "C2", type: "un", req: true, label: "Le ton qui vous ressemble", options: ["Chaleureux et proche", "Professionnel et rassurant", "Dynamique et fun", "Haut de gamme et sobre"] },
      { k: "emojis", n: "C3", type: "un", label: "Émojis", options: ["Oui, quelques-uns (2 ou 3 par post)", "Très peu (1 au plus)", "Aucun"] },
    ],
  },
  {
    titre: "Votre calendrier",
    questions: [
      { k: "temps_forts", n: "D1", type: "plusieurs", label: "Les temps forts que vous souhaitez marquer", aide: "Sans réponse, nous n'utilisons que des temps forts civils et saisonniers.", options: ["Fêtes de fin d'année (formulation neutre)", "Noël", "Nouvel An", "Saint-Valentin", "Ramadan et Aïd el-Fitr", "Aïd al-Adha", "Fête des mères / des pères", "Rentrée de septembre", "Soldes, Black Friday", "Événements de ma ville (marchés, fêtes locales)", "Aucun temps fort religieux"] },
      { k: "fermetures", n: "D2", type: "texte", max: 200, label: "Périodes de fermeture prévues dans l'année", aide: "Par exemple « fermé du 24/12 au 2/01 », « congés du 1er au 21 août »." },
      { k: "jours_calmes", n: "D3", type: "plusieurs", label: "Vos jours les plus calmes", aide: "Nous y plaçons de préférence vos offres, pour remplir ces jours-là.", options: [...JOURS, "Je ne sais pas"] },
    ],
  },
  {
    titre: "Ce qu'il ne faut jamais dire, et vos visuels",
    questions: [
      { k: "interdits", n: "E1", type: "long", max: 1500, label: "Ce que nous ne devons jamais écrire", aide: "Un concurrent à ne pas citer, un service que vous ne faites plus, un mot que vous détestez, une promesse que vous ne voulez pas faire…" },
      { k: "logo", n: "E2", type: "fichiers", maxFichiers: 1, label: "Votre logo (recommandé)", aide: "PNG ou JPG. Nous l'ajoutons discrètement sur vos visuels et reprenons ses couleurs. Pas de logo ? Nous utilisons votre nom en typographie." },
      { k: "photos", n: "E3", type: "fichiers", maxFichiers: 10, label: "5 à 10 photos de votre activité, sans visage (recommandé)", aide: "Vos locaux, la devanture, vos outils, vos réalisations, vos produits. Aucun visage : nos visuels ne montrent personne. Pas de photo ? Nous utilisons des images libres de droits (jamais d'image de personne générée par IA)." },
      { k: "droits_photos", n: "E3", type: "case", req: true, si: { k: "photos", rempli: true }, label: "Je certifie détenir les droits sur ces photos et j'autorise SCALINEA à les utiliser pour créer mes contenus." },
      { k: "couleurs", n: "E4", type: "texte", max: 120, label: "Vos couleurs", aide: "Par exemple « noir et doré ». Laissez vide : nous reprenons les couleurs de votre logo." },
    ],
  },
  {
    titre: "Questions propres à votre métier",
    si: siMetier("Agent ou mandataire immobilier", "Auto-école", "Garage / mécanique auto", "Artisan du bâtiment", "Coach sportif"),
    questions: [
      { k: "immo_statut", n: "F-IMMO-1", type: "un", req: true, si: siMetier("Agent ou mandataire immobilier"), label: "Votre statut", options: ["Agent immobilier titulaire de la carte T", "Mandataire (agent commercial) d'un réseau", "Salarié ou négociateur d'agence"] },
      { k: "immo_mentions", n: "F-IMMO-2", type: "long", req: true, max: 1000, si: siMetier("Agent ou mandataire immobilier"), label: "Les mentions à faire figurer dans vos publicités", aide: "Nom du réseau ou de l'agence, n° de carte professionnelle et CCI qui l'a délivrée ; pour un mandataire : mention « agent commercial », n° RSAC et ville du greffe. Copiez la ligne que votre réseau vous impose." },
      { k: "immo_bareme", n: "F-IMMO-3", type: "lien", req: true, max: 400, si: siMetier("Agent ou mandataire immobilier"), label: "Lien de votre barème d'honoraires" },
      { k: "immo_biens", n: "F-IMMO-4", type: "un", si: siMetier("Agent ou mandataire immobilier"), label: "Avez-vous des biens à mettre en avant ce mois-ci ?", options: ["Oui, je les envoie avec le formulaire du mois", "Non, pas d'annonce de bien ce mois-ci"] },
      { k: "ae_agrement", n: "F-AE-1", type: "texte", req: true, max: 60, si: siMetier("Auto-école"), label: "Numéro d'agrément préfectoral" },
      { k: "ae_formations", n: "F-AE-2", type: "plusieurs", si: siMetier("Auto-école"), label: "Formations proposées", options: ["Permis B", "Boîte automatique", "Conduite accompagnée (AAC)", "Conduite supervisée", "Stage de code", "Moto (A1, A2)", "Permis AM", "Remise à niveau seniors", "CPF éligible"] },
      { k: "ae_taux", n: "F-AE-3", type: "un", si: siMetier("Auto-école"), label: "Publiez-vous votre taux de réussite ?", options: ["Oui", "Non"] },
      { k: "ae_taux_precis", n: "F-AE-3", type: "texte", req: true, max: 150, si: { k: "ae_taux", dans: ["Oui"] }, label: "Votre taux de réussite, avec l'année et la source" },
      { k: "gar_prestations", n: "F-GAR-1", type: "plusieurs", si: siMetier("Garage / mécanique auto"), label: "Prestations", options: ["Entretien toutes marques", "Pneus", "Freins", "Climatisation", "Diagnostic électronique", "Carrosserie", "Pare-brise", "Véhicules électriques / hybrides", "Pièces de réemploi"] },
      { k: "gar_reseau", n: "F-GAR-2", type: "texte", max: 150, si: siMetier("Garage / mécanique auto"), label: "Êtes-vous agréé par des assureurs ou membre d'un réseau ?", aide: "Laissez vide si non." },
      { k: "art_labels", n: "F-ART-1", type: "plusieurs", si: siMetier("Artisan du bâtiment"), label: "Labels et qualifications réels", options: ["RGE (précisez le domaine ci-dessous)", "Qualibat", "Artisan (inscrit au registre des métiers)", "Maître artisan", "Aucun"] },
      { k: "art_labels_precis", n: "F-ART-1", type: "texte", max: 150, si: siMetier("Artisan du bâtiment"), label: "Précisions sur vos labels (domaine RGE…)" },
      { k: "art_decennale", n: "F-ART-2", type: "un", si: siMetier("Artisan du bâtiment"), label: "Souhaitez-vous mentionner votre assurance décennale ?", options: ["Oui", "Non"] },
      { k: "art_assureur", n: "F-ART-3", type: "texte", req: true, max: 150, si: { k: "art_decennale", dans: ["Oui"] }, label: "Assureur décennal et zone géographique couverte" },
      { k: "coach_diplome", n: "F-COACH-1", type: "un", req: true, si: siMetier("Coach sportif"), label: "Vous êtes titulaire de", options: ["Carte professionnelle d'éducateur sportif (BPJEPS, STAPS, DEJEPS…)", "Autre"] },
      { k: "coach_diplome_precis", n: "F-COACH-1", type: "texte", req: true, max: 150, si: { k: "coach_diplome", dans: ["Autre"] }, label: "Précisez votre diplôme ou votre carte" },
      { k: "coach_lieux", n: "F-COACH-2", type: "plusieurs", si: siMetier("Coach sportif"), label: "Où se passent les séances ?", options: ["À domicile", "En extérieur", "En salle", "En visio"] },
      { k: "coach_public", n: "F-COACH-3", type: "plusieurs", si: siMetier("Coach sportif"), label: "Public principal", aide: "Nous n'écrivons aucune promesse de kilos ni allégation de santé.", options: ["Remise en forme", "Femmes", "Seniors", "Préparation physique", "Perte de poids", "Entreprises"] },
    ],
  },
  {
    titre: "Validation",
    questions: [
      { k: "info_donnees", n: "V1", type: "case", req: true, label: "J'ai lu la politique de confidentialité. Mes réponses servent à rédiger mes contenus ; elles sont conservées pendant l'abonnement, puis 6 mois.", lien: "/confidentialite.html" },
      { k: "exemple_public", n: "V3", type: "case", label: "(Facultatif) J'accepte que Bras Droit IA montre mes contenus comme exemple, sans mes coordonnées. Je peux retirer cet accord par simple e-mail." },
      { k: "conseils_email", n: "V4", type: "case", label: "(Facultatif) Je souhaite recevoir les conseils et nouveautés de Bras Droit IA par e-mail (désinscription en un clic)." },
    ],
  },
];

export const MOIS = [
  {
    titre: "Votre pack du mois prochain",
    questions: [
      { k: "offre", n: "G1", type: "long", max: 1500, label: "Une offre ou une nouveauté à mettre en avant ?", aide: "Par exemple « soin offert pour toute couleur le mardi », « nouveau : boîte automatique ». Indiquez les dates et les conditions exactes." },
      { k: "changements", n: "G2", type: "plusieurs", label: "Des changements ?", options: ["Nouveaux prix", "Nouveaux horaires", "Fermeture exceptionnelle", "Nouveau service", "Rien de neuf"] },
      { k: "changements_precis", n: "G2b", type: "texte", req: true, max: 400, si: { k: "changements", sauf: "Rien de neuf" }, label: "Précisez" },
      { k: "biens", n: "G4", type: "long", max: 4000, si: siMetier("Agent ou mandataire immobilier"), label: "Biens à mettre en avant", aide: "Pour chaque bien : type, surface, pièces, quartier, prix honoraires inclus, honoraires (montant ou %, à la charge de qui), classes énergie et climat du DPE, estimation des dépenses d'énergie, copropriété (nombre de lots, charges annuelles, procédure en cours ou non), numéro de mandat. Sans ces éléments, le post est préparé sans le prix ni le DPE, avec des emplacements à compléter." },
      { k: "photos", n: "G4b", type: "fichiers", maxFichiers: 5, label: "De nouvelles photos ce mois-ci ? (facultatif)", aide: "Une réalisation récente, une nouveauté, la vitrine de saison. Aucun visage." },
      { k: "droits_photos", n: "G4b", type: "case", req: true, si: { k: "photos", rempli: true }, label: "Je certifie détenir les droits sur ces photos et j'autorise SCALINEA à les utiliser pour créer mes contenus." },
      { k: "demande", n: "G5", type: "texte", max: 400, label: "Une demande pour la rédaction ?" },
    ],
  },
];

// La condition « si » est-elle remplie pour ces réponses ?
export function visible(q, r) {
  const s = q.si;
  if (!s) return true;
  const v = r[s.k];
  if (v === "*") return true; // valeur inconnue (formulaire du mois sans questionnaire de démarrage) : on affiche
  if (s.rempli) return Array.isArray(v) ? v.length > 0 : !!v;
  if (s.dans) return [].concat(v || []).some((x) => s.dans.includes(x));
  if (s.sauf) return [].concat(v || []).some((x) => x !== s.sauf);
  return true;
}

const URL_OK = /^https?:\/\/[^\s<>"]{3,}$/i;

// Valide et nettoie les réponses. Renvoie { propres, erreurs } (erreurs : { clé: message }).
export function valider(etapes, brut, fichiersConnus = () => true) {
  const propres = {}, erreurs = {};
  const r = brut && typeof brut === "object" ? brut : {};
  for (const etape of etapes) {
    if (etape.si && !visible(etape, r)) continue;
    for (const q of etape.questions) {
      if (!visible(q, r)) continue;
      let v = r[q.k];
      if (q.type === "un") {
        v = typeof v === "string" && q.options.includes(v) ? v : "";
      } else if (q.type === "plusieurs") {
        v = [...new Set([].concat(v || []).filter((x) => typeof x === "string" && q.options.includes(x)))];
        if (q.maxChoix && v.length > q.maxChoix) erreurs[q.k] = `${q.maxChoix} choix au plus.`;
      } else if (q.type === "case") {
        v = v === true;
      } else if (q.type === "fichiers") {
        v = [...new Set([].concat(v || []).filter((x) => typeof x === "string" && /^[A-Za-z0-9_.-]{1,120}$/.test(x) && fichiersConnus(x)))].slice(0, q.maxFichiers);
      } else {
        v = typeof v === "string" ? v.replace(/\r\n/g, "\n").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim() : "";
        if (q.type !== "long") v = v.replace(/\s+/g, " ");
        if (v.length > q.max) erreurs[q.k] = `${q.max} caractères au plus.`;
        if (q.type === "lien" && v) {
          if (!/^https?:\/\//i.test(v)) v = "https://" + v;
          if (!URL_OK.test(v)) erreurs[q.k] = "Ce lien ne semble pas valide.";
        }
      }
      const vide = v === "" || v === false || (Array.isArray(v) && !v.length);
      if (q.req && vide && !erreurs[q.k]) erreurs[q.k] = q.type === "case" ? "Cochez cette case pour continuer." : "Cette réponse est nécessaire.";
      if (!vide) propres[q.k] = v;
    }
  }
  return { propres, erreurs };
}

// Lignes lisibles « question : réponse » (e-mails, export).
export function lignes(etapes, r, nomFichier = (x) => x) {
  const out = [];
  for (const etape of etapes) {
    if (etape.si && !visible(etape, r)) continue;
    const l = [];
    for (const q of etape.questions) {
      if (!visible(q, r) || r[q.k] === undefined) continue;
      let v = r[q.k];
      if (q.type === "case") v = v ? "oui" : "non";
      else if (q.type === "fichiers") v = `${v.length} fichier(s) : ${v.map(nomFichier).join(", ")}`;
      else if (Array.isArray(v)) v = v.join(", ");
      l.push({ n: q.n, label: q.label, valeur: String(v) });
    }
    if (l.length) out.push({ titre: etape.titre, lignes: l });
  }
  return out;
}

// Prestation unique « Fiche Google complète » (39 € TTC, 05/11/2026) : lien /demarrage/?…&fiche=1.
// Même base que le questionnaire de démarrage, sans ce qui ne sert qu'aux publications (réseaux, priorité du trimestre,
// émojis, temps forts, jours calmes, logo, photos, couleurs, biens immobiliers du mois), plus une étape propre à la fiche.
const SANS_FICHE = new Set(["reseaux", "priorite", "emojis", "temps_forts", "jours_calmes", "logo", "photos", "droits_photos", "couleurs", "immo_biens"]);
const AIDES_FICHE = {
  etablissement: "Votre nom réel, tel qu'il figure sur votre devanture, vos factures ou votre site : sans slogan, ni ville, ni métier ajouté. Nous le comparons au nom de votre fiche.",
  fiche_google: "Sur Google Maps : ouvrez votre fiche, « Partager », « Copier le lien ». Il nous permet de voir ce qui est déjà rempli. Pas encore de fiche ? Laissez vide.",
  services: "Une ligne par service, avec son prix si vous voulez l'afficher. Exemple : « Coupe femme, 38 € » ou « Vidange + filtre, à partir de 89 € ». Nous reprenons vos prix à l'identique, sans en inventer.",
  fermetures: "Par exemple « fermé du 24/12 au 2/01 », « congés du 1er au 21 août ». Nous les ajoutons à vos horaires exceptionnels.",
};
const ETAPE_FICHE = {
  titre: "Votre fiche Google aujourd'hui",
  questions: [
    { k: "fiche_categorie", n: "FG1", type: "texte", max: 150, label: "Catégorie principale actuelle de votre fiche", aide: "Elle s'affiche sous le nom de votre fiche, par exemple « Coiffeur » ou « Garage automobile ». Laissez vide si vous ne savez pas." },
    { k: "fiche_type", n: "FG2", type: "un", req: true, label: "Vous recevez vos clients…", options: ["Dans mon local (adresse affichée)", "Chez eux uniquement (adresse masquée, zone desservie)", "Les deux"] },
    { k: "fiche_creation", n: "FG3", type: "texte", max: 40, label: "Année de création de votre activité (facultatif)" },
    { k: "fiche_paiements", n: "FG4", type: "plusieurs", label: "Moyens de paiement acceptés", options: ["Carte bancaire", "Paiement sans contact", "Paiement mobile", "Espèces", "Chèques", "Virement", "Paiement en plusieurs fois"] },
    { k: "fiche_accessibilite", n: "FG5", type: "plusieurs", label: "Accessibilité de votre local", aide: "Ne cochez que ce qui est vrai : ces informations sont affichées par Google.", options: ["Entrée accessible en fauteuil roulant", "Parking accessible en fauteuil roulant", "Toilettes accessibles en fauteuil roulant", "Pas de local recevant du public", "Je ne sais pas"] },
    { k: "fiche_langues", n: "FG6", type: "texte", max: 150, label: "Langues parlées avec vos clients, en plus du français (facultatif)" },
    { k: "fiche_feries", n: "FG7", type: "un", req: true, label: "Les jours fériés, vous êtes…", options: ["Fermé tous les jours fériés", "Ouvert certains jours fériés (précisez ci-dessous)", "Ouvert tous les jours fériés aux horaires habituels"] },
    { k: "fiche_feries_precis", n: "FG7b", type: "texte", req: true, max: 300, si: { k: "fiche_feries", dans: ["Ouvert certains jours fériés (précisez ci-dessous)"] }, label: "Quels jours fériés êtes-vous ouvert, et à quels horaires ?" },
    { k: "fiche_alsace", n: "FG8", type: "un", label: "Votre établissement est-il en Alsace ou en Moselle ?", aide: "Deux jours fériés de plus y sont prévus (Vendredi saint et 26 décembre).", options: ["Oui", "Non"] },
    { k: "fiche_questions", n: "FG9", type: "long", max: 2000, label: "Les questions que vos clients vous posent le plus souvent (facultatif)", aide: "Une par ligne : « Faut-il prendre rendez-vous ? », « Faites-vous les devis gratuitement ? »… Elles nous servent à écrire votre FAQ." },
  ],
};
const q = (k) => ACCUEIL.flatMap((e) => e.questions).find((x) => x.k === k);
// Mentions publicitaires de l'immobilier : utiles aux publications, facultatives pour la fiche.
const FACULTATIF_FICHE = new Set(["immo_mentions", "immo_bareme"]);
const avecAide = (x) => ({ ...x, ...(AIDES_FICHE[x.k] ? { aide: AIDES_FICHE[x.k] } : {}), ...(FACULTATIF_FICHE.has(x.k) ? { req: false } : {}) });
const ETAPES_COMMUNES = ACCUEIL.filter((e) => ["Votre activité", "Vos services et vos prix", "Votre ton", "Questions propres à votre métier"].includes(e.titre));
export const FICHE = [
  ...ETAPES_COMMUNES.map((e) => ({
    ...e,
    titre: e.titre === "Votre ton" ? "Votre ton, et ce qu'il ne faut jamais écrire" : e.titre,
    questions: [...e.questions, ...(e.titre === "Votre ton" ? [q("interdits")] : [])].filter((x) => !SANS_FICHE.has(x.k)).map(avecAide),
  })),
  { ...ETAPE_FICHE, questions: [...ETAPE_FICHE.questions.slice(0, 8), avecAide(q("fermetures")), ...ETAPE_FICHE.questions.slice(8)] },
  {
    titre: "Validation",
    questions: [
      { k: "info_donnees", n: "V1", type: "case", req: true, label: "J'ai lu la politique de confidentialité. Mes réponses servent uniquement à rédiger ma Fiche Google complète ; elles sont conservées 6 mois après la livraison, puis supprimées.", lien: "/confidentialite.html" },
      { k: "conseils_email", n: "V4", type: "case", label: "(Facultatif) Je souhaite recevoir les conseils et nouveautés de Bras Droit IA par e-mail (désinscription en un clic)." },
    ],
  },
];
