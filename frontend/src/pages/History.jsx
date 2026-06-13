import React, { useEffect, useState } from 'react';
import api from '../api';
import { Eye, Smartphone, Search, FileText, Calendar, User, DollarSign, X, Filter, FileDown } from 'lucide-react';
import { downloadHistoryReport } from '../utils/reportGenerator';
import { useAuth } from '../context/AuthContext';
import './History.css';

const History = () => {
    const { user } = useAuth();
    const businessType = String(user?.business_type || '').toLowerCase().includes('retail') ? 'retailer' : 'restaurant';
    const pageTitle = businessType === 'retailer' ? 'Invoices' : 'History';
    const [invoices, setInvoices] = useState([]);
    const [search, setSearch] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [downloadingReport, setDownloadingReport] = useState(false);

    useEffect(() => {
        const fetchInvoices = async () => {
            try {
                const res = await api.get('/invoices/');
                setInvoices(Array.isArray(res.data) ? res.data : []);
            } catch (e) {
                console.error("Failed to fetch invoices", e);
                setInvoices([]);
            }
        };
        fetchInvoices();
    }, []);

    const shareWhatsApp = (invoice, e) => {
        e.stopPropagation();
        const invoiceUrl = `${window.location.origin}/invoice/${invoice.id}`;
        const message = `*Invoice #${invoice.invoice_number}*\nDate: ${new Date(invoice.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' })}\nAmount: ₹${invoice.total_amount.toFixed(2)}\n\nView Invoice: ${invoiceUrl}\n\nThank you for your business!`;
        const url = `https://wa.me/${invoice.customer_phone || ''}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    };

    const isDateInRange = (dateStr) => {
        if (!startDate && !endDate) return true;
        const d = new Date(dateStr);
        d.setHours(0, 0, 0, 0);

        if (startDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            if (d < start) return false;
        }
        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            if (d > end) return false;
        }
        return true;
    };

    const filteredInvoices = invoices.filter(inv => {
        const matchesSearch =
            inv.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
            (inv.customer_name && inv.customer_name.toLowerCase().includes(search.toLowerCase()));
        const matchesDate = isDateInRange(inv.created_at);
        return matchesSearch && matchesDate;
    });

    const handleDownloadReport = async () => {
        if (filteredInvoices.length === 0) {
            alert('No invoices to generate report');
            return;
        }
        
        setDownloadingReport(true);
        try {
            await downloadHistoryReport({
                invoices: filteredInvoices,
                startDate,
                endDate,
                userInfo: user
            });
        } catch (error) {
            console.error('Failed to generate report:', error);
            alert('Failed to generate report. Please try again.');
        } finally {
            setDownloadingReport(false);
        }
    };

    // Modal Component
    const InvoiceModal = ({ invoice, onClose }) => {
        if (!invoice) return null;
        return (
            <div className="history-modal-overlay" onClick={onClose}>
                <div className="history-modal" onClick={e => e.stopPropagation()}>
                    <div className="history-modal-header">
                        <div className="history-modal-title-section">
                            <h3>Invoice Details</h3>
                            <span className="history-modal-invoice-number">{invoice.invoice_number}</span>
                        </div>
                        <button onClick={onClose} className="history-modal-close">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="history-modal-body">
                        <div className="history-modal-info">
                            <div className="history-modal-info-item">
                                <p>Customer</p>
                                <p>{invoice.customer_name || "Walk-in Customer"}</p>
                            </div>
                            <div className="history-modal-info-item">
                                <p>Date</p>
                                <p>
                                    {new Date(invoice.created_at).toLocaleDateString('en-IN', { 
                                        day: 'numeric', 
                                        month: 'short', 
                                        year: 'numeric',
                                        timeZone: 'Asia/Kolkata'
                                    })}
                                </p>
                            </div>
                        </div>

                        <table className="history-modal-items-table">
                            <thead>
                                <tr>
                                    <th>Item</th>
                                    <th>Qty</th>
                                    <th>Price</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoice.items && invoice.items.map((item, idx) => (
                                    <tr key={idx}>
                                        <td>{item.item_name}</td>
                                        <td>{item.quantity}</td>
                                        <td>₹{(item.unit_price * item.quantity).toFixed(2)}</td>
                                    </tr>
                                ))}
                                {(!invoice.items || invoice.items.length === 0) && (
                                    <tr>
                                        <td colSpan="3" style={{ textAlign: 'center', color: '#9ca3af', fontStyle: 'italic' }}>
                                            Items details not available
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="history-modal-footer">
                        <div className="history-modal-total">
                            <span className="history-modal-total-label">Total Amount</span>
                            <span className="history-modal-total-amount">₹{invoice.total_amount.toFixed(2)}</span>
                        </div>
                        <div className="history-modal-buttons">
                            <button
                                className="history-modal-btn whatsapp"
                                onClick={(e) => shareWhatsApp(invoice, e)}
                            >
                                <Smartphone size={18} /> Share on WhatsApp
                            </button>
                            <button
                                className="history-modal-btn view"
                                onClick={() => window.open(`/invoice/${invoice.id}`, '_blank')}
                            >
                                <Eye size={18} /> View Full Invoice
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="history-page with-mobile-header-offset">
            {/* Header Section */}
            <div className="history-header">
                <div className="history-title-section">
                    <div className="history-icon">
                        <FileText size={20} />
                    </div>
                    <h1 className="history-title">{pageTitle}</h1>
                </div>

                <div className="history-filters">
                    {/* Date Filters */}
                    <div className="date-filter-group">
                        <Calendar size={16} />
                        <input
                            type="date"
                            className="history-date-input"
                            value={startDate}
                            onChange={e => setStartDate(e.target.value)}
                        />
                        <span className="date-separator">-</span>
                        <input
                            type="date"
                            className="history-date-input"
                            value={endDate}
                            onChange={e => setEndDate(e.target.value)}
                        />
                    </div>

                    {/* Search Input */}
                    <div className="history-search-wrapper">
                        <Search className="history-search-icon" size={18} />
                        <input
                            className="history-search-input"
                            placeholder="Search invoice, party or customer..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    {/* Download Report Button */}
                    <button
                        className="history-download-btn"
                        onClick={handleDownloadReport}
                        disabled={downloadingReport || filteredInvoices.length === 0}
                        title="Download Sales Report PDF"
                    >
                        {downloadingReport ? (
                            <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                        ) : (
                            <FileDown size={18} />
                        )}
                        {downloadingReport ? 'Generating...' : 'Download Report'}
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="history-content">
                <div className="history-table-container">
                    <table className="history-table">
                        <thead>
                            <tr>
                                <th>Invoice #</th>
                                <th>Date</th>
                                <th>Customer</th>
                                <th style={{ textAlign: 'right' }}>Amount</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredInvoices.map(inv => (
                                <tr key={inv.id} onClick={() => setSelectedInvoice(inv)}>
                                    <td data-label="Invoice #">
                                        <span className="history-invoice-badge">
                                            {inv.invoice_number}
                                        </span>
                                    </td>
                                    <td data-label="Date">
                                        <div className="history-date-cell">
                                            <span className="history-date-main">
                                                {new Date(inv.created_at).toLocaleDateString('en-IN', { 
                                                    day: 'numeric', 
                                                    month: 'numeric', 
                                                    year: 'numeric',
                                                    timeZone: 'Asia/Kolkata'
                                                })}
                                            </span>
                                            <span className="history-date-time">
                                                {new Date(inv.created_at).toLocaleTimeString('en-IN', { 
                                                    hour: '2-digit', 
                                                    minute: '2-digit',
                                                    hour12: true,
                                                    timeZone: 'Asia/Kolkata'
                                                })}
                                            </span>
                                        </div>
                                    </td>
                                    <td data-label="Customer">
                                        <span className="history-customer-name">
                                            {inv.customer_name || "Walk-in Customer"}
                                        </span>
                                    </td>
                                    <td data-label="Amount">
                                        <span className="history-amount">
                                            ₹{inv.total_amount.toFixed(2)}
                                        </span>
                                    </td>
                                    <td data-label="Actions">
                                        <div className="history-actions">
                                            <button
                                                className="history-action-btn"
                                                title="View Details"
                                                onClick={(e) => { e.stopPropagation(); setSelectedInvoice(inv); }}
                                            >
                                                <Eye size={18} />
                                            </button>
                                            <button
                                                className="history-action-btn whatsapp"
                                                title="Share on WhatsApp"
                                                onClick={(e) => shareWhatsApp(inv, e)}
                                            >
                                                <Smartphone size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredInvoices.length === 0 && (
                                <tr>
                                    <td colSpan="5">
                                        <div className="history-empty-state">
                                            <Filter size={48} className="history-empty-icon" />
                                            <p className="history-empty-text">No sales found</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {selectedInvoice && <InvoiceModal invoice={selectedInvoice} onClose={() => setSelectedInvoice(null)} />}
        </div>
    );
};

export default History;
