"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Search } from "lucide-react";

export function SearchBar({
  categories,
}: {
  categories: { id: string; name: string; slug: string }[];
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [query, setQuery] = useState(params.get("q") ?? "");
  const [category, setCategory] = useState(params.get("category") ?? "");

  function submit(event: FormEvent) {
    event.preventDefault();
    const search = new URLSearchParams();
    if (query.trim()) search.set("q", query.trim());
    if (category) search.set("category", category);
    router.push(`/search?${search.toString()}`);
  }

  return (
    <form onSubmit={submit} className="flex h-10 w-full overflow-hidden rounded-md" role="search">
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        aria-label="Kategori seç"
        className="hidden max-w-[140px] shrink-0 border-r border-zinc-300 bg-amz-light px-2 text-xs text-zinc-700 outline-none sm:block"
      >
        <option value="">Tümü</option>
        {categories.map((c) => (
          <option key={c.id} value={c.slug}>
            {c.name}
          </option>
        ))}
      </select>

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Ürün, marka veya kategori ara"
        aria-label="Arama"
        className="min-w-0 flex-1 bg-white px-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-500"
      />

      <button
        type="submit"
        aria-label="Ara"
        className="flex w-11 shrink-0 items-center justify-center bg-amz-yellow text-zinc-900 transition hover:bg-amz-yellow-dark sm:w-12"
      >
        <Search className="size-5" />
      </button>
    </form>
  );
}
