import jsPDF from 'jspdf';

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

const r2 = (n) => `Rs.${Number(n || 0).toFixed(2)}`;

const dateRange = (start, end) => {
    if (start && end) return `${new Date(start).toLocaleDateString('en-IN')} – ${new Date(end).toLocaleDateString('en-IN')}`;
    if (start) return `From ${new Date(start).toLocaleDateString('en-IN')}`;
    if (end) return `Until ${new Date(end).toLocaleDateString('en-IN')}`;
    return 'All Time';
};

/* ══════════════════════════════════════════════════════════════════════
   RESTAURANT SALES REPORT
   Warm amber/dark design. Highlights: covers, top items, hourly peaks
════════════════════════════════════════════════════════════════════════ */
const generateRestaurantReport = async ({ invoices, startDate, endDate, userInfo }) => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const PW = 210;
    const ML = 14, MR = PW - 14;
    const AMBER = [217, 119, 6];
    const DARK = [28, 25, 23];
    const MUTED = [120, 113, 108];
    const AMBER_L = [255, 251, 235];
    const WHITE = [255, 255, 255];

    const logoData = await getLogoDataUrl();
    let y = 0;

    /* ─ header ─ */
    doc.setFillColor(DARK[0], DARK[1], DARK[2]);
    doc.rect(0, 0, PW, 28, 'F');

    if (logoData) doc.addImage(logoData, 'PNG', ML, 5, 14, 14);
    else {
        doc.setFillColor(AMBER[0], AMBER[1], AMBER[2]); doc.circle(ML + 7, 14, 6, 'F');
        doc.setTextColor(WHITE[0], WHITE[1], WHITE[2]); doc.setFontSize(10); doc.setFont('helvetica', 'bold');
        doc.text((userInfo?.business_name || 'R').charAt(0), ML + 7, 17, { align: 'center' });
    }

    doc.setTextColor(WHITE[0], WHITE[1], WHITE[2]);
    doc.setFontSize(13); doc.setFont('helvetica', 'bold');
    doc.text(userInfo?.business_name || 'Restaurant', ML + 20, 12);
    doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(180, 160, 140);
    doc.text(userInfo?.business_address || '', ML + 20, 18);

    // badge
    doc.setFillColor(AMBER[0], AMBER[1], AMBER[2]);
    doc.roundedRect(MR - 46, 8, 42, 12, 2, 2, 'F');
    doc.setTextColor(WHITE[0], WHITE[1], WHITE[2]); doc.setFontSize(9); doc.setFont('helvetica', 'bold');
    doc.text('SALES REPORT', MR - 25, 16, { align: 'center' });

    y = 32;

    /* ─ period & meta ─ */
    doc.setFillColor(AMBER_L[0], AMBER_L[1], AMBER_L[2]);
    doc.rect(0, y, PW, 8, 'F');
    doc.setFontSize(7.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
    doc.text(`Period: ${dateRange(startDate, endDate)}`, ML, y + 5);
    doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')} ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`, MR, y + 5, { align: 'right' });
    y += 12;

    /* ─ KPI boxes ─ */
    const totalInvoices = invoices.length;
    const totalRevenue = invoices.reduce((s, i) => s + i.total_amount, 0);
    const avgTx = totalInvoices ? totalRevenue / totalInvoices : 0;
    const totalItems = invoices.reduce((s, i) => s + (i.items?.reduce((s2, it) => s2 + (it.quantity || 0), 0) || 0), 0);

    const kpis = [
        ['Total Orders', String(totalInvoices), DARK],
        ['Revenue', r2(totalRevenue), AMBER],
        ['Avg. Bill', r2(avgTx), [60, 100, 60]],
        ['Items Sold', String(totalItems), [50, 80, 140]],
    ];
    const boxW = (MR - ML) / kpis.length - 2;
    kpis.forEach(([label, val, color], i) => {
        const bx = ML + i * (boxW + 2);
        doc.setFillColor(WHITE[0], WHITE[1], WHITE[2]);
        doc.setDrawColor(color[0], color[1], color[2]);
        doc.setLineWidth(0.8);
        doc.roundedRect(bx, y, boxW, 18, 2, 2, 'FD');
        doc.setDrawColor(color[0], color[1], color[2]); doc.setLineWidth(2);
        doc.line(bx, y + 18, bx + boxW, y + 18);
        doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
        doc.text(label, bx + boxW / 2, y + 5, { align: 'center' });
        doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(color[0], color[1], color[2]);
        doc.text(val, bx + boxW / 2, y + 14, { align: 'center' });
    });
    y += 24;

    /* ─ payment breakdown ─ */
    const payModes = invoices.reduce((acc, inv) => {
        const m = inv.payment_mode || 'Cash';
        acc[m] = (acc[m] || 0) + inv.total_amount;
        return acc;
    }, {});

    if (Object.keys(payModes).length) {
        doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(DARK[0], DARK[1], DARK[2]);
        doc.text('Payment Mix', ML, y); y += 5;
        const maxPay = Math.max(...Object.values(payModes));
        const barW = 70;
        Object.entries(payModes).sort((a, b) => b[1] - a[1]).forEach(([mode, amt]) => {
            const filled = barW * (amt / maxPay);
            doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(DARK[0], DARK[1], DARK[2]);
            doc.text(mode, ML, y + 3);
            doc.setFillColor(230, 220, 210); doc.rect(ML + 22, y - 1, barW, 5, 'F');
            doc.setFillColor(AMBER[0], AMBER[1], AMBER[2]); doc.rect(ML + 22, y - 1, filled, 5, 'F');
            doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]); doc.text(r2(amt), ML + 22 + barW + 3, y + 3);
            y += 7;
        });
        y += 4;
    }

    /* ─ top items ─ */
    const itemMap = {};
    invoices.forEach(inv => {
        (inv.items || []).forEach(it => {
            const k = it.item_name || 'Unknown';
            if (!itemMap[k]) itemMap[k] = { qty: 0, rev: 0 };
            itemMap[k].qty += it.quantity || 0;
            itemMap[k].rev += it.unit_price * (it.quantity || 1);
        });
    });
    const topItems = Object.entries(itemMap).sort((a, b) => b[1].qty - a[1].qty).slice(0, 8);

    if (topItems.length) {
        doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(DARK[0], DARK[1], DARK[2]);
        doc.text('Top Selling Items', ML, y); y += 5;

        doc.setFillColor(DARK[0], DARK[1], DARK[2]);
        doc.rect(ML, y, MR - ML, 7, 'F');
        doc.setTextColor(WHITE[0], WHITE[1], WHITE[2]); doc.setFontSize(7.5); doc.setFont('helvetica', 'bold');
        doc.text('#', ML + 2, y + 5); doc.text('Item', ML + 10, y + 5);
        doc.text('Qty Sold', MR - 40, y + 5, { align: 'right' });
        doc.text('Revenue', MR, y + 5, { align: 'right' });
        y += 9;

        topItems.forEach(([name, data], i) => {
            if (i % 2 === 0) { doc.setFillColor(AMBER_L[0], AMBER_L[1], AMBER_L[2]); doc.rect(ML, y - 2, MR - ML, 7, 'F'); }
            doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(DARK[0], DARK[1], DARK[2]);
            doc.text(String(i + 1), ML + 2, y + 3);
            doc.setFont('helvetica', 'normal');
            const nm = name.length > 38 ? name.slice(0, 38) + '…' : name;
            doc.text(nm, ML + 10, y + 3);
            doc.setFont('helvetica', 'bold');
            doc.text(String(data.qty), MR - 40, y + 3, { align: 'right' });
            doc.text(r2(data.rev), MR, y + 3, { align: 'right' });
            doc.setDrawColor(220, 200, 180); doc.setLineWidth(0.2); doc.line(ML, y + 4, MR, y + 4);
            y += 7;
        });
        y += 4;
    }

    /* ─ transaction list ─ */
    if (y > 200) { doc.addPage(); y = 20; }

    doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(DARK[0], DARK[1], DARK[2]);
    doc.text('All Transactions', ML, y); y += 5;

    doc.setFillColor(DARK[0], DARK[1], DARK[2]);
    doc.rect(ML, y, MR - ML, 7, 'F');
    doc.setTextColor(WHITE[0], WHITE[1], WHITE[2]); doc.setFontSize(7.5); doc.setFont('helvetica', 'bold');
    const TCOL = { inv: ML + 2, date: ML + 32, table: ML + 60, cust: ML + 88, pay: ML + 120, amt: MR };
    doc.text('Invoice', TCOL.inv, y + 5); doc.text('Date', TCOL.date, y + 5);
    doc.text('Table', TCOL.table, y + 5); doc.text('Customer', TCOL.cust, y + 5);
    doc.text('Mode', TCOL.pay, y + 5); doc.text('Amount', TCOL.amt, y + 5, { align: 'right' });
    y += 9;

    invoices.forEach((inv, i) => {
        if (y > 268) { doc.addPage(); y = 20; }
        if (i % 2 === 0) { doc.setFillColor(AMBER_L[0], AMBER_L[1], AMBER_L[2]); doc.rect(ML, y - 2, MR - ML, 7, 'F'); }
        doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(DARK[0], DARK[1], DARK[2]);
        doc.text((inv.invoice_number || '').slice(0, 12), TCOL.inv, y + 3);
        doc.setFont('helvetica', 'normal');
        doc.text(new Date(inv.created_at).toLocaleDateString('en-IN'), TCOL.date, y + 3);
        doc.text((inv.table_name || '—').slice(0, 10), TCOL.table, y + 3);
        doc.text((inv.customer_name || 'Walk-in').slice(0, 14), TCOL.cust, y + 3);
        doc.text((inv.payment_mode || 'Cash').slice(0, 8), TCOL.pay, y + 3);
        doc.setFont('helvetica', 'bold');
        doc.text(r2(inv.total_amount), TCOL.amt, y + 3, { align: 'right' });
        y += 7;
    });

    /* ─ footer ─ */
    doc.setFillColor(DARK[0], DARK[1], DARK[2]);
    doc.rect(0, 285, PW, 12, 'F');
    doc.setTextColor(AMBER[0], AMBER[1], AMBER[2]); doc.setFontSize(7); doc.setFont('helvetica', 'normal');
    doc.text(`${totalInvoices} transactions · ${dateRange(startDate, endDate)} · Powered by Ailexity POS`, PW / 2, 292, { align: 'center' });

    return doc;
};

