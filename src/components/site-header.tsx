import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

export function SiteHeader({ actions }: { actions?: ReactNode }) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background">
      <div className="mx-auto flex min-h-16 max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-6">
          <Link to="/" className="display text-xl text-foreground">
            Goodrich Group
          </Link>
          <Link
            to="/wall"
            className="text-sm font-medium text-foreground underline decoration-border underline-offset-4"
          >
            Look at the wall
          </Link>
          <Link
            to="/guides"
            className="text-sm font-medium text-foreground underline decoration-border underline-offset-4"
          >
            Guides
          </Link>
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}
