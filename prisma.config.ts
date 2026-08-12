import path from "node:path";
import { defineConfig } from "prisma/config";

// prisma.config.ts varken Prisma CLI .env dosyasını kendisi yüklemez,
// bu yüzden schema içindeki env("DATABASE_URL") için elle yüklüyoruz.
try {
  process.loadEnvFile(path.join(process.cwd(), ".env"));
} catch {
  // .env yoksa değişkenler zaten ortamdan geliyordur (CI / production)
}

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
});
