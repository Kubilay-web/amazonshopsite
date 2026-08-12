import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { cloudinaryConfigured, uploadBuffer, destroyImage } from "@/lib/cloudinary";
import { fail, handleError, ok } from "@/lib/api";

export const runtime = "nodejs";
const MAX_SIZE = 8 * 1024 * 1024; // 8 MB
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];

/** Çoklu görsel yükleme (Cloudinary). Sadece yöneticiler. */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    if (!cloudinaryConfigured) {
      return fail(
        "Cloudinary yapılandırılmamış. .env dosyasına CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY ve CLOUDINARY_API_SECRET ekleyin (veya görsel URL'si yapıştırın).",
        503,
      );
    }

    const form = await request.formData();
    const files = form.getAll("files").filter((f): f is File => f instanceof File);
    const folder = (form.get("folder") as string) || "amazon-clone";

    if (files.length === 0) return fail("Dosya seçilmedi", 400);
    if (files.length > 10) return fail("En fazla 10 dosya yükleyebilirsiniz", 400);

    for (const file of files) {
      if (!ALLOWED.includes(file.type)) return fail(`Desteklenmeyen dosya tipi: ${file.type}`, 415);
      if (file.size > MAX_SIZE) return fail(`${file.name} 8 MB sınırını aşıyor`, 413);
    }

    const uploaded = await Promise.all(
      files.map(async (file) => {
        const buffer = Buffer.from(await file.arrayBuffer());
        return uploadBuffer(buffer, folder);
      }),
    );

    return ok({ images: uploaded }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}

/** Cloudinary'den görsel siler. */
export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin();
    const publicId = request.nextUrl.searchParams.get("publicId");
    if (!publicId) return fail("publicId gerekli", 400);
    await destroyImage(publicId);
    return ok({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
