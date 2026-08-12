"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Star, Trash2 } from "lucide-react";
import { Rating } from "@/components/ui/rating";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/components/providers/auth-provider";
import { useToast } from "@/components/providers/toast-provider";
import { cn, formatDate } from "@/lib/utils";

export type ReviewItem = {
  id: string;
  rating: number;
  title: string | null;
  comment: string;
  createdAt: string | Date;
  user: { id: string; name: string; image: string | null };
};

export function Reviews({
  productId,
  reviews: initial,
  rating,
  numReviews,
}: {
  productId: string;
  reviews: ReviewItem[];
  rating: number;
  numReviews: number;
}) {
  const user = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [reviews, setReviews] = useState<ReviewItem[]>(initial);
  const [score, setScore] = useState(5);
  const [hover, setHover] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);

  const mine = user ? reviews.find((r) => r.user.id === user.id) : null;

  // Puan dağılımı (5 → 1)
  const distribution = [5, 4, 3, 2, 1].map((star) => {
    const count = reviews.filter((r) => r.rating === star).length;
    return { star, count, percent: reviews.length ? (count / reviews.length) * 100 : 0 };
  });

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, rating: score, title, comment }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Yorum kaydedilemedi");

      setReviews((prev) => [
        data.review,
        ...prev.filter((r) => r.user.id !== data.review.user.id),
      ]);
      setTitle("");
      setComment("");
      toast("Yorumunuz yayınlandı");
      router.refresh();
    } catch (error) {
      toast(error instanceof Error ? error.message : "Bir hata oluştu", "error");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    const res = await fetch(`/api/reviews?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      setReviews((prev) => prev.filter((r) => r.id !== id));
      toast("Yorum silindi");
      router.refresh();
    } else {
      toast("Yorum silinemedi", "error");
    }
  }

  return (
    <section className="grid gap-6 lg:grid-cols-3">
      {/* Özet */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-zinc-900">Müşteri değerlendirmeleri</h2>
        <div className="flex items-center gap-2">
          <Rating value={rating} size="lg" showCount={false} />
          <span className="text-sm text-zinc-700">{rating.toFixed(1)} / 5</span>
        </div>
        <p className="text-sm text-zinc-600">{numReviews} değerlendirme</p>

        <div className="space-y-1.5">
          {distribution.map((d) => (
            <div key={d.star} className="flex items-center gap-2 text-sm">
              <span className="w-10 shrink-0 text-amz-link">{d.star} yıldız</span>
              <div className="h-4 flex-1 overflow-hidden rounded border border-amz-border bg-amz-light">
                <div className="h-full bg-amz-star" style={{ width: `${d.percent}%` }} />
              </div>
              <span className="w-9 shrink-0 text-right text-zinc-600">
                %{Math.round(d.percent)}
              </span>
            </div>
          ))}
        </div>

        {/* Yorum formu */}
        <div className="card-amz p-4">
          <h3 className="mb-2 font-bold text-zinc-900">
            {mine ? "Değerlendirmenizi güncelleyin" : "Bu ürünü değerlendirin"}
          </h3>

          {user ? (
            <form onSubmit={submit} className="space-y-3">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setScore(n)}
                    onMouseEnter={() => setHover(n)}
                    onMouseLeave={() => setHover(0)}
                    aria-label={`${n} yıldız`}
                  >
                    <Star
                      className={cn(
                        "size-7 transition",
                        (hover || score) >= n
                          ? "fill-amz-star text-amz-star"
                          : "text-zinc-300",
                      )}
                    />
                  </button>
                ))}
              </div>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Başlık (isteğe bağlı)"
                className="input-amz"
                maxLength={120}
              />
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Ürün hakkındaki düşünceleriniz…"
                required
                minLength={3}
                rows={4}
                className="input-amz resize-y"
              />
              <button type="submit" disabled={saving} className="btn-amz w-full">
                {saving && <Spinner />}
                {mine ? "Güncelle" : "Yorumu gönder"}
              </button>
            </form>
          ) : (
            <p className="text-sm text-zinc-600">
              Değerlendirme yapmak için{" "}
              <Link href="/login" className="text-amz-link hover:text-amz-link-hover">
                giriş yapın
              </Link>
              .
            </p>
          )}
        </div>
      </div>

      {/* Yorum listesi */}
      <div className="lg:col-span-2">
        {reviews.length === 0 ? (
          <p className="rounded-lg border border-amz-border bg-white p-6 text-sm text-zinc-600">
            Bu ürün için henüz değerlendirme yapılmamış. İlk yorumu siz yazın!
          </p>
        ) : (
          <ul className="space-y-4">
            {reviews.map((review) => (
              <li key={review.id} className="border-b border-amz-border pb-4 last:border-0">
                <div className="mb-1 flex items-center gap-2">
                  <div className="flex size-8 items-center justify-center rounded-full bg-zinc-200 text-xs font-bold text-zinc-600">
                    {review.user.name.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-zinc-800">{review.user.name}</span>
                  {(user?.id === review.user.id || user?.role === "ADMIN") && (
                    <button
                      type="button"
                      onClick={() => remove(review.id)}
                      className="ml-auto text-zinc-400 hover:text-amz-price"
                      aria-label="Yorumu sil"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Rating value={review.rating} showCount={false} />
                  {review.title && (
                    <span className="text-sm font-bold text-zinc-900">{review.title}</span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-zinc-500">
                  {formatDate(review.createdAt)} tarihinde değerlendirildi
                </p>
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-zinc-700">
                  {review.comment}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
