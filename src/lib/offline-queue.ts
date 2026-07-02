"use client";

import { supabase, supabaseConfigured } from "@/lib/supabase";

// ── Offline-first write buffer ────────────────────────────────────────────────
// Field writes (specimen chain-of-custody, order status) are executed
// immediately when online; when the device is offline or the write fails,
// they are buffered to localStorage in FIFO order and flushed on reconnect.
// UI can subscribe to queue changes via the "offline-queue-change" event.

export type QueuedWrite =
  | {
      kind: "specimen_insert";
      payload: {
        order_id: string;
        accession_number: string;
        specimen_type: string;
        expires_at: string;
      };
    }
  | { kind: "specimen_update"; orderId: string; payload: Record<string, string | null> }
  | { kind: "order_status"; orderId: string; status: string };

interface StoredWrite {
  id: string;
  queuedAt: string;
  write: QueuedWrite;
}

const STORAGE_KEY = "xray_offline_write_queue";
export const QUEUE_CHANGE_EVENT = "offline-queue-change";

function readQueue(): StoredWrite[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as StoredWrite[];
  } catch {
    return [];
  }
}

function writeQueue(queue: StoredWrite[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  window.dispatchEvent(new CustomEvent(QUEUE_CHANGE_EVENT, { detail: queue.length }));
}

export function pendingWriteCount(): number {
  return readQueue().length;
}

function isOffline(): boolean {
  return typeof navigator !== "undefined" && !navigator.onLine;
}

function enqueue(write: QueuedWrite) {
  const queue = readQueue();
  queue.push({
    id: `qw-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    queuedAt: new Date().toISOString(),
    write,
  });
  writeQueue(queue);
}

async function execute(write: QueuedWrite): Promise<void> {
  switch (write.kind) {
    case "specimen_insert": {
      const { error } = await supabase.from("specimens").insert(write.payload);
      if (error) throw new Error(error.message);
      break;
    }
    case "specimen_update": {
      const { error } = await supabase
        .from("specimens")
        .update(write.payload)
        .eq("order_id", write.orderId);
      if (error) throw new Error(error.message);
      break;
    }
    case "order_status": {
      const { error } = await supabase
        .from("orders")
        .update({ status: write.status })
        .eq("id", write.orderId);
      if (error) throw new Error(error.message);
      break;
    }
  }
}

/**
 * Execute a write now if online, otherwise buffer it locally.
 * Returns how the write was handled so callers can surface sync state.
 */
export async function submitWrite(write: QueuedWrite): Promise<"executed" | "queued"> {
  if (!supabaseConfigured) return "executed"; // mock mode — nothing to persist
  if (isOffline()) {
    enqueue(write);
    return "queued";
  }
  try {
    await execute(write);
    return "executed";
  } catch {
    enqueue(write);
    return "queued";
  }
}

/**
 * Flush buffered writes in FIFO order. Stops at the first failure so
 * ordering guarantees hold (e.g. specimen insert before its update).
 * Returns the number of writes flushed.
 */
export async function flushWrites(): Promise<number> {
  if (!supabaseConfigured || isOffline()) return 0;
  let flushed = 0;
  let queue = readQueue();
  while (queue.length > 0) {
    try {
      await execute(queue[0].write);
    } catch {
      break;
    }
    queue = queue.slice(1);
    writeQueue(queue);
    flushed++;
  }
  return flushed;
}
