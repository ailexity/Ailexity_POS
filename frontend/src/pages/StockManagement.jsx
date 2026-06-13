import React, { useEffect, useMemo, useState } from 'react';
import { Boxes, Plus, Search, ArrowDownToLine, ArrowUpFromLine, Trash2, Edit, X } from 'lucide-react';
import api from '../api';
import { useNavigate } from 'react-router-dom';
import './StockManagement.css';

const emptyDetail = () => ({
    id: crypto.randomUUID(),
    vendor: '',
    batchNo: '',
    unitCost: '',
    expiryDate: '',
    note: ''
});

const emptyItem = {
    name: '',
    unit: '',
    reorderLevel: '',
    openingStock: '',
    details: [emptyDetail()]
};

const emptyTxn = {
    quantity: '',
    unitPrice: '',
    reference: '',
    note: '',
    usedAt: '',
    usedFor: ''
};

const formatCurrency = (value) => `₹${Number(value || 0).toFixed(2)}`;

const formatDateTime = (value) => {
    if (!value) return '—';
    return new Date(value).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const StockManagement = () => {
    const navigate = useNavigate();
    const [items, setItems] = useState([]);
    const [search, setSearch] = useState('');
    const [showItemModal, setShowItemModal] = useState(false);
    const [showTxnModal, setShowTxnModal] = useState(false);
    const [editingItemId, setEditingItemId] = useState(null);
    const [txnItemId, setTxnItemId] = useState(null);
    const [txnType, setTxnType] = useState('entry');
    const [expandedHistoryId, setExpandedHistoryId] = useState(null);
    const [form, setForm] = useState(emptyItem);
    const [txnForm, setTxnForm] = useState(emptyTxn);

    const fetchItems = async () => {
        try {
            const res = await api.get('/raw-stock/');
            setItems(Array.isArray(res.data) ? res.data : []);
        } catch (error) {
            console.error('Failed to fetch raw stock items', error);
            setItems([]);
        }
    };

    useEffect(() => {
        fetchItems();
    }, []);

    const resetItemForm = () => {
        setForm({ ...emptyItem, details: [emptyDetail()] });
        setEditingItemId(null);
    };

    const openCreateModal = () => {
        resetItemForm();
        setShowItemModal(true);
    };

    const openEditModal = (item) => {
        setEditingItemId(item.id);
        setForm({
            name: item.name,
            unit: item.unit,
            reorderLevel: String(item.reorderLevel ?? ''),
            openingStock: String(item.currentStock ?? 0),
            details: item.details?.length ? item.details : [emptyDetail()]
        });
        setShowItemModal(true);
    };

    const closeItemModal = () => {
        setShowItemModal(false);
        resetItemForm();
    };

    const closeTxnModal = () => {
        setShowTxnModal(false);
        setTxnItemId(null);
        setTxnType('entry');
        setTxnForm(emptyTxn);
    };

    const addDetailRow = () => {
        setForm((prev) => ({ ...prev, details: [...prev.details, emptyDetail()] }));
    };

    const removeDetailRow = (detailId) => {
        setForm((prev) => {
            const nextDetails = prev.details.filter((detail) => detail.id !== detailId);
            return { ...prev, details: nextDetails.length ? nextDetails : [emptyDetail()] };
        });
    };

    const updateDetailRow = (detailId, field, value) => {
        setForm((prev) => ({
            ...prev,
            details: prev.details.map((detail) =>
                detail.id === detailId ? { ...detail, [field]: value } : detail
            )
        }));
    };

    const handleSaveItem = async (event) => {
        event.preventDefault();

        const trimmedName = form.name.trim();
        const trimmedUnit = form.unit.trim();

        if (!trimmedName || !trimmedUnit) return;

        const reorderLevel = Number(form.reorderLevel || 0);
        const openingStock = Number(form.openingStock || 0);

        const sanitizedDetails = form.details.map((detail) => ({
            ...detail,
            vendor: detail.vendor.trim(),
            batchNo: detail.batchNo.trim(),
            unitCost: detail.unitCost === '' ? '' : Number(detail.unitCost),
            note: detail.note.trim()
        }));

        const payload = {
            name: trimmedName,
            unit: trimmedUnit,
            reorderLevel,
            currentStock: openingStock,
            details: sanitizedDetails
        };

        try {
            if (editingItemId) {
                await api.put(`/raw-stock/${editingItemId}`, payload);
            } else {
                await api.post('/raw-stock/', payload);
            }
            await fetchItems();
            closeItemModal();
        } catch (error) {
            console.error('Failed to save raw stock item', error);
            alert(error?.response?.data?.detail || 'Failed to save stock item');
        }
    };

    const handleDelete = (itemId) => {
        if (!confirm('Delete this raw stock item?')) return;
        api.delete(`/raw-stock/${itemId}`)
            .then(fetchItems)
            .catch((error) => {
                console.error('Failed to delete stock item', error);
                alert(error?.response?.data?.detail || 'Failed to delete stock item');
            });
    };

    const openTxn = (itemId, type) => {
        setTxnItemId(itemId);
        setTxnType(type);
        setTxnForm(emptyTxn);
        setShowTxnModal(true);
    };

    const handleSaveTxn = (event) => {
        event.preventDefault();
        const quantity = Number(txnForm.quantity || 0);
        const unitPrice = Number(txnForm.unitPrice || 0);
        if (!txnItemId || quantity <= 0 || unitPrice <= 0) return;

        const usedAt = txnForm.usedAt.trim();
        const usedFor = txnForm.usedFor.trim();

        if (txnType === 'exit' && !usedAt) {
            alert('Please add where this stock was used.');
            return;
        }

        api.post(`/raw-stock/${txnItemId}/transactions`, {
            type: txnType,
            quantity,
            unitPrice,
            reference: txnForm.reference.trim(),
            note: txnForm.note.trim(),
            usedAt,
            usedFor,
        })
            .then(async () => {
                await fetchItems();
                closeTxnModal();
            })
            .catch((error) => {
                console.error('Failed to save stock transaction', error);
                alert(error?.response?.data?.detail || 'Failed to save stock transaction');
            });
    };

    const filteredItems = useMemo(() => {
        const keyword = search.toLowerCase().trim();
        if (!keyword) return items;

        return items.filter((item) => {
            const inBase = item.name.toLowerCase().includes(keyword) || item.unit.toLowerCase().includes(keyword);
            const inDetails = (item.details || []).some((detail) =>
                detail.vendor?.toLowerCase().includes(keyword) ||
                detail.batchNo?.toLowerCase().includes(keyword) ||
                detail.note?.toLowerCase().includes(keyword)
            );
            const inHistory = (item.transactions || []).some((txn) =>
                txn.reference?.toLowerCase().includes(keyword) ||
                txn.note?.toLowerCase().includes(keyword) ||
                txn.usedAt?.toLowerCase().includes(keyword) ||
                txn.usedFor?.toLowerCase().includes(keyword)
            );
            return inBase || inDetails || inHistory;
        });
    }, [items, search]);

    const txnItem = items.find((item) => item.id === txnItemId);
    const analytics = useMemo(() => {
        let purchasedQty = 0;
        let usedQty = 0;
        let purchasedValue = 0;
        let usedValue = 0;

        items.forEach((item) => {
            (item.transactions || []).forEach((txn) => {
                if (txn.type === 'entry') {
                    purchasedQty += Number(txn.quantity || 0);
                    purchasedValue += Number(txn.totalPrice || 0);
                }
                if (txn.type === 'exit') {
                    usedQty += Number(txn.quantity || 0);
                    usedValue += Number(txn.totalPrice || 0);
                }
            });
        });

        return {
            purchasedQty,
            usedQty,
            purchasedValue,
            usedValue,
        };
    }, [items]);

    const projectedStock = useMemo(() => {
        if (!txnItem) return 0;
        const quantity = Number(txnForm.quantity || 0);
        return txnType === 'entry'
            ? Number(txnItem.currentStock || 0) + quantity
            : Number(txnItem.currentStock || 0) - quantity;
    }, [txnForm.quantity, txnItem, txnType]);

    const openQuickPurchaseEntry = () => {
        if (!items.length) {
            alert('Please add at least one stock item before recording a purchase entry.');
            return;
        }
        setTxnItemId(items[0].id);
        setTxnType('entry');
        setTxnForm(emptyTxn);
        setShowTxnModal(true);
    };

    const retailWorkflowSteps = [
        {
            step: '01',
            title: 'Add & Manage Inventory',
            description: 'Add products with price, quantity, and GST details. Stock updates automatically after each transaction.',
            actionLabel: 'Open Stock',
            action: () => navigate('/stock')
        },
        {
            step: '02',
            title: 'Create & Manage Parties',
            description: 'Maintain customer and supplier records with contact details, GST info, credit limits, and payment terms.',
            actionLabel: 'Open Parties',
            action: () => navigate('/parties')
        },
        {
            step: '03',
            title: 'Sales / Material Distribution',
            description: 'Generate invoices for sold or distributed goods. Stock reduces and party ledgers should update instantly.',
            actionLabel: 'Open Billing',
            action: () => navigate('/pos')
        },
        {
            step: '04',
            title: 'Payment Tracking',
            description: 'Record full or partial payments and monitor pending dues to keep outstanding balances accurate.',
            actionLabel: 'Open Ledger',
            action: () => navigate('/ledger')
        },
        {
            step: '05',
            title: 'Purchase & Restocking',
            description: 'Add supplier purchases to increase stock automatically and keep supplier payments tracked.',
            actionLabel: 'Record Stock Entry',
            action: openQuickPurchaseEntry
        },
        {
            step: '06',
            title: 'Monitor via Dashboard',
            description: 'Review real-time trends, profit movement, and business performance to make better decisions.',
            actionLabel: 'Open Dashboard',
            action: () => navigate('/dashboard')
        }
    ];

    return (
        <div className="stock-page with-mobile-header-offset">
            <div className="stock-header">
                <div className="stock-title-section">
                    <div className="stock-title-left">
                        <div className="stock-icon">
                            <Boxes size={20} />
                        </div>
                        <h1 className="stock-title">Stock Management</h1>
                    </div>
                    <button className="stock-add-btn" onClick={openCreateModal}>
                        <Plus size={18} /> Add Raw Item
                    </button>
                </div>

                <div className="stock-search-wrapper">
                    <Search className="stock-search-icon" size={18} />
                    <input
                        className="stock-search-input"
                        placeholder="Search raw item, vendor or batch..."
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                    />
                </div>
            </div>

            <div className="stock-content">
                <section className="stock-workflow-panel" aria-label="Retail ERP workflow">
                    <div className="stock-workflow-head">
                        <h2>System Workflow (End-to-End)</h2>
                        <p>Follow this flow for complete retailer operations, from inventory setup to dashboard monitoring.</p>
                    </div>
                    <div className="stock-workflow-grid">
                        {retailWorkflowSteps.map((flow) => (
                            <article key={flow.step} className="stock-workflow-card">
                                <span className="stock-workflow-step">Step {flow.step}</span>
                                <h3>{flow.title}</h3>
                                <p>{flow.description}</p>
                                <button type="button" className="stock-workflow-action" onClick={flow.action}>
                                    {flow.actionLabel}
                                </button>
                            </article>
                        ))}
                    </div>
                </section>

                <div className="stock-analytics-grid">
                    <div className="stock-analytics-card">
                        <p className="stock-analytics-label">Stock Purchased</p>
                        <p className="stock-analytics-value">{analytics.purchasedQty.toFixed(2)}</p>
                        <p className="stock-analytics-sub">Value: {formatCurrency(analytics.purchasedValue)}</p>
                    </div>
                    <div className="stock-analytics-card">
                        <p className="stock-analytics-label">Stock Used</p>
                        <p className="stock-analytics-value">{analytics.usedQty.toFixed(2)}</p>
                        <p className="stock-analytics-sub">Value: {formatCurrency(analytics.usedValue)}</p>
                    </div>
                </div>

                <div className="stock-table-container">
                    <table className="stock-table">
                        <thead>
                            <tr>
                                <th>Raw Item</th>
                                <th>Stock</th>
                                <th>Details</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredItems.map((item) => {
                                const txns = item.transactions || [];
                                const entryTxns = txns.filter((txn) => txn.type === 'entry');
                                const exitTxns = txns.filter((txn) => txn.type === 'exit');

                                return (
                                <React.Fragment key={item.id}>
                                <tr>
                                    <td data-label="Raw Item">
                                        <div className="stock-item-name-group">
                                            <span className="stock-item-name">{item.name}</span>
                                            <span className="stock-item-sub">Unit: {item.unit}</span>
                                        </div>
                                    </td>
                                    <td data-label="Stock">
                                        <div className="stock-qty-group">
                                            <span className={`stock-qty ${item.currentStock <= item.reorderLevel ? 'low' : 'normal'}`}>
                                                {item.currentStock}
                                            </span>
                                            <span className="stock-item-sub">Reorder: {item.reorderLevel}</span>
                                        </div>
                                    </td>
                                    <td data-label="Details">
                                        <div className="stock-details-cell">
                                            <span className="stock-detail-count">Vendors: {item.details?.length || 0}</span>
                                            <span className="stock-item-sub">In: {entryTxns.length} · Out: {exitTxns.length}</span>
                                            <button
                                                className="stock-link-btn"
                                                onClick={() => setExpandedHistoryId((prev) => (prev === item.id ? null : item.id))}
                                            >
                                                {expandedHistoryId === item.id ? 'Hide Details' : 'View Details'}
                                            </button>
                                        </div>
                                    </td>
                                    <td data-label="Actions">
                                        <div className="stock-actions">
                                            <button className="stock-action-btn entry" onClick={() => openTxn(item.id, 'entry')} title="Stock In">
                                                <ArrowDownToLine size={15} /> Stock In
                                            </button>
                                            <button className="stock-action-btn exit" onClick={() => openTxn(item.id, 'exit')} title="Stock Out">
                                                <ArrowUpFromLine size={15} /> Stock Out
                                            </button>
                                            <button className="stock-icon-btn" onClick={() => openEditModal(item)} title="Edit">
                                                <Edit size={15} />
                                            </button>
                                            <button className="stock-icon-btn delete" onClick={() => handleDelete(item.id)} title="Delete">
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>

                                {expandedHistoryId === item.id && (
                                    <tr className="stock-history-row">
                                        <td colSpan="4">
                                            <div className="stock-history-wrap">
                                                <div className="stock-history-head">Simple Stock Details · {item.name}</div>
                                                <div className="stock-details-summary">
                                                    <span>Unit: {item.unit}</span>
                                                    <span>Current: {item.currentStock}</span>
                                                    <span>Reorder Level: {item.reorderLevel}</span>
                                                </div>

                                                {txns.length === 0 ? (
                                                    <p className="stock-history-empty">No stock movement recorded yet.</p>
                                                ) : (
                                                    <div className="stock-history-sections">
                                                        <div className="stock-history-block">
                                                            <div className="stock-history-block-head">Stock In</div>
                                                            {entryTxns.length === 0 ? (
                                                                <p className="stock-history-empty">No stock in records.</p>
                                                            ) : (
                                                                <div className="stock-history-list">
                                                                    {entryTxns.slice(0, 8).map((txn) => (
                                                                        <div className="stock-history-item" key={txn.id}>
                                                                            <div className="stock-history-main">
                                                                                <span className="stock-history-qty">{txn.quantity} {item.unit}</span>
                                                                                <span className="stock-history-qty">{formatCurrency(txn.totalPrice)}</span>
                                                                                <span className="stock-history-date">{formatDateTime(txn.created_at || txn.createdAt)}</span>
                                                                            </div>
                                                                            <div className="stock-history-meta single-col">
                                                                                <span>Unit Price: {formatCurrency(txn.unitPrice)}</span>
                                                                                <span>Reference: {txn.reference || '—'}</span>
                                                                                <span>Note: {txn.note || '—'}</span>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="stock-history-block">
                                                            <div className="stock-history-block-head">Stock Out</div>
                                                            {exitTxns.length === 0 ? (
                                                                <p className="stock-history-empty">No stock out records.</p>
                                                            ) : (
                                                                <div className="stock-history-list">
                                                                    {exitTxns.slice(0, 8).map((txn) => (
                                                                        <div className="stock-history-item" key={txn.id}>
                                                                            <div className="stock-history-main">
                                                                                <span className="stock-history-qty">{txn.quantity} {item.unit}</span>
                                                                                <span className="stock-history-qty">{formatCurrency(txn.totalPrice)}</span>
                                                                                <span className="stock-history-date">{formatDateTime(txn.created_at || txn.createdAt)}</span>
                                                                            </div>
                                                                            <div className="stock-history-meta single-col">
                                                                                <span>Used In: {txn.usedAt || '—'}</span>
                                                                                <span>Purpose: {txn.usedFor || '—'}</span>
                                                                                <span>Note: {txn.note || '—'}</span>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                                </React.Fragment>
                                );
                            })}
                            {filteredItems.length === 0 && (
                                <tr>
                                    <td colSpan="4">
                                        <div className="stock-empty-state">
                                            <Boxes size={44} className="stock-empty-icon" />
                                            <p className="stock-empty-text">
                                                {search ? `No raw stock item found for "${search}"` : 'No raw stock items yet. Add your first item.'}
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showItemModal && (
                <div className="stock-modal-overlay" onClick={closeItemModal}>
                    <div className="stock-modal" onClick={(event) => event.stopPropagation()}>
                        <div className="stock-modal-header">
                            <h2>{editingItemId ? 'Edit Raw Item' : 'Add Raw Item'}</h2>
                            <button className="stock-close-btn" onClick={closeItemModal}><X size={18} /></button>
                        </div>

                        <form className="stock-form" onSubmit={handleSaveItem}>
                            <div className="stock-form-row two-col">
                                <div className="stock-form-group">
                                    <label>Raw Item Name</label>
                                    <input
                                        value={form.name}
                                        onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                                        placeholder="e.g., Wheat Flour"
                                        required
                                    />
                                </div>
                                <div className="stock-form-group">
                                    <label>Unit</label>
                                    <input
                                        value={form.unit}
                                        onChange={(event) => setForm((prev) => ({ ...prev, unit: event.target.value }))}
                                        placeholder="e.g., kg, litre, pcs"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="stock-form-row two-col">
                                <div className="stock-form-group">
                                    <label>Opening Stock</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={form.openingStock}
                                        onChange={(event) => setForm((prev) => ({ ...prev, openingStock: event.target.value }))}
                                        placeholder="0"
                                        required
                                    />
                                </div>
                                <div className="stock-form-group">
                                    <label>Reorder Level</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={form.reorderLevel}
                                        onChange={(event) => setForm((prev) => ({ ...prev, reorderLevel: event.target.value }))}
                                        placeholder="0"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="stock-multi-details">
                                <div className="stock-multi-header">
                                    <h3>Multiple Details</h3>
                                    <button type="button" className="stock-add-detail-btn" onClick={addDetailRow}>
                                        <Plus size={14} /> Add Detail Row
                                    </button>
                                </div>

                                <div className="stock-detail-list">
                                    {form.details.map((detail, index) => (
                                        <div className="stock-detail-row" key={detail.id}>
                                            <div className="stock-detail-row-head">
                                                <span>Detail #{index + 1}</span>
                                                <button type="button" className="stock-remove-detail-btn" onClick={() => removeDetailRow(detail.id)}>
                                                    <X size={14} />
                                                </button>
                                            </div>
                                            <div className="stock-form-row three-col">
                                                <div className="stock-form-group">
                                                    <label>Vendor</label>
                                                    <input
                                                        value={detail.vendor}
                                                        onChange={(event) => updateDetailRow(detail.id, 'vendor', event.target.value)}
                                                        placeholder="Vendor name"
                                                    />
                                                </div>
                                                <div className="stock-form-group">
                                                    <label>Batch No</label>
                                                    <input
                                                        value={detail.batchNo}
                                                        onChange={(event) => updateDetailRow(detail.id, 'batchNo', event.target.value)}
                                                        placeholder="Batch id"
                                                    />
                                                </div>
                                                <div className="stock-form-group">
                                                    <label>Unit Cost (₹)</label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={detail.unitCost}
                                                        onChange={(event) => updateDetailRow(detail.id, 'unitCost', event.target.value)}
                                                        placeholder="0.00"
                                                    />
                                                </div>
                                            </div>
                                            <div className="stock-form-row two-col">
                                                <div className="stock-form-group">
                                                    <label>Expiry Date</label>
                                                    <input
                                                        type="date"
                                                        value={detail.expiryDate}
                                                        onChange={(event) => updateDetailRow(detail.id, 'expiryDate', event.target.value)}
                                                    />
                                                </div>
                                                <div className="stock-form-group">
                                                    <label>Note</label>
                                                    <input
                                                        value={detail.note}
                                                        onChange={(event) => updateDetailRow(detail.id, 'note', event.target.value)}
                                                        placeholder="Any extra detail"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="stock-modal-footer">
                                <button type="button" className="stock-modal-btn cancel" onClick={closeItemModal}>Cancel</button>
                                <button type="submit" className="stock-modal-btn submit">{editingItemId ? 'Update Item' : 'Save Item'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showTxnModal && txnItem && (
                <div className="stock-modal-overlay" onClick={closeTxnModal}>
                    <div className="stock-modal small" onClick={(event) => event.stopPropagation()}>
                        <div className="stock-modal-header">
                            <h2>{txnType === 'entry' ? 'Stock In' : 'Stock Out'} · {txnItem.name}</h2>
                            <button className="stock-close-btn" onClick={closeTxnModal}><X size={18} /></button>
                        </div>

                        <form className="stock-form" onSubmit={handleSaveTxn}>
                            <div className="stock-form-group">
                                <label>Quantity ({txnItem.unit})</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={txnForm.quantity}
                                    onChange={(event) => setTxnForm((prev) => ({ ...prev, quantity: event.target.value }))}
                                    placeholder="0"
                                    required
                                />
                            </div>
                            <div className="stock-form-group">
                                <label>{txnType === 'entry' ? 'Purchase Price / Unit (₹)' : 'Usage Value / Unit (₹)'}</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={txnForm.unitPrice}
                                    onChange={(event) => setTxnForm((prev) => ({ ...prev, unitPrice: event.target.value }))}
                                    placeholder="0.00"
                                    required
                                />
                            </div>
                            {txnType === 'exit' && (
                                <>
                                    <div className="stock-form-group">
                                        <label>Used In</label>
                                        <input
                                            value={txnForm.usedAt}
                                            onChange={(event) => setTxnForm((prev) => ({ ...prev, usedAt: event.target.value }))}
                                            placeholder="Kitchen / Production / Wastage / Staff Meal"
                                            required
                                        />
                                    </div>
                                    <div className="stock-form-group">
                                        <label>Purpose (Optional)</label>
                                        <input
                                            value={txnForm.usedFor}
                                            onChange={(event) => setTxnForm((prev) => ({ ...prev, usedFor: event.target.value }))}
                                            placeholder="What this stock was used for"
                                        />
                                    </div>
                                </>
                            )}
                            <div className="stock-form-group">
                                <label>Reference (Optional)</label>
                                <input
                                    value={txnForm.reference}
                                    onChange={(event) => setTxnForm((prev) => ({ ...prev, reference: event.target.value }))}
                                    placeholder={txnType === 'entry' ? 'Invoice no, purchase id, etc' : 'Any linked id'}
                                />
                            </div>
                            <div className="stock-form-group">
                                <label>Note</label>
                                <input
                                    value={txnForm.note}
                                    onChange={(event) => setTxnForm((prev) => ({ ...prev, note: event.target.value }))}
                                    placeholder="Optional note"
                                />
                            </div>

                            <div className="stock-txn-preview">
                                Current: <strong>{txnItem.currentStock}</strong> {txnItem.unit}
                                {' · '}After: <strong>{projectedStock.toFixed(2)}</strong> {txnItem.unit}
                                {' · '}Value: <strong>{formatCurrency((Number(txnForm.quantity || 0) * Number(txnForm.unitPrice || 0)) || 0)}</strong>
                            </div>

                            <div className="stock-modal-footer">
                                <button type="button" className="stock-modal-btn cancel" onClick={closeTxnModal}>Cancel</button>
                                <button type="submit" className={`stock-modal-btn submit ${txnType === 'exit' ? 'danger' : ''}`}>
                                    {txnType === 'entry' ? 'Save Stock In' : 'Save Stock Out'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StockManagement;
