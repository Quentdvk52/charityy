# 08 - Cagnottes, signatures, confiance et certification

## 1. Machine à états des campagnes (une seule source : `modules/campaigns/state-machine.ts`)

```
DRAFT -> AWAITING_SIGNATURES -> (100 signatures valides + KYC approuvé) -> COMMUNITY_VALIDATED -> ACTIVE
ACTIVE -> ENDED -> CLOSED
COMMUNITY_VALIDATED/ACTIVE -> IN_REVIEW -> CERTIFIED (si demande de certification)
tout état actif -> SUSPENDED (signalement) -> ACTIVE ou FROZEN (enquête) -> CLOSED
```
Chaque transition : conditions vérifiées côté serveur, écriture `AuditLog`, notification. Tests unitaires sur toutes les transitions autorisées et interdites.

## 2. Création guidée
Étapes : type de cause, bénéficiaire (soi-même ou tiers : preuve du lien), histoire (vidéo + texte), objectif et devise, échéance, justificatifs (devis, factures, attestations), localisation, contacts vérifiables, déclaration sur l'honneur, consentements (données, image, documents). Le créateur doit avoir une identité vérifiée (pièce valide non expirée) pour passer de DRAFT à AWAITING_SIGNATURES.

## 3. Signatures
- Seuil : 100 signatures valides avant activation complète.
- Répartition cible : 40 proches, 30 personnes ressources, 30 communauté. Comportement par défaut : le seuil de 100 est atteint avec ces quotas ; un administrateur peut accorder une dérogation motivée (audit) pour les zones à faible connectivité.
- Signature valide : compte avec téléphone vérifié, ancienneté minimale configurable, une seule par compte et par campagne, signature non liée à un doublon d'appareil suspect, non invalidée.
- Types : proche (lien déclaré, pondération plus faible si non vérifié), personne ressource (badge obtenu après vérification : document officiel, appel, e-mail institutionnel ; plusieurs méthodes combinées pour les autorités), communauté.
- Détection de fraude : regroupements d'appareils/IP, comptes créés en rafale, signatures dans une fenêtre de temps très courte ; mise en file de revue ; invalidation en masse par un VERIFIER avec motif.
- Indicateurs publics : En attente (moins de 100), Validée par la communauté (100), Crédibilité élevée (au-delà), Certifiée Charityy (vérification plateforme). Mention permanente : "Les signatures ne remplacent pas une vérification légale ou financière."

## 4. Personnes ressources
Parcours dédié "Devenir personne ressource" : rôle déclaré (chef de quartier, autorité administrative, responsable religieux, professionnel de santé, enseignant, association, parrain financier), preuves, vérification par un agent (document officiel + appel + e-mail institutionnel selon le rôle), badge, durée de validité et revalidation périodique, retrait en cas d'abus.

## 5. Certification
Formulaire (voir document 01), checklist de vérification stockée en JSON : cohérence identité / documents / histoire, authenticité des justificatifs, appel au bénéficiaire, appel aux personnes ressources, recherche de doublons, recoupement de devis et factures. Décisions : approuvée, rejetée (motif), complément demandé (délai). Badge "Certifiée Charityy" retiré si fraude ou non-respect du rapport final.
Mention légale visible : la certification atteste d'un contrôle documentaire et de cohérence, pas d'une garantie d'usage des fonds.

## 6. Transparence et suivi
Mises à jour de campagne, historique des dépenses avec justificatifs, remerciements aux donateurs, rapport final obligatoire (campagnes certifiées) sous un délai défini, sinon blocage de nouvelles collectes du créateur. Liste publique des soutiens uniquement si le donateur l'a autorisé.

## 7. Règles d'accès aux fonds
Le bénéficiaire peut demander un reversement après : identité vérifiée, délai de sécurité écoulé, aucune alerte active, destination de paiement validée (compte ou numéro au nom du bénéficiaire vérifié). Montant maximal progressif selon l'indice de confiance. Au-delà d'un seuil, double validation humaine.
