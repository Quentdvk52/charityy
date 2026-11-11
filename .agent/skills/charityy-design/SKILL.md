---
name: charityy-design
description: À utiliser pour créer ou modifier toute interface, animation, scène 3D ou composant visuel du projet Charityy (direction artistique noir/blanc/gris, mobile-first, accessibilité).
---

# Skill - Design Charityy

Procédure :
1. Lire docs/09-DESIGN-ANIMATIONS-3D.md.
2. Utiliser uniquement les tokens de design et les composants shadcn/ui personnalisés ; aucune couleur ou valeur d'espacement en dur.
3. Concevoir les états : chargement (squelette), vide, erreur, hors ligne, succès.
4. Animations avec Motion (durées 150 à 400 ms), GSAP seulement sur pages publiques, respecter prefers-reduced-motion.
5. 3D (Three.js / React Three Fiber / Drei) seulement aux emplacements autorisés, via next/dynamic ssr:false, avec repli statique et budget de poids ; jamais sur fil, don, KYC, retrait.
6. Vérifier : contraste AA, navigation clavier, axe-core, rendu mobile 360 px et RTL.

Interdits : icône décorative devant un titre, emoji dans l'interface, dégradé violet ou style générique "template IA", couleurs criardes.
