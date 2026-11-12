import React from "react";
import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6 text-foreground bg-background min-h-screen">
      <Link href="/" className="text-xs text-neutral-500 hover:text-foreground">
        ← Retour à l'accueil
      </Link>
      <header className="border-b border-surface-border pb-4 space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Politique de Confidentialité</h1>
        <p className="text-xs text-neutral-500">Conformité RGPD & Normes de protection des données 2026</p>
      </header>

      <div className="space-y-4 text-xs leading-relaxed text-neutral-700 dark:text-neutral-300">
        <section className="space-y-1.5">
          <h2 className="text-sm font-semibold text-foreground">1. Collecte et minimisation des données</h2>
          <p>
            Charityy applique le principe strict de minimisation. Seules les données indispensables à la
            gestion des comptes, à la traçabilité des dons et à la conformité KYC sont collectées.
          </p>
        </section>

        <section className="space-y-1.5">
          <h2 className="text-sm font-semibold text-foreground">2. Sécurité des pièces d'identité et dossiers médicaux</h2>
          <p>
            Les numéros de pièces d'identité sont chiffrés au repos via l'algorithme symétrique AES-256-GCM.
            Les copies numériques de justificatifs sont hermétiquement isolées dans un stockage Cloudflare
            R2 privé, accessibles uniquement pour les équipes habilitées via des URLs éphémères de 60
            secondes sous contrôle de journalisation d'audit immuable.
          </p>
        </section>

        <section className="space-y-1.5">
          <h2 className="text-sm font-semibold text-foreground">3. Floutage des coordonnées géographiques</h2>
          <p>
            Pour garantir l'intimité et la sécurité physique des personnes vulnérables, les coordonnées
            géographiques des urgences affichées sur les cartes interactives sont systématiquement
            floutées par décalage aléatoire.
          </p>
        </section>

        <section className="space-y-1.5">
          <h2 className="text-sm font-semibold text-foreground">4. Exercice de vos droits</h2>
          <p>
            Conformément à la réglementation, vous disposez d'un droit d'accès, de rectification et
            d'effacement de vos données personnelles via notre délégué à la protection des données :
            <span className="font-mono ml-1 text-foreground">dpo@charityy.org</span>.
          </p>
        </section>
      </div>
    </div>
  );
}
