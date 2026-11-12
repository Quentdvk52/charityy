import { AuthUser, hashPassword } from "./session";

export interface StoredUser extends AuthUser {
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

// Magasin en mémoire pour les utilisateurs et sessions
const memoryUsers = new Map<string, StoredUser>();
const memorySessions = new Map<string, { userId: string; expiresAt: Date; tokenHash: string }>();

// Initialisation d'utilisateurs par défaut pour les tests et la démo
function initDefaultUsers() {
  if (memoryUsers.size === 0) {
    const adminUser: StoredUser = {
      id: "usr_superadmin",
      username: "admin",
      displayName: "Administrateur Charityy",
      email: "admin@charityy.org",
      phone: "+2250102030405",
      roles: ["SUPER_ADMIN", "ADMIN"],
      kycStatus: "APPROVED",
      countryCode: "CI",
      city: "Abidjan",
      locale: "fr",
      passwordHash: hashPassword("AdminCharityy2026!"),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const verifierUser: StoredUser = {
      id: "usr_verifier",
      username: "verifier",
      displayName: "Équipe Conformité & KYC",
      email: "conformite@charityy.org",
      phone: "+2250708091011",
      roles: ["VERIFIER"],
      kycStatus: "APPROVED",
      countryCode: "CI",
      city: "Abidjan",
      locale: "fr",
      passwordHash: hashPassword("VerifierCharityy2026!"),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const creatorUser: StoredUser = {
      id: "usr_diallo",
      username: "dr_diallo",
      displayName: "Dr. Mamadou Diallo",
      email: "diallo@hospital.ci",
      phone: "+2250506070809",
      roles: ["CREATOR", "USER"],
      kycStatus: "APPROVED",
      countryCode: "CI",
      city: "Abidjan",
      locale: "fr",
      passwordHash: hashPassword("DialloCharityy2026!"),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    memoryUsers.set(adminUser.id, adminUser);
    memoryUsers.set(verifierUser.id, verifierUser);
    memoryUsers.set(creatorUser.id, creatorUser);
  }
}

initDefaultUsers();

export function findUserById(id: string): StoredUser | undefined {
  return memoryUsers.get(id);
}

export function findUserByIdentifier(identifier: string): StoredUser | undefined {
  const norm = identifier.trim().toLowerCase();
  for (const user of memoryUsers.values()) {
    if (
      user.username.toLowerCase() === norm ||
      (user.email && user.email.toLowerCase() === norm) ||
      (user.phone && user.phone === identifier.trim())
    ) {
      return user;
    }
  }
  return undefined;
}

export function createUser(data: {
  username: string;
  displayName: string;
  password: string;
  email?: string | null;
  phone?: string | null;
  countryCode?: string | null;
  city?: string | null;
  locale?: string;
}): StoredUser {
  const id = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const user: StoredUser = {
    id,
    username: data.username.trim(),
    displayName: data.displayName.trim(),
    email: data.email?.trim().toLowerCase() || null,
    phone: data.phone?.trim() || null,
    roles: ["USER"],
    kycStatus: "NONE",
    countryCode: data.countryCode || "CI",
    city: data.city || "Abidjan",
    locale: data.locale || "fr",
    passwordHash: hashPassword(data.password),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  memoryUsers.set(id, user);
  return user;
}

export function saveSession(tokenHash: string, userId: string, expiresAt: Date) {
  memorySessions.set(tokenHash, { userId, expiresAt, tokenHash });
}

export function findSession(tokenHash: string) {
  const session = memorySessions.get(tokenHash);
  if (!session) return undefined;
  if (new Date() > session.expiresAt) {
    memorySessions.delete(tokenHash);
    return undefined;
  }
  return session;
}

export function deleteSession(tokenHash: string) {
  memorySessions.delete(tokenHash);
}
