import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FieldLabel, SelectField, TextField } from "@/components/ui/fields";
import { AppErrorComponent } from "@/lib/error-component";
import {
  THREAD_KINDS,
  categoryLabel,
  errorText,
  formatFiled,
  resultLabel,
  threadKindLabel,
  type ThreadKind,
  type ThreadPage,
} from "@/lib/exhibits";
import { addThread, getExhibit } from "@/lib/exhibits.functions";
import { prepareSheet } from "@/lib/prepare-sheet";
import { NameCover } from "@/components/name-cover";
import { SAMPLES } from "@/lib/samples";

export const Route = createFileRoute("/sheet/$id")({
  loader: async ({ params }) => {
    const sample = SAMPLES.find((item) => item.id === params.id);
    if (sample) return { page: { ...sample, thread: [] as ThreadPage[] } };
    return { page: await getExhibit({ data: { id: params.id } }) };
  },
  component: SheetPage,
  errorComponent: AppErrorComponent,
  head: ({ loaderData }) => ({
    meta: [
      {
        title: loaderData?.page
          ? `${loaderData.page.title} — Goodrich Group`
          : "Sheet — Goodrich Group",
      },
    ],
  }),
});

function SheetPage() {
  const { page } = Route.useLoaderData();
  if (!page) return <MissingSheet />;
  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
          <Link to="/" className="display text-xl text-foreground">
            Goodrich Group
          </Link>
          <Link
            to="/"
            hash="wall"
            className="text-sm font-medium text-foreground underline decoration-border underline-offset-4"
          >
            The wall
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-12">
        <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
          {page.illustrative ? "Example" : categoryLabel(page.category)}
        </p>
        <h1 className="display mt-4 text-5xl">{page.title}</h1>
        <p className="mt-4 text-base text-muted-foreground">
          {resultLabel(page.result)}
          {page.illustrative ? "" : `. Filed ${formatFiled(page.createdAt)}.`}
        </p>
        {page.illustrative ? null : (
          <p className="mt-3 max-w-xl text-sm text-muted-foreground">
            The person who filed this is not recorded. If someone asks who published it, there is no name to give.
          </p>
        )}
        <img
          src={page.image}
          alt={
            page.illustrative
              ? `Illustrative example sheet titled ${page.title}`
              : `Filed court sheet titled ${page.title}`
          }
          className="mt-8 w-full rounded-sm bg-muted object-contain"
        />
        {page.illustrative ? (
          <p className="mt-8 max-w-xl text-sm text-muted-foreground">
            Set dressing, so the wall is not empty. There is no real conversation behind this page.
          </p>
        ) : (
          <>
            <section className="mt-14" aria-labelledby="thread-heading">
              <h2 id="thread-heading" className="display text-3xl">
                The conversation
              </h2>
              <p className="mt-3 max-w-xl text-sm text-muted-foreground">
                Emails, WhatsApp chats, and other pages filed with this order. Names and contact details should already be covered.
              </p>
              {page.thread.length ? (
                <ul className="mt-8 grid gap-6">
                  {page.thread.map((item) => (
                    <li key={item.id} className="rounded-xl border border-border bg-card p-4">
                      <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
                        {threadKindLabel(item.kind)}
                      </p>
                      <img
                        src={item.image}
                        alt={`${threadKindLabel(item.kind)} filed with ${page.title}`}
                        className="mt-3 w-full rounded-sm bg-muted object-contain"
                      />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-6 text-sm text-muted-foreground">
                  No conversation was filed with this sheet.
                </p>
              )}
            </section>
            <AddPage exhibitId={page.id} />
          </>
        )}
      </main>
    </div>
  );
}

function AddPage({ exhibitId }: { exhibitId: string }) {
  const add = useServerFn(addThread);
  const [code, setCode] = useState("");
  const [kind, setKind] = useState<ThreadKind>("email");
  const [imageData, setImageData] = useState("");
  const [preparing, setPreparing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function take(file: File) {
    setError("");
    setDone(false);
    setPreparing(true);
    try {
      setImageData(await prepareSheet(file));
    } catch (caught) {
      setImageData("");
      setError(errorText(caught, "Could not prepare that image."));
    } finally {
      setPreparing(false);
    }
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!imageData) {
      setError("Add a screenshot of the conversation.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await add({ data: { id: exhibitId, code, kind, imageData } });
      setDone(true);
      setImageData("");
      setCode("");
    } catch (caught) {
      setError(errorText(caught, "Could not add that page."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-14 border-t border-border pt-10" aria-labelledby="add-heading">
      <h2 id="add-heading" className="display text-3xl">
        Add a page
      </h2>
      <p className="mt-3 max-w-xl text-sm text-muted-foreground">
        If this is your sheet, use the removal code. Cover names, phone numbers, and email addresses first. The page stays hidden until it is approved.
      </p>
      <form onSubmit={(event) => void onSubmit(event)} className="mt-6 grid max-w-md gap-5">
        <div>
          <FieldLabel htmlFor="thread-kind">What this page is</FieldLabel>
          <SelectField
            id="thread-kind"
            value={kind}
            onChange={(event) => setKind(event.target.value as ThreadKind)}
          >
            {THREAD_KINDS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </SelectField>
        </div>
        <div>
          <FieldLabel htmlFor="thread-code">Removal code</FieldLabel>
          <TextField
            id="thread-code"
            value={code}
            autoComplete="off"
            required
            onChange={(event) => setCode(event.target.value)}
          />
        </div>
        <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-sm border border-dashed border-border bg-background px-4 py-5 text-center">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
            className="sr-only"
            onChange={(event) => {
              const next = event.target.files?.[0];
              if (next) void take(next);
              event.target.value = "";
            }}
          />
          {imageData ? (
            <img
              src={imageData}
              alt="Preview of the conversation page"
              className="max-h-40 rounded-sm object-contain"
            />
          ) : (
            <span className="text-sm text-muted-foreground">
              {preparing ? "Preparing the image…" : "Choose a screenshot. PNG and WebP are converted."}
            </span>
          )}
        </label>
        {imageData ? <NameCover image={imageData} onChange={setImageData} /> : null}
        {done ? (
          <p className="text-sm text-foreground">Filed. It will not appear here until it is approved.</p>
        ) : null}
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
        <Button type="submit" disabled={busy || preparing}>
          {busy ? "Adding the page…" : "Add this page"}
        </Button>
      </form>
    </section>
  );
}

function MissingSheet() {
  return (
    <main className="mx-auto max-w-xl px-4 py-20">
      <h1 className="display text-4xl">This sheet is not on the wall.</h1>
      <p className="mt-4 text-sm text-muted-foreground">
        It may still be waiting for approval, or it may have been taken down.
      </p>
      <Link
        to="/"
        className="mt-6 inline-flex text-sm font-medium text-foreground underline decoration-border underline-offset-4"
      >
        Back to the wall
      </Link>
    </main>
  );
}
