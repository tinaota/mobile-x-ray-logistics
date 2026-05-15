"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { forwardRef, type ButtonHTMLAttributes } from "react";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 touch-target select-none",
  {
    variants: {
      variant: {
        primary:
          "bg-medical-blue text-white hover:bg-blue-600 active:bg-blue-700 focus-visible:ring-medical-blue",
        secondary:
          "bg-midnight-navy text-white hover:bg-slate-800 active:bg-slate-900 focus-visible:ring-midnight-navy",
        outline:
          "border border-outline bg-transparent text-on-surface hover:bg-surface-container focus-visible:ring-midnight-navy",
        ghost:
          "bg-transparent text-on-surface hover:bg-surface-container focus-visible:ring-midnight-navy",
        danger:
          "bg-emergency-red text-white hover:bg-red-600 active:bg-red-700 focus-visible:ring-emergency-red",
        warning:
          "bg-warning-amber text-midnight-navy hover:bg-amber-500 active:bg-amber-600 focus-visible:ring-warning-amber",
        stat:
          "bg-emergency-red text-white font-bold uppercase tracking-wider hover:bg-red-600 focus-visible:ring-emergency-red",
      },
      size: {
        sm:   "h-8 px-3 text-xs rounded-md",
        md:   "h-10 px-4 text-sm rounded-lg",
        lg:   "h-12 px-6 text-base rounded-lg",
        xl:   "h-14 px-8 text-base rounded-xl",
        icon: "h-10 w-10 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    >
      {loading && (
        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      )}
      {children}
    </button>
  )
);

Button.displayName = "Button";

export { Button, buttonVariants };
