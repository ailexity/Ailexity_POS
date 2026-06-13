import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';
import { Printer, Share2, CheckCircle, XCircle, Download } from 'lucide-react';
import { numberToWords, calculateTaxBreakdown, roundOff, formatInvoiceDate, formatInvoiceTime } from '../utils/invoiceHelpers';
import { downloadInvoicePDF } from '../utils/pdfGenerator';
import PageLoader from '../components/PageLoader';
import '../styles/invoice.css';

/* ── helpers ─────────────────────────────────────────────────────────── */
const getGstinStateCode = (gstin) => {
    if (!gstin || typeof gstin !== 'string') return null;
    const code = gstin.trim().toUpperCase().slice(0, 2);
    return /^\d{2}$/.test(code) ? code : null;
};

const isRetailerInvoice = (invoice) => {
    const bt = String(invoice?.business_type || '').toLowerCase();
    return bt.includes('retail');
};

const fmt = (n) => `₹${Number(n || 0).toFixed(2)}`;

/* ══════════════════════════════════════════════════════════════════════
   RESTAURANT TEMPLATE
   Warm amber/orange accent — dine-in receipt feel
════════════════════════════════════════════════════════════════════════ */
const RestaurantInvoice = ({ invoice }) => {
    const A = '#d97706';        // amber accent
    const AL = '#fffbeb';       // amber light bg
    const DARK = '#1c1917';     // warm dark
    const MUTED = '#78716c';    // warm muted

    const subtotal = invoice.items?.reduce((s, i) => s + i.unit_price * i.quantity, 0) || 0;
    const totalTax = invoice.items?.reduce((s, i) => s + (i.tax_amount || 0), 0) || 0;
    const discount = Number(invoice.discount_amount || 0);
    const grandTotal = invoice.total_amount || (subtotal + totalTax - discount);
    const amountInWords = numberToWords(Math.round(grandTotal));

    return (
        <div className="inv-page" style={{ fontFamily: "'Segoe UI', Arial, sans-serif", background: 'white', color: DARK }}>

            {/* ── Header strip ─────────────────────────────────────────── */}
            <div style={{ borderBottom: `4px solid ${A}`, padding: '28px 32px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                            <div style={{ width: 40, height: 40, borderRadius: '50%', background: A, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: 20 }}>
                                {(invoice.business_name || 'R').charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: DARK, letterSpacing: '-0.5px' }}>
                                    {invoice.business_name || 'Restaurant'}
                                </h1>
                                {invoice.business_address && (
                                    <p style={{ margin: 0, fontSize: 11, color: MUTED }}>{invoice.business_address}</p>
                                )}
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 16, fontSize: 11, color: MUTED, marginTop: 4 }}>
                            {invoice.store_phone && <span>📞 {invoice.store_phone}</span>}
                            {invoice.gstin && <span>GSTIN: {invoice.gstin}</span>}
                            {invoice.fssai_license && <span>FSSAI: {invoice.fssai_license}</span>}
                        </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ background: A, color: '#fff', borderRadius: 8, padding: '8px 18px', display: 'inline-block', marginBottom: 8 }}>
                            <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' }}>Receipt</span>
                        </div>
                        <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: DARK }}>{invoice.invoice_number}</p>
                    </div>
                </div>
            </div>

            {/* ── Table / order info bar ────────────────────────────────── */}
            <div style={{ background: AL, borderBottom: `1px solid ${A}40`, padding: '10px 32px', display: 'flex', flexWrap: 'wrap', gap: 24, fontSize: 12 }}>
                {invoice.table_name && (
                    <span><strong style={{ color: A }}>🍽 Table:</strong> {invoice.table_name}</span>
                )}
                <span><strong style={{ color: A }}>📅 Date:</strong> {formatInvoiceDate(invoice.created_at)}</span>
                <span><strong style={{ color: A }}>🕐 Time:</strong> {formatInvoiceTime(invoice.created_at)}</span>
                <span><strong style={{ color: A }}>💳 Payment:</strong> {invoice.payment_mode || 'Cash'}</span>
                {invoice.payment_status && invoice.payment_status !== 'Paid' && (
                    <span style={{ color: '#dc2626', fontWeight: 700 }}>{invoice.payment_status}</span>
                )}
            </div>

            {/* ── Guest info ───────────────────────────────────────────── */}
            <div style={{ padding: '16px 32px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <p style={{ margin: '0 0 2px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: MUTED, letterSpacing: 1 }}>Guest</p>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: DARK }}>{invoice.customer_name || 'Walk-in Guest'}</p>
                    {invoice.customer_phone && <p style={{ margin: 0, fontSize: 12, color: MUTED }}>📱 {invoice.customer_phone}</p>}
                    {invoice.customer_gstin && <p style={{ margin: 0, fontSize: 11, color: MUTED }}>GSTIN: {invoice.customer_gstin}</p>}
                </div>
                <div style={{ textAlign: 'right', fontSize: 12, color: MUTED }}>
                    {invoice.order_source && <p style={{ margin: 0 }}>Source: <strong>{invoice.order_source}</strong></p>}
                    {invoice.order_type && <p style={{ margin: 0 }}>Type: <strong>{invoice.order_type}</strong></p>}
                </div>
            </div>

            {/* ── Items table ──────────────────────────────────────────── */}
            <div style={{ padding: '20px 32px 0' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                        <tr style={{ background: DARK, color: '#fff' }}>
                            <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, borderRadius: '6px 0 0 0', width: 30 }}>#</th>
                            <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700 }}>Item</th>
                            <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700 }}>Qty</th>
                            <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700 }}>Rate</th>
                            <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, borderRadius: '0 6px 0 0' }}>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {invoice.items?.map((item, i) => (
                            <tr key={i} style={{ background: i % 2 === 0 ? AL : 'white', borderBottom: `1px solid ${A}20` }}>
                                <td style={{ padding: '10px 12px', color: MUTED, fontSize: 11 }}>{i + 1}</td>
                                <td style={{ padding: '10px 12px' }}>
                                    <span style={{ fontWeight: 600, color: DARK }}>{item.item_name}</span>
                                    {item.notes && <div style={{ fontSize: 10, color: A, fontStyle: 'italic', marginTop: 2 }}>✏ {item.notes}</div>}
                                </td>
                                <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700, color: DARK }}>{item.quantity}</td>
                                <td style={{ padding: '10px 12px', textAlign: 'right', color: MUTED }}>{fmt(item.unit_price)}</td>
                                <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: DARK }}>{fmt(item.unit_price * item.quantity)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* ── Totals ───────────────────────────────────────────────── */}
            <div style={{ padding: '16px 32px', display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{ minWidth: 260, fontSize: 13 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${A}30` }}>
                        <span style={{ color: MUTED }}>Subtotal</span>
                        <span style={{ fontWeight: 600 }}>{fmt(subtotal)}</span>
                    </div>
                    {totalTax > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${A}30` }}>
                            <span style={{ color: MUTED }}>Tax (incl. GST)</span>
                            <span style={{ fontWeight: 600 }}>{fmt(totalTax)}</span>
                        </div>
                    )}
                    {discount > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${A}30`, color: '#16a34a' }}>
                            <span>Discount</span>
                            <span style={{ fontWeight: 600 }}>−{fmt(discount)}</span>
                        </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: A, color: '#fff', borderRadius: 8, marginTop: 8 }}>
                        <span style={{ fontSize: 15, fontWeight: 800 }}>TOTAL</span>
                        <span style={{ fontSize: 18, fontWeight: 900 }}>{fmt(grandTotal)}</span>
                    </div>
                    <p style={{ fontSize: 11, color: MUTED, fontStyle: 'italic', textAlign: 'right', marginTop: 6 }}>{amountInWords}</p>
                </div>
            </div>

            {/* ── Notes ────────────────────────────────────────────────── */}
            {invoice.invoice_notes && (
                <div style={{ margin: '0 32px', padding: '10px 14px', background: AL, borderLeft: `3px solid ${A}`, borderRadius: 4, fontSize: 12, color: DARK }}>
                    <strong>Note:</strong> {invoice.invoice_notes}
                </div>
            )}

            {/* ── Footer ───────────────────────────────────────────────── */}
            <div style={{ marginTop: 'auto', textAlign: 'center', padding: '24px 32px', borderTop: `2px dashed ${A}40`, marginTop: 20 }}>
                <p style={{ fontSize: 16, fontWeight: 700, color: A, margin: '0 0 4px' }}>Thank you for dining with us! 🍽</p>
                {invoice.invoice_terms && <p style={{ fontSize: 11, color: MUTED, margin: '0 0 4px' }}>{invoice.invoice_terms}</p>}
                <p style={{ fontSize: 10, color: '#d1d5db', margin: 0 }}>Powered by Ailexity POS</p>
            </div>
        </div>
    );
};

/* ══════════════════════════════════════════════════════════════════════
   RETAILER TEMPLATE
   Professional navy/blue — full GST-compliant B2B invoice
════════════════════════════════════════════════════════════════════════ */
const RetailerInvoice = ({ invoice }) => {
    const NAVY = '#1e3a5f';
    const BLUE = '#2563eb';
    const BL = '#eff6ff';
    const DARK = '#0f172a';
    const MUTED = '#64748b';
    const BORDER = '#e2e8f0';

    const sellerStateCode = getGstinStateCode(invoice.gstin);
    const customerStateCode = getGstinStateCode(invoice.customer_gstin);
    const isInterState = Boolean(sellerStateCode && customerStateCode && sellerStateCode !== customerStateCode);

    const subtotal = invoice.items?.reduce((s, i) => s + i.unit_price * i.quantity, 0) || 0;
    const totalTax = invoice.items?.reduce((s, i) => s + (i.tax_amount || 0), 0) || 0;
    const taxRate = subtotal > 0 && totalTax > 0 ? (totalTax / subtotal) * 100 : 0;
    const taxBreakdown = calculateTaxBreakdown(subtotal, taxRate, isInterState);
    const discount = Number(invoice.discount_amount || 0);
    const { roundedAmount: grandTotal, roundOffValue } = roundOff(subtotal + totalTax - discount);
    const amountInWords = numberToWords(Math.round(grandTotal));

    return (
        <div className="inv-page" style={{ fontFamily: "'Segoe UI', Arial, sans-serif", background: 'white', color: DARK }}>

            {/* ── Header ────────────────────────────────────────────────── */}
            <div style={{ background: NAVY, color: '#fff', padding: '24px 32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <h1 style={{ margin: '0 0 4px', fontSize: 24, fontWeight: 900, letterSpacing: '-0.5px' }}>
                            {invoice.business_name || 'Business Name'}
                        </h1>
                        {invoice.business_address && (
                            <p style={{ margin: '0 0 2px', fontSize: 11, opacity: 0.8 }}>{invoice.business_address}</p>
                        )}
                        <div style={{ display: 'flex', gap: 16, fontSize: 11, opacity: 0.75, marginTop: 4, flexWrap: 'wrap' }}>
                            {invoice.store_phone && <span>📞 {invoice.store_phone}</span>}
                            {invoice.store_email && <span>✉ {invoice.store_email}</span>}
                        </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ background: '#fff', color: NAVY, borderRadius: 6, padding: '6px 16px', display: 'inline-block', marginBottom: 8 }}>
                            <span style={{ fontSize: 13, fontWeight: 900, letterSpacing: 2 }}>TAX INVOICE</span>
                        </div>
                        <p style={{ margin: 0, fontSize: 15, fontWeight: 700, opacity: 0.9 }}>{invoice.invoice_number}</p>
                        <p style={{ margin: 0, fontSize: 11, opacity: 0.7 }}>{formatInvoiceDate(invoice.created_at)}</p>
                    </div>
                </div>
            </div>

            {/* ── GST strip ─────────────────────────────────────────────── */}
            <div style={{ background: BL, borderBottom: `1px solid ${BLUE}30`, padding: '8px 32px', display: 'flex', gap: 24, fontSize: 11, flexWrap: 'wrap' }}>
                {invoice.gstin && <span style={{ color: MUTED }}>Seller GSTIN: <strong style={{ color: DARK }}>{invoice.gstin}</strong></span>}
                {invoice.pan_number && <span style={{ color: MUTED }}>PAN: <strong style={{ color: DARK }}>{invoice.pan_number}</strong></span>}
                {invoice.fssai_license && <span style={{ color: MUTED }}>FSSAI: <strong style={{ color: DARK }}>{invoice.fssai_license}</strong></span>}
                <span style={{ color: MUTED, marginLeft: 'auto' }}>Supply Type: <strong style={{ color: DARK }}>{isInterState ? 'Inter-State' : 'Intra-State'}</strong></span>
            </div>

            {/* ── Parties ───────────────────────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, borderBottom: `1px solid ${BORDER}` }}>
                <div style={{ padding: '16px 32px', borderRight: `1px solid ${BORDER}` }}>
                    <p style={{ margin: '0 0 8px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: MUTED, letterSpacing: 1 }}>Bill To</p>
                    <p style={{ margin: '0 0 2px', fontSize: 14, fontWeight: 700, color: DARK }}>{invoice.customer_name || 'Walk-in Customer'}</p>
                    {invoice.customer_address && <p style={{ margin: '0 0 2px', fontSize: 12, color: MUTED }}>{invoice.customer_address}</p>}
                    {invoice.customer_phone && <p style={{ margin: '0 0 2px', fontSize: 12, color: MUTED }}>📞 {invoice.customer_phone}</p>}
                    {invoice.customer_gstin && (
                        <p style={{ margin: '0 0 2px', fontSize: 12, color: DARK, fontWeight: 600 }}>GSTIN: {invoice.customer_gstin}</p>
                    )}
                </div>
                <div style={{ padding: '16px 32px' }}>
                    <p style={{ margin: '0 0 8px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: MUTED, letterSpacing: 1 }}>Invoice Details</p>
                    {[
                        ['Invoice No.', invoice.invoice_number],
                        ['Date', formatInvoiceDate(invoice.created_at)],
                        ['Time', formatInvoiceTime(invoice.created_at)],
                        ['Payment Mode', invoice.payment_mode || 'Cash'],
                        ['Status', invoice.payment_status || 'Paid'],
                    ].map(([label, val]) => (
                        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                            <span style={{ color: MUTED }}>{label}</span>
                            <span style={{ fontWeight: 600, color: DARK }}>{val}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Items table ──────────────────────────────────────────── */}
            <div style={{ padding: '0 0 0' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                        <tr style={{ background: NAVY, color: '#fff' }}>
                            <th style={{ padding: '9px 12px', textAlign: 'left', width: 30 }}>#</th>
                            <th style={{ padding: '9px 12px', textAlign: 'left' }}>Description</th>
                            <th className="hidden-on-mobile" style={{ padding: '9px 8px', textAlign: 'center' }}>HSN/SAC</th>
                            <th style={{ padding: '9px 8px', textAlign: 'center' }}>Qty</th>
                            <th style={{ padding: '9px 8px', textAlign: 'right' }}>Rate</th>
                            <th className="hidden-on-mobile" style={{ padding: '9px 8px', textAlign: 'right' }}>Taxable</th>
                            {isInterState
                                ? <th className="hidden-on-mobile" style={{ padding: '9px 8px', textAlign: 'right' }}>IGST</th>
                                : <>
                                    <th className="hidden-on-mobile" style={{ padding: '9px 8px', textAlign: 'right' }}>CGST</th>
                                    <th className="hidden-on-mobile" style={{ padding: '9px 8px', textAlign: 'right' }}>SGST</th>
                                </>
                            }
                            <th style={{ padding: '9px 12px', textAlign: 'right' }}>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {invoice.items?.map((item, i) => {
                            const taxable = item.unit_price * item.quantity;
                            const itemTaxRate = taxable > 0 ? ((item.tax_amount || 0) / taxable) * 100 : 0;
                            const itb = calculateTaxBreakdown(taxable, itemTaxRate, isInterState);
                            return (
                                <tr key={i} style={{ background: i % 2 === 0 ? BL : 'white', borderBottom: `1px solid ${BORDER}` }}>
                                    <td style={{ padding: '9px 12px', color: MUTED }}>{i + 1}</td>
                                    <td style={{ padding: '9px 12px', fontWeight: 600, color: DARK }}>
                                        {item.item_name}
                                        {item.notes && <div style={{ fontSize: 10, color: BLUE, fontStyle: 'italic', marginTop: 1 }}>✏ {item.notes}</div>}
                                    </td>
                                    <td className="hidden-on-mobile" style={{ padding: '9px 8px', textAlign: 'center', color: MUTED }}>{item.hsn_code || '—'}</td>
                                    <td style={{ padding: '9px 8px', textAlign: 'center', fontWeight: 700 }}>{item.quantity}</td>
                                    <td style={{ padding: '9px 8px', textAlign: 'right', color: MUTED }}>{fmt(item.unit_price)}</td>
                                    <td className="hidden-on-mobile" style={{ padding: '9px 8px', textAlign: 'right' }}>{fmt(taxable)}</td>
                                    {isInterState
                                        ? <td className="hidden-on-mobile" style={{ padding: '9px 8px', textAlign: 'right', color: MUTED }}>{fmt(itb.igst)}</td>
                                        : <>
                                            <td className="hidden-on-mobile" style={{ padding: '9px 8px', textAlign: 'right', color: MUTED }}>{fmt(itb.cgst)}</td>
                                            <td className="hidden-on-mobile" style={{ padding: '9px 8px', textAlign: 'right', color: MUTED }}>{fmt(itb.sgst)}</td>
                                        </>
                                    }
                                    <td style={{ padding: '9px 12px', textAlign: 'right', fontWeight: 700 }}>{fmt(taxable + (item.tax_amount || 0))}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* ── Totals + Bank ─────────────────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 0, padding: '0 0 0' }}>
                {/* Bank / payment details */}
                <div style={{ padding: '16px 32px', borderTop: `1px solid ${BORDER}`, borderRight: `1px solid ${BORDER}` }}>
                    {(invoice.bank_account || invoice.bank_name) && (
                        <>
                            <p style={{ margin: '0 0 8px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: MUTED, letterSpacing: 1 }}>Payment Details</p>
                            {invoice.bank_name && <p style={{ margin: '0 0 2px', fontSize: 12, color: DARK }}><strong>Bank:</strong> {invoice.bank_name}</p>}
                            {invoice.account_name && <p style={{ margin: '0 0 2px', fontSize: 12, color: DARK }}><strong>A/C Name:</strong> {invoice.account_name}</p>}
                            {invoice.bank_account && <p style={{ margin: '0 0 2px', fontSize: 12, fontFamily: 'monospace', color: DARK }}><strong>A/C No:</strong> {invoice.bank_account}</p>}
                        </>
                    )}
                    {invoice.invoice_terms && (
                        <div style={{ marginTop: 12 }}>
                            <p style={{ margin: '0 0 4px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: MUTED, letterSpacing: 1 }}>Terms & Conditions</p>
                            <p style={{ margin: 0, fontSize: 11, color: MUTED, lineHeight: 1.5 }}>{invoice.invoice_terms}</p>
                        </div>
                    )}
                    {invoice.invoice_notes && (
                        <div style={{ marginTop: 10, padding: '8px 10px', background: BL, borderLeft: `3px solid ${BLUE}`, borderRadius: 3, fontSize: 11, color: DARK }}>
                            <strong>Note:</strong> {invoice.invoice_notes}
                        </div>
                    )}
                </div>

                {/* Totals */}
                <div style={{ padding: '16px 32px', borderTop: `1px solid ${BORDER}`, minWidth: 280, fontSize: 13 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${BORDER}` }}>
                        <span style={{ color: MUTED }}>Subtotal (Taxable)</span>
                        <span style={{ fontWeight: 600 }}>{fmt(subtotal)}</span>
                    </div>
                    {taxBreakdown.cgst > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 12 }}>
                            <span style={{ color: MUTED }}>CGST @ {(taxRate / 2).toFixed(1)}%</span>
                            <span>{fmt(taxBreakdown.cgst)}</span>
                        </div>
                    )}
                    {taxBreakdown.sgst > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 12 }}>
                            <span style={{ color: MUTED }}>SGST @ {(taxRate / 2).toFixed(1)}%</span>
                            <span>{fmt(taxBreakdown.sgst)}</span>
                        </div>
                    )}
                    {taxBreakdown.igst > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 12 }}>
                            <span style={{ color: MUTED }}>IGST @ {taxRate.toFixed(1)}%</span>
                            <span>{fmt(taxBreakdown.igst)}</span>
                        </div>
                    )}
                    {discount > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 12, color: '#16a34a', borderTop: `1px solid ${BORDER}` }}>
                            <span>Discount</span>
                            <span style={{ fontWeight: 600 }}>−{fmt(discount)}</span>
                        </div>
                    )}
                    {Math.abs(roundOffValue) > 0.005 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 12, color: MUTED }}>
                            <span>Round Off</span>
                            <span>{roundOffValue > 0 ? '+' : ''}{roundOffValue.toFixed(2)}</span>
                        </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderTop: `2px solid ${NAVY}`, marginTop: 6 }}>
                        <span style={{ fontSize: 15, fontWeight: 800, color: NAVY }}>Total Due</span>
                        <span style={{ fontSize: 19, fontWeight: 900, color: NAVY }}>{fmt(grandTotal)}</span>
                    </div>
                    <div style={{ background: BL, borderRadius: 6, padding: '8px 10px', border: `1px solid ${BLUE}30`, marginTop: 4 }}>
                        <p style={{ margin: '0 0 2px', fontSize: 10, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: 1 }}>Amount in Words</p>
                        <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: DARK }}>{amountInWords}</p>
                    </div>
                </div>
            </div>

            {/* ── Signature strip ───────────────────────────────────────── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 32px', borderTop: `1px solid ${BORDER}`, fontSize: 11, color: MUTED }}>
                <div>
                    <p style={{ margin: 0, fontStyle: 'italic' }}>E &amp; O.E. — Goods once sold will not be taken back.</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ borderBottom: `1px solid ${DARK}`, width: 120, marginBottom: 4 }}></div>
                    <p style={{ margin: 0 }}>Authorised Signatory</p>
                </div>
            </div>

            {/* ── Footer ───────────────────────────────────────────────── */}
            <div style={{ textAlign: 'center', padding: '10px 32px', background: NAVY, color: '#ffffff80', fontSize: 10 }}>
                {invoice.store_email && <span style={{ marginRight: 16 }}>{invoice.store_email}</span>}
                <span>Powered by Ailexity POS</span>
            </div>
        </div>
    );
};

