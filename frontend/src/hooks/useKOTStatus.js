import { useState, useEffect, useCallback } from 'react';
import api from '../api';

const KOT_STATUS_RANK = {
    cancelled: 0, completed: 0,
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
                const rank = KOT_STATUS_RANK[kot.status] ?? 1;
                const existing = map[key];
                const existingRank = existing ? (KOT_STATUS_RANK[existing.status] ?? 1) : -1;
                const updatedAt = new Date(kot.updated_at || kot.created_at || 0);
                if (!existing || rank > existingRank || updatedAt > existing.updatedAt) {
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
