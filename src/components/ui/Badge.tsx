import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

const badgeVariants = cva(
  "inline-flex items-center gap-1 font-label font-semibold uppercase tracking-wider transition-colors",
  {
    variants: {
      variant: {
        default:   "bg-surface-container text-on-surface-variant",
        primary:   "bg-midnight-navy text-white",
        secondary: "bg-medical-blue text-white",
        stat:      "bg-emergency-red text-white",
        urgent:    "bg-warning-amber text-midnight-navy",
        routine:   "bg-surface-container-high text-on-surface-variant",
        success:   "bg-green-100 text-green-800",
        offline:   "bg-slate-200 text-slate-600",
        synced:    "bg-green-100 text-green-700",
        conflict:  "bg-orange-100 text-orange-700",
        pending:   "bg-warning-amber/20 text-amber-700",
        billed:    "bg-blue-100 text-blue-700",
      },
      size: {
        sm: "px-1.5 py-0.5 text-[10px] rounded",
        md: "px-2 py-0.5 text-xs rounded-md",
        lg: "px-3 py-1 text-xs rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, size, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, size }), className)} {...props} />;
}
