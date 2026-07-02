"use client";

import { useEffect, useState } from "react";
import { flushWrites, pendingWriteCount, QUEUE_CHANGE_EVENT } from "@/lib/offline-queue";

/**
 * Tracks the local offline write buffer and flushes it automatically
 * when connectivity returns. Mount once per shell (e.g. TechnicianShell).
 */
export function useOfflineWrites() {
  const [pendingWrites, setPendingWrites] = useState(0);

  useEffect(() => {
    setPendingWrites(pendingWriteCount());

    const onQueueChange = () => setPendingWrites(pendingWriteCount());
    const onOnline = () => { flushWrites(); };

    window.addEventListener(QUEUE_CHANGE_EVENT, onQueueChange);
    window.addEventListener("online", onOnline);

    // Flush anything left over from a previous session
    flushWrites();

    return () => {
      window.removeEventListener(QUEUE_CHANGE_EVENT, onQueueChange);
      window.removeEventListener("online", onOnline);
    };
  }, []);

  return { pendingWrites };
}
