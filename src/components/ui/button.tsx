import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

const buttonVariants = cva(
  "inline-flex h-11 items-center justify-center gap-2 rounded-sm px-4 text-sm font-medium transition-[scale,background-color,opacity] duration-150 ease-out active:not-disabled:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-40",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground hover:bg-accent",
        secondary: "border border-border bg-card text-foreground hover:bg-muted",
        quiet: "bg-transparent px-0 text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground",
      },
    },
    defaultVariants: { variant: "primary" },
  },
);

export function Button({
  className,
  variant,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>) {
  return <button type={type} className={cn(buttonVariants({ variant }), className)} {...props} />;
}
