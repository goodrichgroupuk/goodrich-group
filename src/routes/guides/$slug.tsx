import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { AppErrorComponent } from "@/lib/error-component";
import { formatFiled } from "@/lib/exhibits";
import { getGuide } from "@/lib/guides";

export const Route = createFileRoute("/guides/$slug")({
  loader: ({ params }) => ({ post: getGuide(params.slug) }),
  component: GuidePage,
  errorComponent: AppErrorComponent,
  head: ({ loaderData }) => ({
    meta: [
      {
        title: loaderData?.post
          ? `${loaderData.post.title} — Goodrich Group`
          : "Guide — Goodrich Group",
      },
      {
        name: "description",
        content: loaderData?.post?.summary ?? "General information, not legal advice.",
      },
    ],
  }),
});

function GuidePage() {
  const { post } = Route.useLoaderData();
  if (!post) return <MissingGuide />;
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-12">
        <p className="text-sm text-muted-foreground">{formatFiled(post.date)}</p>
        <h1 className="display mt-3 text-5xl">{post.title}</h1>
        <p className="mt-4 text-lg text-muted-foreground">{post.summary}</p>
        <p className="mt-6 rounded-sm border border-border bg-card px-4 py-3 text-sm text-foreground">
          General information, not legal advice.
        </p>
        <div className="mt-8 space-y-4 text-base text-foreground">
          {post.body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
        <Link
          to="/guides"
          className="mt-12 inline-flex text-sm font-medium text-foreground underline decoration-border underline-offset-4"
        >
          All guides
        </Link>
      </main>
    </div>
  );
}

function MissingGuide() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="display text-4xl">That guide is not here.</h1>
        <Link
          to="/guides"
          className="mt-6 inline-flex text-sm font-medium underline decoration-border underline-offset-4"
        >
          All guides
        </Link>
      </main>
    </div>
  );
}
