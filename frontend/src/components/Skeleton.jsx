import React from 'react';

/* ─── base pulse element ─────────────────────────────────────────────────── */
const Pulse = ({ style = {}, className = '' }) => (
  <div
    className={`skeleton-pulse ${className}`}
    style={style}
    aria-hidden="true"
  />
);

/* ─── primitives ─────────────────────────────────────────────────────────── */
export const SkeletonLine = ({ width = '100%', height = 14, style = {} }) => (
  <Pulse style={{ width, height, borderRadius: 6, ...style }} />
);

export const SkeletonBlock = ({ width = '100%', height = 40, radius = 8, style = {} }) => (
  <Pulse style={{ width, height, borderRadius: radius, ...style }} />
);

export const SkeletonCircle = ({ size = 40 }) => (
  <Pulse style={{ width: size, height: size, borderRadius: '50%', flexShrink: 0 }} />
);

/* ─── composed skeletons ─────────────────────────────────────────────────── */
export const SkeletonKpiCard = () => (
  <div className="skeleton-kpi-card" aria-hidden="true">
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
      <SkeletonCircle size={36} />
      <SkeletonBlock width={56} height={22} radius={99} />
    </div>
    <SkeletonLine width="55%" height={12} style={{ marginBottom: 8 }} />
    <SkeletonLine width="75%" height={28} style={{ marginBottom: 8 }} />
    <SkeletonLine width="45%" height={11} />
  </div>
);

export const SkeletonItemCard = () => (
  <div className="skeleton-item-card" aria-hidden="true">
    <SkeletonBlock width="100%" height={80} radius={8} style={{ marginBottom: 10 }} />
    <SkeletonLine width="80%" height={13} style={{ marginBottom: 6 }} />
    <SkeletonLine width="45%" height={12} />
  </div>
);

export const SkeletonTableRow = ({ cols = 5 }) => (
  <tr aria-hidden="true">
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i} style={{ padding: '12px 16px' }}>
        <SkeletonLine width={i === 0 ? '70%' : '55%'} height={13} />
      </td>
    ))}
  </tr>
);

export const SkeletonCard = ({ lines = 3, height = 120 }) => (
  <div className="card skeleton-card-inner" aria-hidden="true">
    <SkeletonBlock width="40%" height={16} style={{ marginBottom: 16 }} />
    {Array.from({ length: lines }).map((_, i) => (
      <SkeletonLine
        key={i}
        width={i === lines - 1 ? '60%' : '100%'}
        height={13}
        style={{ marginBottom: 10 }}
      />
    ))}
  </div>
);

/* ─── page-level composites ──────────────────────────────────────────────── */
export const DashboardSkeleton = () => (
  <div className="content-area dashboard-content" aria-label="Loading dashboard" aria-busy="true">
    <section className="dashboard-kpi-grid">
      {[1, 2, 3, 4].map((i) => <SkeletonKpiCard key={i} />)}
    </section>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginTop: 20 }}>
      {[1, 2, 3].map((i) => <SkeletonCard key={i} lines={4} />)}
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 20 }}>
      <SkeletonCard lines={6} />
      <SkeletonCard lines={5} />
    </div>
  </div>
);

export const POSItemsSkeleton = ({ count = 12 }) => (
  <div className="pos-grid" aria-label="Loading items" aria-busy="true">
    {Array.from({ length: count }).map((_, i) => <SkeletonItemCard key={i} />)}
  </div>
);

export const TableRowsSkeleton = ({ rows = 6, cols = 5 }) => (
  <>
    {Array.from({ length: rows }).map((_, i) => <SkeletonTableRow key={i} cols={cols} />)}
  </>
);

/* default export for convenience */
export default {
  Line: SkeletonLine,
  Block: SkeletonBlock,
  Circle: SkeletonCircle,
  KpiCard: SkeletonKpiCard,
  ItemCard: SkeletonItemCard,
  TableRow: SkeletonTableRow,
  Card: SkeletonCard,
  DashboardPage: DashboardSkeleton,
  POSItems: POSItemsSkeleton,
  TableRows: TableRowsSkeleton,
};