/* ══════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════════════════════════════ */
const InvoiceView = () => {
    const { invoiceId } = useParams();
    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [downloading, setDownloading] = useState(false);

    useEffect(() => { fetchInvoice(); }, [invoiceId]);

    const fetchInvoice = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/invoices/public/${invoiceId}`);
            setInvoice(response.data);
        } catch {
            try {
                const response = await api.get(`/invoices/`);
                const found = response.data.find(inv => inv.id === invoiceId);
                if (found) setInvoice(found);
                else setError('Invoice not found');
            } catch {
                setError('Failed to load invoice');
            }
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        const orig = document.title;
        document.title = `Invoice-${invoice?.invoice_number || 'Invoice'}`;
        window.print();
        setTimeout(() => { document.title = orig; }, 500);
    };

    const handleShare = () => {
        const url = window.location.href;
        if (navigator.share) {
            navigator.share({ title: `Invoice ${invoice?.invoice_number}`, url });
        } else {
            navigator.clipboard.writeText(url);
            alert('Invoice link copied to clipboard!');
        }
    };

    const handleDownloadPDF = async () => {
        if (!invoice) return;
        setDownloading(true);
        try {
            await downloadInvoicePDF(invoice);
        } finally {
            setDownloading(false);
        }
    };

    if (loading) return <PageLoader message="Loading invoice..." fullscreen />;

    if (error || !invoice) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
                <div style={{ textAlign: 'center' }}>
                    <p style={{ color: '#dc2626', fontSize: 16, marginBottom: 16 }}>{error || 'Invoice not found'}</p>
                    <button onClick={() => window.history.back()} style={{ padding: '10px 20px', background: '#1e293b', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    const isRetailer = isRetailerInvoice(invoice);

    return (
        <div className="min-h-screen invoice-view-shell flex flex-col">
            <div className="invoice-a4-container py-8">
                <div className="invoice-a4-page">
                    {isRetailer
                        ? <RetailerInvoice invoice={invoice} />
                        : <RestaurantInvoice invoice={invoice} />
                    }
                </div>
            </div>

            {/* Action bar — hidden on print */}
            <div className="w-full bg-white border-t border-gray-200 px-4 py-3 print:hidden">
                <div className="invoice-actions-row flex gap-3 w-full" style={{ maxWidth: 600, margin: '0 auto' }}>
                    <button onClick={handleShare} style={{ flex: 1, padding: '11px', background: 'white', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                        <Share2 size={16} /> Share
                    </button>
                    <button onClick={handleDownloadPDF} disabled={downloading} style={{ flex: 1, padding: '11px', background: '#f8fafc', color: '#374151', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: downloading ? 0.6 : 1 }}>
                        <Download size={16} /> {downloading ? 'Generating…' : 'Download PDF'}
                    </button>
                    <button onClick={handlePrint} style={{ flex: 1, padding: '11px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                        <Printer size={16} /> Print
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InvoiceView;
