---
name: charityy-video-live
description: À utiliser pour tout code touchant la vidéo courte (Cloudflare Stream), le fil d'actualité, les lives Agora, le chat, les cadeaux virtuels et la modération de contenu du projet Charityy.
---

# Skill - Vidéo et live Charityy

Procédure :
1. Lire docs/07-VIDEO-ET-LIVE.md et docs/05-SECURITE.md.
2. Téléversement : URL directe signée émise par le serveur après contrôle des droits, durée et taille contraintes, webhook vérifié avant passage à READY.
3. Lecture : HLS adaptatif, jetons signés pour contenus non publics, mode économie de données.
4. Live : confirmer les API dans la documentation Agora actuelle ; jetons générés côté serveur uniquement, durée courte, rôle host/audience, certificat jamais exposé.
5. Cadeaux : débit wallet et ledger côté serveur d'abord, animation client seulement après confirmation.
6. Modération : file de revue pour contenus liés aux cagnottes, signalement en un geste, retrait immédiat par rôle autorisé, protection des mineurs prioritaire.
7. Tester : accès aux contenus privés, jetons hors rôle, débit unique des cadeaux, fin de live forcée.
