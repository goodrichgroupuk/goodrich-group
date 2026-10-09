import { useServerFn } from "@tanstack/react-start";
import { useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { FieldLabel, TextField } from "@/components/ui/fields";
import { errorText } from "@/lib/exhibits";
import { removeExhibit } from "@/lib/exhibits.functions";

export function RemoveDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const remove = useServerFn(removeExhibit);
  const [id, setId] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (open) return;
    setId("");
    setCode("");
    setBusy(false);
    setError("");
    setDone(false);
  }, [open]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await remove({ data: { id, code } });
      setDone(true);
      await router.invalidate();
    } catch (caught) {
      setError(errorText(caught, "Could not take the sheet down."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {done ? (
        <DialogContent title="Sheet taken down" description="It is no longer on the wall.">
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogContent>
      ) : (
        <DialogContent
          title="Take a sheet down"
          description="Use the reference and the removal code from when the sheet was filed. Example sheets cannot be removed."
        >
          <form onSubmit={(event) => void onSubmit(event)} className="grid gap-5">
            <div>
              <FieldLabel htmlFor="remove-id">Reference</FieldLabel>
              <TextField
                id="remove-id"
                value={id}
                autoComplete="off"
                placeholder="gr-xxxxxxxx"
                onChange={(event) => setId(event.target.value)}
                required
              />
            </div>
            <div>
              <FieldLabel htmlFor="remove-code">Removal code</FieldLabel>
              <TextField
                id="remove-code"
                value={code}
                autoComplete="off"
                placeholder="ABCD-EFGH"
                onChange={(event) => setCode(event.target.value)}
                className="font-mono"
                required
              />
            </div>
            {error ? (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            ) : null}
            <Button type="submit" disabled={busy}>
              {busy ? "Removing…" : "Take it down"}
            </Button>
          </form>
        </DialogContent>
      )}
    </Dialog>
  );
}
