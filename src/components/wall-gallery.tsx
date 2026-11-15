import { useMemo, useState } from "react";
import { ExhibitCard } from "@/components/exhibit-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { CATEGORIES, categoryLabel, type Exhibit } from "@/lib/exhibits";
import { SAMPLES } from "@/lib/samples";

export function WallGallery({
  filed,
  onFile,
  titleAs = "h2",
  title = "The wall",
}: {
  filed: Exhibit[];
  onFile: () => void;
  titleAs?: "h1" | "h2";
  title?: string;
}) {
  const [filter, setFilter] = useState("all");
  const visibleFiled = useMemo(
    () => filed.filter((item) => filter === "all" || item.category === filter),
    [filed, filter],
  );
  const visibleSamples = useMemo(
    () => SAMPLES.filter((item) => filter === "all" || item.category === filter),
    [filter],
  );
  const Title = titleAs;

  return (
    <section id="wall" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-14">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Title className={cn("display", titleAs === "h1" ? "text-5xl" : "text-4xl")}>{title}</Title>
          <p className="mt-2 text-sm text-muted-foreground">
            <span className="tabular-nums">{filed.length}</span>{" "}
            {filed.length === 1 ? "sheet filed" : "sheets filed"}
          </p>
        </div>
        <div className="flex max-w-full gap-2 overflow-x-auto pb-1" role="group" aria-label="Filter the wall">
          <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>
            All
          </FilterChip>
          {CATEGORIES.map((item) => (
            <FilterChip key={item.id} active={filter === item.id} onClick={() => setFilter(item.id)}>
              {item.label}
            </FilterChip>
          ))}
        </div>
      </div>

      {visibleFiled.length ? (
        <ul className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visibleFiled.map((item) => (
            <ExhibitCard key={item.id} item={item} />
          ))}
        </ul>
      ) : (
        <div className="mt-8 rounded-xl border border-border bg-card px-6 py-10">
          <p className="display text-3xl">
            {filed.length === 0 ? "The wall is clear." : "Nothing in this category yet."}
          </p>
          <p className="mt-3 max-w-xl text-sm text-muted-foreground">
            {filed.length === 0
              ? "When someone files a JPEG of an order they won, it appears here. The sheets below are examples, not real cases."
              : `No filed sheet is tagged ${filter === "all" ? "here" : categoryLabel(filter).toLowerCase()}.`}
          </p>
          <Button className="mt-6" onClick={onFile}>
            File a sheet
          </Button>
        </div>
      )}

      <div className="mt-16">
        <h2 className="display text-3xl">Illustrative sheets</h2>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          Set dressing, so you can see how a page sits. Not real orders. Not real parties.
        </p>
        {visibleSamples.length ? (
          <ul className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {visibleSamples.map((item) => (
              <ExhibitCard key={item.id} item={item} />
            ))}
          </ul>
        ) : (
          <p className="mt-6 text-sm text-muted-foreground">
            No example in this category. A filed sheet would still appear above.
          </p>
        )}
      </div>
    </section>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "h-11 shrink-0 rounded-full px-4 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active ? "bg-primary text-primary-foreground" : "border border-border bg-card text-foreground",
      )}
    >
      {children}
    </button>
  );
}
