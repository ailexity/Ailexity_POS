import { useState, useEffect, useCallback } from 'react';
import api from '../api';

// Statuses that represent live kitchen work still on the table.
// Terminal statuses (completed/cancelled) are intentionally excluded.
const ACTIVE_KOT_STATUSES = new Set(['pending', 'printed', 'preparing', 'ready']);

// Used only as a deterministic tie-breaker when two active KOTs share the
// same updated time — the more progressed status wins.
const KOT_STATUS_RANK = {
    pending: 1, printed: 2, preparing: 3, ready: 4,
};

const KOT_STATUS_LABELS = {
    pending: 'Pending', preparing: 'Preparing', ready: 'Ready',
    printed: 'Printed', completed: 'Completed', cancelled: 'Cancelled',
};

const KOT_STATUS_COLORS = {
    pending: '#f59e0b', preparing: '#f97316', ready: '#22c55e',
    printed: '#0ea5e9', completed: '#6b7280', cancelled: '#ef4444',
};

/**
 * Polls KOT statuses every `intervalMs` milliseconds.
 * Returns { kotStatuses, refresh } where kotStatuses is a map from table_number → { status, label, color }
 * Pass isRetailer=true to skip entirely.
 */
export function useKOTStatus(isRetailer = false, intervalMs = 10000) {
    const [kotStatuses, setKotStatuses] = useState({});

    const refresh = useCallback(async () => {
        if (isRetailer) { setKotStatuses({}); return; }
        try {
            const res = await api.get('/kots/');
            const kotsData = Array.isArray(res.data) ? res.data : [];
            const map = {};
            kotsData.forEach((kot) => {
                const key = kot.table_number != null ? String(kot.table_number) : null;
                if (!key) return;
                // Only surface live kitchen work; ignore completed/cancelled so
                // cleared tables don't keep showing a stale order status.
                if (!ACTIVE_KOT_STATUSES.has(kot.status)) return;

                const updatedAt = new Date(kot.updated_at || kot.created_at || 0);
                const existing = map[key];
                // Show the table's most recently updated active order. Tie-break
                // on status progression so the result is deterministic.
                const isNewer = !existing
                    || updatedAt > existing.updatedAt
                    || (updatedAt.getTime() === existing.updatedAt.getTime()
                        && (KOT_STATUS_RANK[kot.status] ?? 1) > (KOT_STATUS_RANK[existing.status] ?? 1));

                if (isNewer) {
                    map[key] = {
                        status: kot.status,
                        label: KOT_STATUS_LABELS[kot.status] || kot.status,
                        color: KOT_STATUS_COLORS[kot.status] || '#94a3b8',
                        updatedAt,
                    };
                }
            });
            setKotStatuses(map);
        } catch {
            setKotStatuses({});
        }
    }, [isRetailer]);

    useEffect(() => {
        refresh();
        if (isRetailer) return;
        const id = setInterval(refresh, intervalMs);
        return () => clearInterval(id);
    }, [refresh, isRetailer, intervalMs]);

    return { kotStatuses, refresh };
}
