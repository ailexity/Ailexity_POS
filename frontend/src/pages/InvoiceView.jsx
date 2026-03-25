import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';
import { Printer, Share2, CheckCircle, XCircle } from 'lucide-react';
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

    const invoiceDate = new Date(invoice.created_at);
    
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

    return (
        <div className="min-h-screen invoice-view-shell flex flex-col">
            {/* A4 Invoice Template */}
            <div className="invoice-a4-container py-8">
                <div className="invoice-a4-page invoice-professional-page" style={{ fontFamily: 'Arial, sans-serif', backgroundColor: 'white' }}>
                    {/* Header */}
                    <div className="invoice-professional-header" style={{ padding: '24px 32px', marginBottom: '0' }}>
                        <div className="flex justify-between items-center">
                            <div>
                                <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#111827', margin: 0 }}>
                                    {invoice.business_name || 'Business Name'}
                                </h1>
                            </div>
                            <div className="text-right">
                                <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827', margin: 0 }}>TAX INVOICE</h2>
                                <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
                                    {invoice.invoice_number}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div style={{ padding: '32px', flex: '1', display: 'flex', flexDirection: 'column' }}>
                        {/* Bill To Section */}
                        <div style={{ marginBottom: '24px' }}>
                            <h3 style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>
                                BILL TO
                            </h3>
                            <p style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b', margin: 0 }}>
                                {invoice.customer_name || 'Walk-in Customer'}
                            </p>
                            {invoice.customer_gstin && (
                                <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', marginBottom: 0 }}>
                                    GSTIN: {invoice.customer_gstin}
                                </p>
                            )}
                        </div>

                        {/* Invoice Details Section */}
                        <div style={{ marginBottom: '24px' }}>
                            <h3 style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', marginBottom: '12px' }}>
                                INVOICE DETAILS
                            </h3>
                            <div className="invoice-details-grid" style={{ display: 'grid', gap: '8px', fontSize: '13px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#64748b' }}>Invoice No:</span>
                                    <span style={{ fontWeight: '600', color: '#1e293b', textAlign: 'right' }}>{invoice.invoice_number}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#64748b' }}>Payment Status:</span>
                                    <span style={{ fontWeight: '600', color: '#1e293b', textAlign: 'right', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        {invoice.payment_status === 'Paid' ? <CheckCircle size={14} color="#111827" /> : <XCircle size={14} color="#6b7280" />}
                                        {invoice.payment_status || 'Paid'}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#64748b' }}>Date:</span>
                                    <span style={{ fontWeight: '600', color: '#1e293b', textAlign: 'right' }}>{formatInvoiceDate(invoice.created_at)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#64748b' }}>Time:</span>
                                    <span style={{ fontWeight: '600', color: '#1e293b', textAlign: 'right' }}>{formatInvoiceTime(invoice.created_at)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#64748b' }}>Payment Mode:</span>
                                    <span style={{ fontWeight: '600', color: '#1e293b', textAlign: 'right' }}>{invoice.payment_mode || 'Cash'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Items Table */}
                        <table className="invoice-items-table" style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px', fontSize: '13px' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid #d1d5db', backgroundColor: '#f9fafb' }}>
                                    <th style={{ textAlign: 'left', padding: '12px 8px', fontWeight: '600', color: '#475569' }}>Sr.</th>
                                    <th style={{ textAlign: 'left', padding: '12px 8px', fontWeight: '600', color: '#475569' }}>Item Description</th>
                                    <th className="hidden-on-mobile" style={{ textAlign: 'center', padding: '12px 8px', fontWeight: '600', color: '#475569' }}>HSN/SAC</th>
                                    <th style={{ textAlign: 'center', padding: '12px 8px', fontWeight: '600', color: '#475569' }}>Qty</th>
                                    <th style={{ textAlign: 'right', padding: '12px 8px', fontWeight: '600', color: '#475569' }}>Rate</th>
                                    <th className="hidden-on-mobile" style={{ textAlign: 'right', padding: '12px 8px', fontWeight: '600', color: '#475569' }}>Taxable Value</th>
                                    {isInterState ? (
                                        <th className="hidden-on-mobile" style={{ textAlign: 'right', padding: '12px 8px', fontWeight: '600', color: '#475569' }}>IGST</th>
                                    ) : (
                                        <>
                                            <th className="hidden-on-mobile" style={{ textAlign: 'right', padding: '12px 8px', fontWeight: '600', color: '#475569' }}>CGST</th>
                                            <th className="hidden-on-mobile" style={{ textAlign: 'right', padding: '12px 8px', fontWeight: '600', color: '#475569' }}>SGST</th>
                                        </>
                                    )}
                                    <th style={{ textAlign: 'right', padding: '12px 8px', fontWeight: '600', color: '#475569' }}>Amount</th>
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
                                        <tr key={index} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={{ padding: '12px 8px', color: '#64748b' }}>{index + 1}</td>
                                            <td style={{ padding: '12px 8px', color: '#1e293b', fontWeight: '500' }}>{item.item_name}</td>
                                            <td className="hidden-on-mobile" style={{ padding: '12px 8px', textAlign: 'center', color: '#64748b' }}>{item.hsn_code || '-'}</td>
                                            <td style={{ padding: '12px 8px', textAlign: 'center', color: '#1e293b' }}>{item.quantity}</td>
                                            <td style={{ padding: '12px 8px', textAlign: 'right', color: '#64748b' }}>₹{item.unit_price.toFixed(2)}</td>
                                            <td className="hidden-on-mobile" style={{ padding: '12px 8px', textAlign: 'right', fontWeight: '600', color: '#1e293b' }}>₹{taxableValue.toFixed(2)}</td>
                                            {isInterState ? (
                                                <td className="hidden-on-mobile" style={{ padding: '12px 8px', textAlign: 'right', color: '#64748b', fontSize: '12px' }}>₹{itemTaxBreakdown.igst.toFixed(2)}</td>
                                            ) : (
                                                <>
                                                    <td className="hidden-on-mobile" style={{ padding: '12px 8px', textAlign: 'right', color: '#64748b', fontSize: '12px' }}>₹{itemTaxBreakdown.cgst.toFixed(2)}</td>
                                                    <td className="hidden-on-mobile" style={{ padding: '12px 8px', textAlign: 'right', color: '#64748b', fontSize: '12px' }}>₹{itemTaxBreakdown.sgst.toFixed(2)}</td>
                                                </>
                                            )}
                                            <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: '600', color: '#1e293b' }}>₹{amount.toFixed(2)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>

                        {/* Totals Summary - Right Aligned */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
                            <div className="invoice-totals-card" style={{ width: '400px' }}>
                                {/* Subtotal */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e2e8f0' }}>
                                    <span style={{ fontSize: '13px', color: '#64748b' }}>Sub Total (Taxable Value):</span>
                                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>₹{subtotal.toFixed(2)}</span>
                                </div>
                                
                                {/* Tax Breakdown */}
                                <div style={{ padding: '12px 0' }}>
                                    <p style={{ fontSize: '12px', fontWeight: '600', color: '#1e293b', marginBottom: '8px' }}>Tax Breakdown:</p>
                                    {taxBreakdown.cgst > 0 && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>
                                            <span>CGST @ {taxRate / 2}%:</span>
                                            <span style={{ fontWeight: '500' }}>₹{taxBreakdown.cgst.toFixed(2)}</span>
                                        </div>
                                    )}
                                    {taxBreakdown.sgst > 0 && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>
                                            <span>SGST @ {taxRate / 2}%:</span>
                                            <span style={{ fontWeight: '500' }}>₹{taxBreakdown.sgst.toFixed(2)}</span>
                                        </div>
                                    )}
                                    {taxBreakdown.igst > 0 && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>
                                            <span>IGST @ {taxRate}%:</span>
                                            <span style={{ fontWeight: '500' }}>₹{taxBreakdown.igst.toFixed(2)}</span>
                                        </div>
                                    )}
                                </div>
                                
                                {/* Total Tax */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
                                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>Total Tax:</span>
                                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>₹{totalTax.toFixed(2)}</span>
                                </div>
                                
                                {/* Round Off */}
                                {Math.abs(roundOffValue) > 0.01 && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                                        <span style={{ fontSize: '13px', color: '#64748b' }}>Round Off:</span>
                                        <span style={{ fontSize: '13px', fontWeight: '500', color: '#1e293b' }}>
                                            {roundOffValue > 0 ? '+' : ''}{roundOffValue.toFixed(2)}
                                        </span>
                                    </div>
                                )}
                                
                                {/* Grand Total */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderTop: '2px solid #1e293b', marginTop: '8px' }}>
                                    <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e293b' }}>Grand Total:</span>
                                    <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e293b' }}>₹{grandTotal.toFixed(2)}</span>
                                </div>
                                
                                {/* Amount in Words */}
                                <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                                    <p style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', marginBottom: '4px' }}>Amount in Words</p>
                                    <p style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>{amountInWords}</p>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Footer - Positioned at bottom */}
                    <div style={{ marginTop: 'auto', textAlign: 'center', padding: '24px 32px', borderTop: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
                        <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>Thank you for your business!</p>
                        <p style={{ fontSize: '12px', color: '#94a3b8' }}>Powered by Ailexity POS</p>
                    </div>
                </div>
            </div>

            {/* Action Buttons - Hidden on print */}
            <div className="w-full bg-white border-t border-gray-200 px-4 py-4 print:hidden">
                <div className="invoice-actions-row flex gap-3 w-full">
                    <button
                        onClick={handleShare}
                        style={{
                            flex: 1,
                            padding: '12px 16px',
                            backgroundColor: 'white',
                            color: '#64748b',
                            border: '1px solid #e2e8f0',
                            borderRadius: '6px',
                            fontSize: '14px',
                            fontWeight: '500',
                            cursor: 'pointer',
                        }}
                    >
                        <Share2 size={18} style={{ display: 'inline', marginRight: '6px' }} />
                        Share
                    </button>
                    <button
                        onClick={handlePrint}
                        style={{
                            flex: 1,
                            padding: '12px 16px',
                            backgroundColor: '#111827',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '14px',
                            fontWeight: '500',
                            cursor: 'pointer',
                        }}
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
