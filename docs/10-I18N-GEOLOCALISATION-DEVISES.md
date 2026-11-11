# 10 - Langues, devises et géolocalisation

## 1. Détection du pays et de la langue
Ordre de priorité : choix explicite de l'utilisateur (cookie `locale`/`country` et profil) > pays détecté par l'IP via les en-têtes de la plateforme (`x-vercel-ip-country`, `x-vercel-ip-city`) > en-tête `Accept-Language` > défaut (fr, XOF).
- La détection se fait dans `middleware.ts` ; elle propose, ne contraint pas : bandeau discret "Voulez-vous changer de langue ou de pays ?" et sélecteur toujours accessible.
- La détection par IP est approximative (VPN, réseau mobile) : elle ne sert jamais de preuve de résidence ni de contrôle de conformité.
- Géolocalisation précise (GPS navigateur) : uniquement après consentement explicite, usage limité à la découverte locale, stockage d'une position approximative (quartier ou ville, arrondie), jamais de coordonnées exactes publiées.

## 2. Langues (next-intl)
- Routage `/[locale]/...`, fichiers de messages dans `src/messages/*.json`, aucune chaîne en dur dans les composants.
- Langues initiales recommandées : français, anglais, puis portugais, espagnol, arabe (RTL), swahili, haoussa, yoruba, fon (extension progressive). Prévoir la mise en page RTL dès le début (propriétés logiques CSS : `margin-inline`, `padding-inline`).
- Pluriels, dates, nombres et listes via ICU/Intl. Traductions initiales produites automatiquement puis relues par des locuteurs avant mise en production ; marquer les traductions non relues.
- Contenu généré par les utilisateurs : traduction automatique à la demande de la légende et de l'histoire, avec mention "Traduit automatiquement" et accès à l'original.
- SEO : balises `hreflang`, sitemap par langue, métadonnées localisées.

## 3. Devises
- Devise de référence interne : XOF ; chaque campagne a sa devise d'origine (celle de l'objectif). Le wallet est tenu en XOF par défaut (extension multi-devises prévue par le ledger).
- Affichage : conversion à la devise du pays détecté ou choisie, avec `Intl.NumberFormat`, mention "environ" pour les montants convertis et accès au montant d'origine.
- Taux : cron toutes les heures (ou quotidien) alimentant `FxRate` depuis une API de taux (par exemple https://www.exchangerate-api.com/docs/free ou une source officielle), stockage de l'historique, repli sur le dernier taux connu avec alerte si trop ancien.
- Paiement : le montant débité est fixé et affiché dans la devise payée ; le taux appliqué est enregistré avec la transaction ; vérifier chez Moneroo les devises supportées par pays (à confirmer) et convertir vers une devise supportée si besoin avec frais et taux transparents.
- Précision : entiers en unités mineures, exposants par devise (XOF et XAF : 0 décimale ; USD, EUR : 2 ; certaines devises : 3), table `Currency`.
- Jamais de conversion en nombre flottant pour un calcul financier ; utiliser un type décimal ou des entiers avec règle d'arrondi unique.

## 4. Découverte géographique
- Rayons : quartier, ville, région, pays, monde ; filtre par cause et urgence.
- Carte : MapLibre GL avec tuiles (MapTiler ou OSM selon licence), regroupement de marqueurs, vue "campagnes actives près de moi", positions floutées (arrondi) pour protéger la vie privée.
- Requêtes : PostgreSQL avec index sur pays/ville ; PostGIS (extension Neon) pour les recherches par rayon quand la position approximative est disponible.
- Alertes d'urgence proches : opt-in, limitées en fréquence, jamais de notification nominative sans consentement.

## 5. Contraintes par pays
Table de configuration `country_rules` : collecte autorisée ou non, méthodes de paiement, KYC requis, plafonds, textes légaux, langues par défaut. Les pays non encore ouverts à la collecte proposent la consultation et le soutien non financier uniquement, sans bloquer l'application.
