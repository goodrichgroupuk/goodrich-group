import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { FieldLabel, TextField } from "@/components/ui/fields";
import { AppErrorComponent } from "@/lib/error-component";
import {
  categoryLabel,
  errorText,
  formatFiled,
  resultLabel,
  threadKindLabel,
  type ReviewCase,
} from "@/lib/exhibits";
import { decideExhibit, listPending } from "@/lib/exhibits.functions";

const KEY_STORAGE = "goodrich-review-key";

export const Route = createFileRoute("/review")({
  component: ReviewPage,
  errorComponent: AppErrorComponent,
  head: () => ({
    meta: [{ title: "Review the queue — Goodrich Group" }],
  }),
});

function ReviewPage() {
  const loadQueue = useServerFn(listPending);
  const decide = useServerFn(decideExhibit);
  const [key, setKey] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [items, setItems] = useState<ReviewCase[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  useEffect(() => {
    const saved = sessionStorage.getItem(KEY_STORAGE);
    if (saved) void openQueue(saved);
  }, []);

  async function openQueue(nextKey: string) {
    setBusy(true);
    setError("");
    try {
      const rows = await loadQueue({ data: { key: nextKey } });
      sessionStorage.setItem(KEY_STORAGE, nextKey);
      setKey(nextKey);
      setItems(rows);
      setUnlocked(true);
    } catch (caught) {
      sessionStorage.removeItem(KEY_STORAGE);
      setUnlocked(false);
      setItems([]);
      setError(errorText(caught, "That key does not open the queue."));
    } finally {
      setBusy(false);
    }
  }

  async function onDecide(id: string, action: "approve" | "decline") {
    setBusy(true);
    setError("");
    try {
      await decide({ data: { id, action, key } });
      setConfirmId(null);
      setItems(await loadQueue({ data: { key } }));
    } catch (caught) {
      setError(errorText(caught, "Could not update that sheet."));
    } finally {
      setBusy(false);
    }
  }

  function lock() {
    sessionStorage.removeItem(KEY_STORAGE);
    setUnlocked(false);
    setItems([]);
    setKey("");
    setConfirmId(null);
    setError("");
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
          <Link to="/" className="display text-xl text-foreground">
            Goodrich Group
          </Link>
          {unlocked ? (
            <Button variant="secondary" onClick={lock}>
              Lock the queue
            </Button>
          ) : null}
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-12">
        <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
          Private
        </p>
        <h1 className="display mt-4 text-5xl">Review the queue</h1>
        <p className="mt-4 max-w-xl text-base text-muted-foreground">
          Nothing filed by a visitor is hung until you approve it. A conversation filed with a sheet is checked with it. Declined sheets are removed.
        </p>

        {unlocked ? (
          <section className="mt-10">
            <p className="text-sm text-muted-foreground">
              <span className="tabular-nums">{items.length}</span>{" "}
              {items.length === 1 ? "sheet waiting" : "sheets waiting"}
            </p>
            {error ? (
              <p role="alert" className="mt-4 text-sm text-destructive">
                {error}
              </p>
            ) : null}
            {items.length === 0 ? (
              <div className="mt-8 rounded-xl border border-border bg-card px-6 py-10">
                <p className="display text-3xl">Nothing is waiting.</p>
                <p className="mt-3 max-w-xl text-sm text-muted-foreground">
                  New sheets appear here after someone files them. The wall stays as it is until you approve one.
                </p>
              </div>
            ) : (
              <ul className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
                {items.map((item) => (
                  <li key={item.id} className="rounded-xl border border-border bg-card p-4">
                    <div className="flex aspect-[3/4] items-center justify-center overflow-hidden rounded-sm bg-muted">
                      <img
                        src={item.image}
                        alt={`Sheet awaiting review, titled ${item.title}`}
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                    <p className="mt-4 text-xs font-medium tracking-widest text-muted-foreground uppercase">
                      {categoryLabel(item.category)}
                    </p>
                    <h2 className="display mt-1 text-2xl">{item.title}</h2>
                    <p className="mt-2 text-sm text-muted-foreground">{resultLabel(item.result)}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Filed {formatFiled(item.createdAt)}. Reference {item.id}.
                      {item.pendingSheet
                        ? ""
                        : " This sheet is already on the wall. Only the new pages are waiting."}
                    </p>
                    {item.thread.length ? (
                      <ul className="mt-4 grid grid-cols-2 gap-3">
                        {item.thread.map((page) => (
                          <li key={page.id}>
                            <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
                              {threadKindLabel(page.kind)}
                            </p>
                            <img
                              src={page.image}
                              alt={`${threadKindLabel(page.kind)} awaiting review`}
                              className="mt-2 max-h-48 w-full rounded-sm bg-muted object-contain"
                            />
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                      <Button disabled={busy} onClick={() => void onDecide(item.id, "approve")}>
                        {item.pendingSheet ? "Approve" : "Approve these pages"}
                      </Button>
                      {confirmId === item.id ? (
                        <Button
                          variant="secondary"
                          disabled={busy}
                          onClick={() => void onDecide(item.id, "decline")}
                        >
                          {item.pendingSheet ? "Confirm decline" : "Confirm decline of these pages"}
                        </Button>
                      ) : (
                        <Button
                          variant="secondary"
                          disabled={busy}
                          onClick={() => setConfirmId(item.id)}
                        >
                          {item.pendingSheet ? "Decline" : "Decline these pages"}
                        </Button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ) : (
          <form
            className="mt-10 max-w-md"
            onSubmit={(event) => {
              event.preventDefault();
              void openQueue(key);
            }}
          >
            <FieldLabel htmlFor="review-key">Review key</FieldLabel>
            <TextField
              id="review-key"
              type="password"
              autoComplete="off"
              value={key}
              onChange={(event) => setKey(event.target.value)}
              required
            />
            {error ? (
              <p role="alert" className="mt-4 text-sm text-destructive">
                {error}
              </p>
            ) : null}
            <Button className="mt-6" type="submit" disabled={busy}>
              {busy ? "Opening…" : "Open the queue"}
            </Button>
          </form>
        )}
      </main>
    </div>
  );
}
