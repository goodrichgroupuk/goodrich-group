import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export const Dialog = DialogPrimitive.Root;

export function DialogContent({
  title,
  description,
  wide,
  locked,
  children,
}: {
  title: string;
  description?: string;
  wide?: boolean;
  locked?: boolean;
  children: ReactNode;
}) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="overlay-in fixed inset-0 z-40 bg-foreground/50" />
      <DialogPrimitive.Content
        className={cn(
          "panel fixed top-1/2 left-1/2 z-50 -translate-x-1/2 -translate-y-1/2 text-card-foreground outline-none",
          wide && "panel-wide",
        )}
        onEscapeKeyDown={(event) => {
          if (locked) event.preventDefault();
        }}
        onInteractOutside={(event) => {
          if (locked) event.preventDefault();
        }}
      >
        <div className="flex items-start justify-between gap-4 p-6 pb-0">
          <div className="min-w-0">
            <DialogPrimitive.Title className="display text-3xl text-foreground">
              {title}
            </DialogPrimitive.Title>
            {description ? (
              <DialogPrimitive.Description className="mt-2 text-sm text-pretty text-muted-foreground">
                {description}
              </DialogPrimitive.Description>
            ) : (
              <DialogPrimitive.Description className="sr-only">
                {title}
              </DialogPrimitive.Description>
            )}
          </div>
          {locked ? (
            <span className="size-11 shrink-0" />
          ) : (
            <DialogPrimitive.Close
              aria-label="Close"
              className="grid size-11 shrink-0 place-items-center rounded-sm text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="size-4" aria-hidden="true" />
            </DialogPrimitive.Close>
          )}
        </div>
        <div className="p-6">{children}</div>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
