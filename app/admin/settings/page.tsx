import { getSettings } from "@/lib/settings";
import { SettingsForm } from "@/components/admin/settings-form";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const settings = await getSettings();

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Ayarlar</h1>
        <p className="text-sm text-zinc-600">
          Mağazanın tamamını buradan yönetin. Değişiklikler kaydedildiği anda yürürlüğe girer.
        </p>
      </div>

      <SettingsForm initial={settings} />
    </div>
  );
}
