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
    const [showLowStockOnly, setShowLowStockOnly] = useState(false);

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

    const lowStockItems = useMemo(() => {
        return items
            .filter((item) => Number(item.currentStock || 0) <= Number(item.reorderLevel || 0))
            .sort((a, b) => {
                const aDiff = Number(a.currentStock || 0) - Number(a.reorderLevel || 0);
                const bDiff = Number(b.currentStock || 0) - Number(b.reorderLevel || 0);
                return aDiff - bDiff;
            });
    }, [items]);

    const highUsageItems = useMemo(() => {
        return items
            .map((item) => {
                const usedQty = (item.transactions || []).reduce((sum, txn) => {
                    return txn.type === 'exit' ? sum + Number(txn.quantity || 0) : sum;
                }, 0);
                return { ...item, usedQty };
            })
            .sort((a, b) => b.usedQty - a.usedQty)
            .slice(0, 3);
    }, [items]);

    const filteredItems = useMemo(() => {
        const keyword = search.toLowerCase().trim();
        const sourceItems = showLowStockOnly ? lowStockItems : items;
        if (!keyword) return sourceItems;

        return sourceItems.filter((item) => {
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
    }, [items, lowStockItems, search, showLowStockOnly]);

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

    const totalItems = items.length;
    const totalCurrentStock = useMemo(
        () => items.reduce((sum, item) => sum + Number(item.currentStock || 0), 0),
        [items]
    );
    const lowStockPercent = totalItems ? Math.round((lowStockItems.length / totalItems) * 100) : 0;

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

    const stockDashboardSteps = [
        {
            step: '01',
            title: 'Inventory Usage Overview',
            description: 'Track stock purchases, current balances, and material consumption in one cumulative dashboard.',
            actionLabel: 'View Stock',
            action: () => navigate('/stock')
        },
        {
            step: '02',
            title: 'Low Stock Alerts',
            description: 'See items below reorder level instantly so you can replenish before stockouts occur.',
            actionLabel: 'Check Alerts',
            action: () => navigate('/stock')
        },
        {
            step: '03',
            title: 'Purchase & Restock',
            description: 'Record supplier entries to update stock quantities and capture purchase cost data.',
            actionLabel: 'Add Stock In',
            action: openQuickPurchaseEntry
        },
        {
            step: '04',
            title: 'Consumption Insights',
            description: 'Review how much stock has been used over time and spot high-consumption items.',
            actionLabel: 'View Usage',
            action: () => navigate('/stock')
        },
        {
            step: '05',
            title: 'Batch & Vendor Tracking',
            description: 'Manage lot details, batch numbers, and supplier sources for traceability.',
            actionLabel: 'Open Stock',
            action: () => navigate('/stock')
        },
        {
            step: '06',
            title: 'Cumulative Reporting',
            description: 'Use aggregated stock metrics and alerts to make smarter purchasing decisions.',
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

                <div className="stock-header-actions">
                    <button className="stock-quick-btn" onClick={() => setShowLowStockOnly((prev) => !prev)}>
                        {showLowStockOnly ? 'Show all stock' : 'Show low stock only'}
                    </button>
                    <button className="stock-quick-btn secondary" onClick={openQuickPurchaseEntry}>
                        Stock In Quick
                    </button>
                    <button className="stock-quick-btn secondary" onClick={() => {
                        if (!items.length) return alert('Add a stock item first.');
                        setTxnItemId(items[0].id);
                        setTxnType('exit');
                        setTxnForm(emptyTxn);
                        setShowTxnModal(true);
                    }}>
                        Stock Out Quick
                    </button>
                </div>
            </div>

            <div className="stock-content">
                <div className="stock-analytics-grid">
                    <div className="stock-analytics-card">
                        <p className="stock-analytics-label">Total item types</p>
                        <p className="stock-analytics-value">{totalItems}</p>
                        <p className="stock-analytics-sub">Different raw ingredients tracked in inventory.</p>
                    </div>
                    <div className="stock-analytics-card accent">
                        <p className="stock-analytics-label">Current stock total</p>
                        <p className="stock-analytics-value">{totalCurrentStock.toFixed(2)}</p>
                        <p className="stock-analytics-sub">Total available quantity across all items.</p>
                    </div>
                    <div className="stock-analytics-card in-card">
                        <p className="stock-analytics-label"><ArrowDownToLine size={13} /> Total stock in</p>
                        <p className="stock-analytics-value">+{analytics.purchasedQty.toFixed(2)}</p>
                        <p className="stock-analytics-sub">Added to inventory · {formatCurrency(analytics.purchasedValue)}</p>
                    </div>
                    <div className="stock-analytics-card out-card">
                        <p className="stock-analytics-label"><ArrowUpFromLine size={13} /> Total stock out</p>
                        <p className="stock-analytics-value">−{analytics.usedQty.toFixed(2)}</p>
                        <p className="stock-analytics-sub">Used / removed · {formatCurrency(analytics.usedValue)}</p>
                    </div>
                </div>

                <section className="stock-usage-panel">
                    <div className="stock-usage-head">
                        <div>
                            <h3>Stock health at a glance</h3>
                            <p>See item counts, low stock pressure, and your most consumed raw materials.</p>
                        </div>
                        <span className="stock-usage-summary">{lowStockItems.length} low-stock item{lowStockItems.length === 1 ? '' : 's'} · {lowStockPercent}% of inventory types</span>
                    </div>

                    <div className="stock-usage-list">
                        {highUsageItems.length > 0 ? (
                            highUsageItems.map((item) => (
                                <div key={item.id} className="stock-usage-item">
                                    <div>
                                        <strong>{item.name}</strong>
                                        <p className="stock-usage-item-sub">Used: {item.usedQty.toFixed(2)} {item.unit}</p>
                                    </div>
                                    <div className="stock-usage-value">{item.currentStock.toFixed(2)} {item.unit} left</div>
                                </div>
                            ))
                        ) : (
                            <p className="stock-history-empty">No usage data yet. Add stock in/out transactions to see insights.</p>
                        )}
                    </div>
                </section>

                {lowStockItems.length > 0 && (
                    <section className="stock-low-alerts">
                        <div className="stock-low-alerts-head">
                            <h3>Low Stock Alerts</h3>
                            <p>{`You have ${lowStockItems.length} item${lowStockItems.length === 1 ? '' : 's'} at or below reorder level.`}</p>
                        </div>
                        <div className="stock-low-alert-list">
                            {lowStockItems.slice(0, 5).map((item) => (
                                <div key={item.id} className="stock-low-item">
                                    <div>
                                        <strong>{item.name}</strong> · {item.currentStock} {item.unit}
                                    </div>
                                    <div>
                                        <span className="stock-low-badge">Reorder {item.reorderLevel}</span>
                                        <button className="stock-low-action" onClick={() => openTxn(item.id, 'entry')}>
                                            Restock
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {lowStockItems.length > 5 && (
                                <div className="stock-low-item more">And {lowStockItems.length - 5} more low stock item{lowStockItems.length - 6 ? 's' : ''}...</div>
                            )}
                        </div>
                    </section>
                )}

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
                                        <tr className={Number(item.currentStock || 0) <= Number(item.reorderLevel || 0) ? 'stock-low-row' : ''}>
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
                                                    <span className="stock-item-sub stock-inout-line">
                                                        <span className="in">▾ {entryTxns.length} in</span>
                                                        <span className="out">▴ {exitTxns.length} out</span>
                                                    </span>
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
                                                                    <div className="stock-history-block-head in">
                                                                        <ArrowDownToLine size={14} /> Stock In · added {entryTxns.length}
                                                                    </div>
                                                                    {entryTxns.length === 0 ? (
                                                                        <p className="stock-history-empty">No stock added yet.</p>
                                                                    ) : (
                                                                        <div className="stock-history-list">
                                                                            {entryTxns.slice(0, 8).map((txn) => (
                                                                                <div className="stock-history-item entry" key={txn.id}>
                                                                                    <div className="stock-history-main">
                                                                                        <span className="stock-move-badge in"><ArrowDownToLine size={12} /> Added</span>
                                                                                        <span className="stock-move-qty in">+{txn.quantity} {item.unit}</span>
                                                                                        <span className="stock-history-price">{formatCurrency(txn.totalPrice)}</span>
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
                                                                    <div className="stock-history-block-head out">
                                                                        <ArrowUpFromLine size={14} /> Stock Out · used {exitTxns.length}
                                                                    </div>
                                                                    {exitTxns.length === 0 ? (
                                                                        <p className="stock-history-empty">No stock used yet.</p>
                                                                    ) : (
                                                                        <div className="stock-history-list">
                                                                            {exitTxns.slice(0, 8).map((txn) => (
                                                                                <div className="stock-history-item exit" key={txn.id}>
                                                                                    <div className="stock-history-main">
                                                                                        <span className="stock-move-badge out"><ArrowUpFromLine size={12} /> Used</span>
                                                                                        <span className="stock-move-qty out">−{txn.quantity} {item.unit}</span>
                                                                                        <span className="stock-history-price">{formatCurrency(txn.totalPrice)}</span>
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
                            <div className={`stock-txn-banner ${txnType}`}>
                                {txnType === 'entry' ? <ArrowDownToLine size={16} /> : <ArrowUpFromLine size={16} />}
                                <span>
                                    {txnType === 'entry'
                                        ? 'Stock In — you are adding stock to inventory.'
                                        : 'Stock Out — you are removing stock from inventory.'}
                                </span>
                            </div>
                            <div className="stock-form-group">
                                <label>Stock Item</label>
                                <select
                                    value={txnItemId || ''}
                                    onChange={(event) => setTxnItemId(event.target.value)}
                                    required
                                >
                                    <option value="" disabled>Select a stock item</option>
                                    {items.map((item) => (
                                        <option key={item.id} value={item.id}>
                                            {item.name} ({item.currentStock} {item.unit} in stock)
                                        </option>
                                    ))}
                                </select>
                            </div>
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

                            <div className={`stock-txn-preview ${txnType}`}>
                                <p className="stock-txn-explain">
                                    {Number(txnForm.quantity) > 0
                                        ? (txnType === 'entry'
                                            ? `Adding ${txnForm.quantity} ${txnItem.unit} of ${txnItem.name} to your stock.`
                                            : `Removing ${txnForm.quantity} ${txnItem.unit} of ${txnItem.name} from your stock.`)
                                        : (txnType === 'entry'
                                            ? 'Enter a quantity above to add stock.'
                                            : 'Enter a quantity above to remove stock.')}
                                </p>
                                <div className="stock-txn-flow">
                                    <div className="stock-txn-step">
                                        <span className="stock-txn-step-label">Stock now</span>
                                        <span className="stock-txn-step-value">{Number(txnItem.currentStock).toFixed(2)} {txnItem.unit}</span>
                                    </div>
                                    <span className={`stock-txn-arrow ${txnType}`}>
                                        {txnType === 'entry' ? '+' : '−'}{Number(txnForm.quantity || 0)} →
                                    </span>
                                    <div className="stock-txn-step result">
                                        <span className="stock-txn-step-label">After this</span>
                                        <span className="stock-txn-step-value">{projectedStock.toFixed(2)} {txnItem.unit}</span>
                                    </div>
                                </div>
                                <div className="stock-txn-value-line">
                                    Transaction value: <strong>{formatCurrency((Number(txnForm.quantity || 0) * Number(txnForm.unitPrice || 0)) || 0)}</strong>
                                </div>
                                {txnType === 'exit' && projectedStock < 0 && (
                                    <p className="stock-txn-warning">⚠ This is more than you currently have in stock.</p>
                                )}
                            </div>

                            <div className="stock-modal-footer">
                                <button type="button" className="stock-modal-btn cancel" onClick={closeTxnModal}>Cancel</button>
                                <button type="submit" className={`stock-modal-btn submit ${txnType === 'exit' ? 'danger' : ''}`}>
                                    {txnType === 'entry' ? '＋ Add to Stock' : '－ Remove from Stock'}
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
