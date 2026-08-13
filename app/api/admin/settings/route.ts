import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getSettings, saveSettings } from "@/lib/settings";
import { settingsSchema } from "@/lib/validators";
import { logAudit } from "@/lib/audit";
import { handleError, ok } from "@/lib/api";

export async function GET() {
  try {
    await requireAdmin();
    return ok({ settings: await getSettings() });
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const data = settingsSchema.parse(await request.json());

    const settings = await saveSettings({
      ...data,
      siteDescription: data.siteDescription || "",
      supportEmail: data.supportEmail || "",
      supportPhone: data.supportPhone || "",
      contactAddress: data.contactAddress || "",
      announcement: data.announcement || "",
      announcementLink: data.announcementLink || "/",
      maintenanceMessage: data.maintenanceMessage || "",
      facebook: data.facebook || "",
      instagram: data.instagram || "",
      twitter: data.twitter || "",
      youtube: data.youtube || "",
    });

    await logAudit({
      user: admin,
      action: "SETTINGS",
      entity: "setting",
      summary: `Site ayarları güncellendi${settings.maintenanceMode ? " (bakım modu açık)" : ""}`,
    });

    return ok({ settings });
  } catch (error) {
    return handleError(error);
  }
}
