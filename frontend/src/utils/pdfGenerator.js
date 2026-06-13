import jsPDF from 'jspdf';
import { numberToWords, calculateTaxBreakdown, roundOff, formatInvoiceDate, formatInvoiceTime } from './invoiceHelpers';

const getLogoDataUrl = () =>
    new Promise((resolve) => {
        const img = new Image();
        img.src = '/logo.png';
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
            const c = document.createElement('canvas');
            c.width = img.width; c.height = img.height;
            c.getContext('2d').drawImage(img, 0, 0);
            resolve(c.toDataURL('image/png'));
        };
        img.onerror = () => resolve(null);
    });

const isRetailerInvoice = (invoice) =>
    String(invoice?.business_type || '').toLowerCase().includes('retail');

const getGstinStateCode = (gstin) => {
    if (!gstin) return null;
    const code = String(gstin).trim().toUpperCase().slice(0, 2);
    return /^\d{2}$/.test(code) ? code : null;
};

/* ── shared helpers ───────────────────────────────────────────────────── */
const r2 = (n) => `Rs.${Number(n || 0).toFixed(2)}`;

/* ══════════════════════════════════════════════════════════════════════
   RESTAURANT PDF
   Warm amber/dark design, A4 portrait
════════════════════════════════════════════════════════════════════════ */
const generateRestaurantPDF = async (invoice) => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const PW = 210, PH = 297;
    const ML = 14, MR = PW - 14;
    const AMBER = [217, 119, 6];
    const DARK = [28, 25, 23];
    const MUTED = [120, 113, 108];
    const AMBER_L = [255, 251, 235];
    const WHITE = [255, 255, 255];

    const logoData = await getLogoDataUrl();
    let y = 0;

    /* ─ header band ─ */
    doc.setFillColor(28, 25, 23);
    doc.rect(0, 0, PW, 30, 'F');

    if (logoData) {
        doc.addImage(logoData, 'PNG', ML, 5, 18, 18);
    } else {
        doc.setFillColor(AMBER[0], AMBER[1], AMBER[2]);
        doc.circle(ML + 9, 15, 8, 'F');
        doc.setTextColor(WHITE[0], WHITE[1], WHITE[2]);
        doc.setFontSize(14); doc.setFont('helvetica', 'bold');
        doc.text((invoice.business_name || 'R').charAt(0).toUpperCase(), ML + 9, 19, { align: 'center' });
    }

    doc.setTextColor(WHITE[0], WHITE[1], WHITE[2]);
    doc.setFontSize(16); doc.setFont('helvetica', 'bold');
    doc.text(invoice.business_name || 'Restaurant', ML + 22, 12);

    doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(200, 200, 200);
    if (invoice.business_address) doc.text(invoice.business_address, ML + 22, 18, { maxWidth: 80 });

    // "RECEIPT" badge top-right
    doc.setFillColor(AMBER[0], AMBER[1], AMBER[2]);
    doc.roundedRect(MR - 34, 8, 30, 12, 3, 3, 'F');
    doc.setTextColor(WHITE[0], WHITE[1], WHITE[2]);
    doc.setFontSize(9); doc.setFont('helvetica', 'bold');
    doc.text('RECEIPT', MR - 19, 16, { align: 'center' });

    y = 36;

    /* ─ amber info strip ─ */
    doc.setFillColor(AMBER_L[0], AMBER_L[1], AMBER_L[2]);
    doc.rect(0, y, PW, 10, 'F');
    doc.setDrawColor(AMBER[0], AMBER[1], AMBER[2]);
    doc.setLineWidth(0.5); doc.line(0, y, PW, y); doc.line(0, y + 10, PW, y + 10);

    doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(AMBER[0], AMBER[1], AMBER[2]);
    let xOff = ML;
    const infoItems = [
        invoice.table_name ? `Table: ${invoice.table_name}` : null,
        `Date: ${formatInvoiceDate(invoice.created_at)}`,
        `Time: ${formatInvoiceTime(invoice.created_at)}`,
        `Payment: ${invoice.payment_mode || 'Cash'}`,
        `Invoice: ${invoice.invoice_number}`,
    ].filter(Boolean);
    infoItems.forEach(txt => {
        doc.text(txt, xOff, y + 7);
        xOff += doc.getTextWidth(txt) + 8;
    });

    y += 16;

    /* ─ guest info ─ */
    doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
    doc.text('GUEST', ML, y); y += 5;
    doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(DARK[0], DARK[1], DARK[2]);
    doc.text(invoice.customer_name || 'Walk-in Guest', ML, y); y += 5;
    doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
    if (invoice.customer_phone) { doc.text(`Phone: ${invoice.customer_phone}`, ML, y); y += 4; }
    if (invoice.gstin) { doc.text(`GSTIN: ${invoice.gstin}`, ML, y); y += 4; }
    if (invoice.fssai_license) { doc.text(`FSSAI: ${invoice.fssai_license}`, ML, y); y += 4; }

    y += 4;

    /* ─ items table ─ */
    const COL = { n: ML, item: ML + 8, qty: 120, rate: 148, amt: MR };
    // Header
    doc.setFillColor(DARK[0], DARK[1], DARK[2]);
    doc.rect(ML, y, MR - ML, 8, 'F');
    doc.setTextColor(WHITE[0], WHITE[1], WHITE[2]);
    doc.setFontSize(8); doc.setFont('helvetica', 'bold');
    doc.text('#', COL.n, y + 5);
    doc.text('Item', COL.item, y + 5);
    doc.text('Qty', COL.qty, y + 5, { align: 'center' });
    doc.text('Rate', COL.rate, y + 5, { align: 'right' });
    doc.text('Amount', COL.amt, y + 5, { align: 'right' });
    y += 10;

    const items = invoice.items || [];
    items.forEach((item, i) => {
        if (y > 240) { doc.addPage(); y = 20; }
        if (i % 2 === 0) { doc.setFillColor(AMBER_L[0], AMBER_L[1], AMBER_L[2]); doc.rect(ML, y - 2, MR - ML, 8, 'F'); }
        doc.setTextColor(DARK[0], DARK[1], DARK[2]);
        doc.setFontSize(8); doc.setFont('helvetica', 'bold');
        doc.text(String(i + 1), COL.n, y + 3);
        const name = item.item_name.length > 36 ? item.item_name.slice(0, 36) + '…' : item.item_name;
        doc.text(name, COL.item, y + 3);
        doc.setFont('helvetica', 'normal');
        doc.text(String(item.quantity), COL.qty, y + 3, { align: 'center' });
        doc.text(r2(item.unit_price), COL.rate, y + 3, { align: 'right' });
        doc.setFont('helvetica', 'bold');
        doc.text(r2(item.unit_price * item.quantity), COL.amt, y + 3, { align: 'right' });
        doc.setDrawColor(220, 200, 180); doc.setLineWidth(0.2); doc.line(ML, y + 5, MR, y + 5);
        y += 8;
    });

    y += 4;

    /* ─ totals ─ */
    const subtotal = items.reduce((s, i) => s + i.unit_price * i.quantity, 0);
    const totalTax = items.reduce((s, i) => s + (i.tax_amount || 0), 0);
    const discount = Number(invoice.discount_amount || 0);
    const grandTotal = invoice.total_amount || (subtotal + totalTax - discount);

    const SUMX = MR - 50;
    doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
    [[`Subtotal`, r2(subtotal)], [`Tax`, r2(totalTax)], ...(discount > 0 ? [[`Discount`, `-${r2(discount)}`]] : [])].forEach(([l, v]) => {
        doc.text(l, SUMX, y, { align: 'right' });
        doc.setTextColor(DARK[0], DARK[1], DARK[2]); doc.setFont('helvetica', 'bold');
        doc.text(v, MR, y, { align: 'right' });
        doc.setFont('helvetica', 'normal'); doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
        y += 6;
    });

    // grand total box
    doc.setFillColor(AMBER[0], AMBER[1], AMBER[2]);
    doc.roundedRect(SUMX - 8, y - 2, MR - SUMX + 12, 10, 2, 2, 'F');
    doc.setTextColor(WHITE[0], WHITE[1], WHITE[2]); doc.setFontSize(9); doc.setFont('helvetica', 'bold');
    doc.text('TOTAL', SUMX - 4, y + 5);
    doc.setFontSize(11);
    doc.text(r2(grandTotal), MR, y + 5, { align: 'right' });

    y += 16;

    // amount in words
    doc.setFontSize(8); doc.setFont('helvetica', 'italic'); doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
    doc.text(numberToWords(Math.round(grandTotal)), ML, y); y += 6;

    /* ─ notes ─ */
    if (invoice.invoice_notes) {
        doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(DARK[0], DARK[1], DARK[2]);
        doc.text(`Note: ${invoice.invoice_notes}`, ML, y, { maxWidth: MR - ML }); y += 8;
    }

    /* ─ footer ─ */
    doc.setFillColor(DARK[0], DARK[1], DARK[2]);
    doc.rect(0, PH - 16, PW, 16, 'F');
    doc.setTextColor(AMBER[0], AMBER[1], AMBER[2]); doc.setFontSize(9); doc.setFont('helvetica', 'bold');
    doc.text('Thank you for dining with us!', PW / 2, PH - 9, { align: 'center' });
    doc.setTextColor(100, 90, 80); doc.setFontSize(7);
    doc.text('Powered by Ailexity POS', PW / 2, PH - 4, { align: 'center' });

    return doc;
};

