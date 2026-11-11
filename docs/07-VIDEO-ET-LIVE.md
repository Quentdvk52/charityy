# 07 - Vidéo courte, lives Agora et cadeaux

## 1. Vidéo
- Hébergement et transcodage : Cloudflare Stream (https://developers.cloudflare.com/stream). Alternative budgétaire à évaluer : Mux (https://www.mux.com).
- Téléversement : URL de téléversement direct (direct creator upload, reprise possible via tus) émise par le serveur après contrôle des droits, durée de vie courte, durée maximale contrainte (180 s par défaut).
- Lecture : HLS adaptatif, jetons de lecture signés pour les vidéos non publiques, miniatures générées, préchargement de la vidéo suivante dans le fil, mode économie de données (qualité plafonnée, lecture sur demande).
- Webhook Cloudflare : signature vérifiée, passage `PROCESSING -> READY`, rejet si format ou durée invalide.
- Sous-titres automatiques : service de transcription (par exemple Whisper hébergé ou API tierce) lancé en tâche de fond, langues multiples, édition manuelle par l'auteur ; traduction automatique des légendes à la demande avec mise en cache.
- Montage dans le navigateur : MediaRecorder + WebCodecs ou `ffmpeg.wasm` limité aux découpes simples ; sinon import de la vidéo et montage minimal (texte, coupe). Ne pas bloquer le MVP sur le montage avancé.
- Musique : uniquement de la bibliothèque libre de droits fournie par Charityy ; pas d'import de musique protégée.
- Modération : toute vidéo reliée à une cagnotte est en file de revue ; analyse automatique (service de modération d'images/vidéo comme AWS Rekognition, Hive ou équivalent) ; signalement utilisateur ; retrait immédiat possible par MODERATOR.
- Protection des mineurs : détection et blocage de contenu sexualisé ; gel et signalement aux autorités selon la loi ; accès restreint à toute vidéo impliquant un enfant dans une cagnotte (consentement parental documenté, floutage proposé).

## 2. Fil d'actualité
- Endpoint `GET /api/feed?tab=...&cursor=...` ; score = combinaison pondérée (proximité, confiance/certification, fraîcheur, engagement, urgence, intérêts, abonnement) calculé côté serveur, paramétrable dans `PlatformSetting`.
- Les contenus sponsorisés sont insérés selon des règles de fréquence et toujours étiquetés "Sponsorisé".
- Diversité : pas plus de 2 vidéos consécutives du même auteur ; une cagnotte non certifiée ne dépasse pas un quota dans le fil "Pour toi".
- Anti-manipulation : likes/vues pondérés, détection de bots, plafonds.

## 3. Lives avec Agora
Documentation : https://docs.agora.io. Paquets : `agora-rtc-sdk-ng` (client), `agora-token` (génération de jetons côté serveur), Agora Chat pour le chat (https://docs.agora.io/en/agora-chat/overview/product-overview). L'agent confirme les noms de paquets et les API dans la documentation à jour.
- Jetons : générés uniquement côté serveur après contrôle des droits ; durée courte (par exemple 1 h, renouvelable), rôle `host` ou `audience`, canal unique non devinable. `AGORA_APP_CERTIFICATE` jamais exposé.
- Mode : diffusion interactive à faible latence (live streaming), invités possibles (co-animation) avec montée sur scène autorisée par l'hôte.
- Chat : modération (mots interdits, limitation de débit, bannissement, modérateurs désignés), conservation limitée.
- Enregistrement : Agora Cloud Recording ou enregistrement serveur vers R2/Stream ; avertissement visible "Ce live est enregistré" ; replay publié après contrôle.
- Don pendant un live : bouton de don relié à la cagnotte ; progression mise à jour en temps réel (canal temps réel : Agora Chat/RTM, Ably ou Pusher ; ou revalidation par polling court en phase 1).
- Capacité et coûts : plafond de spectateurs configurable, alerte de consommation Agora, mode dégradé en audio seul.
- Règles de sécurité : un live ne démarre que si le compte est vérifié (KYC pour les lives de collecte), fin de live forcée sur décision de modération, signalement en direct.

## 4. Cadeaux virtuels
- Catalogue administré (`GiftCatalog`), prix en unités mineures XOF avec conversion à l'affichage.
- Envoi : débit du wallet (ou paiement Moneroo si solde insuffisant), écriture ledger, animation côté client uniquement après confirmation serveur.
- Répartition : part du créateur selon le taux publié, commission plateforme, le reste en revenus créateur retirables (après seuil et KYC).
- Animations : Lottie pour les cadeaux simples, Three.js (R3F) pour les cadeaux premium, avec file d'attente d'animations pour ne pas bloquer l'interface.
- Anti-abus : plafonds par jour, détection de cadeaux circulaires (A envoie à B qui renvoie à A), alerte sur schémas de blanchiment, possibilité de geler les gains.
- Classement des meilleurs soutiens par live et par créateur, avec option d'anonymat.
