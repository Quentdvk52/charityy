# 11 - Administration générale, rôles et modération

L'administration générale regroupe modération, support, remboursements et vérifications. Les droits sont attribuables à des comptes équipe par le SUPER_ADMIN, sans modification du code.

## 1. Rôles et permissions (matrice de départ)

| Rôle | Permissions principales |
|------|-------------------------|
| USER | Publier, commenter, signer, donner |
| CREATOR | USER + monétisation, tableau de bord créateur |
| ORG_OWNER | CREATOR + gestion d'organisation, membres |
| MODERATOR | Voir files de signalement, masquer/retirer contenus, suspendre cagnotte (réversible), gérer chats |
| VERIFIER | Examiner KYC, certifications, personnes ressources, invalider signatures |
| FINANCE | Voir transactions, approuver retraits, remboursements, réconciliation, paramètres de tarifs |
| SUPPORT | Voir dossiers utilisateurs (données masquées), répondre aux tickets, aucune action financière |
| ADMIN | Tout sauf gestion des rôles critiques et clés |
| SUPER_ADMIN | Gestion des rôles, paramètres plateforme, accès d'urgence (journalisé) |

Mécanisme : table de permissions fines (`resource:action`) assignables à un rôle ou à un compte ; rôles personnalisés créables ; toute modification de droits est auditée et exige une réauthentification. Principe du moindre privilège ; revue trimestrielle des accès.

## 2. Modules du back-office
1. Tableau de bord : indicateurs (dons, campagnes, signatures, fraudes détectées, délais de traitement).
2. File KYC : visionneuse sécurisée (filigrane avec identifiant de l'agent, aucune copie locale, URL signées 60 s), décisions avec motifs standardisés.
3. File certification : checklist, historique, communications avec le bénéficiaire.
4. File signalements et modération : priorité par gravité (mineurs, violence, fraude, haine), actions rapides, journal.
5. Gestion des campagnes : suspendre, geler, clôturer, corriger, fusionner les doublons.
6. Finance : paiements, retraits (double approbation), remboursements, réconciliation, exports.
7. Utilisateurs : recherche, historique, sanctions (avertissement, suspension, bannissement), appels.
8. Catalogue de cadeaux, boosts, tarifs, taux, pays et règles.
9. Support : tickets, modèles de réponse, base d'aide.
10. Paramètres de plateforme (`PlatformSetting`) avec historique et retour arrière.
11. Journal d'audit consultable (lecture seule, filtres, export).

## 3. Règles de fonctionnement
- Accès au back-office uniquement avec 2FA et sur sessions courtes ; restriction par IP/appareil recommandée.
- Visibilité limitée : le support voit des données masquées ; seules les personnes autorisées voient les pièces d'identité et documents médicaux, avec journalisation de chaque ouverture.
- Délais cibles (SLA) : signalement grave sous 2 heures, KYC sous 48 heures, certification sous 5 jours ouvrés, ticket support sous 24 heures.
- Décisions motivées, notifiées à l'utilisateur avec voie de recours (appel examiné par une personne différente).
- Procédure d'urgence : gel immédiat des fonds et retrait de contenu possible par MODERATOR/FINANCE, revue sous 24 heures.

## 4. Support utilisateur
Centre d'aide multilingue, formulaire de contact, suivi des tickets, page statut, signalement dans l'application, canaux WhatsApp/e-mail ajoutés ultérieurement.