/* ══════════════════════════════════════════════════════════════════════
   RETAILER PDF
   Professional navy/blue, full GST-compliant, A4 portrait
════════════════════════════════════════════════════════════════════════ */
const generateRetailerPDF = async (invoice) => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const PW = 210, PH = 297;
    const ML = 14, MR = PW - 14;
    const NAVY = [30, 58, 95];
    const BLUE = [37, 99, 235];
    const BL = [239, 246, 255];
    const DARK = [15, 23, 42];
    const MUTED = [100, 116, 139];
    const BORDER = [226, 232, 240];
    const WHITE = [255, 255, 255];

    const logoData = await getLogoDataUrl();
    const sellerCode = getGstinStateCode(invoice.gstin);
    const buyerCode = getGstinStateCode(invoice.customer_gstin);
    const isInterState = Boolean(sellerCode && buyerCode && sellerCode !== buyerCode);

    let y = 0;

    /* ─ navy header ─ */
    doc.setFillColor(NAVY[0], NAVY[1], NAVY[2]);
    doc.rect(0, 0, PW, 36, 'F');

    if (logoData) { doc.addImage(logoData, 'PNG', ML, 7, 16, 16); }
    else {
        doc.setFillColor(WHITE[0], WHITE[1], WHITE[2]);
        doc.circle(ML + 8, 15, 7, 'F');
        doc.setTextColor(NAVY[0], NAVY[1], NAVY[2]);
        doc.setFontSize(12); doc.setFont('helvetica', 'bold');
        doc.text((invoice.business_name || 'B').charAt(0), ML + 8, 19, { align: 'center' });
    }

    doc.setTextColor(WHITE[0], WHITE[1], WHITE[2]);
    doc.setFontSize(15); doc.setFont('helvetica', 'bold');
    doc.text(invoice.business_name || 'Business', ML + 22, 13);
    doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(180, 200, 220);
    if (invoice.business_address) doc.text(invoice.business_address, ML + 22, 19, { maxWidth: 90 });
    const contact = [invoice.store_phone, invoice.store_email].filter(Boolean).join('   ');
    if (contact) doc.text(contact, ML + 22, 27);

    // TAX INVOICE badge
    doc.setFillColor(WHITE[0], WHITE[1], WHITE[2]);
    doc.roundedRect(MR - 40, 10, 36, 14, 2, 2, 'F');
    doc.setTextColor(NAVY[0], NAVY[1], NAVY[2]); doc.setFontSize(9); doc.setFont('helvetica', 'bold');
    doc.text('TAX INVOICE', MR - 22, 19, { align: 'center' });

    y = 40;

    /* ─ GST strip ─ */
    doc.setFillColor(BL[0], BL[1], BL[2]);
    doc.rect(0, y, PW, 8, 'F');
    doc.setDrawColor(BORDER[0], BORDER[1], BORDER[2]); doc.setLineWidth(0.3);
    doc.line(0, y, PW, y); doc.line(0, y + 8, PW, y + 8);
    doc.setFontSize(7.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
    let gx = ML;
    if (invoice.gstin) { doc.text(`Seller GSTIN: ${invoice.gstin}`, gx, y + 5); gx += doc.getTextWidth(`Seller GSTIN: ${invoice.gstin}`) + 10; }
    if (invoice.pan_number) { doc.text(`PAN: ${invoice.pan_number}`, gx, y + 5); gx += doc.getTextWidth(`PAN: ${invoice.pan_number}`) + 10; }
    if (invoice.fssai_license) { doc.text(`FSSAI: ${invoice.fssai_license}`, gx, y + 5); }
    doc.text(`Supply: ${isInterState ? 'Inter-State' : 'Intra-State'}`, MR, y + 5, { align: 'right' });

    y += 12;

    /* ─ parties row ─ */
    const halfW = (MR - ML) / 2 - 4;
    // Bill To
    doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
    doc.text('BILL TO', ML, y);
    y += 4;
    doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(DARK[0], DARK[1], DARK[2]);
    doc.text(invoice.customer_name || 'Walk-in Customer', ML, y); y += 5;
    doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
    if (invoice.customer_address) { doc.text(invoice.customer_address, ML, y, { maxWidth: halfW }); y += 8; }
    if (invoice.customer_phone) { doc.text(`Phone: ${invoice.customer_phone}`, ML, y); y += 4; }
    if (invoice.customer_gstin) {
        doc.setFont('helvetica', 'bold'); doc.setTextColor(DARK[0], DARK[1], DARK[2]);
        doc.text(`GSTIN: ${invoice.customer_gstin}`, ML, y);
        doc.setFont('helvetica', 'normal'); doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
        y += 4;
    }

    // Invoice details — right column (at same y start)
    const detailsY = y - 21; // approximate aligned start
    const dx = ML + halfW + 8;
    doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
    doc.text('INVOICE DETAILS', dx, detailsY);
    const details = [
        ['Invoice No.', invoice.invoice_number],
        ['Date', formatInvoiceDate(invoice.created_at)],
        ['Time', formatInvoiceTime(invoice.created_at)],
        ['Payment', invoice.payment_mode || 'Cash'],
        ['Status', invoice.payment_status || 'Paid'],
    ];
    details.forEach(([l, v], i) => {
        const ry = detailsY + 5 + i * 5;
        doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
        doc.text(l + ':', dx, ry);
        doc.setFont('helvetica', 'bold'); doc.setTextColor(DARK[0], DARK[1], DARK[2]);
        doc.text(v, MR, ry, { align: 'right' });
    });

    y += 6;

    /* ─ horizontal rule ─ */
    doc.setDrawColor(BORDER[0], BORDER[1], BORDER[2]); doc.setLineWidth(0.4);
    doc.line(ML, y, MR, y); y += 4;

    /* ─ items table ─ */
    const COLS = { n: ML, desc: ML + 8, hsn: 100, qty: 120, rate: 140, tax: 163, amt: MR };
    // header
    doc.setFillColor(NAVY[0], NAVY[1], NAVY[2]);
    doc.rect(ML, y, MR - ML, 8, 'F');
    doc.setTextColor(WHITE[0], WHITE[1], WHITE[2]); doc.setFontSize(7.5); doc.setFont('helvetica', 'bold');
    doc.text('#', COLS.n, y + 5);
    doc.text('Description', COLS.desc, y + 5);
    doc.text('HSN/SAC', COLS.hsn, y + 5, { align: 'center' });
    doc.text('Qty', COLS.qty, y + 5, { align: 'center' });
    doc.text('Rate', COLS.rate, y + 5, { align: 'right' });
    doc.text(isInterState ? 'IGST' : 'CGST+SGST', COLS.tax, y + 5, { align: 'right' });
    doc.text('Total', COLS.amt, y + 5, { align: 'right' });
    y += 10;

    const items = invoice.items || [];
    items.forEach((item, i) => {
        if (y > 230) { doc.addPage(); y = 20; }
        if (i % 2 === 0) { doc.setFillColor(BL[0], BL[1], BL[2]); doc.rect(ML, y - 2, MR - ML, 8, 'F'); }
        doc.setTextColor(DARK[0], DARK[1], DARK[2]); doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text(String(i + 1), COLS.n, y + 3);
        const name = item.item_name.length > 32 ? item.item_name.slice(0, 32) + '…' : item.item_name;
        doc.text(name, COLS.desc, y + 3);
        doc.setFont('helvetica', 'normal');
        doc.text(item.hsn_code || '—', COLS.hsn, y + 3, { align: 'center' });
        doc.text(String(item.quantity), COLS.qty, y + 3, { align: 'center' });
        doc.text(r2(item.unit_price), COLS.rate, y + 3, { align: 'right' });
        doc.text(r2(item.tax_amount || 0), COLS.tax, y + 3, { align: 'right' });
        doc.setFont('helvetica', 'bold');
        doc.text(r2(item.unit_price * item.quantity + (item.tax_amount || 0)), COLS.amt, y + 3, { align: 'right' });
        doc.setDrawColor(BORDER[0], BORDER[1], BORDER[2]); doc.setLineWidth(0.2);
        doc.line(ML, y + 5, MR, y + 5);
        y += 8;
    });

    y += 4;

    /* ─ totals ─ */
    const subtotal = items.reduce((s, i) => s + i.unit_price * i.quantity, 0);
    const totalTax = items.reduce((s, i) => s + (i.tax_amount || 0), 0);
    const taxRate = subtotal > 0 ? (totalTax / subtotal) * 100 : 0;
    const tb = calculateTaxBreakdown(subtotal, taxRate, isInterState);
    const discount = Number(invoice.discount_amount || 0);
    const { roundedAmount: grandTotal, roundOffValue } = roundOff(subtotal + totalTax - discount);

    const TX = MR - 50;
    const totals = [
        ['Subtotal (Taxable)', r2(subtotal)],
        ...(tb.cgst > 0 ? [`CGST @ ${(taxRate / 2).toFixed(1)}%`, r2(tb.cgst)] : []).map(x => [x[0], x[1]]),
        ...(tb.sgst > 0 ? [`SGST @ ${(taxRate / 2).toFixed(1)}%`, r2(tb.sgst)] : []).map(x => [x[0], x[1]]),
        ...(tb.igst > 0 ? [`IGST @ ${taxRate.toFixed(1)}%`, r2(tb.igst)] : []).map(x => [x[0], x[1]]),
        ...(discount > 0 ? [['Discount', `-${r2(discount)}`]] : []),
        ...(Math.abs(roundOffValue) > 0.005 ? [['Round Off', `${roundOffValue > 0 ? '+' : ''}${roundOffValue.toFixed(2)}`]] : []),
    ];

    // group cgst/sgst
    const flatTotals = [
        ['Subtotal (Taxable)', r2(subtotal)],
        ...(tb.cgst > 0 ? [['CGST @ ' + (taxRate / 2).toFixed(1) + '%', r2(tb.cgst)]] : []),
        ...(tb.sgst > 0 ? [['SGST @ ' + (taxRate / 2).toFixed(1) + '%', r2(tb.sgst)]] : []),
        ...(tb.igst > 0 ? [['IGST @ ' + taxRate.toFixed(1) + '%', r2(tb.igst)]] : []),
        ...(discount > 0 ? [['Discount', '-' + r2(discount)]] : []),
        ...(Math.abs(roundOffValue) > 0.005 ? [['Round Off', (roundOffValue > 0 ? '+' : '') + roundOffValue.toFixed(2)]] : []),
    ];

    flatTotals.forEach(([l, v]) => {
        doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
        doc.text(l, TX, y, { align: 'right' });
        doc.setFont('helvetica', 'bold'); doc.setTextColor(DARK[0], DARK[1], DARK[2]);
        doc.text(v, MR, y, { align: 'right' });
        y += 5;
    });

    // total due box
    doc.setDrawColor(NAVY[0], NAVY[1], NAVY[2]); doc.setLineWidth(0.6);
    doc.line(TX - 8, y, MR, y); y += 3;
    doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(NAVY[0], NAVY[1], NAVY[2]);
    doc.text('Total Due', TX, y + 4, { align: 'right' });
    doc.setFontSize(13); doc.text(r2(grandTotal), MR, y + 4, { align: 'right' });
    y += 10;

    // amount in words
    doc.setFontSize(7.5); doc.setFont('helvetica', 'italic'); doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
    doc.text(numberToWords(Math.round(grandTotal)), ML, y, { maxWidth: MR - ML - 50 }); y += 8;

    /* ─ bank details ─ */
    if (invoice.bank_account || invoice.bank_name) {
        doc.setDrawColor(BORDER[0], BORDER[1], BORDER[2]); doc.setLineWidth(0.3);
        doc.line(ML, y, MR, y); y += 4;
        doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
        doc.text('PAYMENT DETAILS', ML, y); y += 4;
        doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(DARK[0], DARK[1], DARK[2]);
        if (invoice.bank_name) { doc.text(`Bank: ${invoice.bank_name}`, ML, y); y += 4; }
        if (invoice.account_name) { doc.text(`A/C Name: ${invoice.account_name}`, ML, y); y += 4; }
        if (invoice.bank_account) { doc.text(`A/C No: ${invoice.bank_account}`, ML, y); y += 4; }
    }

    /* ─ terms ─ */
    if (invoice.invoice_terms) {
        doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
        doc.text('TERMS & CONDITIONS', ML, y); y += 4;
        doc.setFontSize(7.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
        const termsLines = doc.splitTextToSize(invoice.invoice_terms, MR - ML);
        termsLines.forEach(l => { doc.text(l, ML, y); y += 4; });
    }

    /* ─ signature ─ */
    doc.setDrawColor(DARK[0], DARK[1], DARK[2]); doc.setLineWidth(0.4);
    doc.line(MR - 40, PH - 24, MR, PH - 24);
    doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
    doc.text('Authorised Signatory', MR - 20, PH - 19, { align: 'center' });
    doc.text('E & O.E. — Goods once sold will not be taken back.', ML, PH - 19);

    /* ─ navy footer ─ */
    doc.setFillColor(NAVY[0], NAVY[1], NAVY[2]);
    doc.rect(0, PH - 12, PW, 12, 'F');
    doc.setTextColor(180, 210, 240); doc.setFontSize(7); doc.setFont('helvetica', 'normal');
    const footerParts = [invoice.store_email, 'Powered by Ailexity POS'].filter(Boolean);
    doc.text(footerParts.join('   |   '), PW / 2, PH - 5, { align: 'center' });

    return doc;
};

/* ══════════════════════════════════════════════════════════════════════
   PUBLIC API
════════════════════════════════════════════════════════════════════════ */

export const generateInvoicePDF = async (invoice) =>
    isRetailerInvoice(invoice)
        ? generateRetailerPDF(invoice)
        : generateRestaurantPDF(invoice);

export const downloadInvoicePDF = async (invoice) => {
    const doc = await generateInvoicePDF(invoice);
    doc.save(`Invoice-${invoice.invoice_number || 'draft'}.pdf`);
};

export const getInvoicePDFBlob = async (invoice) => {
    const doc = await generateInvoicePDF(invoice);
    return doc.output('blob');
};
