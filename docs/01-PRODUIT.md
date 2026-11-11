# 01 - Cahier des charges produit consolidé

## 1. Vision
Charityy : monde meilleure est un réseau social vidéo solidaire, mobile-first : vidéos verticales, lives, cagnottes, signatures de soutien, certification, cadeaux et monétisation des créateurs. Il transforme l'attention en action concrète (dons, partenariats, bénévolat).

## 2. Acteurs
Visiteur, Utilisateur, Créateur, Bénéficiaire (porteur de cagnotte), Personne ressource, Organisation (ONG, association, entreprise), Modérateur, Agent de vérification, Agent financier, Support, Administrateur général (super admin).

## 3. Modules fonctionnels (tous obligatoires à la livraison finale)

### 3.1 Comptes et profils
- Inscription par téléphone (OTP), e-mail, Google, Apple, Facebook.
- Types de profil : personnel, créateur, association/ONG, entreprise, institution.
- Badges : identité vérifiée, organisation vérifiée, personne ressource, partenaire vérifié, certifiée.
- Confidentialité, blocage, désactivation et suppression du compte (droit à l'effacement avec conservation légale des pièces financières).

### 3.2 Vidéos
- Capture ou import, durée jusqu'à 3 minutes (configurable), montage simple (coupe, texte, musique libre de droits, filtres), sous-titres automatiques, miniature, brouillons.
- Visibilité : publique, abonnés, privée.
- Likes, commentaires, réponses, partages, signalements.
- Types de publication : simple, ou avec cagnotte/campagne.

### 3.3 Lives
- Live seul ou avec invités, chat, réactions, cadeaux, modération en direct, replay, live lié à une cagnotte avec don en direct.

### 3.4 Cagnottes et campagnes
- Objectif, devise, échéance, catégorie, justificatifs, mises à jour, remerciements, historique des dépenses, clôture, rapport final obligatoire pour les campagnes certifiées.
- Statuts : brouillon, en attente de signatures, en vérification, validée par la communauté, certifiée, active, terminée, suspendue, gelée, clôturée.

### 3.5 Signatures de soutien
- 100 signatures minimales, avec répartition cible : 40% proches, 30% personnes ressources, 30% communauté.
- Signature gratuite, liée à un téléphone vérifié (identité vérifiable pour les personnes ressources).

### 3.6 Certification "Certifiée Charityy"
- Formulaire complet, vérification documentaire et de cohérence par l'équipe interne, contact des personnes ressources, statuts : en cours, complément demandé, approuvée, rejetée.
- Tarif : 5% du montant de la campagne (voir hypothèses dans le document 00).

### 3.7 Fil et découverte
Priorités : (1) suivis, (2) certifiées de la zone, (3) urgences proches, (4) très engagées dans le pays, (5) intérêts, (6) créateurs suivis, (7) lives proches, (8) sponsorisées (toujours étiquetées).
Onglets : Pour toi, Suivis, Local, Urgences, Lives, Découvrir.

### 3.8 Géolocalisation
Pays et ville, géolocalisation optionnelle (consentement explicite), rayon (quartier, ville, région, pays, monde), carte des campagnes actives, alertes d'urgence à proximité.

### 3.9 Paiements, wallet, cadeaux, boosts
Voir document 06.

### 3.10 Monétisation créateur
2% sur activité éligible, tableau de bord, retraits via Moneroo.

### 3.11 Administration, modération, sécurité
Voir documents 05 et 11.

## 4. Écrans
Accueil (fil plein écran), création, cagnotte, live, profil, portefeuille, notifications, recherche, carte, paramètres, centre d'aide, espace certification, back-office (admin).

## 5. Exigences non fonctionnelles
- Mobile-first, installable (PWA), fonctionne sur réseaux lents (important pour l'Afrique) : vidéo adaptative, images optimisées, mode économie de données, pages critiques utilisables hors ligne partiel.
- Objectifs de performance : LCP inférieur à 2,5 s sur 4G, interactions inférieures à 200 ms, score Lighthouse mobile supérieur à 85.
- Accessibilité : WCAG 2.2 AA (sous-titres, contrastes, navigation clavier, lecteurs d'écran).
- Disponibilité visée : 99,9% ; sauvegardes quotidiennes de la base avec test de restauration.
- Internationalisation complète (voir document 10).
