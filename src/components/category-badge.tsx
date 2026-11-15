import { categoryLabel } from "@/lib/exhibits";
import { cn } from "@/lib/cn";

export function CategoryBadge({ id, className }: { id: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center rounded-full border border-border px-2.5 py-1 text-xs font-medium tracking-widest text-muted-foreground uppercase",
        className,
      )}
    >
      {categoryLabel(id)}
    </span>
  );
}
