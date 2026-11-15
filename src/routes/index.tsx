import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { FileDialog } from "@/components/file-dialog";
import { RedactDialog } from "@/components/redact-dialog";
import { RemoveDialog } from "@/components/remove-dialog";
import { SiteHeader } from "@/components/site-header";
import { WallGallery } from "@/components/wall-gallery";
import { Button } from "@/components/ui/button";
import { AppErrorComponent } from "@/lib/error-component";
import { resultLabel } from "@/lib/exhibits";
import { listExhibits } from "@/lib/exhibits.functions";
import { SAMPLES } from "@/lib/samples";
import { cn } from "@/lib/cn";

export const Route = createFileRoute("/")({
  loader: () => listExhibits(),
  component: Home,
  errorComponent: AppErrorComponent,
  pendingComponent: PendingHome,
  head: () => ({
    meta: [
      { title: "Goodrich Group — Good does not always mean rich." },
      {
        name: "description",
        content:
          "A public gallery of court orders and counter-judgments. File the JPEG of a sheet you won.",
      },
    ],
  }),
});

function PendingHome() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-16">
      <div className="h-4 w-28 rounded-sm bg-muted" />
      <div className="mt-6 h-16 w-full max-w-md rounded-sm bg-muted" />
      <div className="mt-4 h-6 w-64 rounded-sm bg-muted" />
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="aspect-[3/4] rounded-xl bg-muted" />
        <div className="aspect-[3/4] rounded-xl bg-muted" />
        <div className="hidden aspect-[3/4] rounded-xl bg-muted lg:block" />
      </div>
    </main>
  );
}

function Home() {
  const filed = Route.useLoaderData();
  const [fileOpen, setFileOpen] = useState(false);
  const [redactOpen, setRedactOpen] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);
  const featured = filed[0] ?? SAMPLES[0];

  return (
    <div id="top" className="min-h-screen">
      <SiteHeader
        actions={
          <>
            <Button variant="secondary" className="whitespace-nowrap" onClick={() => setRedactOpen(true)}>
              Redact a file
            </Button>
            <Button className="whitespace-nowrap" onClick={() => setFileOpen(true)}>
              File a sheet
            </Button>
          </>
        }
      />

      <main>
        <section className="mx-auto grid max-w-6xl items-end gap-10 px-4 py-12 md:grid-cols-12 md:py-20">
          <div className="rise md:col-span-7">
            <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
              A public gallery
            </p>
            <h1 className="display mt-4 text-5xl text-foreground md:text-6xl">Goodrich Group</h1>
            <p className="tagline mt-4 text-2xl text-foreground md:text-3xl">
              Good does not always mean rich.
            </p>
            <p className="mt-6 max-w-xl text-base text-muted-foreground">
              When someone stalls a payment, pays an invoice late, keeps a deposit, or leans on
              you because they think you will not fight it, the court sheet is the answer that
              lasts. Photograph it. File it here. The wall is a record that bullying people out
              of money, including late invoice payments, does not pay.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button onClick={() => setFileOpen(true)}>File a sheet</Button>
              <Button variant="secondary" onClick={() => setRedactOpen(true)}>
                Redact a file
              </Button>
              <a
                href="#wall"
                className="inline-flex h-11 items-center text-sm font-medium text-foreground underline decoration-border underline-offset-4"
              >
                Look at the wall
              </a>
            </div>
          </div>
          {featured ? (
            <div className="md:col-span-5">
              <Link
                to="/sheet/$id"
                params={{ id: featured.id }}
                className="block w-full rounded-xl border border-border bg-card p-4 text-left transition-colors duration-150 hover:border-foreground/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="flex aspect-[3/4] items-center justify-center overflow-hidden rounded-sm bg-muted">
                  <img
                    src={featured.image}
                    alt={
                      featured.illustrative
                        ? "Illustrative example of a sheet on the wall"
                        : `Latest filed sheet, ${featured.title}`
                    }
                    className="max-h-full max-w-full object-contain"
                  />
                </span>
                <span className="mt-4 block text-xs font-medium tracking-widest text-muted-foreground uppercase">
                  {featured.illustrative ? "Example on the wall" : "Latest on the wall"}
                </span>
                <span className="display mt-1 block text-3xl">{featured.title}</span>
                <span className="mt-2 block text-sm text-muted-foreground">
                  {resultLabel(featured.result)}
                </span>
              </Link>
            </div>
          ) : null}
        </section>

        <section aria-labelledby="how-heading" className="border-y border-border">
          <h2 id="how-heading" className="sr-only">
            From court to the wall
          </h2>
          <ol className="mx-auto grid max-w-6xl sm:grid-cols-3">
            <Step
              n="01"
              title="Win the order"
              body="Take the dispute to court. Come back with the judgment, the counterclaim that succeeded, or the order that the money is due."
            />
            <Step
              n="02"
              title="Photograph the sheet"
              body="A JPEG, a HEIC, or a PDF of the page is enough. Before it is filed, black out the claimant: your name, address, phone, and email. The company that would not pay can stay visible."
            />
            <Step
              n="03"
              title="Put it on the wall"
              body="File it here. Each sheet is checked before it is hung, so the wall stays a record rather than a place for spam."
              last
            />
          </ol>
        </section>

        <WallGallery filed={filed} onFile={() => setFileOpen(true)} />
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 sm:flex-row sm:items-end sm:justify-between">
          <p className="max-w-xl text-sm text-muted-foreground">
            Goodrich Group is a public viewing gallery, not a law firm, not a court, and not
            legal advice. It does not record who files a sheet, and it cannot tell anyone who
            did. Only file a document you have the right to publish.
          </p>
          <div className="flex flex-col gap-1 sm:items-end">
            <Button variant="quiet" onClick={() => setRemoveOpen(true)}>
              Take a sheet down
            </Button>
            <Link
              to="/review"
              className="inline-flex h-11 items-center text-sm font-medium text-foreground underline decoration-border underline-offset-4"
            >
              Review the queue
            </Link>
          </div>
        </div>
      </footer>

      <FileDialog open={fileOpen} onOpenChange={setFileOpen} />
      <RedactDialog open={redactOpen} onOpenChange={setRedactOpen} />
      <RemoveDialog open={removeOpen} onOpenChange={setRemoveOpen} />
    </div>
  );
}

function Step({
  n,
  title,
  body,
  last,
}: {
  n: string;
  title: string;
  body: string;
  last?: boolean;
}) {
  return (
    <li className={cn("px-4 py-8", !last && "border-b border-border sm:border-r sm:border-b-0")}>
      <p className="display text-3xl text-foreground">{n}</p>
      <h3 className="mt-3 text-base font-medium">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
    </li>
  );
}
