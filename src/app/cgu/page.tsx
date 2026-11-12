import React from "react";
import Link from "next/link";

export default function CGUPage() {
  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6 text-foreground bg-background min-h-screen">
      <Link href="/" className="text-xs text-neutral-500 hover:text-foreground">
        ← Retour à l'accueil
      </Link>
      <header className="border-b border-surface-border pb-4 space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Conditions Générales d'Utilisation</h1>
        <p className="text-xs text-neutral-500">Dernière mise à jour : 12 Novembre 2026</p>
      </header>

      <div className="space-y-4 text-xs leading-relaxed text-neutral-700 dark:text-neutral-300">
        <section className="space-y-1.5">
          <h2 className="text-sm font-semibold text-foreground">1. Présentation de la plateforme</h2>
          <p>
            Charityy est une plateforme numérique solidaire permettant la création, le partage vidéo et
            le soutien participatif à des cagnottes citoyennes et médicales d'urgence.
          </p>
        </section>

        <section className="space-y-1.5">
          <h2 className="text-sm font-semibold text-foreground">2. Portée des signatures citoyennes</h2>
          <p>
            L'apposition d'une signature sur une campagne constitue un témoignage civique de notoriété
            locale. Les signatures citoyennes ne constituent en aucun cas une garantie financière,
            médicale ou juridique délivrée par la plateforme.
          </p>
        </section>

        <section className="space-y-1.5">
          <h2 className="text-sm font-semibold text-foreground">3. Modalités des dons et flux financiers</h2>
          <p>
            Tous les règlements sont opérés via l'agrégateur agréé Moneroo. Charityy agit en qualité
            d'intermédiaire technique sans détention de fonds. Une commission de 3% sur le montant net
            est prélevée au profit du fonctionnement de l'infrastructure, complétée le cas échéant d'une
            part de 2% pour le créateur apporteur de cause.
          </p>
        </section>

        <section className="space-y-1.5">
          <h2 className="text-sm font-semibold text-foreground">4. Vérification d'identité (KYC) & Lutte anti-fraude</h2>
          <p>
            Tout créateur de campagne ou bénéficiaire de retrait est tenu de soumettre un document
            d'identité valide. En cas de suspicion d'escroquerie ou de fausse déclaration, la plateforme
            se réserve le droit de geler immédiatement la campagne et les fonds associés.
          </p>
        </section>
      </div>
    </div>
  );
}
