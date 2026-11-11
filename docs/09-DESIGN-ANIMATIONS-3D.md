# 09 - Design, animations et 3D

## 1. Direction artistique (imposée)
- Sobre, premium, humain, crédible. Palette : noir, blanc, gris clair. Accents discrets uniquement pour les actions importantes : don, urgence, certification (une seule couleur d'accent par fonction, contraste AA validé).
- Aucune icône décorative devant les titres. Icônes uniquement fonctionnelles (actions, navigation), cohérentes (lucide-react).
- Aucun look "template IA" : pas de dégradés violets, pas de cartes génériques identiques partout, pas d'emojis dans l'interface, pas de couleurs criardes.
- Typographie : une famille sans-serif moderne et très lisible hébergée localement (par exemple Inter, Geist ou Manrope via `next/font`), deux graisses principales, échelle typographique fixe.
- Modes clair et sombre (variables CSS), `prefers-color-scheme` respecté, bascule manuelle.
- Mobile-first : zones tactiles d'au moins 44 px, actions principales dans la zone du pouce, navigation par onglets en bas.

## 2. Principes UX
1. Comprendre une cagnotte en moins de 5 secondes : montant demandé, collecté, urgence, certification toujours visibles.
2. Don en trois étapes maximum (montant, méthode, confirmation) ; montants suggérés dans la devise locale ; paiement mobile money par défaut selon le pays.
3. Preuves et transparence mises en avant (documents, mises à jour, dépenses).
4. Moins de friction à la création : sauvegarde automatique du brouillon, progression visible, aide contextuelle.
5. États vides, de chargement (squelettes), d'erreur et hors ligne conçus pour chaque écran.
6. Textes courts, ton chaleureux et respectueux, langage simple, pas de culpabilisation des donateurs.

## 3. Système de design
Jetons (tokens) dans Tailwind/CSS : couleurs, espacements (échelle de 4 px), rayons, ombres, durées et courbes d'animation. Composants shadcn/ui personnalisés, documentés dans une page interne `/design` (Storybook facultatif). Aucune valeur de couleur ou d'espacement écrite en dur dans les composants.

## 4. Animations
| Usage | Outil | Règle |
|-------|-------|-------|
| Transitions de pages, apparition d'éléments, boutons | Motion | Durées 150 à 400 ms, courbes douces, pas de rebond excessif |
| Scènes d'introduction, pages marketing, défilement | GSAP + ScrollTrigger, Lenis | Uniquement pages publiques, jamais dans le fil ni le tunnel de don |
| Progression de cagnotte | Motion (animation de largeur et compteur) | Chiffres animés une seule fois à l'entrée |
| Réussite de don | canvas-confetti discret + message de remerciement | Durée courte, désactivé si mouvement réduit |
| Cadeaux animés | Lottie ou R3F | File d'attente, annulation si l'utilisateur quitte |
| Chargement | Squelettes | Pas de spinner plein écran |

Accessibilité : respecter `prefers-reduced-motion` partout (animations remplacées par des fondus simples), aucune animation clignotante, jamais d'information portée uniquement par le mouvement.

## 5. 3D : où et comment
Usages autorisés : page d'accueil publique (globe interactif montrant les campagnes par pays avec `cobe` ou Three.js), écran de remerciement premium, cadeaux virtuels premium, visualisation d'impact (carte 3D légère facultative).
Règles de performance :
- Chargement différé (`next/dynamic` avec `ssr: false`), `Suspense` avec squelette.
- Détection d'appareil faible (mémoire, GPU, connexion lente, économie de données) : remplacer par une image statique.
- Modèles glTF compressés (Draco/Meshopt, textures KTX2), poids maximal 1 Mo par scène, 60 images/s visés, 30 acceptables, DPR plafonné à 2.
- Arrêt du rendu quand l'onglet ou la scène n'est pas visible.
- Aucun usage de la 3D dans les écrans critiques (fil, don, KYC, retrait).

## 6. Accessibilité
WCAG 2.2 AA : contrastes, focus visible, navigation clavier, `aria-*` corrects, textes alternatifs, sous-titres vidéo, tailles de police ajustables, pas de dépendance à la couleur seule, tests axe-core en CI.

## 7. Performance perçue
Optimisation des images (`next/image`, AVIF/WebP), polices locales avec `font-display: swap`, découpage du code par route, budget JS initial inférieur à 200 Ko compressé sur la page d'accueil, mise en cache agressive des ressources statiques, PWA avec Serwist (cache des coquilles d'écran, page hors ligne, file d'actions différées pour les signatures et commentaires).
