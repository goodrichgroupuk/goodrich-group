import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";

type Rect = { x: number; y: number; w: number; h: number };

function pointIn(frame: HTMLDivElement, event: React.PointerEvent) {
  const box = frame.getBoundingClientRect();
  return {
    x: Math.min(1, Math.max(0, (event.clientX - box.left) / box.width)),
    y: Math.min(1, Math.max(0, (event.clientY - box.top) / box.height)),
  };
}

async function burnCovers(dataUrl: string, rects: Rect[]) {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const next = new Image();
    next.onload = () => resolve(next);
    next.onerror = () => reject(new Error("Could not cover that name."));
    next.src = dataUrl;
  });
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not cover that name.");
  context.drawImage(image, 0, 0);
  context.fillStyle = "#1c1b18";
  for (const rect of rects) {
    context.fillRect(
      rect.x * canvas.width,
      rect.y * canvas.height,
      Math.max(2, rect.w * canvas.width),
      Math.max(2, rect.h * canvas.height),
    );
  }
  let quality = 0.72;
  let url = "";
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", quality);
    });
    if (!blob) throw new Error("Could not cover that name.");
    url = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") resolve(reader.result);
        else reject(new Error("Could not cover that name."));
      };
      reader.onerror = () => reject(new Error("Could not cover that name."));
      reader.readAsDataURL(blob);
    });
    if (url.length <= 400_000) return url;
    quality -= 0.12;
  }
  throw new Error("That picture is still too large after the cover. Try a closer crop.");
}

export function NameCover({
  image,
  onChange,
}: {
  image: string;
  onChange: (next: string) => void;
}) {
  const frame = useRef<HTMLDivElement>(null);
  const origin = useRef<{ x: number; y: number } | null>(null);
  const [open, setOpen] = useState(true);
  const [rects, setRects] = useState<Rect[]>([]);
  const [draft, setDraft] = useState<Rect | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function close() {
    setOpen(false);
    setRects([]);
    setDraft(null);
    setError("");
    origin.current = null;
  }

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (!frame.current) return;
    origin.current = pointIn(frame.current, event);
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // A drag still works while the pointer stays on the picture.
    }
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!origin.current || !frame.current) return;
    const next = pointIn(frame.current, event);
    const x = Math.min(origin.current.x, next.x);
    const y = Math.min(origin.current.y, next.y);
    setDraft({
      x,
      y,
      w: Math.abs(next.x - origin.current.x),
      h: Math.abs(next.y - origin.current.y),
    });
  }

  function onPointerUp(event: React.PointerEvent<HTMLDivElement>) {
    if (!origin.current || !frame.current) {
      origin.current = null;
      setDraft(null);
      return;
    }
    const next = pointIn(frame.current, event);
    const rect = {
      x: Math.min(origin.current.x, next.x),
      y: Math.min(origin.current.y, next.y),
      w: Math.abs(next.x - origin.current.x),
      h: Math.abs(next.y - origin.current.y),
    };
    origin.current = null;
    setDraft(null);
    if (rect.w > 0.01 && rect.h > 0.008) setRects((existing) => [...existing, rect]);
  }

  async function apply() {
    if (!rects.length) {
      close();
      return;
    }
    setBusy(true);
    setError("");
    try {
      onChange(await burnCovers(image, rects));
      close();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not cover that name.");
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <div className="mt-3">
        <Button type="button" variant="secondary" onClick={() => setOpen(true)}>
          Redact your details
        </Button>
      </div>
    );
  }

  const marks = draft ? [...rects, draft] : rects;

  return (
    <div className="mt-3 grid gap-3">
      <p className="text-sm text-muted-foreground">
        Drag a box over the claimant: your name, address, phone, or email. Leave the company that would not pay visible. The bar is burned into the JPEG, and it cannot be lifted later.
      </p>
      <div
        ref={frame}
        data-cover-frame
        className="relative inline-block max-w-full touch-none select-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <img
          src={image}
          alt="Picture you can cover names on"
          draggable={false}
          className="max-h-80 max-w-full rounded-sm bg-muted"
        />
        {marks.map((rect, index) => (
          <span
            key={`${rect.x}-${rect.y}-${index}`}
            className="absolute bg-foreground"
            style={{
              left: `${rect.x * 100}%`,
              top: `${rect.y * 100}%`,
              width: `${rect.w * 100}%`,
              height: `${rect.h * 100}%`,
            }}
          />
        ))}
      </div>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button type="button" disabled={busy || !rects.length} onClick={() => void apply()}>
          {busy ? "Redacting…" : "Burn in the redaction"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={busy || !rects.length}
          onClick={() => setRects((current) => current.slice(0, -1))}
        >
          Undo
        </Button>
        <Button type="button" variant="secondary" disabled={busy} onClick={close}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
