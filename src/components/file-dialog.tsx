import { useServerFn } from "@tanstack/react-start";
import { useRouter } from "@tanstack/react-router";
import { Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { FieldLabel, SelectField, TextField } from "@/components/ui/fields";
import {
  CATEGORIES,
  RESULTS,
  THREAD_KINDS,
  errorText,
  groupCode,
  type CategoryId,
  type ResultId,
  type ThreadKind,
} from "@/lib/exhibits";
import { fileExhibit } from "@/lib/exhibits.functions";
import { prepareSheet, SHEET_ACCEPT } from "@/lib/prepare-sheet";
import { NameCover } from "@/components/name-cover";

export function FileDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const file = useServerFn(fileExhibit);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<CategoryId>("invoice");
  const [result, setResult] = useState<ResultId>("debt");
  const [consent, setConsent] = useState(false);
  const [imageData, setImageData] = useState("");
  const [sheetEpoch, setSheetEpoch] = useState(0);
  const [pages, setPages] = useState<{ id: string; kind: ThreadKind; imageData: string }[]>([]);
  const [addingPage, setAddingPage] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState<{ id: string; removalCode: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open) return;
    setTitle("");
    setCategory("invoice");
    setResult("debt");
    setConsent(false);
    setImageData("");
    setPages([]);
    setAddingPage(false);
    setDragOver(false);
    setPreparing(false);
    setBusy(false);
    setError("");
    setReceipt(null);
    setCopied(false);
  }, [open]);

  async function take(fileInput: File) {
    setError("");
    setPreparing(true);
    try {
      setImageData(await prepareSheet(fileInput));
      setSheetEpoch((current) => current + 1);
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
      setError("Add a JPEG of the court sheet.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const saved = await file({
        data: {
          title,
          category,
          result,
          imageData,
          consent,
          attachments: pages.map((page) => ({ kind: page.kind, imageData: page.imageData })),
        },
      });
      setReceipt(saved);
      await router.invalidate();
    } catch (caught) {
      setError(errorText(caught, "Could not file the sheet."));
    } finally {
      setBusy(false);
    }
  }

  async function copyCode() {
    if (!receipt) return;
    const text = `Reference ${receipt.id}\nRemoval code ${groupCode(receipt.removalCode)}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      setCopied(false);
      setError("Copy failed. Select the code and save it yourself.");
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && receipt) return;
        onOpenChange(next);
      }}
    >
      {receipt ? (
        <DialogContent
          locked
          title="Sheet filed"
          description="Save the removal code. This sheet is not on the wall yet. Any conversation you added is held with it until it is approved."
        >
          <dl className="grid gap-4">
            <div>
              <dt className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
                Reference
              </dt>
              <dd className="mt-1 font-mono text-sm text-foreground">{receipt.id}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
                Removal code
              </dt>
              <dd className="mt-1">
                <input
                  readOnly
                  value={groupCode(receipt.removalCode)}
                  onFocus={(event) => event.currentTarget.select()}
                  className="h-11 w-full rounded-sm border border-input bg-background px-3 font-mono text-base text-foreground"
                  aria-label="Removal code"
                />
              </dd>
            </div>
          </dl>
          {error ? (
            <p role="alert" className="mt-4 text-sm text-destructive">
              {error}
            </p>
          ) : null}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button variant="secondary" onClick={() => void copyCode()}>
              {copied ? "Copied" : "Copy code"}
            </Button>
            <Button onClick={() => onOpenChange(false)}>I saved the code</Button>
          </div>
        </DialogContent>
      ) : (
        <DialogContent
          title="File a sheet"
          description="A JPEG, a HEIC, or a PDF of the order you won. Add the conversation if you have it. Nothing is public until it is approved."
        >
          <form onSubmit={(event) => void onSubmit(event)} className="grid gap-5">
            <div
              className={
                dragOver
                  ? "rounded-sm border border-foreground bg-background"
                  : "rounded-sm border border-dashed border-border bg-background"
              }
              onDragOver={(event) => {
                event.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDragOver(false);
                const next = event.dataTransfer.files?.[0];
                if (next) void take(next);
              }}
            >
              <label className="flex min-h-44 cursor-pointer flex-col items-center justify-center gap-2 px-4 py-6 text-center">
                <input
                  type="file"
                  accept={SHEET_ACCEPT}
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
                    alt="Preview of the sheet you are about to file"
                    className="max-h-48 rounded-sm object-contain"
                  />
                ) : (
                  <>
                    <Upload className="size-5" aria-hidden="true" />
                    <span className="text-sm font-medium">Choose a JPEG, a HEIC, or a PDF</span>
                    <span className="max-w-xs text-sm text-muted-foreground">
                      {preparing
                        ? "Preparing the file…"
                        : "Drop it here, or browse. A PDF or a HEIC is turned into a picture you can redact."}
                    </span>
                  </>
                )}
              </label>
            </div>
            {imageData ? (
              <NameCover key={sheetEpoch} image={imageData} onChange={setImageData} />
            ) : null}

            <div>
              <FieldLabel htmlFor="file-title">Public label</FieldLabel>
              <TextField
                id="file-title"
                value={title}
                maxLength={72}
                required
                placeholder="Unpaid invoice"
                autoComplete="off"
                onChange={(event) => setTitle(event.target.value)}
              />
              <p className="mt-2 text-sm text-muted-foreground">
                No names in the label. Black out the claimant on the picture if you want to stay anonymous. The company on the order can stay visible.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <FieldLabel htmlFor="file-category">Dispute</FieldLabel>
                <SelectField
                  id="file-category"
                  value={category}
                  onChange={(event) => setCategory(event.target.value as CategoryId)}
                >
                  {CATEGORIES.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </SelectField>
              </div>
              <div>
                <FieldLabel htmlFor="file-result">What the court ordered</FieldLabel>
                <SelectField
                  id="file-result"
                  value={result}
                  onChange={(event) => setResult(event.target.value as ResultId)}
                >
                  {RESULTS.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </SelectField>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-foreground">The conversation</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Optional. Emails, WhatsApp, or other pages that led to court. Cover names, phone numbers, and email addresses first. Up to four.
              </p>
              {pages.length ? (
                <ul className="mt-3 grid gap-3">
                  {pages.map((page) => (
                    <li key={page.id} className="rounded-sm border border-border bg-background p-3">
                      <div className="grid items-center gap-3 sm:grid-cols-[3rem_1fr_auto]">
                        <img
                          src={page.imageData}
                          alt="Preview of a conversation page"
                          className="h-16 w-12 rounded-sm bg-muted object-contain"
                        />
                        <SelectField
                          aria-label="What this page is"
                          value={page.kind}
                          onChange={(event) =>
                            setPages((current) =>
                              current.map((item) =>
                                item.id === page.id
                                  ? { ...item, kind: event.target.value as ThreadKind }
                                  : item,
                              ),
                            )
                          }
                        >
                          {THREAD_KINDS.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.label}
                            </option>
                          ))}
                        </SelectField>
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() =>
                            setPages((current) => current.filter((item) => item.id !== page.id))
                          }
                        >
                          Remove
                        </Button>
                      </div>
                      <NameCover
                        image={page.imageData}
                        onChange={(next) =>
                          setPages((current) =>
                            current.map((item) =>
                              item.id === page.id ? { ...item, imageData: next } : item,
                            ),
                          )
                        }
                      />
                    </li>
                  ))}
                </ul>
              ) : null}
              {pages.length < 4 ? (
                <label className="mt-3 inline-flex h-11 cursor-pointer items-center rounded-sm border border-border bg-card px-4 text-sm font-medium text-foreground">
                  <input
                    id="conversation-file"
                    type="file"
                    accept={SHEET_ACCEPT}
                    className="sr-only"
                    onChange={(event) => {
                      const next = event.target.files?.[0];
                      event.target.value = "";
                      if (!next) return;
                      setAddingPage(true);
                      setError("");
                      void prepareSheet(next)
                        .then((data) => {
                          setPages((current) =>
                            current.length >= 4
                              ? current
                              : [...current, { id: crypto.randomUUID(), kind: "email", imageData: data }],
                          );
                        })
                        .catch((caught) => setError(errorText(caught, "Could not prepare that image.")))
                        .finally(() => setAddingPage(false));
                    }}
                  />
                  {addingPage ? "Preparing…" : "Add a page"}
                </label>
              ) : null}
            </div>

            <label className="flex min-h-11 items-start gap-3 text-sm text-foreground">
              <input
                type="checkbox"
                checked={consent}
                onChange={(event) => setConsent(event.target.checked)}
                className="mt-1 size-4 accent-accent"
                required
              />
              <span>
                I have the right to publish this, and I understand that, if it is approved, anyone can view the sheet and any conversation I add.
              </span>
            </label>

            {error ? (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            ) : null}

            <Button type="submit" disabled={busy || preparing || addingPage || !consent}>
              {busy ? "Filing the sheet…" : "File it on the wall"}
            </Button>
          </form>
        </DialogContent>
      )}
    </Dialog>
  );
}
