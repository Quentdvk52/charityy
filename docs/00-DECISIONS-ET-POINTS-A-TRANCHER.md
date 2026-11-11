# 00 - Décisions prises, hypothèses et points à trancher

## 1. Décisions confirmées par le porteur de projet

| Sujet | Décision |
|-------|----------|
| Cible | Monde entier dès le départ |
| Langue et devise | Détection automatique du pays, conversion automatique de la langue et de la devise |
| Devise de référence | FCFA (XOF), converti à l'affichage selon le pays |
| Paiements | Moneroo uniquement (agrégateur : mobile money, cartes, moyens locaux) |
| Statut | Entreprise fintech |
| Fonds collectés | Appartiennent au bénéficiaire ; non gérés directement sur Moneroo |
| Certification | Payante, 5% du montant des campagnes et collectes |
| Vérification humaine | Équipe interne |
| Pièce d'identité | Obligatoire et valide pour toute personne qui lance une cagnotte, collecte ou campagne |
| Personnes ressources | Vérifiées par document officiel, appel, e-mail institutionnel et autres méthodes |
| Monétisation créateur | 2% sur cagnottes, lives, cadeaux, produits et campagnes commerciales |
| Commission plateforme | 3% des recettes nettes (après frais de paiement) |
| Cadeaux | Wallet par compte, rechargeable ; paiement direct via Moneroo si le wallet est vide |
| Mobile | Site web responsive + PWA installable en premier |
| Marque | Logo, domaine, identité : réglés à la fin |
| Rôles | Rôles d'administration générale ; droits attribuables à des comptes équipe |
| Livraison | Plusieurs étapes, application entièrement fonctionnelle à la fin |

## 2. Hypothèses retenues par défaut (modifiables via la table `platform_settings`)

1. Montants stockés en unités mineures (entiers), jamais en flottants.
2. Le wallet est un registre interne (ledger en partie double). Son statut réglementaire est à valider (section 3, point 1).
3. La certification (5%) est calculée sur l'objectif déclaré de la campagne, avec minimum et maximum configurables, et prélevée sur les fonds collectés au moment du reversement, pas payée à l'avance. Raison : exiger 5% d'avance à une famille en détresse est un frein majeur. Alternative configurable : paiement à la demande.
4. Les 2% créateur s'appliquent à l'activité qu'il a lui-même apportée (dons arrivés via son lien ou sa publication, cadeaux reçus sur son live, ventes de ses produits). Base de calcul exacte dans `06-PAIEMENTS-MONEROO-WALLET.md`.
5. Une cagnotte devient publique (reçoit des dons) à 100 signatures valides ET identité du créateur vérifiée.
6. Remboursement : les fonds appartiennent au bénéficiaire, donc pas de remboursement automatique si l'objectif n'est pas atteint. Cas de remboursement : fraude avérée, erreur technique, décision de médiation, demande légale.

## 3. Points à valider avec un juriste / comptable avant le lancement public

1. **Wallet et détention de fonds.** Un wallet chargé par l'utilisateur et rémunérant des créateurs peut relever de la monnaie électronique ou des services de paiement (par exemple règles BCEAO en zone UEMOA, équivalents dans chaque pays). Deux voies : (a) fonctionnement strictement en flux, où l'argent transite par Moneroo et son partenaire agréé sans que Charityy le détienne ; (b) licence ou partenariat avec un établissement agréé. Sans cette validation, ne pas ouvrir les retraits publics.
2. **"Non géré directement sur Moneroo".** Le besoin exact est ambigu : les fonds des bénéficiaires restent-ils sur le compte marchand Moneroo de Charityy, ou sont-ils reversés immédiatement ? Le code supporte les deux via le ledger, mais il faut choisir.
3. **Agrément de collecte de fonds** par pays (appels à la générosité publique, dons).
4. **Fiscalité** des dons, des revenus créateurs, de la TVA sur certification et boosts.
5. **Données de santé** (documents médicaux) : base légale, consentement, durée de conservation, hébergement.
6. **KYC et LCB-FT** (blanchiment, financement du terrorisme) : seuils, listes de sanctions, déclarations.
7. **Statut d'hébergeur** de contenus et obligations de retrait (contenus illicites, protection des mineurs).
8. **Règles de monétisation "alignées sur TikTok"** : on ne peut pas copier des règles internes d'une autre plateforme ; les conditions d'éligibilité de Charityy doivent être définies et publiées dans ses propres CGU.
9. **Cadeaux virtuels convertis en revenus** : qualification juridique à confirmer.

## 4. Risques produit connus (l'agent doit les traiter dans le code)

| Risque | Parade imposée |
|--------|----------------|
| Fausses cagnottes | KYC obligatoire, 100 signatures vérifiées, certification, gel des fonds, signalements, audit |
| Faux comptes pour fabriquer des signatures | Signature liée à un téléphone vérifié, limite par appareil/IP, détection d'anomalies, pondération par fiabilité |
| Blanchiment via cadeaux/wallet | Plafonds, KYC progressif, surveillance des schémas, journal d'audit |
| Double crédit via webhook rejoué | Idempotence stricte, vérification de signature, réconciliation quotidienne |
| Fuite de pièces d'identité ou documents médicaux | Stockage privé chiffré, URL signées courtes, accès journalisé, séparation des droits |
| Contenus choquants ou impliquant des mineurs | Modération humaine prioritaire, floutage, procédure d'urgence |
| Manipulation de l'algorithme par boost | Badge "sponsorisé", plafonds, transparence |
