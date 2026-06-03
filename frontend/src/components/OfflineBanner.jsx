import React from 'react';
import { WifiOff, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

/**
 * Sticky top banner that shows:
 *   - Red bar when offline
 *   - Blue bar while syncing queued invoices
 *   - Green bar for 5 s after sync completes
 *   - Nothing when online with no pending work
 */
const OfflineBanner = ({ isOnline, pendingCount, syncing, syncResult, onSyncNow }) => {
  if (syncing) {
    return (
      <div style={styles.bar('#3b82f6', '#eff6ff')}>
        <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }} />
        <span>Syncing {pendingCount} queued invoice{pendingCount !== 1 ? 's' : ''} to server…</span>
      </div>
    );
  }

  if (syncResult) {
    const allGood = syncResult.failed === 0;
    return (
      <div style={styles.bar(allGood ? '#16a34a' : '#f97316', allGood ? '#f0fdf4' : '#fff7ed')}>
        {allGood
          ? <CheckCircle size={14} style={{ flexShrink: 0 }} />
          : <AlertCircle size={14} style={{ flexShrink: 0 }} />}
        <span>
          {syncResult.synced > 0 && `${syncResult.synced} invoice${syncResult.synced !== 1 ? 's' : ''} synced.`}
          {syncResult.failed > 0 && ` ${syncResult.failed} failed — will retry when online.`}
        </span>
      </div>
    );
  }

  if (!isOnline) {
    return (
      <div style={styles.bar('#dc2626', '#fef2f2')}>
        <WifiOff size={14} style={{ flexShrink: 0 }} />
        <span>
          You're offline.
          {pendingCount > 0
            ? ` ${pendingCount} invoice${pendingCount !== 1 ? 's' : ''} queued — will sync when reconnected.`
            : ' Billing works — invoices will be queued until you reconnect.'}
        </span>
      </div>
    );
  }

  if (pendingCount > 0 && !syncing) {
    return (
      <div style={styles.bar('#f59e0b', '#fffbeb')}>
        <AlertCircle size={14} style={{ flexShrink: 0 }} />
        <span>{pendingCount} invoice{pendingCount !== 1 ? 's' : ''} pending sync.</span>
        <button
          onClick={onSyncNow}
          style={{ marginLeft: 10, background: '#f59e0b', color: '#fff', border: 'none', borderRadius: 6, padding: '2px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
        >
          Sync Now
        </button>
      </div>
    );
  }

  return null;
};

const styles = {
  bar: (color, bg) => ({
    position: 'sticky',
    top: 0,
    zIndex: 1050,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 16px',
    background: bg,
    color: color,
    fontSize: 13,
    fontWeight: 600,
    borderBottom: `1px solid ${color}33`,
    boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
    animation: 'slideDown 0.2s ease',
  }),
};

export default OfflineBanner;
