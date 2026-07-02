"use client";

import { useCallback, useEffect, useState } from "react";
import { Droplet, FileText, CheckCircle2, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { BarcodeScanner } from "@/components/domain/BarcodeScanner";
import { supabase, supabaseConfigured } from "@/lib/supabase";
import { submitWrite } from "@/lib/offline-queue";
import { cn } from "@/lib/utils";
import type { Order, OrderStatus } from "@/lib/utils";

const VESSEL_TYPES = ["LAVENDER TOP", "RED TOP"];
const STORAGE_TEMPS = ["REFRIGERATED", "AMBIENT", "FROZEN"];
const DESTINATION_LABS = [
  "Central Lab - Level 2",
  "Stat Lab - ER Wing",
  "On-site Satellite Lab",
  "External Courier Pickup",
];

interface SpecimenRecord {
  specimen_type: string;
  accession_number: string;
  expires_at: string;
  collected_at?: string;
}

interface PhlebotomyDrawPanelProps {
  order: Order;
  onUpdateStatus: (id: string, status: OrderStatus) => Promise<void>;
  /** Called after a successful lab drop-off (e.g. close a sheet). */
  onDelivered?: () => void;
}

/**
 * Shared bedside phlebotomy workflow: specimen draw capture (with vial
 * barcode scanning), transit-mode lock with stability countdown, and
 * chain-of-custody drop-off verification.
 *
 * Owns the lab-specific action buttons for the "in-progress" and
 * "in-transit" states; parents keep navigation / radiology actions.
 */
export function PhlebotomyDrawPanel({ order, onUpdateStatus, onDelivered }: PhlebotomyDrawPanelProps) {
  // Draw state
  const [specimenType, setSpecimenType] = useState(VESSEL_TYPES[0]);
  const [accessionNumber, setAccessionNumber] = useState("");
  const [stabilityHours, setStabilityHours] = useState(4);
  const [drawAttempted, setDrawAttempted] = useState(false);

  // Transit state
  const [destinationLab, setDestinationLab] = useState(DESTINATION_LABS[0]);
  const [storageTemp, setStorageTemp] = useState("AMBIENT");
  const [transitNotes, setTransitNotes] = useState("");

  // Chain-of-custody drop-off state
  const [custodyId, setCustodyId] = useState("");
  const [deliverAttempted, setDeliverAttempted] = useState(false);

  // Which scanner is open: vial label at draw, drop-station badge at delivery
  const [scannerTarget, setScannerTarget] = useState<"accession" | "custody" | null>(null);

  const [specimen, setSpecimen] = useState<SpecimenRecord | null>(null);
  const [timeLeft, setTimeLeft] = useState("00:00:00");
  const [percentLeft, setPercentLeft] = useState(100);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);

  const isInTransit = order.status === "in-transit";

  // Reset + fetch the specimen record when the order changes
  useEffect(() => {
    setAccessionNumber("");
    setSpecimenType(VESSEL_TYPES[0]);
    setStabilityHours(4);
    setDrawAttempted(false);
    setCustodyId("");
    setDeliverAttempted(false);

    const fetchSpecimen = async () => {
      if (!supabaseConfigured) {
        if (order.status === "in-transit" || order.status === "complete") {
          setSpecimen({
            specimen_type: "LAVENDER TOP",
            accession_number: `LACT-${order.id.split("-")[1] || "9902"}-1`,
            expires_at: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
            collected_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          });
        } else {
          setSpecimen(null);
        }
        return;
      }

      const { data } = await supabase
        .from("specimens")
        .select("*")
        .eq("order_id", order.id)
        .maybeSingle();
      setSpecimen(data ?? null);
    };

    fetchSpecimen();
  }, [order]);

  // Stability countdown — window derived from collected_at → expires_at
  // when both are known, otherwise falls back to a 4-hour window.
  useEffect(() => {
    if (!specimen?.expires_at) return;

    const expiry = new Date(specimen.expires_at).getTime();
    const totalWindow = specimen.collected_at
      ? Math.max(expiry - new Date(specimen.collected_at).getTime(), 60 * 1000)
      : 4 * 60 * 60 * 1000;

    const updateTimer = () => {
      const diff = expiry - Date.now();
      if (diff <= 0) {
        setTimeLeft("EXPIRED");
        setPercentLeft(0);
        return;
      }
      const hrs = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft(
        `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
      );
      setPercentLeft(Math.max(0, Math.min(100, (diff / totalWindow) * 100)));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [specimen]);

  const handleScanDetect = useCallback((code: string) => {
    setScannerTarget(target => {
      if (target === "accession") setAccessionNumber(code);
      if (target === "custody") setCustodyId(code);
      return null;
    });
  }, []);

  // Complete draw → persist specimen (offline-buffered) → Transit Mode
  const handleCompleteDraw = async () => {
    setDrawAttempted(true);
    if (!accessionNumber.trim()) return;

    const collectedAt = new Date().toISOString();
    const expiresAt = new Date(Date.now() + stabilityHours * 60 * 60 * 1000).toISOString();

    await submitWrite({
      kind: "specimen_insert",
      payload: {
        order_id: order.id,
        accession_number: accessionNumber,
        specimen_type: specimenType,
        expires_at: expiresAt,
      },
    });

    setSpecimen({
      specimen_type: specimenType,
      accession_number: accessionNumber,
      expires_at: expiresAt,
      collected_at: collectedAt,
    });

    await onUpdateStatus(order.id, "in-transit");
  };

  // Drop-off: requires the receiving staff credential (scanned or typed)
  const handleDeliverToLab = async () => {
    setDeliverAttempted(true);
    if (!custodyId.trim()) return;

    await submitWrite({
      kind: "specimen_update",
      orderId: order.id,
      payload: {
        delivered_at: new Date().toISOString(),
        custody_transferred_to: custodyId.trim(),
        destination_lab: destinationLab,
        storage_temp: storageTemp,
        transit_notes: transitNotes.trim() || null,
      },
    });

    await onUpdateStatus(order.id, "complete");

    setShowSuccessOverlay(true);
    setTimeout(() => {
      setShowSuccessOverlay(false);
      onDelivered?.();
    }, 2000);
  };

  return (
    <>
      {/* DRAW PANEL — in-progress */}
      {order.status === "in-progress" && (
        <section className="space-y-4 py-2 animate-in fade-in duration-300">
          <h3 className="text-xs font-label font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-1">
            <FileText className="h-3.5 w-3.5 text-laboratory-rose" /> Bedside Specimen Draw
          </h3>

          {/* Vessel type */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block mb-1.5">Vessel Selection</label>
            <div className="grid grid-cols-2 gap-2">
              {VESSEL_TYPES.map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSpecimenType(type)}
                  className={cn(
                    "py-2 rounded-lg text-[10px] font-bold font-mono tracking-wider border-2 transition-all text-center",
                    specimenType === type
                      ? "border-laboratory-rose bg-laboratory-rose/5 text-laboratory-rose"
                      : "border-outline-variant/40 bg-white text-on-surface-variant hover:border-outline-variant"
                  )}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Accession (scan or type) + stability window */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block mb-1.5">Accession Code</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={accessionNumber}
                  onChange={e => setAccessionNumber(e.target.value.toUpperCase())}
                  placeholder="Scan vial or type code"
                  className={cn(
                    "flex-1 min-w-0 h-10 px-3 rounded-lg border border-outline-variant/60 bg-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-laboratory-rose",
                    drawAttempted && !accessionNumber.trim() && "border-error focus:ring-error"
                  )}
                />
                <button
                  type="button"
                  onClick={() => setScannerTarget("accession")}
                  className="h-10 w-10 shrink-0 rounded-lg border-2 border-laboratory-rose/40 bg-laboratory-rose/5 text-laboratory-rose flex items-center justify-center hover:bg-laboratory-rose/10 transition-colors"
                  aria-label="Scan vial barcode"
                >
                  <ScanLine className="h-4 w-4" />
                </button>
              </div>
              {drawAttempted && !accessionNumber.trim() && (
                <p className="text-[10px] text-error font-semibold mt-1">Scan the vial barcode or enter the accession code</p>
              )}
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block mb-1.5">Stability window</label>
              <select
                value={stabilityHours}
                onChange={e => setStabilityHours(Number(e.target.value))}
                className="w-full h-10 px-3 rounded-lg border border-outline-variant/60 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-laboratory-rose"
              >
                <option value={1}>1 Hour (STAT)</option>
                <option value={2}>2 Hours</option>
                <option value={4}>4 Hours (Standard)</option>
                <option value={8}>8 Hours</option>
              </select>
            </div>
          </div>
        </section>
      )}

      {/* TRANSIT MODE PANEL — in-transit */}
      {isInTransit && specimen && (
        <section className="space-y-4 py-2 animate-in fade-in duration-300">
          <div className="bg-laboratory-rose/5 p-4 rounded-xl border border-laboratory-rose/20 flex items-center gap-3">
            <Droplet className="h-6 w-6 text-laboratory-rose animate-pulse" />
            <div>
              <h4 className="text-xs font-bold text-laboratory-rose uppercase tracking-wider">Cold Chain Transit Active</h4>
              <p className="text-[10px] text-on-surface-variant">Specimen locked and custody log open</p>
            </div>
          </div>

          {/* Stability countdown */}
          <div className="bg-white p-4 rounded-xl border border-outline-variant/40">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-bold font-mono uppercase text-on-surface-variant">Vial Expiry Timer</span>
              <span className="font-mono font-bold text-sm text-laboratory-rose tracking-widest">{timeLeft}</span>
            </div>
            <div className="w-full bg-outline-variant/30 h-1.5 rounded-full overflow-hidden mb-1">
              <div
                className={cn(
                  "h-full transition-all duration-1000",
                  percentLeft > 50 ? "bg-laboratory-emerald" : percentLeft > 20 ? "bg-warning-amber" : "bg-emergency-red animate-pulse"
                )}
                style={{ width: `${percentLeft}%` }}
              />
            </div>
            <div className="flex justify-between text-[9px] text-on-surface-variant font-semibold">
              <span>Accession: {specimen.accession_number}</span>
              <span>Tube: {specimen.specimen_type}</span>
            </div>
          </div>

          {/* Destination + temperature */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block mb-1.5 font-mono">Destination Lab</label>
              <select
                value={destinationLab}
                onChange={e => setDestinationLab(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-outline-variant/60 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-laboratory-rose"
              >
                {DESTINATION_LABS.map(lab => <option key={lab}>{lab}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block mb-1.5 font-mono">Storage Temperature</label>
              <div className="grid grid-cols-3 gap-1 bg-surface-container p-1 rounded-lg">
                {STORAGE_TEMPS.map(temp => (
                  <button
                    key={temp}
                    type="button"
                    onClick={() => setStorageTemp(temp)}
                    className={cn(
                      "py-1.5 rounded text-[8px] font-bold tracking-wider uppercase transition-all",
                      storageTemp === temp
                        ? "bg-white text-laboratory-rose shadow-sm"
                        : "text-on-surface-variant hover:text-on-surface"
                    )}
                  >
                    {temp}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Transit notes */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block mb-1.5 font-mono">Transit Notes</label>
            <textarea
              value={transitNotes}
              onChange={e => setTransitNotes(e.target.value)}
              placeholder="e.g. Icepack verified, tube fully sealed..."
              rows={2}
              className="w-full text-xs p-3 rounded-lg border border-outline-variant/60 bg-white focus:outline-none focus:ring-2 focus:ring-laboratory-rose"
            />
          </div>

          {/* Custody transfer — receiving staff credential */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block mb-1.5 font-mono">Receiving Staff ID</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={custodyId}
                onChange={e => setCustodyId(e.target.value.toUpperCase())}
                placeholder="Scan drop-station badge or type staff ID"
                className={cn(
                  "flex-1 min-w-0 h-10 px-3 rounded-lg border border-outline-variant/60 bg-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-laboratory-emerald",
                  deliverAttempted && !custodyId.trim() && "border-error focus:ring-error"
                )}
              />
              <button
                type="button"
                onClick={() => setScannerTarget("custody")}
                className="h-10 w-10 shrink-0 rounded-lg border-2 border-laboratory-emerald/40 bg-laboratory-emerald/5 text-laboratory-emerald flex items-center justify-center hover:bg-laboratory-emerald/10 transition-colors"
                aria-label="Scan drop-station badge"
              >
                <ScanLine className="h-4 w-4" />
              </button>
            </div>
            {deliverAttempted && !custodyId.trim() && (
              <p className="text-[10px] text-error font-semibold mt-1">
                Custody transfer requires the receiving staff credential
              </p>
            )}
          </div>
        </section>
      )}

      {/* Lab action buttons */}
      {order.status === "in-progress" && (
        <Button
          variant="primary"
          size="lg"
          className="flex-1 gap-2 bg-laboratory-rose hover:bg-rose-700 h-12 rounded-xl w-full"
          onClick={handleCompleteDraw}
          disabled={!accessionNumber.trim()}
        >
          <CheckCircle2 className="h-4 w-4" /> Complete Draw & Lock
        </Button>
      )}
      {isInTransit && (
        <Button
          variant="primary"
          size="lg"
          className="flex-1 gap-2 bg-laboratory-emerald hover:bg-emerald-700 h-12 rounded-xl w-full"
          onClick={handleDeliverToLab}
        >
          <CheckCircle2 className="h-4 w-4" /> Deliver to Lab (Drop-off)
        </Button>
      )}

      {/* Vial / badge scanner */}
      {scannerTarget && (
        <BarcodeScanner
          title={scannerTarget === "accession" ? "Scan Vial Barcode" : "Scan Drop-Station Badge"}
          hint={
            scannerTarget === "accession"
              ? "Align the vial label barcode inside the frame to bind it to this order."
              : "Scan the receiving clinic's drop-station badge to verify custody transfer."
          }
          onDetect={handleScanDetect}
          onClose={() => setScannerTarget(null)}
        />
      )}

      {/* Success overlay */}
      {showSuccessOverlay && (
        <div className="fixed inset-0 z-[100] bg-laboratory-emerald/95 flex flex-col items-center justify-center text-white transition-opacity duration-300 animate-fade-in">
          <CheckCircle2 className="h-20 w-20 mb-4 animate-bounce text-white" />
          <h2 className="text-xl font-bold font-headline">Custody Transferred</h2>
          <p className="text-sm opacity-90">Delivery logged · TAT clock closed</p>
        </div>
      )}
    </>
  );
}
