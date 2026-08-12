import "server-only";
import { v2 as cloudinary } from "cloudinary";

export const cloudinaryConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET,
);

if (cloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export type UploadResult = {
  url: string;
  publicId: string;
  width: number;
  height: number;
};

/** Buffer'ı doğrudan Cloudinary'ye yükler (upload_stream). */
export function uploadBuffer(
  buffer: Buffer,
  folder = "amazon-clone",
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        transformation: [{ quality: "auto", fetch_format: "auto" }],
      },
      (error, result) => {
        if (error || !result) return reject(error ?? new Error("Yükleme başarısız"));
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
        });
      },
    );
    stream.end(buffer);
  });
}

export async function destroyImage(publicId: string) {
  if (!cloudinaryConfigured) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch {
    // Silme hatası akışı bozmasın
  }
}

export default cloudinary;
