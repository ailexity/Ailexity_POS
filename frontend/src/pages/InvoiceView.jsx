import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';
import { Printer, Share2, CheckCircle, XCircle, MapPin, Phone, Mail } from 'lucide-react';
import { numberToWords, calculateTaxBreakdown, roundOff, formatInvoiceDate, formatInvoiceTime } from '../utils/invoiceHelpers';
import PageLoader from '../components/PageLoader';
import '../styles/invoice.css';

const getGstinStateCode = (gstin) => {
    if (!gstin || typeof gstin !== 'string') return null;
    const normalized = gstin.trim().toUpperCase();
    if (normalized.length < 2) return null;
    const code = normalized.slice(0, 2);
    return /^\d{2}$/.test(code) ? code : null;
};

const InvoiceView = () => {
    const { invoiceId } = useParams();
    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchInvoice();
    }, [invoiceId]);

    const fetchInvoice = async () => {
        try {
            setLoading(true);
            // Use public endpoint for invoice viewing (no auth required)
            const response = await api.get(`/invoices/public/${invoiceId}`);
            setInvoice(response.data);
        } catch (err) {
            // Try authenticated endpoint as fallback
            try {
                const response = await api.get(`/invoices/`);
                const foundInvoice = response.data.find(inv => inv.id === invoiceId);
                if (foundInvoice) {
                    setInvoice(foundInvoice);
                } else {
                    setError('Invoice not found');
                }
            } catch (fallbackErr) {
                setError('Failed to load invoice');
                console.error(err, fallbackErr);
            }
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        // Set document title to invoice number for filename
        const originalTitle = document.title;
        document.title = `Invoice-${invoice?.invoice_number || 'Invoice'}`;

        // Trigger print dialog
        window.print();

        // Restore original title after printing
        setTimeout(() => {
            document.title = originalTitle;
        }, 500);
    };

    const handleShare = () => {
        const url = window.location.href;
        if (navigator.share) {
            navigator.share({
                title: `Invoice ${invoice?.invoice_number}`,
                text: `View invoice for ₹${invoice?.total_amount.toFixed(2)}`,
                url: url
            });
        } else {
            navigator.clipboard.writeText(url);
            alert('Invoice link copied to clipboard!');
        }
    };

    if (loading) {
        return <PageLoader message="Loading invoice..." fullscreen />;
    }

    if (error || !invoice) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <p className="text-red-600 text-lg mb-4">{error || 'Invoice not found'}</p>
                    <button
                        onClick={() => window.history.back()}
                        className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
                    >
                        Go to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    // Calculate totals and tax breakdown
    const subtotal = invoice.items?.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0) || 0;
    const taxRate = invoice.items?.[0]?.tax_amount ?
        ((invoice.items[0].tax_amount / (invoice.items[0].unit_price * invoice.items[0].quantity)) * 100) : 0;
    const sellerStateCode = getGstinStateCode(invoice.gstin);
    const customerStateCode = getGstinStateCode(invoice.customer_gstin);
    const isInterState = Boolean(
        sellerStateCode && customerStateCode && sellerStateCode !== customerStateCode
    );
    const taxBreakdown = calculateTaxBreakdown(subtotal, taxRate, isInterState);
    const totalTax = taxBreakdown.cgst + taxBreakdown.sgst + taxBreakdown.igst;
    const grandTotalBeforeRound = subtotal + totalTax;
    const { roundedAmount: grandTotal, roundOffValue } = roundOff(grandTotalBeforeRound);
    const amountInWords = numberToWords(grandTotal);
    const isPaid = (invoice.payment_status || 'Paid').toLowerCase() === 'paid';
    const hasBankDetails = invoice.bank_account || invoice.bank_name || invoice.account_name;

    return (
        <div className="min-h-screen invoice-view-shell flex flex-col">
            {/* A4 Invoice Template */}
            <div className="invoice-a4-container py-8">
                <div className="invoice-a4-page invoice-pro-page">
                    {/* Accent top bar */}
                    <div className="invoice-pro-topbar" />

                    {/* Header */}
                    <div className="invoice-pro-header">
                        <div className="invoice-pro-brand">
                            <h1>{invoice.business_name || 'Your Business'}</h1>
                            <p className="invoice-pro-tagline">Powered by Ailexity POS</p>
                        </div>
                        <div className="invoice-pro-title">
                            <h2>INVOICE</h2>
                            <p>{invoice.invoice_number}</p>
                        </div>
                    </div>

                    {/* Meta row: Invoice details / Bill To / Total Due */}
                    <div className="invoice-pro-meta">
                        <div className="invoice-pro-meta-col">
                            <h4>Invoice Details</h4>
                            <div className="invoice-pro-meta-line">
                                <span>Invoice No.</span>
                                <span>{invoice.invoice_number}</span>
                            </div>
                            <div className="invoice-pro-meta-line">
                                <span>Date</span>
                                <span>{formatInvoiceDate(invoice.created_at)}</span>
                            </div>
                            <div className="invoice-pro-meta-line">
                                <span>Time</span>
                                <span>{formatInvoiceTime(invoice.created_at)}</span>
                            </div>
                            {invoice.table_name && (
                                <div className="invoice-pro-meta-line">
                                    <span>Table</span>
                                    <span>{invoice.table_name}{invoice.table_number ? ` (#${invoice.table_number})` : ''}</span>
                                </div>
                            )}
                            <div className="invoice-pro-meta-line">
                                <span>Payment Mode</span>
                                <span>{invoice.payment_mode || 'Cash'}</span>
                            </div>
                            <div className="invoice-pro-meta-line">
                                <span>Status</span>
                                <span className={`invoice-pro-status ${isPaid ? 'is-paid' : 'is-unpaid'}`}>
                                    {isPaid ? <CheckCircle size={13} /> : <XCircle size={13} />}
                                    {invoice.payment_status || 'Paid'}
                                </span>
                            </div>
                        </div>

                        <div className="invoice-pro-meta-col">
                            <h4>Invoice To</h4>
                            <p className="invoice-pro-customer-name">
                                {invoice.customer_name || 'Walk-in Customer'}
                            </p>
                            {invoice.customer_phone && (
                                <p className="invoice-pro-meta-text">{invoice.customer_phone}</p>
                            )}
                            {invoice.customer_address && (
                                <p className="invoice-pro-meta-text">{invoice.customer_address}</p>
                            )}
                            {invoice.customer_gstin && (
                                <p className="invoice-pro-meta-text">GSTIN: {invoice.customer_gstin}</p>
                            )}
                        </div>

                        <div className="invoice-pro-total-due">
                            <p className="invoice-pro-total-due-label">Total Due</p>
                            <p className="invoice-pro-total-due-amount">₹{grandTotal.toFixed(2)}</p>
                            <div className="invoice-pro-total-due-divider" />
                            {invoice.business_address && (
                                <p className="invoice-pro-total-due-line">{invoice.business_address}</p>
                            )}
                            {invoice.store_phone && (
                                <p className="invoice-pro-total-due-line">{invoice.store_phone}</p>
                            )}
                            {invoice.store_email && (
                                <p className="invoice-pro-total-due-line">{invoice.store_email}</p>
                            )}
                            {invoice.gstin && (
                                <p className="invoice-pro-total-due-line">GSTIN: {invoice.gstin}</p>
                            )}
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="invoice-pro-table-wrap">
                        <table className="invoice-pro-table">
                            <thead>
                                <tr>
                                    <th className="col-sr">Sr.</th>
                                    <th className="col-desc">Item Description</th>
                                    <th className="col-center hidden-on-mobile">HSN/SAC</th>
                                    <th className="col-center">Qty</th>
                                    <th className="col-right">Rate</th>
                                    <th className="col-right hidden-on-mobile">Taxable Value</th>
                                    {isInterState ? (
                                        <th className="col-right hidden-on-mobile">IGST</th>
                                    ) : (
                                        <>
                                            <th className="col-right hidden-on-mobile">CGST</th>
                                            <th className="col-right hidden-on-mobile">SGST</th>
                                        </>
                                    )}
                                    <th className="col-right">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoice.items && invoice.items.map((item, index) => {
                                    const taxableValue = item.unit_price * item.quantity;
                                    const itemTaxRate = taxableValue > 0
                                        ? ((item.tax_amount || 0) / taxableValue) * 100
                                        : 0;
                                    const itemTaxBreakdown = calculateTaxBreakdown(taxableValue, itemTaxRate, isInterState);
                                    const amount = taxableValue + item.tax_amount;

                                    return (
                                        <tr key={index}>
                                            <td className="col-sr">{index + 1}</td>
                                            <td className="col-desc">{item.item_name}</td>
                                            <td className="col-center hidden-on-mobile">{item.hsn_code || '-'}</td>
                                            <td className="col-center">{item.quantity}</td>
                                            <td className="col-right">₹{item.unit_price.toFixed(2)}</td>
                                            <td className="col-right hidden-on-mobile">₹{taxableValue.toFixed(2)}</td>
                                            {isInterState ? (
                                                <td className="col-right hidden-on-mobile invoice-pro-muted">₹{itemTaxBreakdown.igst.toFixed(2)}</td>
                                            ) : (
                                                <>
                                                    <td className="col-right hidden-on-mobile invoice-pro-muted">₹{itemTaxBreakdown.cgst.toFixed(2)}</td>
                                                    <td className="col-right hidden-on-mobile invoice-pro-muted">₹{itemTaxBreakdown.sgst.toFixed(2)}</td>
                                                </>
                                            )}
                                            <td className="col-right invoice-pro-amount">₹{amount.toFixed(2)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Bottom: Payment info + Totals */}
                    <div className="invoice-pro-bottom">
                        <div className="invoice-pro-payment">
                            <h4>Payment Method</h4>
                            {hasBankDetails ? (
                                <div className="invoice-pro-bank-details">
                                    {invoice.account_name && <p><span>Account Name:</span> {invoice.account_name}</p>}
                                    {invoice.bank_name && <p><span>Bank:</span> {invoice.bank_name}</p>}
                                    {invoice.bank_account && <p><span>Account No:</span> {invoice.bank_account}</p>}
                                </div>
                            ) : (
                                <p className="invoice-pro-meta-text">We accept Cash, Card &amp; UPI payments.</p>
                            )}

                            {invoice.invoice_notes && (
                                <>
                                    <h4 className="invoice-pro-section-spacer">Notes</h4>
                                    <p className="invoice-pro-meta-text">{invoice.invoice_notes}</p>
                                </>
                            )}

                            {invoice.invoice_terms && (
                                <>
                                    <h4 className="invoice-pro-section-spacer">Terms &amp; Conditions</h4>
                                    <p className="invoice-pro-meta-text">{invoice.invoice_terms}</p>
                                </>
                            )}
                        </div>

                        <div className="invoice-pro-totals">
                            <div className="invoice-pro-totals-row">
                                <span>Sub Total (Taxable Value)</span>
                                <span>₹{subtotal.toFixed(2)}</span>
                            </div>

                            {taxBreakdown.cgst > 0 && (
                                <div className="invoice-pro-totals-row is-muted">
                                    <span>CGST @ {(taxRate / 2).toFixed(1)}%</span>
                                    <span>₹{taxBreakdown.cgst.toFixed(2)}</span>
                                </div>
                            )}
                            {taxBreakdown.sgst > 0 && (
                                <div className="invoice-pro-totals-row is-muted">
                                    <span>SGST @ {(taxRate / 2).toFixed(1)}%</span>
                                    <span>₹{taxBreakdown.sgst.toFixed(2)}</span>
                                </div>
                            )}
                            {taxBreakdown.igst > 0 && (
                                <div className="invoice-pro-totals-row is-muted">
                                    <span>IGST @ {taxRate.toFixed(1)}%</span>
                                    <span>₹{taxBreakdown.igst.toFixed(2)}</span>
                                </div>
                            )}

                            {totalTax > 0 && (
                                <div className="invoice-pro-totals-row is-bordered">
                                    <span>Total Tax</span>
                                    <span>₹{totalTax.toFixed(2)}</span>
                                </div>
                            )}

                            {Math.abs(roundOffValue) > 0.01 && (
                                <div className="invoice-pro-totals-row is-muted">
                                    <span>Round Off</span>
                                    <span>{roundOffValue > 0 ? '+' : ''}{roundOffValue.toFixed(2)}</span>
                                </div>
                            )}

                            <div className="invoice-pro-grand-total">
                                <span>Grand Total</span>
                                <span>₹{grandTotal.toFixed(2)}</span>
                            </div>

                            <div className="invoice-pro-words">
                                <p className="invoice-pro-words-label">Amount in Words</p>
                                <p className="invoice-pro-words-text">{amountInWords}</p>
                            </div>
                        </div>
                    </div>

                    {/* Signature */}
                    <div className="invoice-pro-signature">
                        <div className="invoice-pro-signature-line" />
                        <p>Authorized Signatory</p>
                    </div>

                    {/* Footer */}
                    <div className="invoice-pro-footer">
                        <div className="invoice-pro-footer-contacts">
                            {invoice.business_address && (
                                <span><MapPin size={13} /> {invoice.business_address}</span>
                            )}
                            {invoice.store_phone && (
                                <span><Phone size={13} /> {invoice.store_phone}</span>
                            )}
                            {invoice.store_email && (
                                <span><Mail size={13} /> {invoice.store_email}</span>
                            )}
                        </div>
                        <p className="invoice-pro-footer-thanks">Thank you for your business!</p>
                        <p className="invoice-pro-footer-powered">Powered by Ailexity POS</p>
                    </div>
                </div>
            </div>

            {/* Action Buttons - Hidden on print */}
            <div className="w-full bg-white border-t border-gray-200 px-4 py-4 print:hidden">
                <div className="invoice-actions-row flex gap-3 w-full">
                    <button
                        onClick={handleShare}
                        className="invoice-action-btn invoice-action-btn-secondary"
                    >
                        <Share2 size={18} style={{ display: 'inline', marginRight: '6px' }} />
                        Share
                    </button>
                    <button
                        onClick={handlePrint}
                        className="invoice-action-btn invoice-action-btn-primary"
                    >
                        <Printer size={18} style={{ display: 'inline', marginRight: '6px' }} />
                        Print
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InvoiceView;
