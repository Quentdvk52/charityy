import { env } from "../../lib/env";
import { verifyHmacSignature } from "../../lib/crypto";

export interface MonerooCustomer {
  email?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
}

export interface MonerooInitPaymentParams {
  amount: number;
  currency: string;
  description: string;
  customer?: MonerooCustomer;
  return_url: string;
  metadata?: Record<string, unknown>;
}

export interface MonerooPaymentResponse {
  id: string;
  checkout_url: string;
  status: "pending" | "success" | "failed" | "cancelled";
  amount: number;
  currency: string;
  fee?: number;
}

export interface MonerooPayoutParams {
  amount: number;
  currency: string;
  method: string; // e.g. "mobile_money", "bank_transfer"
  destination: string;
  description: string;
  recipient: MonerooCustomer;
}

/**
 * Client d'intégration officiel Moneroo côté serveur.
 */
export class MonerooClient {
  private secretKey: string;
  private apiBase: string;

  constructor() {
    this.secretKey = env.MONEROO_SECRET_KEY;
    this.apiBase = env.MONEROO_API_BASE;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.apiBase}${endpoint}`;
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.secretKey}`,
      ...options.headers,
    };

    // Mode simulation locale / test si clé de test
    if (this.secretKey.startsWith("test_")) {
      return this.mockResponse<T>(endpoint, options);
    }

    const response = await fetch(url, { ...options, headers });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erreur API Moneroo (${response.status}): ${errorText}`);
    }

    return response.json() as Promise<T>;
  }

  /**
   * Initialise un paiement de collecte ou de recharge wallet.
   */
  async initializePayment(params: MonerooInitPaymentParams): Promise<MonerooPaymentResponse> {
    return this.request<MonerooPaymentResponse>("/payments/initialize", {
      method: "POST",
      body: JSON.stringify(params),
    });
  }

  /**
   * Vérifie le statut réel et le montant d'un paiement auprès de l'API Moneroo.
   */
  async verifyPayment(paymentId: string): Promise<MonerooPaymentResponse> {
    return this.request<MonerooPaymentResponse>(`/payments/${paymentId}/verify`, {
      method: "GET",
    });
  }

  /**
   * Initialise une demande de reversement (payout).
   */
  async initializePayout(params: MonerooPayoutParams): Promise<{ id: string; status: string }> {
    return this.request<{ id: string; status: string }>("/payouts/initialize", {
      method: "POST",
      body: JSON.stringify(params),
    });
  }

  /**
   * Vérifie la signature HMAC-SHA256 d'un webhook Moneroo entrant.
   */
  verifyWebhook(rawBody: string | Buffer, signatureHeader: string): boolean {
    return verifyHmacSignature(rawBody, signatureHeader, env.MONEROO_WEBHOOK_SECRET);
  }

  /**
   * Mock pour le développement local et les tests automatisés sans accès internet.
   */
  private mockResponse<T>(endpoint: string, options: RequestInit): T {
    if (endpoint.includes("/payments/initialize")) {
      const body = options.body ? JSON.parse(options.body as string) : {};
      return {
        id: `mon_pay_${Date.now()}`,
        checkout_url: `https://checkout.moneroo.io/pay/mock_${Date.now()}`,
        status: "pending",
        amount: body.amount || 1000,
        currency: body.currency || "XOF",
        fee: Math.round((body.amount || 1000) * 0.03),
      } as T;
    }

    if (endpoint.includes("/verify")) {
      return {
        id: "mock_verified_payment_id",
        status: "success",
        amount: 10000,
        currency: "XOF",
        fee: 300,
      } as T;
    }

    if (endpoint.includes("/payouts")) {
      return {
        id: `mon_payout_${Date.now()}`,
        status: "processing",
      } as T;
    }

    return {} as T;
  }
}

export const moneroo = new MonerooClient();
