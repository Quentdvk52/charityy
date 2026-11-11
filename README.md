# Charityy : monde meilleure - Dossier de pilotage pour l'agent Antigravity

Ce dossier contient tout ce dont l'agent Antigravity a besoin pour construire l'application de bout en bout, en plusieurs étapes, de façon sécurisée et entièrement fonctionnelle.

## Comment l'utiliser (3 minutes)

1. Créez un dossier de projet vide, puis copiez-y le contenu de cette archive (y compris le dossier caché `.agent`).
2. Ouvrez le dossier dans Antigravity.
3. Copiez le contenu de `prompts/00-PROMPT-MAITRE.md` dans le chat de l'agent. C'est le seul prompt de lancement.
4. Ensuite, pour chaque étape, utilisez le prompt correspondant dans `prompts/01-PROMPTS-PAR-ETAPE.md`, ou tapez simplement `/etape-suivante`.
5. Avant toute mise en ligne : `/audit-securite` puis `/pre-deploiement`.

## Ordre de lecture obligatoire pour l'agent

| N° | Fichier | Contenu |
|----|---------|---------|
| 0 | docs/00-DECISIONS-ET-POINTS-A-TRANCHER.md | Décisions prises, hypothèses, points à valider avec un juriste |
| 1 | docs/01-PRODUIT.md | Cahier des charges fonctionnel consolidé |
| 2 | docs/02-ARCHITECTURE.md | Architecture technique et structure du code |
| 3 | docs/03-STACK-ET-INSTALLATION.md | Technologies, bibliothèques, commandes d'installation, liens |
| 4 | docs/04-BASE-DE-DONNEES.md + prisma/schema.prisma | Modèle de données et ledger financier |
| 5 | docs/05-SECURITE.md | Règles de sécurité obligatoires (non négociables) |
| 6 | docs/06-PAIEMENTS-MONEROO-WALLET.md | Paiements, wallet, commissions, reversements |
| 7 | docs/07-VIDEO-ET-LIVE.md | Vidéo courte, lives Agora, cadeaux |
| 8 | docs/08-CAGNOTTES-SIGNATURES-CERTIFICATION.md | Règles métier de confiance |
| 9 | docs/09-DESIGN-ANIMATIONS-3D.md | Direction artistique, animations, 3D |
| 10 | docs/10-I18N-GEOLOCALISATION-DEVISES.md | Langues, devises, géolocalisation |
| 11 | docs/11-ADMIN-MODERATION-ROLES.md | Administration générale, rôles, modération |
| 12 | docs/12-FEUILLE-DE-ROUTE-ETAPES.md | Étapes de construction avec critères d'acceptation |
| 13 | docs/13-TESTS-QUALITE-DEPLOIEMENT.md | Tests, CI/CD, déploiement, monitoring |
| 14 | docs/14-CONFORMITE-LEGALE.md | Conformité, données, KYC, LCB-FT |
| 15 | docs/15-VARIABLES-ENVIRONNEMENT.md | Liste complète des variables d'environnement |

Les dossiers `.agent/rules`, `.agent/skills` et `.agent/workflows` sont lus automatiquement par Antigravity (règles permanentes, compétences, commandes). Si votre version d'Antigravity utilise d'autres emplacements, déplacez ces fichiers au bon endroit sans changer leur contenu.

## Règle d'or

L'agent ne déclare jamais une étape terminée sans : tests qui passent, audit de sécurité de l'étape effectué, et critères d'acceptation vérifiés un par un. Il s'arrête et demande en cas de doute juridique ou financier.
