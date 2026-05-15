"use client";

import { cn } from "@/lib/utils";
import { CheckCircle, AlertTriangle, XCircle, Info, X } from "lucide-react";
import type { ReactNode } from "react";

export type ToastVariant = "success" | "warning" | "error" | "info";

interface ToastProps {
  variant?: ToastVariant;
  title: string;
  description?: string;
  onDismiss?: () => void;
  action?: ReactNode;
}

const iconMap: Record<ToastVariant, ReactNode> = {
  success: <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />,
  warning: <AlertTriangle className="h-5 w-5 text-warning-amber shrink-0" />,
  error:   <XCircle className="h-5 w-5 text-emergency-red shrink-0" />,
  info:    <Info className="h-5 w-5 text-medical-blue shrink-0" />,
};

const styleMap: Record<ToastVariant, string> = {
  success: "border-green-200 bg-green-50",
  warning: "border-amber-200 bg-amber-50",
  error:   "border-red-200 bg-red-50",
  info:    "border-blue-200 bg-blue-50",
};

export function Toast({ variant = "info", title, description, onDismiss, action }: ToastProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-3 w-full max-w-sm rounded-xl border px-4 py-3 shadow-card-md animate-fade-in",
        styleMap[variant]
      )}
    >
      {iconMap[variant]}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-on-surface">{title}</p>
        {description && <p className="text-xs text-on-surface-variant mt-0.5">{description}</p>}
        {action && <div className="mt-2">{action}</div>}
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="shrink-0 rounded p-0.5 hover:bg-black/10 transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4 text-on-surface-variant" />
        </button>
      )}
    </div>
  );
}

export function ToastContainer({ children }: { children: ReactNode }) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm">
      {children}
    </div>
  );
}
