"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      if (isRegisterMode) {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: identifier.toLowerCase().replace(/[^a-z0-9_]/g, ""),
            displayName: displayName || identifier,
            password,
            email: identifier.includes("@") ? identifier : null,
            phone: !identifier.includes("@") ? identifier : null,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          setErrorMessage(data.error || "Erreur lors de l'inscription.");
          setLoading(false);
          return;
        }

        setSuccessMessage("Compte créé avec succès ! Connexion en cours...");
        // Auto-login
        const loginRes = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier, password }),
        });

        if (loginRes.ok) {
          setTimeout(() => {
            router.push("/");
            router.refresh();
          }, 800);
        } else {
          setIsRegisterMode(false);
          setLoading(false);
        }
      } else {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier, password }),
        });

        const data = await res.json();
        if (!res.ok) {
          setErrorMessage(data.error || "Identifiant ou mot de passe incorrect.");
          setLoading(false);
          return;
        }

        setSuccessMessage(`Bienvenue, ${data.user.displayName} ! Redirection...`);
        setTimeout(() => {
          router.push("/");
          router.refresh();
        }, 600);
      }
    } catch {
      setErrorMessage("Une erreur réseau est survenue. Veuillez réessayer.");
      setLoading(false);
    }
  };

  const handleQuickLogin = async (loginId: string, loginPass: string) => {
    setIdentifier(loginId);
    setPassword(loginPass);
    setIsRegisterMode(false);
    setErrorMessage(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: loginId, password: loginPass }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMessage(`Connecté en tant que ${data.user.displayName}`);
        setTimeout(() => {
          router.push("/");
          router.refresh();
        }, 500);
      } else {
        setErrorMessage(data.error || "Erreur lors de la connexion.");
        setLoading(false);
      }
    } catch {
      setErrorMessage("Erreur de connexion.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface rounded-2xl border border-surface-border p-6 sm:p-8 space-y-6 shadow-sm">
        {/* En-tête */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-block">
            <span className="font-extrabold text-2xl tracking-tight text-foreground">CHARITYY</span>
          </Link>
          <h1 className="text-lg font-bold text-foreground">
            {isRegisterMode ? "Créer un compte solidaire" : "Connexion à votre espace"}
          </h1>
          <p className="text-xs text-neutral-500">
            {isRegisterMode
              ? "Rejoignez la communauté pour soutenir, signer et suivre des causes vérifiées."
              : "Accédez à votre portefeuille solidaire, vos cagnottes et vos signatures citoyennes."}
          </p>
        </div>

        {/* Messages d'alerte */}
        {errorMessage && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-600 font-medium">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs text-emerald-600 font-medium">
            {successMessage}
          </div>
        )}

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegisterMode && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-600 block">Nom complet ou pseudonyme</label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Ex: Awa Traoré"
                className="w-full bg-background border border-surface-border rounded-lg px-3.5 py-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
              />
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-semibold text-neutral-600 block">
              Email ou Numéro de téléphone
            </label>
            <input
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Ex: donateur@charityy.org ou +225 01020304"
              className="w-full bg-background border border-surface-border rounded-lg px-3.5 py-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-neutral-600">Mot de passe</label>
              {!isRegisterMode && (
                <span className="text-[11px] text-neutral-400 hover:text-foreground cursor-pointer">
                  Mot de passe oublié ?
                </span>
              )}
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-background border border-surface-border rounded-lg px-3.5 py-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-foreground text-background py-3 rounded-lg font-semibold text-xs hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? "Chargement..." : isRegisterMode ? "Créer mon compte" : "Se connecter"}
          </button>
        </form>

        {/* Bascule Connexion / Inscription */}
        <div className="text-center pt-2 border-t border-surface-border">
          <button
            type="button"
            onClick={() => {
              setIsRegisterMode(!isRegisterMode);
              setErrorMessage(null);
            }}
            className="text-xs text-neutral-600 hover:text-foreground font-medium underline"
          >
            {isRegisterMode
              ? "Vous avez déjà un compte ? Se connecter"
              : "Nouveau sur Charityy ? Créer un compte citoyen"}
          </button>
        </div>

        {/* Section Démonstration & Comptes de Test (1 clic) */}
        <div className="pt-4 border-t border-surface-border space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              Comptes de test (Accès 1 clic)
            </span>
            <span className="h-px bg-surface-border flex-1" />
          </div>
          <p className="text-[11px] text-neutral-500">
            Cliquez sur un profil pour tester l&apos;application avec les différents rôles :
          </p>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin("donateur@charityy.org", "Donateur2026!")}
              className="p-2.5 text-left border border-surface-border rounded-lg bg-surface-muted hover:border-foreground/40 transition"
            >
              <div className="text-xs font-bold text-foreground">👤 Citoyenne Donatrice</div>
              <div className="text-[10px] text-neutral-500">Awa Traoré • Rôle USER</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin("diallo@hospital.ci", "DialloCharityy2026!")}
              className="p-2.5 text-left border border-surface-border rounded-lg bg-surface-muted hover:border-foreground/40 transition"
            >
              <div className="text-xs font-bold text-foreground">🩺 Médecin Porteur</div>
              <div className="text-[10px] text-neutral-500">Dr. Diallo • Rôle CREATOR</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin("conformite@charityy.org", "VerifierCharityy2026!")}
              className="p-2.5 text-left border border-surface-border rounded-lg bg-surface-muted hover:border-foreground/40 transition"
            >
              <div className="text-xs font-bold text-foreground">🛡️ Conformité KYC</div>
              <div className="text-[10px] text-neutral-500">Agent KYC • Rôle VERIFIER</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin("admin@charityy.org", "AdminCharityy2026!")}
              className="p-2.5 text-left border border-surface-border rounded-lg bg-surface-muted hover:border-foreground/40 transition"
            >
              <div className="text-xs font-bold text-foreground">🏛️ Super Administrateur</div>
              <div className="text-[10px] text-neutral-500">Admin Finance • Rôle ADMIN</div>
            </button>
          </div>
        </div>

        {/* Retour au fil */}
        <div className="text-center pt-2">
          <Link href="/" className="text-xs text-neutral-400 hover:text-foreground">
            ← Retourner au fil vidéo sans se connecter
          </Link>
        </div>
      </div>
    </div>
  );
}
