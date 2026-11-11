import crypto from "crypto";
import { verifyHmacSignature } from "../../lib/crypto.ts";

export interface StreamUploadResponse {
  uploadURL: string;
  uid: string;
}

/**
 * Service d'intégration Cloudflare Stream (vidéo courte, HLS adaptatif).
 */
export class StreamClient {
  private accountId: string;
  private apiToken: string;
  private webhookSecret: string;

  constructor() {
    this.accountId = process.env.CLOUDFLARE_ACCOUNT_ID || "mock_account_id";
    this.apiToken = process.env.STREAM_API_TOKEN || "mock_stream_token";
    this.webhookSecret = process.env.STREAM_WEBHOOK_SECRET || "mock_stream_webhook_secret";
  }

  /**
   * Crée une URL de téléversement direct éphémère (Direct Creator Upload).
   */
  async createDirectUploadUrl(maxDurationSeconds = 180): Promise<StreamUploadResponse> {
    if (this.apiToken.startsWith("mock_")) {
      const mockUid = `stream_${crypto.randomBytes(8).toString("hex")}`;
      return {
        uploadURL: `https://upload.videodelivery.net/mock_direct_upload/${mockUid}`,
        uid: mockUid,
      };
    }

    const url = `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/stream/direct_upload`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        maxDurationSeconds,
        requireSignedURLs: true,
      }),
    });

    if (!response.ok) {
      throw new Error("Impossible de générer l'URL de téléversement vidéo");
    }

    const data = await response.json();
    return {
      uploadURL: data.result.uploadURL,
      uid: data.result.uid,
    };
  }

  /**
   * Vérifie la signature du webhook Cloudflare Stream.
   */
  verifyWebhook(rawBody: string | Buffer, signatureHeader: string): boolean {
    return verifyHmacSignature(rawBody, signatureHeader, this.webhookSecret);
  }
}

export const stream = new StreamClient();
