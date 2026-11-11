---
description: Checklist finale avant toute mise en production
---

Cocher chaque point avec une preuve (lien, capture, résultat de commande). Tout point non cochable bloque la mise en production.

- [ ] /audit-securite exécuté sans constat ouvert de gravité haute ou critique
- [ ] Test d'intrusion externe réalisé et correctifs appliqués
- [ ] CI verte (lint, typecheck, tests, E2E, CodeQL, Lighthouse)
- [ ] Variables d'environnement de production renseignées par le porteur de projet, clés distinctes de celles de staging
- [ ] Migrations testées en staging, sauvegarde récente, restauration testée
- [ ] Réconciliation Moneroo/ledger sans écart sur staging
- [ ] Validation juridique obtenue (wallet, collecte de fonds, CGU, confidentialité) pour chaque pays ouvert
- [ ] KYC et vérification des listes de sanctions opérationnels
- [ ] Alertes, journaux, page de statut et runbooks en place
- [ ] Plan de retour arrière testé
- [ ] Ouverture progressive par drapeaux de fonctionnalités (bêta fermée d'abord)
- [ ] Domaine, DNS, Cloudflare, certificats et security.txt configurés
