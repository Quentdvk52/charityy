---
name: charityy-securite
description: À utiliser pour toute tâche touchant l'authentification, les autorisations, les données sensibles (KYC, documents médicaux), les fichiers, les webhooks, les endpoints API ou toute revue de sécurité du projet Charityy.
---

# Skill - Sécurité Charityy

Procédure :
1. Lire docs/05-SECURITE.md et docs/14-CONFORMITE-LEGALE.md.
2. Pour chaque endpoint ou action créé : écrire d'abord le schéma zod, la vérification de session, la permission (server/auth/permissions.ts) et le contrôle de propriété, puis la logique, puis le rate limit, puis un DTO de sortie explicite.
3. Pour toute donnée sensible : chiffrement applicatif, stockage privé, URL signée courte, écriture dans AuditLog à chaque accès.
4. Écrire les tests négatifs : utilisateur non connecté, utilisateur A sur ressource de B, rôle insuffisant, entrée malformée, rejeu.
5. Remplir la checklist de sécurité (document 05, section 13) et la joindre au compte rendu.

Interdits : secret en dur, autorisation côté client seule, SQL concaténé, dangerouslySetInnerHTML sans nettoyage, retour d'objet de base brut, désactivation d'une protection pour passer un test.
