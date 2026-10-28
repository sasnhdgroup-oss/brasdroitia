# Bras Droit IA — mise en route de l'encaissement (27/10/2026)

Quatre comptes à créer par Abdellah, au nom de SCALINEA. Environ 45 minutes au total. Rien n'est payé ni publié par Claude.

Informations de SCALINEA à utiliser partout (vérifiées le 27/10/2026) :
- Raison sociale : SCALINEA (SARL, EURL), capital 100 EUR (statuts constitutifs : vérifier le Kbis)
- SIREN : 105 349 427 — RCS Créteil (registre national, vérifié)
- Siège : 22 rue Parmentier, 94550 Chevilly-Larue (registre national, vérifié)
- TVA intracommunautaire : FR80105349427 (validée par le service VIES de l'UE, vérifié)
- E-mail de la marque : contact@brasdroitia.com

---

## 1. Boîte e-mail contact@brasdroitia.com (OVH, 5 min)
1. Espace client OVH > **Web Cloud > Courriels > brasdroitia.com**.
2. **Créer une adresse e-mail** : `contact`, mot de passe fort.
3. La lire depuis le webmail OVH (mail.ovh.net) ou l'ajouter sur le téléphone.
4. Les lignes MX et DKIM sont déjà en place dans la zone DNS : ne pas y toucher.

## 2. Stripe (20 min + vérification par Stripe)
1. **stripe.com > Créer un compte** avec contact@brasdroitia.com.
2. **Activer les paiements** : type « Entreprise », SARL, SIREN, adresse ci-dessus, IBAN de SCALINEA, pièce d'identité du gérant. Nom affiché sur les relevés : `BRASDROITIA`.
3. **Produit** (Catalogue de produits > Ajouter un produit) :
   - Nom : `Contenus du mois — Bras Droit IA`
   - Prix : **29,00 EUR**, **récurrent mensuel**, **TTC** (« Inclure la taxe dans le prix » : oui)
4. **Taxes** (Paramètres > Taxes) : enregistrer l'immatriculation TVA France FR80105349427 ; activer **Stripe Tax** si proposé, sinon taux fixe 20 % (à confirmer par l'expert-comptable).
5. **Coupon** (Catalogue > Coupons > Créer) : `PILOTE`, réduction de **20,00 EUR**, durée **une fois** (premier mois) → le client paie 9 EUR puis 29 EUR.
6. **Lien de paiement** (Liens de paiement > Nouveau) :
   - Produit : Contenus du mois ; appliquer le coupon PILOTE automatiquement ;
   - **Collecter** : nom, e-mail, adresse de facturation, **numéro de TVA (professionnels)** ;
   - **Champs personnalisés** (3 maximum) : `Métier` (liste : Coiffure/barbier, Immobilier, Auto-école, Garage, Artisan, Coach, Autre), `Ville`, `Achat pour mon activité professionnelle` (Oui/Non) ;
   - **Conditions** : exiger l'acceptation des CGV avec le lien `https://brasdroitia.com/cgv.html` ;
   - **Après le paiement** : rediriger vers le questionnaire Tally (étape 3).
7. **Portail client** (Paramètres > Facturation > Portail client) : activer, autoriser **l'annulation à la fin de la période**, copier le lien du portail.
8. **E-mails** (Paramètres > E-mails clients) : activer les reçus et les factures.
9. Envoyer à Claude : le **lien de paiement** et le **lien du portail**. Claude les place sur le site.
10. Facultatif : connecter Stripe à Windsor (windsor.ai > Connecteurs > Stripe) pour que Claude suive les ventes.

## 3. Tally (15 min)
Deux formulaires, sur un compte créé avec contact@brasdroitia.com (tally.so, offre gratuite) :
- **Questionnaire client** : le contenu exact est préparé par Claude (fichier `questionnaire_client.md` dans `livrables/scalinea/bras-droit-ia-production/`).
- **Formulaire de rétractation** (obligatoire depuis le 19/06/2026 pour les particuliers) :
  - Titre : `Renoncer à mon abonnement Bras Droit IA`
  - Champs : nom et prénom, e-mail utilisé lors de l'achat, date de souscription, case « Je renonce à mon contrat d'abonnement Contenus du mois », bouton **« Confirmer la rétractation »** ;
  - Paramètres > Notifications : **e-mail de confirmation automatique au répondant** (accusé de réception avec la date et le contenu) et copie à contact@brasdroitia.com.
- Envoyer les deux liens Tally à Claude.

## 4. Médiateur de la consommation (10 min, obligatoire avant la première vente à un particulier)
- Recommandation : **CM2C** (référencé par la CECMC ; adhésion indiquée à partir d'environ 48 EUR pour 3 ans pour une petite entreprise — source secondaire, à vérifier sur cm2c.net).
- Alternatives : SMP, CNPM (voir la liste officielle des médiateurs référencés sur economie.gouv.fr).
- Après adhésion, envoyer à Claude le nom, l'adresse et le site du médiateur : il complète les CGV et les mentions légales.

## Ce qui reste à compléter sur le site après ces étapes
- Lien de paiement Stripe (bouton « Démarrer à 9 € »)
- Lien du portail client Stripe (bouton « Résilier mon abonnement »)
- Lien du formulaire Tally de rétractation (bouton « Renoncer au contrat ici »)
- Médiateur de la consommation
- Date de mise en ligne des CGV
- Clause sur l'accès depuis l'extérieur de l'UE (confidentialité) : à valider par l'avocat