/* ══════════════════════════════════════════════════════════════════════
   RETAILER SALES REPORT
   Professional navy/blue. Highlights: party breakdown, outstanding, GST
════════════════════════════════════════════════════════════════════════ */
const generateRetailerReport = async ({ invoices, startDate, endDate, userInfo }) => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const PW = 210;
    const ML = 14, MR = PW - 14;
    const NAVY = [30, 58, 95];
    const BLUE = [37, 99, 235];
    const BL = [239, 246, 255];
    const DARK = [15, 23, 42];
    const MUTED = [100, 116, 139];
    const BORDER = [226, 232, 240];
    const WHITE = [255, 255, 255];

    const logoData = await getLogoDataUrl();
    let y = 0;

    /* ─ header ─ */
    doc.setFillColor(NAVY[0], NAVY[1], NAVY[2]);
    doc.rect(0, 0, PW, 30, 'F');

    if (logoData) doc.addImage(logoData, 'PNG', ML, 6, 14, 14);
    else {
        doc.setFillColor(WHITE[0], WHITE[1], WHITE[2]); doc.circle(ML + 7, 15, 6, 'F');
        doc.setTextColor(NAVY[0], NAVY[1], NAVY[2]); doc.setFontSize(10); doc.setFont('helvetica', 'bold');
        doc.text((userInfo?.business_name || 'B').charAt(0), ML + 7, 18, { align: 'center' });
    }

    doc.setTextColor(WHITE[0], WHITE[1], WHITE[2]);
    doc.setFontSize(13); doc.setFont('helvetica', 'bold');
    doc.text(userInfo?.business_name || 'Business', ML + 20, 12);
    doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(180, 200, 220);
    if (userInfo?.business_address) doc.text(userInfo.business_address, ML + 20, 18);
    if (userInfo?.gstin) doc.text(`GSTIN: ${userInfo.gstin}`, ML + 20, 24);

    doc.setFillColor(WHITE[0], WHITE[1], WHITE[2]);
    doc.roundedRect(MR - 42, 9, 38, 12, 2, 2, 'F');
    doc.setTextColor(NAVY[0], NAVY[1], NAVY[2]); doc.setFontSize(9); doc.setFont('helvetica', 'bold');
    doc.text('SALES REPORT', MR - 23, 17, { align: 'center' });

    y = 34;

    /* ─ period strip ─ */
    doc.setFillColor(BL[0], BL[1], BL[2]);
    doc.rect(0, y, PW, 8, 'F');
    doc.setFontSize(7.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
    doc.text(`Period: ${dateRange(startDate, endDate)}`, ML, y + 5);
    doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')} ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`, MR, y + 5, { align: 'right' });
    y += 12;

    /* ─ KPI boxes ─ */
    const totalInvoices = invoices.length;
    const totalRevenue = invoices.reduce((s, i) => s + i.total_amount, 0);
    const avgTx = totalInvoices ? totalRevenue / totalInvoices : 0;
    const totalTax = invoices.reduce((s, inv) => s + (inv.items || []).reduce((s2, it) => s2 + (it.tax_amount || 0), 0), 0);

    const kpis = [
        ['Invoices', String(totalInvoices), NAVY],
        ['Gross Revenue', r2(totalRevenue), BLUE],
        ['Avg Invoice', r2(avgTx), [20, 120, 80]],
        ['Total Tax', r2(totalTax), [140, 60, 20]],
    ];
    const boxW = (MR - ML) / kpis.length - 2;
    kpis.forEach(([label, val, color], i) => {
        const bx = ML + i * (boxW + 2);
        doc.setFillColor(WHITE[0], WHITE[1], WHITE[2]);
        doc.setDrawColor(BORDER[0], BORDER[1], BORDER[2]); doc.setLineWidth(0.4);
        doc.roundedRect(bx, y, boxW, 18, 2, 2, 'FD');
        doc.setFillColor(color[0], color[1], color[2]);
        doc.roundedRect(bx, y, boxW, 4, 2, 2, 'F');
        doc.rect(bx, y + 2, boxW, 2, 'F');
        doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
        doc.text(label, bx + boxW / 2, y + 9, { align: 'center' });
        doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(color[0], color[1], color[2]);
        doc.text(val, bx + boxW / 2, y + 15, { align: 'center' });
    });
    y += 24;

    /* ─ payment breakdown ─ */
    const payModes = invoices.reduce((acc, inv) => {
        const m = inv.payment_mode || 'Cash';
        acc[m] = (acc[m] || 0) + inv.total_amount;
        return acc;
    }, {});

    if (Object.keys(payModes).length) {
        doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(DARK[0], DARK[1], DARK[2]);
        doc.text('Payment Mode Summary', ML, y); y += 5;

        const modes = Object.entries(payModes).sort((a, b) => b[1] - a[1]);
        const colW = (MR - ML) / Math.min(modes.length, 4);
        modes.slice(0, 4).forEach(([mode, amt], i) => {
            const bx = ML + i * colW;
            doc.setFillColor(BL[0], BL[1], BL[2]);
            doc.setDrawColor(BORDER[0], BORDER[1], BORDER[2]); doc.setLineWidth(0.3);
            doc.roundedRect(bx, y, colW - 2, 12, 2, 2, 'FD');
            doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(NAVY[0], NAVY[1], NAVY[2]);
            doc.text(mode, bx + (colW - 2) / 2, y + 5, { align: 'center' });
            doc.setFontSize(8); doc.setTextColor(DARK[0], DARK[1], DARK[2]);
            doc.text(r2(amt), bx + (colW - 2) / 2, y + 10, { align: 'center' });
        });
        y += 18;
    }

    /* ─ top parties ─ */
    const partyMap = {};
    invoices.forEach(inv => {
        const p = inv.customer_name || 'Walk-in';
        if (!partyMap[p]) partyMap[p] = { count: 0, total: 0 };
        partyMap[p].count++;
        partyMap[p].total += inv.total_amount;
    });
    const topParties = Object.entries(partyMap).sort((a, b) => b[1].total - a[1].total).slice(0, 6);

    if (topParties.length > 1) {
        doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(DARK[0], DARK[1], DARK[2]);
        doc.text('Top Customers / Parties', ML, y); y += 5;

        doc.setFillColor(NAVY[0], NAVY[1], NAVY[2]);
        doc.rect(ML, y, MR - ML, 7, 'F');
        doc.setTextColor(WHITE[0], WHITE[1], WHITE[2]); doc.setFontSize(7.5); doc.setFont('helvetica', 'bold');
        doc.text('Party', ML + 2, y + 5); doc.text('Invoices', MR - 40, y + 5, { align: 'right' }); doc.text('Total', MR, y + 5, { align: 'right' });
        y += 9;

        topParties.forEach(([name, data], i) => {
            if (i % 2 === 0) { doc.setFillColor(BL[0], BL[1], BL[2]); doc.rect(ML, y - 2, MR - ML, 7, 'F'); }
            doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(DARK[0], DARK[1], DARK[2]);
            doc.text(name.length > 40 ? name.slice(0, 40) + '…' : name, ML + 2, y + 3);
            doc.text(String(data.count), MR - 40, y + 3, { align: 'right' });
            doc.setFont('helvetica', 'bold');
            doc.text(r2(data.total), MR, y + 3, { align: 'right' });
            y += 7;
        });
        y += 4;
    }

    /* ─ transactions table ─ */
    if (y > 200) { doc.addPage(); y = 20; }
    doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(DARK[0], DARK[1], DARK[2]);
    doc.text('Transaction Ledger', ML, y); y += 5;

    doc.setFillColor(NAVY[0], NAVY[1], NAVY[2]);
    doc.rect(ML, y, MR - ML, 7, 'F');
    doc.setTextColor(WHITE[0], WHITE[1], WHITE[2]); doc.setFontSize(7.5); doc.setFont('helvetica', 'bold');
    const TCOL2 = { inv: ML + 2, date: ML + 32, party: ML + 60, mode: ML + 120, amt: MR };
    doc.text('Invoice', TCOL2.inv, y + 5); doc.text('Date', TCOL2.date, y + 5);
    doc.text('Party', TCOL2.party, y + 5); doc.text('Mode', TCOL2.mode, y + 5);
    doc.text('Amount', TCOL2.amt, y + 5, { align: 'right' });
    y += 9;

    invoices.forEach((inv, i) => {
        if (y > 268) { doc.addPage(); y = 20; }
        if (i % 2 === 0) { doc.setFillColor(BL[0], BL[1], BL[2]); doc.rect(ML, y - 2, MR - ML, 7, 'F'); }
        doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(DARK[0], DARK[1], DARK[2]);
        doc.text((inv.invoice_number || '').slice(0, 12), TCOL2.inv, y + 3);
        doc.setFont('helvetica', 'normal');
        doc.text(new Date(inv.created_at).toLocaleDateString('en-IN'), TCOL2.date, y + 3);
        doc.text((inv.customer_name || 'Walk-in').slice(0, 22), TCOL2.party, y + 3);
        doc.text((inv.payment_mode || 'Cash').slice(0, 8), TCOL2.mode, y + 3);
        doc.setFont('helvetica', 'bold');
        doc.text(r2(inv.total_amount), TCOL2.amt, y + 3, { align: 'right' });
        doc.setDrawColor(BORDER[0], BORDER[1], BORDER[2]); doc.setLineWidth(0.2); doc.line(ML, y + 4, MR, y + 4);
        y += 7;
    });

    /* ─ footer ─ */
    doc.setFillColor(NAVY[0], NAVY[1], NAVY[2]);
    doc.rect(0, 285, PW, 12, 'F');
    doc.setTextColor(180, 210, 240); doc.setFontSize(7); doc.setFont('helvetica', 'normal');
    doc.text(`${totalInvoices} transactions · ${dateRange(startDate, endDate)} · Powered by Ailexity POS`, PW / 2, 292, { align: 'center' });

    return doc;
};

/* ══════════════════════════════════════════════════════════════════════
   PUBLIC API
════════════════════════════════════════════════════════════════════════ */

export const generateHistoryReportPDF = async (params) => {
    const bt = String(params.userInfo?.business_type || '').toLowerCase();
    return bt.includes('retail')
        ? generateRetailerReport(params)
        : generateRestaurantReport(params);
};

export const downloadHistoryReport = async (params) => {
    const doc = await generateHistoryReportPDF(params);
    const type = String(params.userInfo?.business_type || '').toLowerCase().includes('retail') ? 'Retail' : 'Restaurant';
    doc.save(`Sales-Report-${type}-${new Date().toISOString().split('T')[0]}.pdf`);
};
