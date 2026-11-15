import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { AppErrorComponent } from "@/lib/error-component";
import { formatFiled } from "@/lib/exhibits";
import { GUIDES } from "@/lib/guides";

export const Route = createFileRoute("/guides/")({
  component: GuidesPage,
  errorComponent: AppErrorComponent,
  head: () => ({
    meta: [
      { title: "Guides — Goodrich Group" },
      {
        name: "description",
        content:
          "Plain-English notes from Goodrich Group. General information, not legal advice.",
      },
    ],
  }),
});

function GuidesPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-12">
        <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
          Guides
        </p>
        <h1 className="display mt-4 text-5xl">Notes before and after court</h1>
        <p className="mt-4 max-w-xl text-base text-muted-foreground">
          Practical writing for people dealing with a contractor or a trader, and for people who
          have to defend themselves in court. General information, not legal advice.
        </p>
        <ul className="mt-10 divide-y divide-border border-y border-border">
          {GUIDES.map((post) => (
            <li key={post.slug}>
              <Link
                to="/guides/$slug"
                params={{ slug: post.slug }}
                className="block py-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <p className="text-sm text-muted-foreground">{formatFiled(post.date)}</p>
                <h2 className="display mt-2 text-3xl">{post.title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{post.summary}</p>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
