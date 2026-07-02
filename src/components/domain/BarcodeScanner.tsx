"use client";

import { useEffect, useRef, useState } from "react";
import { X, Camera, Keyboard, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

// Minimal typings for the Shape Detection API (not yet in lib.dom)
interface DetectedBarcode { rawValue: string; }
type BarcodeDetectorInstance = { detect(source: HTMLVideoElement): Promise<DetectedBarcode[]> };
type BarcodeDetectorCtor = new (options?: { formats?: string[] }) => BarcodeDetectorInstance;

function getBarcodeDetector(): BarcodeDetectorCtor | null {
  if (typeof window === "undefined") return null;
  return (window as unknown as { BarcodeDetector?: BarcodeDetectorCtor }).BarcodeDetector ?? null;
}

interface BarcodeScannerProps {
  title: string;
  hint?: string;
  onDetect: (code: string) => void;
  onClose: () => void;
}

/**
 * Camera-fed barcode scanner (vial labels, drop-station badges).
 * Uses the native BarcodeDetector API when available; always offers
 * manual entry as a fallback for unsupported browsers or damaged labels.
 */
export function BarcodeScanner({ title, hint, onDetect, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraState, setCameraState] = useState<"starting" | "active" | "unavailable">("starting");
  const [manualCode, setManualCode] = useState("");

  useEffect(() => {
    let cancelled = false;
    let scanTimer: ReturnType<typeof setInterval> | null = null;

    const start = async () => {
      const Detector = getBarcodeDetector();
      if (!Detector || !navigator.mediaDevices?.getUserMedia) {
        setCameraState("unavailable");
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        if (cancelled) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setCameraState("active");

        const detector = new Detector({
          formats: ["code_128", "code_39", "ean_13", "qr_code", "data_matrix"],
        });
        scanTimer = setInterval(async () => {
          if (!videoRef.current || videoRef.current.readyState < 2) return;
          try {
            const barcodes = await detector.detect(videoRef.current);
            if (barcodes.length > 0 && barcodes[0].rawValue) {
              onDetect(barcodes[0].rawValue.toUpperCase());
            }
          } catch {
            // detection errors on individual frames are non-fatal
          }
        }, 400);
      } catch {
        if (!cancelled) setCameraState("unavailable");
      }
    };

    start();
    return () => {
      cancelled = true;
      if (scanTimer) clearInterval(scanTimer);
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, [onDetect]);

  const submitManual = () => {
    if (manualCode.trim()) onDetect(manualCode.trim().toUpperCase());
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-midnight-navy/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-card-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-outline-variant/30">
          <div className="flex items-center gap-2">
            <ScanLine className="h-4 w-4 text-laboratory-rose" />
            <h3 className="text-sm font-bold text-on-surface">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:bg-surface-container-highest transition-colors"
            aria-label="Close scanner"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Camera viewport */}
        <div className="relative bg-midnight-navy aspect-[4/3]">
          {cameraState !== "unavailable" ? (
            <>
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                muted
                playsInline
              />
              {cameraState === "active" && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-4/5 h-1/3 border-2 border-laboratory-rose/80 rounded-lg relative overflow-hidden scanner-overlay">
                    <div className="scan-line" />
                  </div>
                </div>
              )}
              {cameraState === "starting" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-400">
                  <Camera className="h-8 w-8 animate-pulse" />
                  <p className="text-xs">Requesting camera…</p>
                </div>
              )}
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-400 px-6 text-center">
              <Keyboard className="h-8 w-8" />
              <p className="text-xs">
                Camera scanning is not available on this device. Enter the code manually below.
              </p>
            </div>
          )}
        </div>

        {/* Manual entry fallback */}
        <div className="px-5 py-4 space-y-3">
          {hint && <p className="text-[10px] text-on-surface-variant">{hint}</p>}
          <div className="flex gap-2">
            <input
              type="text"
              value={manualCode}
              onChange={e => setManualCode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === "Enter" && submitManual()}
              placeholder="Enter code manually"
              className={cn(
                "flex-1 h-11 px-3 rounded-lg border border-outline-variant/60 bg-white font-mono text-xs",
                "focus:outline-none focus:ring-2 focus:ring-laboratory-rose"
              )}
            />
            <Button
              variant="primary"
              size="md"
              className="bg-laboratory-rose hover:bg-rose-700 h-11"
              onClick={submitManual}
              disabled={!manualCode.trim()}
            >
              Use Code
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
