# 04 - Base de données et ledger financier

Le schéma de référence est dans `prisma/schema.prisma`. L'agent peut l'étendre mais ne doit jamais retirer une contrainte d'unicité, un index de sécurité ou une règle d'immuabilité.

## 1. Règles générales
- PostgreSQL sur Neon, deux URL : `DATABASE_URL` (poolée, pour l'application) et `DIRECT_URL` (migrations).
- Toutes les migrations sont versionnées (`prisma migrate dev` en local, `prisma migrate deploy` en production), réversibles quand c'est possible, et conçues sans coupure (ajouter une colonne nullable, remplir, puis rendre obligatoire).
- Jamais de requête SQL brute avec concaténation de chaînes : Prisma ou `$queryRaw` avec paramètres liés uniquement.
- Suppression : logique (`deletedAt`) pour les utilisateurs et contenus ; les données financières ne sont jamais supprimées.
- Colonnes sensibles (numéro de pièce d'identité, destination de retrait) : chiffrement applicatif AES-256-GCM avec clé en variable d'environnement (`DATA_ENCRYPTION_KEY`), prévoir la rotation (champ de version de clé).
- Identifiants publics non devinables (cuid). Aucun identifiant séquentiel exposé.

## 2. Ledger en partie double (obligatoire)
Principe : chaque mouvement d'argent est une `LedgerTransaction` composée d'au moins deux `LedgerEntry` (débits et crédits égaux dans la même devise). Les soldes sont calculés à partir des écritures (avec un solde matérialisé mis à jour dans la même transaction, vérifié chaque nuit).

Comptes types : portefeuille utilisateur, fonds de campagne, gains créateur, revenus plateforme, frais de paiement, compte de compensation Moneroo, réserve.

Exemple, don de 10 000 XOF avec frais Moneroo de 300 XOF, commission 3% sur net et part créateur 2% (base : montant total du don, voir 06) :
1. Débit compensation Moneroo 10 000 ; crédit fonds de campagne 10 000 (réception du don).
2. Débit fonds de campagne 300 ; crédit frais de paiement 300 (frais).
3. Débit fonds de campagne 291 ; crédit revenus plateforme 291 (3% x 9 700).
4. Débit fonds de campagne 200 ; crédit gains créateur 200 (2% x 10 000, si un créateur est à l'origine du don). Confirmer la source de financement de cette part dans le document 06.

Garde-fous :
- Contrainte applicative et test : somme débits = somme crédits par transaction.
- `idempotencyKey` unique : rejouer la même opération ne crée rien.
- Verrou : `SELECT ... FOR UPDATE` sur les comptes concernés pour tout débit de wallet (jamais de solde négatif).
- Isolation `Serializable` ou verrous explicites pour les opérations de wallet et de retrait.
- Job quotidien de réconciliation : somme du ledger contre les rapports Moneroo ; alerte si écart.
- Lignes immuables : trigger PostgreSQL interdisant UPDATE et DELETE sur `LedgerEntry` et `LedgerTransaction`.

## 3. Index et performance
- Index composés sur les requêtes du fil (pays, date, statut).
- Pagination par curseur (id + date).
- Compteurs (likes, vues) incrémentés de façon atomique, vues agrégées par lot via Redis puis écrites en base.
- Vues matérialisées ou tables de cache pour les classements et tendances.

## 4. Sauvegarde et rétention
- Sauvegardes Neon (point-in-time) + export chiffré hebdomadaire hors plateforme.
- Test de restauration trimestriel documenté.
- Rétention : pièces d'identité et documents médicaux selon la politique du document 14 ; journaux d'audit au minimum 5 ans pour la partie financière (à confirmer juridiquement).

## 5. Jeu de données de test
L'agent fournit un script `prisma/seed.ts` créant : un super admin, des comptes de chaque rôle, des devises (XOF, XAF, GHS, NGN, KES, USD, EUR, etc.), un catalogue de cadeaux, des campagnes de démonstration, sans jamais utiliser de données réelles.
