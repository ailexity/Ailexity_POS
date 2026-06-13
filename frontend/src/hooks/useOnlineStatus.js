import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../api';
import { getPendingInvoices, removePendingInvoice, getPendingCount } from '../utils/offlineQueue';

/**
 * Tracks online/offline state and automatically replays any invoices that were
 * queued while the device was offline.
 *
 * Returns:
 *   isOnline      boolean
 *   pendingCount  number  — how many invoices are waiting to sync
 *   syncing       boolean — true while replay is in progress
 *   syncResult    { synced, failed } | null  — cleared after 5 s
 *   syncNow       () => void  — manually trigger sync
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);
  const syncRef = useRef(false); // guard against concurrent syncs

  const refreshCount = useCallback(async () => {
    try {
      const n = await getPendingCount();
      setPendingCount(n);
    } catch {
      // IndexedDB unavailable — non-fatal
    }
  }, []);

  const syncNow = useCallback(async () => {
    if (syncRef.current || !navigator.onLine) return;
    let pending;
    try {
      pending = await getPendingInvoices();
    } catch {
      return;
    }
    if (pending.length === 0) return;

    syncRef.current = true;
    setSyncing(true);
    let synced = 0;
    let failed = 0;

    for (const entry of pending) {
      try {
        // _skipOfflineQueue tells the api.js interceptor not to re-queue this
        await api.post('/invoices/', entry.payload, { _skipOfflineQueue: true });
        await removePendingInvoice(entry.id);
        synced++;
      } catch {
        failed++;
      }
    }

    syncRef.current = false;
    setSyncing(false);
    setSyncResult({ synced, failed });
    await refreshCount();

    const clearTimer = setTimeout(() => setSyncResult(null), 5000);
    return () => clearTimeout(clearTimer);
  }, [refreshCount]);

  useEffect(() => {
    // Seed count on mount
    refreshCount();

    const handleOnline = () => {
      setIsOnline(true);
      syncNow();
    };
    const handleOffline = () => setIsOnline(false);
    // api.js fires this whenever an invoice is queued
    const handleQueued = () => refreshCount();

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('invoice-queued', handleQueued);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('invoice-queued', handleQueued);
    };
  }, [syncNow, refreshCount]);

  return { isOnline, pendingCount, syncing, syncResult, syncNow };
}
