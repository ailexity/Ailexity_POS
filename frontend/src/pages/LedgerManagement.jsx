import React, { useEffect, useMemo, useState } from 'react';
import { DollarSign, Plus, AlertTriangle, RefreshCw } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api';

const initialLedgerForm = {
    entry_type: 'sale',
    amount: '',
    paid_amount: '',
    reference_no: '',
    due_date: '',
    notes: '',
};

const initialPaymentForm = {
    payment_type: 'payment_in',
    amount: '',
    payment_mode: 'Cash',
    reference_no: '',
    notes: '',
    payment_date: '',
};

const formatMoney = (v) => `₹${Number(v || 0).toFixed(2)}`;

const LedgerManagement = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [parties, setParties] = useState([]);
    const [selectedPartyId, setSelectedPartyId] = useState('');
    const [summary, setSummary] = useState(null);
    const [ledgerRows, setLedgerRows] = useState([]);
    const [paymentRows, setPaymentRows] = useState([]);
    const [allSummaries, setAllSummaries] = useState([]);
    const [dueAlerts, setDueAlerts] = useState([]);
    const [statusFilter, setStatusFilter] = useState('all');
    const [ledgerForm, setLedgerForm] = useState(initialLedgerForm);
    const [paymentForm, setPaymentForm] = useState(initialPaymentForm);
    const [loading, setLoading] = useState(true);

    const queryPartyId = useMemo(() => {
        const params = new URLSearchParams(location.search);
        return params.get('partyId') || '';
    }, [location.search]);

    const fetchPartiesAndGlobal = async () => {
        try {
            const [partiesRes, summariesRes, alertsRes] = await Promise.all([
                api.get('/parties/'),
                api.get('/parties/summaries/all'),
                api.get('/parties/dues/alerts', { params: { days: 0 } }),
            ]);
            const partyList = Array.isArray(partiesRes.data) ? partiesRes.data : [];
            setParties(partyList);
            setAllSummaries(Array.isArray(summariesRes.data) ? summariesRes.data : []);
            setDueAlerts(Array.isArray(alertsRes.data) ? alertsRes.data : []);

            if (queryPartyId && partyList.some((p) => p.id === queryPartyId)) {
                setSelectedPartyId(queryPartyId);
            } else if (!selectedPartyId && partyList.length > 0) {
                setSelectedPartyId(partyList[0].id);
            }
        } catch (error) {
            if (error?.response?.status === 404) {
                setParties([]);
                setAllSummaries([]);
                setDueAlerts([]);
                return;
            }
            console.error('Failed to fetch party globals', error);
            setParties([]);
            setAllSummaries([]);
            setDueAlerts([]);
        }
    };

    const fetchPartyDetails = async (partyId) => {
        if (!partyId) return;
        try {
            const [summaryRes, ledgerRes, paymentRes] = await Promise.all([
                api.get(`/parties/${partyId}/summary`),
                api.get(`/parties/${partyId}/ledger`),
                api.get(`/parties/${partyId}/payments`),
            ]);
            setSummary(summaryRes.data || null);
            setLedgerRows(Array.isArray(ledgerRes.data) ? ledgerRes.data : []);
            setPaymentRows(Array.isArray(paymentRes.data) ? paymentRes.data : []);
        } catch (error) {
            if (error?.response?.status === 404) {
                setSummary(null);
                setLedgerRows([]);
                setPaymentRows([]);
                return;
            }
            console.error('Failed to fetch party details', error);
            setSummary(null);
            setLedgerRows([]);
            setPaymentRows([]);
        }
    };

    const refreshAll = async () => {
        setLoading(true);
        await fetchPartiesAndGlobal();
        setLoading(false);
    };

    useEffect(() => {
        refreshAll();
    }, [queryPartyId]);

    useEffect(() => {
        if (!selectedPartyId) return;
        fetchPartyDetails(selectedPartyId);
    }, [selectedPartyId]);

    const filteredLedger = useMemo(() => {
        const now = new Date();
        return ledgerRows.filter((row) => {
            if (statusFilter === 'all') return true;
            if (statusFilter === 'overdue') {
                const due = row.due_date ? new Date(row.due_date) : null;
                return ['open', 'partial'].includes(row.status) && due && due < now;
            }
            return row.status === statusFilter;
        });
    }, [ledgerRows, statusFilter]);

    const submitLedger = async (e) => {
        e.preventDefault();
        if (!selectedPartyId) return;
        const payload = {
            entry_type: ledgerForm.entry_type,
            amount: Number(ledgerForm.amount || 0),
            paid_amount: Number(ledgerForm.paid_amount || 0),
            reference_no: ledgerForm.reference_no.trim() || null,
            due_date: ledgerForm.due_date ? new Date(ledgerForm.due_date).toISOString() : null,
            notes: ledgerForm.notes.trim() || null,
        };
        try {
            await api.post(`/parties/${selectedPartyId}/ledger`, payload);
            setLedgerForm(initialLedgerForm);
            await fetchPartyDetails(selectedPartyId);
            await fetchPartiesAndGlobal();
        } catch (error) {
            console.error('Failed to create ledger entry', error);
            alert(error?.response?.data?.detail || 'Failed to create ledger entry');
        }
    };

    const submitPayment = async (e) => {
        e.preventDefault();
        if (!selectedPartyId) return;
        const payload = {
            payment_type: paymentForm.payment_type,
            amount: Number(paymentForm.amount || 0),
            payment_mode: paymentForm.payment_mode || 'Cash',
            reference_no: paymentForm.reference_no.trim() || null,
            notes: paymentForm.notes.trim() || null,
            payment_date: paymentForm.payment_date ? new Date(paymentForm.payment_date).toISOString() : null,
        };
        try {
            await api.post(`/parties/${selectedPartyId}/payments`, payload);
            setPaymentForm(initialPaymentForm);
            await fetchPartyDetails(selectedPartyId);
            await fetchPartiesAndGlobal();
        } catch (error) {
            console.error('Failed to record payment', error);
            alert(error?.response?.data?.detail || 'Failed to record payment');
        }
    };

    return (
        <div className="page-container with-mobile-header-offset" style={{ background: '#f8fafc' }}>
            <div className="header-section" style={{ backgroundColor: 'white' }}>
                <div className="flex items-center gap-3">
                    <div style={{ width: '40px', height: '40px', background: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <DollarSign size={22} color="white" />
                    </div>
                    <div>
                        <h1 style={{ margin: 0 }}>Ledger & Payments</h1>
                        <p className="text-muted text-sm">Track dues, partial payments, and auto-updated party balances</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button className="btn-secondary" onClick={() => navigate('/parties')}>Parties</button>
                    <button className="btn" onClick={refreshAll}><RefreshCw size={15} /> Refresh</button>
                </div>
            </div>

            <div className="content-area">
                <div className="card mb-4">
                    <div className="form-grid thirds">
                        <div>
                            <label className="label-text">Select Party</label>
                            <select className="input" value={selectedPartyId} onChange={(e) => setSelectedPartyId(e.target.value)}>
                                {parties.length === 0 && <option value="">No party available</option>}
                                {parties.map((p) => (
                                    <option key={p.id} value={p.id}>{p.party_name} ({p.party_type})</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="label-text">Ledger Filter</label>
                            <select className="input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                                <option value="all">All</option>
                                <option value="open">Open</option>
                                <option value="partial">Partial</option>
                                <option value="paid">Paid</option>
                                <option value="overdue">Overdue</option>
                            </select>
                        </div>
                    </div>
                </div>

                {!!summary && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(180px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                        <div className="card" style={{ padding: '14px' }}>
                            <p className="text-muted text-xs">Current Balance</p>
                            <h3>{formatMoney(summary.current_balance)}</h3>
                        </div>
                        <div className="card" style={{ padding: '14px' }}>
                            <p className="text-muted text-xs">Receivable</p>
                            <h3 style={{ color: '#059669' }}>{formatMoney(summary.total_receivable)}</h3>
                        </div>
                        <div className="card" style={{ padding: '14px' }}>
                            <p className="text-muted text-xs">Payable</p>
                            <h3 style={{ color: '#b45309' }}>{formatMoney(summary.total_payable)}</h3>
                        </div>
                        <div className="card" style={{ padding: '14px' }}>
                            <p className="text-muted text-xs">Overdue Entries</p>
                            <h3 style={{ color: '#dc2626' }}>{summary.open_entries}</h3>
                        </div>
                    </div>
                )}

                <div className="card mb-4">
                    <h2 className="mb-4">Record Ledger Entry</h2>
                    <form onSubmit={submitLedger} className="form-grid thirds">
                        <div>
                            <label className="label-text">Entry Type</label>
                            <select className="input" value={ledgerForm.entry_type} onChange={(e) => setLedgerForm({ ...ledgerForm, entry_type: e.target.value })}>
                                <option value="sale">Sale</option>
                                <option value="purchase">Purchase</option>
                                <option value="adjustment">Adjustment</option>
                            </select>
                        </div>
                        <div>
                            <label className="label-text">Amount</label>
                            <input className="input" type="number" required value={ledgerForm.amount} onChange={(e) => setLedgerForm({ ...ledgerForm, amount: e.target.value })} />
                        </div>
                        <div>
                            <label className="label-text">Paid Amount</label>
                            <input className="input" type="number" value={ledgerForm.paid_amount} onChange={(e) => setLedgerForm({ ...ledgerForm, paid_amount: e.target.value })} />
                        </div>
                        <div>
                            <label className="label-text">Reference No</label>
                            <input className="input" value={ledgerForm.reference_no} onChange={(e) => setLedgerForm({ ...ledgerForm, reference_no: e.target.value })} />
                        </div>
                        <div>
                            <label className="label-text">Due Date</label>
                            <input className="input" type="date" value={ledgerForm.due_date} onChange={(e) => setLedgerForm({ ...ledgerForm, due_date: e.target.value })} />
                        </div>
                        <div>
                            <label className="label-text">Notes</label>
                            <input className="input" value={ledgerForm.notes} onChange={(e) => setLedgerForm({ ...ledgerForm, notes: e.target.value })} />
                        </div>
                        <div className="col-span-2">
                            <button className="btn" type="submit"><Plus size={14} /> Add Ledger Row</button>
                        </div>
                    </form>
                </div>

                <div className="card mb-4">
                    <h2 className="mb-4">Record Payment</h2>
                    <form onSubmit={submitPayment} className="form-grid thirds">
                        <div>
                            <label className="label-text">Payment Type</label>
                            <select className="input" value={paymentForm.payment_type} onChange={(e) => setPaymentForm({ ...paymentForm, payment_type: e.target.value })}>
                                <option value="payment_in">Payment In (Customer)</option>
                                <option value="payment_out">Payment Out (Supplier)</option>
                            </select>
                        </div>
                        <div>
                            <label className="label-text">Amount</label>
                            <input className="input" type="number" required value={paymentForm.amount} onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })} />
                        </div>
                        <div>
                            <label className="label-text">Payment Mode</label>
                            <input className="input" value={paymentForm.payment_mode} onChange={(e) => setPaymentForm({ ...paymentForm, payment_mode: e.target.value })} />
                        </div>
                        <div>
                            <label className="label-text">Reference</label>
                            <input className="input" value={paymentForm.reference_no} onChange={(e) => setPaymentForm({ ...paymentForm, reference_no: e.target.value })} />
                        </div>
                        <div>
                            <label className="label-text">Payment Date</label>
                            <input className="input" type="date" value={paymentForm.payment_date} onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })} />
                        </div>
                        <div>
                            <label className="label-text">Notes</label>
                            <input className="input" value={paymentForm.notes} onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })} />
                        </div>
                        <div className="col-span-2">
                            <button className="btn" type="submit"><Plus size={14} /> Record Payment</button>
                        </div>
                    </form>
                </div>

                <div className="card mb-4 overflow-hidden p-0">
                    <div className="p-4" style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <h2 className="m-0">Ledger Entries</h2>
                    </div>
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Type</th>
                                <th>Reference</th>
                                <th>Amount</th>
                                <th>Paid</th>
                                <th>Due</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredLedger.length === 0 && (
                                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>No ledger entries</td></tr>
                            )}
                            {filteredLedger.map((row) => (
                                <tr key={row.id}>
                                    <td>{new Date(row.created_at).toLocaleString()}</td>
                                    <td>{row.entry_type}</td>
                                    <td>{row.reference_no || '—'}</td>
                                    <td>{formatMoney(row.amount)}</td>
                                    <td>{formatMoney(row.paid_amount)}</td>
                                    <td>{formatMoney(row.due_amount)}</td>
                                    <td><span className="badge" style={{ background: '#e2e8f0', color: '#334155' }}>{row.status}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="card mb-4 overflow-hidden p-0">
                    <div className="p-4" style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <h2 className="m-0">Payment History</h2>
                    </div>
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Type</th>
                                <th>Mode</th>
                                <th>Reference</th>
                                <th>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paymentRows.length === 0 && (
                                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>No payments recorded</td></tr>
                            )}
                            {paymentRows.map((row) => (
                                <tr key={row.id}>
                                    <td>{new Date(row.payment_date).toLocaleString()}</td>
                                    <td>{row.payment_type}</td>
                                    <td>{row.payment_mode}</td>
                                    <td>{row.reference_no || '—'}</td>
                                    <td>{formatMoney(row.amount)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="card">
                    <h2 className="mb-3">Overdue Alerts</h2>
                    {dueAlerts.length === 0 ? (
                        <p className="text-muted">No overdue dues right now.</p>
                    ) : (
                        <div style={{ display: 'grid', gap: '10px' }}>
                            {dueAlerts.slice(0, 10).map((alert) => (
                                <div key={alert.ledger_entry_id} style={{ padding: '12px', background: '#fef2f2', border: '1px solid #fecaca', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <p style={{ fontWeight: 600, color: '#7f1d1d', marginBottom: '2px' }}><AlertTriangle size={14} style={{ display: 'inline-block', marginRight: '6px' }} />{alert.party_name}</p>
                                        <p className="text-xs" style={{ color: '#b91c1c' }}>{alert.entry_type} · overdue {alert.days_overdue} day(s) · due {new Date(alert.due_date).toLocaleDateString()}</p>
                                    </div>
                                    <p style={{ color: '#991b1b', fontWeight: 700 }}>{formatMoney(alert.due_amount)}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="card mt-4 overflow-hidden p-0">
                    <div className="p-4" style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <h2 className="m-0">Top Parties Snapshot</h2>
                    </div>
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Party</th>
                                <th>Receivable</th>
                                <th>Payable</th>
                                <th>Overdue (Rec)</th>
                                <th>Overdue (Pay)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {allSummaries
                                .slice()
                                .sort((a, b) => (Number(b.total_receivable || 0) + Number(b.total_payable || 0)) - (Number(a.total_receivable || 0) + Number(a.total_payable || 0)))
                                .slice(0, 8)
                                .map((row) => (
                                    <tr key={row.party_id}>
                                        <td>{row.party_name}</td>
                                        <td>{formatMoney(row.total_receivable)}</td>
                                        <td>{formatMoney(row.total_payable)}</td>
                                        <td>{formatMoney(row.overdue_receivable)}</td>
                                        <td>{formatMoney(row.overdue_payable)}</td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default LedgerManagement;
