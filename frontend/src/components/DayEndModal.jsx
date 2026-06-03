import React, { useRef } from 'react';
import { X, TrendingUp, ShoppingCart, DollarSign, Package, CreditCard, Printer } from 'lucide-react';

/**
 * End-of-Day summary modal.
 * Props:
 *   isOpen        boolean
 *   onClose       () => void
 *   stats         Dashboard stats object
 *   businessName  string
 *   formatCurrency (n) => string
 */
const DayEndModal = ({ isOpen, onClose, stats, businessName, formatCurrency }) => {
    const printRef = useRef(null);

    const handlePrint = () => {
        const content = printRef.current?.innerHTML;
        if (!content) return;
        const win = window.open('', '_blank');
        win.document.write(`<html><head><title>Day End Report</title><style>
            body { font-family: sans-serif; padding: 20px; font-size: 13px; }
            h2 { margin-bottom: 4px; } p { margin: 0 0 16px; color: #64748b; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
            td, th { padding: 6px 8px; border: 1px solid #e2e8f0; text-align: left; }
            th { background: #f8fafc; font-weight: 700; }
            .total { font-weight: 700; font-size: 15px; }
            @media print { button { display: none; } }
        </style></head><body>${content}<script>window.print();<\/script></body></html>`);
        win.document.close();
    };

    if (!isOpen) return null;

    const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const paymentTotal = Object.values(stats?.paymentModes || {}).reduce((s, v) => s + Number(v || 0), 0);
    const topPayments = Object.entries(stats?.paymentModes || {}).sort((a, b) => Number(b[1]) - Number(a[1]));
    const cashAmount = Number(stats?.paymentModes?.Cash || 0);

    return (
        <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: 20, backdropFilter: 'blur(4px)' }}
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 520, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px 16px', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, background: '#fff', zIndex: 1 }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>End of Day Summary</h2>
                        <p style={{ margin: '3px 0 0', fontSize: 12, color: '#64748b' }}>{today}</p>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={handlePrint} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#374151' }}>
                            <Printer size={15} /> Print
                        </button>
                        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <div ref={printRef} style={{ padding: '20px 24px 24px' }}>
                    <h2 style={{ margin: '0 0 4px', fontSize: 16 }}>{businessName} — Day End Report</h2>
                    <p style={{ margin: '0 0 20px', fontSize: 12, color: '#64748b' }}>{today}</p>

                    {/* KPI row */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                        {[
                            { icon: DollarSign, label: "Today's Revenue", value: formatCurrency(stats?.todayRevenue), color: '#108a85', bg: '#f0fdfa' },
                            { icon: ShoppingCart, label: "Today's Orders", value: stats?.todayOrders ?? 0, color: '#f97316', bg: '#fff7ed' },
                            { icon: TrendingUp, label: "Today's Profit", value: formatCurrency(stats?.todayProfit), color: '#8b5cf6', bg: '#f5f3ff' },
                            { icon: DollarSign, label: 'Cash In Hand', value: formatCurrency(cashAmount), color: '#10b981', bg: '#f0fdf4' },
                        ].map(({ icon: Icon, label, value, color, bg }) => (
                            <div key={label} style={{ background: bg, borderRadius: 10, padding: '14px 16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                    <Icon size={15} color={color} />
                                    <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
                                </div>
                                <strong style={{ fontSize: 20, color, lineHeight: 1 }}>{value}</strong>
                            </div>
                        ))}
                    </div>

                    {/* Payment breakdown */}
                    {topPayments.length > 0 && (
                        <div style={{ marginBottom: 20 }}>
                            <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#64748b' }}>Payment Breakdown</p>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr>
                                        {['Method', 'Orders', 'Amount', 'Share'].map(h => (
                                            <th key={h} style={{ padding: '6px 10px', background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: 11, fontWeight: 700, color: '#64748b', textAlign: 'left' }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {topPayments.map(([mode, count]) => (
                                        <tr key={mode}>
                                            <td style={{ padding: '7px 10px', border: '1px solid #e2e8f0', fontSize: 13, fontWeight: 600 }}>{mode}</td>
                                            <td style={{ padding: '7px 10px', border: '1px solid #e2e8f0', fontSize: 13 }}>{count}</td>
                                            <td style={{ padding: '7px 10px', border: '1px solid #e2e8f0', fontSize: 13 }}>—</td>
                                            <td style={{ padding: '7px 10px', border: '1px solid #e2e8f0', fontSize: 13 }}>
                                                {paymentTotal > 0 ? ((Number(count) / paymentTotal) * 100).toFixed(0) + '%' : '—'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Comparison */}
                    <div style={{ background: '#f8fafc', borderRadius: 10, padding: '14px 16px', marginBottom: 20 }}>
                        <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#64748b' }}>vs Yesterday</p>
                        <div style={{ display: 'flex', gap: 24 }}>
                            <div>
                                <span style={{ fontSize: 11, color: '#94a3b8' }}>Today</span>
                                <div style={{ fontSize: 16, fontWeight: 700, color: '#108a85' }}>{formatCurrency(stats?.todayRevenue)}</div>
                                <div style={{ fontSize: 11, color: '#64748b' }}>{stats?.todayOrders} orders</div>
                            </div>
                            <div>
                                <span style={{ fontSize: 11, color: '#94a3b8' }}>Yesterday</span>
                                <div style={{ fontSize: 16, fontWeight: 700, color: '#64748b' }}>{formatCurrency(stats?.yesterdayRevenue)}</div>
                                <div style={{ fontSize: 11, color: '#64748b' }}>{stats?.yesterdayOrders} orders</div>
                            </div>
                            <div>
                                <span style={{ fontSize: 11, color: '#94a3b8' }}>This Week</span>
                                <div style={{ fontSize: 16, fontWeight: 700, color: '#3b82f6' }}>{formatCurrency(stats?.weekRevenue)}</div>
                                <div style={{ fontSize: 11, color: '#64748b' }}>{stats?.weekOrders} orders</div>
                            </div>
                        </div>
                    </div>

                    {/* Footer note */}
                    <p style={{ margin: 0, fontSize: 11, color: '#94a3b8', textAlign: 'center' }}>
                        Generated at {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} · Ailexity POS
                    </p>
                </div>
            </div>
        </div>
    );
};

export default DayEndModal;
