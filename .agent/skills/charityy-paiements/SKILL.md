---
name: charityy-paiements
description: À utiliser pour tout code touchant Moneroo, les paiements, le wallet, le ledger, les commissions (3 % plateforme, 2 % créateur, 5 % certification), les retraits, les remboursements ou la réconciliation du projet Charityy.
---

# Skill - Paiements Charityy

Procédure :
1. Lire docs/06-PAIEMENTS-MONEROO-WALLET.md, docs/04-BASE-DE-DONNEES.md et la documentation officielle Moneroo (https://docs.moneroo.io). Confirmer les points marqués "à confirmer".
2. Montants en entiers (unités mineures) ; exposant par devise via la table Currency ; jamais de flottants.
3. Toute opération monétaire : clé d'idempotence, transaction SQL unique, verrous sur les comptes, écritures de ledger équilibrées. Aucun solde modifié hors ledger.
4. Webhooks : corps brut, signature vérifiée à temps constant, enregistrement unique dans WebhookEvent, re-vérification du paiement via l'API avant crédit, traitement asynchrone.
5. Calculs dans computeSplit() uniquement (fonction pure, tests exhaustifs, règle d'arrondi unique). Paramètres lus dans PlatformSetting.
6. Tests obligatoires : document 06, section 7.
7. Ne jamais appeler Moneroo depuis le navigateur ; ne jamais faire confiance à un montant, une devise ou une commission venant du client.

Si une règle financière est ambiguë (qui supporte les 2 % créateur, remboursement, détention des fonds), s'arrêter et demander au porteur de projet.
