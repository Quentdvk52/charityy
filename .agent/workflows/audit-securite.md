---
description: Audit de sécurité complet du dépôt avant fusion ou mise en production
---

1. Lancer gitleaks sur tout l'historique ; toute découverte = incident (rotation immédiate).
2. Lancer pnpm audit et OSV-Scanner ; aucune vulnérabilité haute ou critique restante.
3. Parcourir tous les Route Handlers, Server Actions et jobs : authentification, autorisation, propriété de la ressource, validation zod, rate limit, DTO de sortie. Produire un tableau endpoint par endpoint.
4. Vérifier les flux d'argent : idempotence, signature des webhooks, re-vérification API, ledger équilibré, triggers d'immuabilité, absence d'écriture de solde hors ledger.
5. Vérifier les stockages : buckets privés, URL signées courtes, chiffrement des champs sensibles, journal d'accès.
6. Vérifier les en-têtes (CSP sans unsafe-inline/unsafe-eval, HSTS, etc.), cookies, CSRF, CORS.
7. Exécuter les tests d'accès (IDOR, escalade de rôle), de rejeu de webhooks, d'injection, de téléversement piégé.
8. Vérifier les journaux : aucun secret ni donnée sensible.
9. Produire docs/audits/AAAA-MM-JJ.md avec constats classés par gravité, correctifs appliqués et risques résiduels. Ne rien minimiser.
