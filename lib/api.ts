import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { zodErrors } from "@/lib/validators";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function fail(message: string, status = 400, fields?: Record<string, string>) {
  return NextResponse.json({ message, fields }, { status });
}

/**
 * API route'ları için tek noktadan hata yakalama.
 * Zod hatalarını 422, yetki hatalarını 401/403 olarak çevirir.
 */
export function handleError(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      { message: "Girilen bilgiler geçersiz", fields: zodErrors(error) },
      { status: 422 },
    );
  }
  if (error instanceof Error) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Giriş yapmalısınız" }, { status: 401 });
    }
    if (error.message === "FORBIDDEN") {
      return NextResponse.json({ message: "Bu işlem için yetkiniz yok" }, { status: 403 });
    }
    if (error.message === "NOT_FOUND") {
      return NextResponse.json({ message: "Kayıt bulunamadı" }, { status: 404 });
    }
    console.error("[API]", error);
    return NextResponse.json({ message: error.message || "Sunucu hatası" }, { status: 500 });
  }
  console.error("[API]", error);
  return NextResponse.json({ message: "Beklenmeyen bir hata oluştu" }, { status: 500 });
}
