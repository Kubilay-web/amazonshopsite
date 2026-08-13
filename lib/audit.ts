import "server-only";
import prisma from "@/lib/prisma";
import type { SessionUser } from "@/lib/auth";

export type AuditAction = "CREATE" | "UPDATE" | "DELETE" | "BULK" | "LOGIN" | "SETTINGS";

export type AuditEntity =
  | "product"
  | "category"
  | "subcategory"
  | "order"
  | "user"
  | "review"
  | "coupon"
  | "banner"
  | "setting"
  | "inventory";

/**
 * Yönetici işlemlerini kaydeder. Denetim kaydı asıl işlemi bloke etmemeli;
 * bu yüzden hatalar yutulur ve yalnızca sunucu günlüğüne düşer.
 */
export async function logAudit(entry: {
  user: Pick<SessionUser, "id" | "name" | "email"> | null;
  action: AuditAction;
  entity: AuditEntity;
  entityId?: string | null;
  summary: string;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: entry.user?.id ?? null,
        userName: entry.user?.name ?? "sistem",
        userEmail: entry.user?.email ?? "",
        action: entry.action,
        entity: entry.entity,
        entityId: entry.entityId ?? null,
        summary: entry.summary.slice(0, 500),
      },
    });
  } catch (error) {
    console.error("[audit]", error);
  }
}
