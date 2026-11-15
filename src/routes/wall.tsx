import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { FileDialog } from "@/components/file-dialog";
import { RedactDialog } from "@/components/redact-dialog";
import { RemoveDialog } from "@/components/remove-dialog";
import { SiteHeader } from "@/components/site-header";
import { WallGallery } from "@/components/wall-gallery";
import { Button } from "@/components/ui/button";
import { AppErrorComponent } from "@/lib/error-component";
import { listExhibits } from "@/lib/exhibits.functions";

export const Route = createFileRoute("/wall")({
  loader: () => listExhibits(),
  component: WallPage,
  errorComponent: AppErrorComponent,
  head: () => ({
    meta: [
      { title: "The Wall — Goodrich Group" },
      {
        name: "description",
        content: "The public wall of court sheets filed with Goodrich Group.",
      },
    ],
  }),
});

function WallPage() {
  const filed = Route.useLoaderData();
  const [fileOpen, setFileOpen] = useState(false);
  const [redactOpen, setRedactOpen] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);

  return (
    <div className="min-h-screen">
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
        <WallGallery filed={filed} title="The Wall" titleAs="h1" onFile={() => setFileOpen(true)} />
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
