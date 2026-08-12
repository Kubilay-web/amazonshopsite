import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("size-4 animate-spin", className)} aria-hidden />;
}

export function FullSpinner({ label = "Yükleniyor…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-zinc-500">
      <Loader2 className="size-8 animate-spin text-amz-orange" />
      <p className="text-sm">{label}</p>
    </div>
  );
}
