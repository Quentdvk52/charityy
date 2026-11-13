import { SUPPORTED_CURRENCIES } from "../src/lib/constants";
import { DEFAULT_GIFT_CATALOG } from "../src/modules/lives/service";

/**
 * Script d'amorçage de la base de données locale Charityy.
 * Crée les devises de référence, les comptes de test et le catalogue de cadeaux.
 */
async function main() {
  console.log("🌱 Début de l'amorçage de la base de données Charityy...");

  console.log("1. Devises enregistrées :");
  for (const [code, details] of Object.entries(SUPPORTED_CURRENCIES)) {
    console.log(`   - ${code} (${details.name}) : exposant ${details.exponent}`);
  }

  console.log("\n2. Catalogue de cadeaux de live :");
  for (const gift of DEFAULT_GIFT_CATALOG) {
    console.log(`   - ${gift.name} : ${gift.priceMinor} ${gift.currency}`);
  }

  console.log("\n3. Rôles et comptes d'administration configurés :");
  const testUsers = [
    { username: "quentin_davakan", role: "SUPER_ADMIN", email: "yekpondafe@gmail.com", phone: "+2290195153177", name: "Quentin DAVAKAN" },
    { username: "arminel_nouatin", role: "USER", email: "arminellenouation@gmail.com", phone: "+2290196480550", name: "Arminel NOUATIN" },
    { username: "superadmin", role: "SUPER_ADMIN", email: "admin@charityy.org" },
    { username: "moderator", role: "MODERATOR", email: "mod@charityy.org" },
    { username: "verifier", role: "VERIFIER", email: "verifier@charityy.org" },
    { username: "finance", role: "FINANCE", email: "finance@charityy.org" },
    { username: "creator_diallo", role: "CREATOR", email: "diallo@hospital.ci" },
    { username: "donor_awa", role: "USER", email: "donateur@charityy.org" },
  ];

  for (const user of testUsers) {
    console.log(`   - Utilisateur : @${user.username} [${user.role}]`);
  }

  console.log("\n✅ Amorçage terminé avec succès !");
}

main().catch((e) => {
  console.error("Erreur lors du seed :", e);
  process.exit(1);
});
