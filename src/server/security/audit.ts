import { hashWithPepper } from "../../lib/crypto";

export interface LogAuditParams {
  actorId?: string | null;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  clientIp?: string | null;
  meta?: Record<string, unknown>;
}

export interface AuditRecord extends LogAuditParams {
  id: string;
  ipHash?: string | null;
  createdAt: Date;
}

// Tampon en mémoire pour les logs d'audit locaux
const memoryAuditLogs: AuditRecord[] = [];

/**
 * Enregistre un événement dans le journal d'audit append-only de la plateforme.
 * Les adresses IP sont systématiquement hachées avec le poivre secret.
 */
export function logAudit(params: LogAuditParams): AuditRecord {
  const ipHash = params.clientIp ? hashWithPepper(params.clientIp) : null;

  const record: AuditRecord = {
    id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    actorId: params.actorId || null,
    action: params.action,
    targetType: params.targetType || null,
    targetId: params.targetId || null,
    ipHash,
    meta: params.meta || {},
    createdAt: new Date(),
  };

  memoryAuditLogs.push(record);
  return record;
}

export const recordAuditLog = logAudit;

/**
 * Récupère les entrées du journal d'audit pour la consultation dans le back-office.
 */
export function getAuditLogs(filter?: {
  actorId?: string;
  targetType?: string;
  targetId?: string;
  limit?: number;
}): AuditRecord[] {
  let logs = [...memoryAuditLogs];

  if (filter?.actorId) {
    logs = logs.filter((l) => l.actorId === filter.actorId);
  }
  if (filter?.targetType) {
    logs = logs.filter((l) => l.targetType === filter.targetType);
  }
  if (filter?.targetId) {
    logs = logs.filter((l) => l.targetId === filter.targetId);
  }

  logs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return logs.slice(0, filter?.limit || 100);
}
