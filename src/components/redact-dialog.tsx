import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { NameCover } from "@/components/name-cover";
import { errorText } from "@/lib/exhibits";
import { prepareSheet, SHEET_ACCEPT } from "@/lib/prepare-sheet";

export function RedactDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [imageData, setImageData] = useState("");
  const [epoch, setEpoch] = useState(0);
  const [preparing, setPreparing] = useState(false);
  const [error, setError] = useState("");

  async function take(file: File) {
    setError("");
    setPreparing(true);
    try {
      setImageData(await prepareSheet(file));
      setEpoch((current) => current + 1);
    } catch (caught) {
      setImageData("");
      setError(errorText(caught, "Could not prepare that file."));
    } finally {
      setPreparing(false);
    }
  }

  function download() {
    const link = document.createElement("a");
    link.href = imageData;
    link.download = "redacted-sheet.jpg";
    link.click();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setImageData("");
          setError("");
        }
        onOpenChange(next);
      }}
    >
      <DialogContent
        title="Redact a file"
        description="Choose a JPEG, a HEIC, or a PDF. Drag a box over your name, address, phone, or email. The company can stay. Nothing is sent anywhere until you file the sheet."
      >
        <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-sm border border-dashed border-border bg-background px-4 py-5 text-center">
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
              alt="Preview of the file you can redact"
              className="max-h-40 rounded-sm object-contain"
            />
          ) : (
            <span className="text-sm text-muted-foreground">
              {preparing ? "Preparing the file…" : "Choose a JPEG, a HEIC, or a PDF."}
            </span>
          )}
        </label>
        {imageData ? <NameCover key={epoch} image={imageData} onChange={setImageData} /> : null}
        {error ? (
          <p role="alert" className="mt-3 text-sm text-destructive">
            {error}
          </p>
        ) : null}
        <div className="mt-6">
          <Button type="button" disabled={!imageData} onClick={download}>
            Download the redacted JPEG
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
