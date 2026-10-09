import { Link } from "@tanstack/react-router";
import {
  categoryLabel,
  formatFiled,
  resultLabel,
  type Exhibit,
} from "@/lib/exhibits";

export function ExhibitCard({ item }: { item: Exhibit }) {
  const filed = item.illustrative ? "Example sheet" : formatFiled(item.createdAt);
  return (
    <li>
      <Link
        to="/sheet/$id"
        params={{ id: item.id }}
        className="sheet-card flex h-full w-full flex-col rounded-xl border border-border bg-card p-4 text-left transition-colors duration-150 hover:border-foreground/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="flex aspect-[3/4] items-center justify-center overflow-hidden rounded-sm bg-muted">
          <img
            src={item.image}
            alt={
              item.illustrative
                ? `Illustrative example sheet titled ${item.title}`
                : `Filed court sheet titled ${item.title}`
            }
            className="max-h-full max-w-full object-contain"
          />
        </span>
        <span className="mt-4 text-xs font-medium tracking-widest text-muted-foreground uppercase">
          {categoryLabel(item.category)}
        </span>
        <span className="display mt-1 text-2xl text-foreground">{item.title}</span>
        <span className="mt-2 text-sm text-muted-foreground">{resultLabel(item.result)}</span>
        <span className="mt-3 text-xs text-muted-foreground">{filed}</span>
      </Link>
    </li>
  );
}
