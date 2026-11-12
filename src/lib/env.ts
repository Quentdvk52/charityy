import { z } from "zod";

export interface Env {
  NODE_ENV: "development" | "test" | "production";
  APP_URL: string;
  DEFAULT_LOCALE: string;
  DEFAULT_CURRENCY: string;
  DATABASE_URL: string;
  DIRECT_URL?: string;
  AUTH_SECRET: string;
  DATA_ENCRYPTION_KEY: string;
  DATA_ENCRYPTION_KEY_ID: string;
  HASH_PEPPER: string;
  MONEROO_SECRET_KEY: string;
  MONEROO_WEBHOOK_SECRET: string;
  MONEROO_API_BASE: string;
  CRON_SECRET: string;
}

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_URL: z.string().url().default("http://localhost:3000"),
  DEFAULT_LOCALE: z.string().default("fr"),
  DEFAULT_CURRENCY: z.string().length(3).default("XOF"),
  DATABASE_URL: z.string().default("postgresql://localhost:5432/charityy"),
  DIRECT_URL: z.string().optional(),
  AUTH_SECRET: z.string().min(16).default("dev_local_secret_key_minimum_32_characters_long"),
  DATA_ENCRYPTION_KEY: z.string().default("MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTIzNDU2Nzg5MDE="),
  DATA_ENCRYPTION_KEY_ID: z.string().default("v1"),
  HASH_PEPPER: z.string().default("local_dev_pepper_random_value"),
  MONEROO_SECRET_KEY: z.string().default("test_moneroo_sk_mock"),
  MONEROO_WEBHOOK_SECRET: z.string().default("test_moneroo_webhook_mock"),
  MONEROO_API_BASE: z.string().url().default("https://api.moneroo.io/v1"),
  CRON_SECRET: z.string().default("dev_cron_secret"),
});

let parsedEnv: Env;

try {
  parsedEnv = envSchema.parse(process.env);
} catch {
  // Repli sécurisé pour environnement local / tests sans variables
  parsedEnv = {
    NODE_ENV: (process.env.NODE_ENV as any) || "development",
    APP_URL: process.env.APP_URL || "http://localhost:3000",
    DEFAULT_LOCALE: process.env.DEFAULT_LOCALE || "fr",
    DEFAULT_CURRENCY: process.env.DEFAULT_CURRENCY || "XOF",
    DATABASE_URL: process.env.DATABASE_URL || "postgresql://localhost:5432/charityy",
    DIRECT_URL: process.env.DIRECT_URL,
    AUTH_SECRET: process.env.AUTH_SECRET || "dev_local_secret_key_minimum_32_characters_long",
    DATA_ENCRYPTION_KEY:
      process.env.DATA_ENCRYPTION_KEY || "MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTIzNDU2Nzg5MDE=",
    DATA_ENCRYPTION_KEY_ID: process.env.DATA_ENCRYPTION_KEY_ID || "v1",
    HASH_PEPPER: process.env.HASH_PEPPER || "local_dev_pepper_random_value",
    MONEROO_SECRET_KEY: process.env.MONEROO_SECRET_KEY || "test_moneroo_sk_mock",
    MONEROO_WEBHOOK_SECRET: process.env.MONEROO_WEBHOOK_SECRET || "test_moneroo_webhook_mock",
    MONEROO_API_BASE: process.env.MONEROO_API_BASE || "https://api.moneroo.io/v1",
    CRON_SECRET: process.env.CRON_SECRET || "dev_cron_secret",
  };
}

export const env = parsedEnv;
