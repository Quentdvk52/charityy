export interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
}

interface RateLimitEntry {
  timestamps: number[];
}

const rateLimitStore = new Map<string, RateLimitEntry>();

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetMs: number;
}

/**
 * Limiteur de débit à fenêtre glissante (Sliding Window).
 * Protège les routes sensibles (connexion, OTP, dons, signatures) contre les attaques par force brute.
 */
export function checkRateLimit(
  key: string,
  options: RateLimitOptions = { windowMs: 60_000, maxRequests: 30 }
): RateLimitResult {
  const now = Date.now();
  const windowStart = now - options.windowMs;

  let entry = rateLimitStore.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    rateLimitStore.set(key, entry);
  }

  // Nettoyage des requêtes antérieures à la fenêtre
  entry.timestamps = entry.timestamps.filter((ts) => ts > windowStart);

  if (entry.timestamps.length >= options.maxRequests) {
    const oldest = entry.timestamps[0] || now;
    const resetMs = Math.max(0, oldest + options.windowMs - now);
    return {
      success: false,
      remaining: 0,
      resetMs,
    };
  }

  entry.timestamps.push(now);
  return {
    success: true,
    remaining: options.maxRequests - entry.timestamps.length,
    resetMs: options.windowMs,
  };
}
