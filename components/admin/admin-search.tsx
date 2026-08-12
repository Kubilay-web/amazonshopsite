"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";

export function AdminSearch({ placeholder = "Ara…" }: { placeholder?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [value, setValue] = useState(params.get("q") ?? "");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const next = new URLSearchParams(params.toString());
        if (value.trim()) next.set("q", value.trim());
        else next.delete("q");
        next.delete("page");
        router.push(`${pathname}?${next.toString()}`);
      }}
      className="flex w-full max-w-sm gap-2"
    >
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="input-amz"
      />
      <button type="submit" className="btn-amz-outline shrink-0">
        <Search className="size-4" />
      </button>
    </form>
  );
}
