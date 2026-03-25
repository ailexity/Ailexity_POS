import React, { useEffect, useMemo, useState } from 'react';
import { Users, Plus, Search, Edit, Trash2, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const initialForm = {
    party_name: '',
    party_type: 'customer',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    gstin: '',
    credit_limit: '',
    payment_terms_days: '',
    opening_balance: '',
    notes: '',
    is_active: true,
};

const PartyManagement = () => {
    const navigate = useNavigate();
    const [parties, setParties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [showModal, setShowModal] = useState(false);
    const [editingParty, setEditingParty] = useState(null);
    const [form, setForm] = useState(initialForm);

    const fetchParties = async () => {
        try {
            setLoading(true);
            const params = {};
            if (search.trim()) params.q = search.trim();
            if (typeFilter !== 'all') params.party_type = typeFilter;
            const res = await api.get('/parties/', { params });
            setParties(Array.isArray(res.data) ? res.data : []);
        } catch (error) {
            if (error?.response?.status === 404) {
                setParties([]);
                return;
            }
            console.error('Failed to fetch parties', error);
            setParties([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchParties();
    }, [typeFilter]);

    const totals = useMemo(() => {
        return parties.reduce(
            (acc, row) => {
                acc.receivable += Number(row.total_receivable || 0);
                acc.payable += Number(row.total_payable || 0);
                return acc;
            },
            { receivable: 0, payable: 0 }
        );
    }, [parties]);

    const openCreate = () => {
        setEditingParty(null);
        setForm(initialForm);
        setShowModal(true);
    };

    const openEdit = (party) => {
        setEditingParty(party);
        setForm({
            party_name: party.party_name || '',
            party_type: party.party_type || 'customer',
            contact_person: party.contact_person || '',
            phone: party.phone || '',
            email: party.email || '',
            address: party.address || '',
            gstin: party.gstin || '',
            credit_limit: party.credit_limit ?? '',
            payment_terms_days: party.payment_terms_days ?? '',
            opening_balance: party.opening_balance ?? '',
            notes: party.notes || '',
            is_active: !!party.is_active,
        });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingParty(null);
        setForm(initialForm);
    };

    const onSave = async (e) => {
        e.preventDefault();
        const payload = {
            party_name: form.party_name.trim(),
            party_type: form.party_type,
            contact_person: form.contact_person.trim() || null,
            phone: form.phone.trim() || null,
            email: form.email.trim() || null,
            address: form.address.trim() || null,
            gstin: form.gstin.trim() || null,
            credit_limit: form.credit_limit === '' ? 0 : Number(form.credit_limit),
            payment_terms_days: form.payment_terms_days === '' ? 0 : Number(form.payment_terms_days),
            opening_balance: form.opening_balance === '' ? 0 : Number(form.opening_balance),
            notes: form.notes.trim() || null,
            is_active: !!form.is_active,
        };

        try {
            if (editingParty) {
                await api.put(`/parties/${editingParty.id}`, payload);
            } else {
                await api.post('/parties/', payload);
            }
            await fetchParties();
            closeModal();
        } catch (error) {
            console.error('Failed to save party', error);
            alert(error?.response?.data?.detail || 'Failed to save party');
        }
    };

    const onDeactivate = async (party) => {
        if (!window.confirm(`Deactivate party ${party.party_name}?`)) return;
        try {
            await api.delete(`/parties/${party.id}`);
            await fetchParties();
        } catch (error) {
            console.error('Failed to deactivate party', error);
            alert(error?.response?.data?.detail || 'Failed to deactivate party');
        }
    };

    return (
        <div className="page-container with-mobile-header-offset" style={{ background: '#f8fafc' }}>
            <div className="header-section" style={{ backgroundColor: 'white' }}>
                <div className="flex items-center gap-3">
                    <div style={{ width: '40px', height: '40px', background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Users size={22} color="white" />
                    </div>
                    <div>
                        <h1 style={{ margin: 0 }}>Party Management</h1>
                        <p className="text-muted text-sm">Customers, suppliers, credits, terms and outstanding balances</p>
                    </div>
                </div>
                <button className="btn" onClick={openCreate}>
                    <Plus size={16} /> Add Party
                </button>
            </div>

            <div className="content-area">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(220px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                    <div className="card" style={{ padding: '14px' }}>
                        <p className="text-muted text-xs">Total Parties</p>
                        <h2 style={{ marginTop: '6px' }}>{parties.length}</h2>
                    </div>
                    <div className="card" style={{ padding: '14px' }}>
                        <p className="text-muted text-xs">Total Receivable</p>
                        <h2 style={{ marginTop: '6px', color: '#059669' }}>₹{totals.receivable.toFixed(2)}</h2>
                    </div>
                    <div className="card" style={{ padding: '14px' }}>
                        <p className="text-muted text-xs">Total Payable</p>
                        <h2 style={{ marginTop: '6px', color: '#b45309' }}>₹{totals.payable.toFixed(2)}</h2>
                    </div>
                </div>

                <div className="card" style={{ marginBottom: '14px' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <div className="search-input-wrapper" style={{ maxWidth: '360px' }}>
                            <Search className="search-input-icon" size={16} />
                            <input
                                className="search-input-field"
                                placeholder="Search by name, phone, GSTIN"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                style={{ paddingLeft: '34px' }}
                            />
                        </div>
                        <select
                            className="input"
                            style={{ maxWidth: '180px' }}
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                        >
                            <option value="all">All Types</option>
                            <option value="customer">Customer</option>
                            <option value="supplier">Supplier</option>
                            <option value="both">Both</option>
                        </select>
                        <button className="btn-secondary" onClick={fetchParties}>Search</button>
                    </div>
                </div>

                <div className="card overflow-hidden p-0">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Party</th>
                                <th>Type</th>
                                <th>Contact</th>
                                <th>Credit Limit</th>
                                <th>Outstanding</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {!loading && parties.length === 0 && (
                                <tr>
                                    <td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>No parties found</td>
                                </tr>
                            )}
                            {parties.map((row) => (
                                <tr key={row.id}>
                                    <td>
                                        <div style={{ fontWeight: 600 }}>{row.party_name}</div>
                                        <div className="text-xs text-muted">{row.gstin || 'No GSTIN'}</div>
                                    </td>
                                    <td>
                                        <span className="badge" style={{ background: '#e2e8f0', color: '#334155' }}>{row.party_type}</span>
                                    </td>
                                    <td>
                                        <div>{row.phone || '—'}</div>
                                        <div className="text-xs text-muted">{row.contact_person || 'No contact person'}</div>
                                    </td>
                                    <td>₹{Number(row.credit_limit || 0).toFixed(2)}</td>
                                    <td>
                                        <div style={{ color: '#065f46' }}>Rec: ₹{Number(row.total_receivable || 0).toFixed(2)}</div>
                                        <div style={{ color: '#92400e' }}>Pay: ₹{Number(row.total_payable || 0).toFixed(2)}</div>
                                    </td>
                                    <td>
                                        <span className={`badge ${row.is_active ? 'bg-green-500' : 'bg-red-500'}`}>
                                            {row.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="flex gap-2">
                                            <button className="btn-secondary" onClick={() => navigate(`/ledger?partyId=${row.id}`)}>
                                                <FileText size={14} />
                                            </button>
                                            <button className="btn-secondary" onClick={() => openEdit(row)}>
                                                <Edit size={14} />
                                            </button>
                                            <button className="btn-secondary" onClick={() => onDeactivate(row)}>
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black-60 flex items-center justify-center z-50 p-4">
                    <div className="card w-full" style={{ maxWidth: '920px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <h2 className="mb-4">{editingParty ? 'Edit Party' : 'Create Party'}</h2>
                        <form onSubmit={onSave} className="form-grid">
                            <div>
                                <label className="label-text">Party Name *</label>
                                <input className="input" required value={form.party_name} onChange={(e) => setForm({ ...form, party_name: e.target.value })} />
                            </div>
                            <div>
                                <label className="label-text">Party Type *</label>
                                <select className="input" value={form.party_type} onChange={(e) => setForm({ ...form, party_type: e.target.value })}>
                                    <option value="customer">Customer</option>
                                    <option value="supplier">Supplier</option>
                                    <option value="both">Both</option>
                                </select>
                            </div>
                            <div>
                                <label className="label-text">Contact Person</label>
                                <input className="input" value={form.contact_person} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} />
                            </div>
                            <div>
                                <label className="label-text">Phone</label>
                                <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                            </div>
                            <div>
                                <label className="label-text">Email</label>
                                <input className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                            </div>
                            <div>
                                <label className="label-text">GSTIN</label>
                                <input className="input" value={form.gstin} onChange={(e) => setForm({ ...form, gstin: e.target.value })} />
                            </div>
                            <div>
                                <label className="label-text">Credit Limit</label>
                                <input type="number" className="input" value={form.credit_limit} onChange={(e) => setForm({ ...form, credit_limit: e.target.value })} />
                            </div>
                            <div>
                                <label className="label-text">Payment Terms (days)</label>
                                <input type="number" className="input" value={form.payment_terms_days} onChange={(e) => setForm({ ...form, payment_terms_days: e.target.value })} />
                            </div>
                            <div>
                                <label className="label-text">Opening Balance</label>
                                <input type="number" className="input" value={form.opening_balance} onChange={(e) => setForm({ ...form, opening_balance: e.target.value })} />
                            </div>
                            <div className="col-span-2">
                                <label className="label-text">Address</label>
                                <textarea className="input" rows="2" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                            </div>
                            <div className="col-span-2">
                                <label className="label-text">Notes</label>
                                <textarea className="input" rows="2" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                            </div>

                            <div className="col-span-2 flex gap-2 justify-end mt-4">
                                <button type="button" className="btn-secondary" onClick={closeModal}>Cancel</button>
                                <button type="submit" className="btn">{editingParty ? 'Update Party' : 'Create Party'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PartyManagement;
