"use client";

import { cn } from "@/lib/utils";
import { Upload, CheckCircle, AlertCircle, FileText, X } from "lucide-react";
import { useRef, useState } from "react";
import { Badge } from "@/components/ui/Badge";

type UploadStatus = "idle" | "uploading" | "verified" | "error";

interface CredentialUploadProps {
  label: string;
  acceptedFormats?: string;
  required?: boolean;
  onUpload?: (file: File) => Promise<void>;
  className?: string;
}

export function CredentialUpload({
  label,
  acceptedFormats = "PDF, JPG, PNG (max 10MB)",
  required,
  onUpload,
  className,
}: CredentialUploadProps) {
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setFileName(file.name);
    setStatus("uploading");
    try {
      await onUpload?.(file);
      setStatus("verified");
    } catch {
      setStatus("error");
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const reset = () => {
    setStatus("idle");
    setFileName(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2">
        <label className="text-xs font-semibold font-label uppercase tracking-wider text-on-surface-variant">
          {label}
        </label>
        {required && <Badge variant="stat" size="sm">Required</Badge>}
        {status === "verified" && <Badge variant="success" size="sm">Verified</Badge>}
        {status === "error" && <Badge variant="stat" size="sm">Failed</Badge>}
      </div>

      {status === "idle" || status === "uploading" ? (
        <div
          className={cn(
            "relative flex flex-col items-center justify-center gap-3 p-6 rounded-xl border-2 border-dashed transition-colors cursor-pointer",
            dragging
              ? "border-medical-blue bg-blue-50"
              : "border-outline-variant hover:border-medical-blue hover:bg-surface-container"
          )}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            className="sr-only"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
          {status === "uploading" ? (
            <div className="flex flex-col items-center gap-2 animate-pulse">
              <FileText className="h-8 w-8 text-medical-blue" />
              <p className="text-sm text-medical-blue font-medium">Verifying {fileName}…</p>
            </div>
          ) : (
            <>
              <Upload className="h-8 w-8 text-outline" />
              <div className="text-center">
                <p className="text-sm font-medium text-on-surface">Drop file or click to upload</p>
                <p className="text-xs text-on-surface-variant mt-0.5">{acceptedFormats}</p>
              </div>
            </>
          )}
        </div>
      ) : (
        <div
          className={cn(
            "flex items-center gap-3 p-4 rounded-xl border",
            status === "verified"
              ? "bg-green-50 border-green-200"
              : "bg-red-50 border-red-200"
          )}
        >
          {status === "verified"
            ? <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
            : <AlertCircle className="h-5 w-5 text-emergency-red shrink-0" />
          }
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-on-surface truncate">{fileName}</p>
            <p className="text-xs text-on-surface-variant">
              {status === "verified" ? "Document verified" : "Verification failed — try again"}
            </p>
          </div>
          <button onClick={reset} className="shrink-0 p-1 rounded hover:bg-black/10 transition-colors" aria-label="Remove">
            <X className="h-4 w-4 text-on-surface-variant" />
          </button>
        </div>
      )}
    </div>
  );
}
