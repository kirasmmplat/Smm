import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export type AuditAction =
  | "LOGIN" | "LOGOUT" | "LOGIN_FAILED" | "PASSWORD_CHANGED" | "TWO_FACTOR_ENABLED" | "TWO_FACTOR_DISABLED"
  | "USER_CREATED" | "USER_UPDATED" | "USER_BANNED" | "USER_UNBANNED" | "BALANCE_ADJUSTED"
  | "ORDER_CREATED" | "ORDER_STATUS_CHANGED" | "ORDER_CANCELLED" | "ORDER_REFUNDED"
  | "TRANSACTION_CREATED" | "TRANSACTION_APPROVED" | "TRANSACTION_REJECTED"
  | "SERVICE_CREATED" | "SERVICE_UPDATED" | "SERVICE_DELETED"
  | "PROVIDER_CREATED" | "PROVIDER_UPDATED" | "PROVIDER_DELETED" | "PROVIDER_TESTED"
  | "TICKET_CREATED" | "TICKET_CLOSED" | "TICKET_REPLIED"
  | "SETTINGS_UPDATED" | "PLATFORM_UPDATED" | "PAYMENT_METHOD_UPDATED"
  | "API_KEY_GENERATED" | "API_KEY_REVOKED"
  | "ADMIN_ACTION";

export type AuditSeverity = "INFO" | "WARNING" | "ERROR" | "CRITICAL";

interface LogOptions {
  userId?: string;
  userEmail?: string;
  action: AuditAction | string;
  entity?: string;
  entityId?: string;
  details?: Record<string, unknown>;
  ip?: string;
  severity?: AuditSeverity;
}

export async function createAuditLog(opts: LogOptions): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: opts.userId ?? null,
        userEmail: opts.userEmail ?? null,
        action: opts.action,
        entity: opts.entity ?? null,
        entityId: opts.entityId ?? null,
        details: opts.details ? (opts.details as Prisma.InputJsonValue) : undefined,
        ip: opts.ip ?? null,
        severity: opts.severity ?? "INFO",
      },
    });
  } catch {
    // Never let audit log failure break the main flow
  }
}

export function getIpFromRequest(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return "unknown";
}
