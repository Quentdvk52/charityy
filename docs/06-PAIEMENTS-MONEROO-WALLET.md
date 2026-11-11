# 06 - Paiements, wallet, commissions et reversements

Documentation officielle Moneroo : https://docs.moneroo.io. L'agent lit cette documentation avant de coder et confirme chaque point marqué (à confirmer) : endpoints, noms de champs, en-tête de signature du webhook, liste des méthodes par pays, frais, limites, devises supportées, délais de reversement.

## 1. Intégration Moneroo (serveur uniquement)
Fichier unique d'intégration : `src/server/integrations/moneroo.ts`. Aucun appel Moneroo depuis le navigateur. Clé secrète uniquement en variable d'environnement.

Flux de collecte :
1. Initialisation d'un paiement (à confirmer : `POST /v1/payments/initialize`) avec montant, devise, description, client, `return_url`, `metadata` (identifiant interne de paiement uniquement).
2. Redirection vers le checkout hébergé retourné par Moneroo.
3. Webhook de résultat vers `/api/webhooks/moneroo` (à confirmer : en-tête de signature HMAC-SHA256 du corps brut avec le secret de webhook).
4. Vérification serveur du paiement via l'API (à confirmer : `GET /v1/payments/{id}/verify`) avant tout crédit. La page de retour (`return_url`) n'a aucune valeur de preuve : elle affiche seulement "en cours de confirmation".

Flux de reversement :
1. Demande validée -> initialisation d'un payout (à confirmer : `POST /v1/payouts/initialize`) avec méthode et destination (mobile money, compte).
2. Webhook de statut -> écritures de ledger finales. En cas d'échec : retour des fonds au compte d'origine (écriture inverse).

Devises : Moneroo supporte plusieurs devises et pays ; l'agent construit la table des méthodes disponibles par pays à partir de l'API ou de la documentation (à confirmer) et l'affiche dans le checkout. Si une devise n'est pas supportée pour un pays, convertir vers une devise supportée avec transparence (taux et frais affichés avant paiement).

## 2. Wallet
- Un wallet par compte utilisateur et par devise de base (XOF par défaut), représenté par un `LedgerAccount(USER_WALLET)`.
- Recharge : paiement Moneroo `WALLET_TOPUP` -> crédit après confirmation.
- Dépenses (cadeaux, boosts, certification, dons, produits) : si solde suffisant, débit immédiat du wallet (transaction avec verrou) ; sinon, option "payer directement" via Moneroo.
- Retraits du wallet : uniquement pour les gains créateur et les fonds de campagne du bénéficiaire, jamais pour le solde rechargé non dépensé sauf politique explicite (limite le risque de blanchiment : le solde rechargé est remboursable uniquement vers le moyen de paiement d'origine, sur demande et après contrôle).
- Plafonds par niveau de KYC (configurables) : montant par transaction, par jour, solde maximum.
- Aucun solde négatif, jamais ; opérations idempotentes ; historique complet exportable.

## 3. Commissions et partages (paramètres dans `PlatformSetting`)

| Paramètre | Valeur par défaut |
|-----------|-------------------|
| `fee.platform.rate` | 3% des recettes nettes (après frais de paiement) |
| `fee.creator.rate` | 2% |
| `fee.certification.rate` | 5% de l'objectif de campagne |
| `fee.certification.min` / `max` | À définir par le porteur de projet |
| `payout.min` | À définir (par devise) |
| `payout.securityDelayHours` | 48 |
| `payout.dualApprovalThreshold` | À définir (par devise) |

Calcul (fonction pure `computeSplit()` couverte par des tests exhaustifs, arrondi défini une fois pour toutes, par exemple arrondi au plus proche en unités mineures avec le reste attribué à la plateforme) :
1. `net = montant_brut - frais_de_paiement`
2. `commission_plateforme = net x 3%`
3. `part_createur = base_eligible x 2%` où `base_eligible` est le montant brut de l'activité éligible attribuée au créateur (don arrivé via sa publication ou son lien, cadeaux reçus sur son live, vente de ses produits, campagne commerciale qu'il a apportée).
4. `montant_beneficiaire = brut - frais - commission_plateforme - part_createur_si_applicable`

Point à valider par le porteur de projet : qui supporte les 2% du créateur sur un don à une cagnotte (le bénéficiaire, la plateforme, ou le donateur en supplément) ? Par défaut proposé : prélevé sur la commission plateforme pour ne pas pénaliser les bénéficiaires, ce qui peut rendre la marge négative si la part créateur dépasse la commission nette ; l'agent implémente un plafond `creator share <= platform commission` activable. Transparence obligatoire : le donateur voit avant paiement la ventilation exacte (montant versé, frais, commission).

Cas particuliers : cadeaux (la part créateur est définie par le catalogue, conversion des "cadeaux" en revenus avec un taux publié), produits (commission plateforme et part créateur par catégorie), boosts et certification (revenu plateforme à 100%).

## 4. Certification payante (5%)
- Devis affiché avant la demande : tarif calculé, modifiable seulement par un rôle FINANCE avec justification (audit).
- Mode par défaut : frais prélevés sur les fonds collectés lors du premier reversement ; mode alternatif : paiement avant examen. Si la certification est rejetée pour fraude, aucun remboursement ; rejetée pour dossier incomplet, remboursement ou crédit selon CGU.

## 5. Remboursements et litiges
- Les fonds collectés appartiennent au bénéficiaire. Remboursement possible seulement : fraude avérée, erreur technique, double paiement, décision de médiation, obligation légale.
- Procédure : demande -> gel -> examen (FINANCE + MODERATOR) -> décision -> écriture inverse -> notification. Rétrofacturation (chargeback) carte : preuve conservée (journal de transaction, adresse IP hachée, horodatage).

## 6. Réconciliation et contrôle
- Cron quotidien : comparaison paiements Moneroo / ledger / statuts ; tableau d'écarts dans l'administration FINANCE ; alerte si écart non nul.
- Cron horaire : paiements `PENDING` de plus de X minutes -> re-vérification via API.
- Rapport mensuel exportable (CSV) : collectes, frais, commissions, reversements, soldes par campagne.

## 7. Tests obligatoires
Webhook rejoué 10 fois = un seul crédit ; webhook avec mauvaise signature rejeté ; montant altéré côté client ignoré ; double clic = une seule opération ; concurrence (100 dépenses simultanées) sans solde négatif ; arrondis (cas limites de 1 unité mineure) ; panne Moneroo simulée avec reprise ; devise à 0 décimale (XOF) et à 2 décimales (USD, EUR).
