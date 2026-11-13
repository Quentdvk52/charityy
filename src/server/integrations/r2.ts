import crypto from "crypto";
import { PLATFORM_DEFAULTS } from "../../lib/constants";

export interface PresignedUrlResult {
  url: string;
  key: string;
  expiresInSeconds: number;
}

/**
 * Gestionnaire de stockage Cloudflare R2 (compatible S3) pour pièces KYC et justificatifs de cagnottes.
 */
export class R2StorageClient {
  private privateBucket: string;
  private publicBucket: string;

  constructor() {
    this.privateBucket = process.env.R2_BUCKET_PRIVATE || "charityy-evidence-private";
    this.publicBucket = process.env.R2_BUCKET_PUBLIC || "charityy-media-public";
  }

  /**
   * Génère une clé de stockage unique et non devinable (cuid / uuid).
   */
  generateKey(prefix: string, extension: string): string {
    const randomHex = crypto.randomBytes(16).toString("hex");
    return `${prefix}/${Date.now()}_${randomHex}.${extension}`;
  }

  /**
   * Génère une URL signée éphémère (60 secondes) pour la consultation d'un justificatif ou d'une pièce KYC privée.
   */
  generatePresignedDownloadUrl(options: {
    key: string;
    isPrivate?: boolean;
    expiresInSeconds?: number;
  }): PresignedUrlResult {
    const expiresIn = options.expiresInSeconds || PLATFORM_DEFAULTS.PRIVATE_URL_EXPIRATION_SEC;
    const expiresAt = Math.floor(Date.now() / 1000) + expiresIn;
    const signature = crypto
      .createHmac("sha256", process.env.DATA_ENCRYPTION_KEY || "fallback_salt")
      .update(`${this.privateBucket}:${options.key}:${expiresAt}`)
      .digest("hex");

    const presignedUrl = `https://storage.charityy.internal/${this.privateBucket}/${options.key}?exp=${expiresAt}&sig=${signature}`;

    return {
      url: presignedUrl,
      key: options.key,
      expiresInSeconds: expiresIn,
    };
  }

  /**
   * Génère une URL signée éphémère (60 secondes) pour la consultation d'un justificatif ou d'une pièce KYC privée (version asynchrone).
   */
  async getPresignedReadUrl(
    storageKey: string,
    expiresIn = PLATFORM_DEFAULTS.PRIVATE_URL_EXPIRATION_SEC
  ): Promise<PresignedUrlResult> {
    const expiresAt = Math.floor(Date.now() / 1000) + expiresIn;
    const signature = crypto
      .createHmac("sha256", process.env.DATA_ENCRYPTION_KEY || "fallback_salt")
      .update(`${this.privateBucket}:${storageKey}:${expiresAt}`)
      .digest("hex");

    const presignedUrl = `https://storage.charityy.internal/${this.privateBucket}/${storageKey}?exp=${expiresAt}&sig=${signature}`;

    return {
      url: presignedUrl,
      key: storageKey,
      expiresInSeconds: expiresIn,
    };
  }

  /**
   * Génère une URL de téléversement direct pour le client vers le bucket privé.
   */
  async getPresignedUploadUrl(
    prefix: "kyc" | "campaign_evidence",
    extension: string,
    contentType: string
  ): Promise<PresignedUrlResult> {
    const key = this.generateKey(prefix, extension);
    const expiresIn = 300; // 5 minutes pour téléverser

    const uploadUrl = `https://upload.charityy.internal/${this.privateBucket}/${key}?type=${encodeURIComponent(
      contentType
    )}`;

    return {
      url: uploadUrl,
      key,
      expiresInSeconds: expiresIn,
    };
  }
}

export const r2 = new R2StorageClient();
