/**
 * Stripe webhook takma adı.
 * Asıl uç `/api/webhooks/stripe`; bazı Stripe panellerinde endpoint `/api/webhook`
 * olarak kayıtlı olabildiği için aynı işleyici bu yoldan da servis ediliyor.
 */
export { POST } from "@/app/api/webhooks/stripe/route";

export const runtime = "nodejs";
