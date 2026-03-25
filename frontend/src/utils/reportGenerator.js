import jsPDF from 'jspdf';

const getLogoDataUrl = () => {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = '/logo.png';
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = () => {
            resolve(null);
        };
    });
};

/**
 * Generate a sales history report PDF
 * @param {Object} params - Report parameters
 * @param {Array} params.invoices - Array of invoice objects
 * @param {string} params.startDate - Start date for report
 * @param {string} params.endDate - End date for report
 * @param {Object} params.userInfo - User/business information
 * @returns {Promise<jsPDF>} doc
 */
export const generateHistoryReportPDF = async ({ invoices, startDate, endDate, userInfo }) => {
    const doc = new jsPDF();
    const primaryRgb = [17, 24, 39];
    const borderRgb = [229, 231, 235];
    const softRgb = [249, 250, 251];
    const textRgb = [17, 24, 39];
    const mutedRgb = [107, 114, 128];

    doc.setFont('helvetica');

    // === COMPACT HEADER ===
    let yPos = 15;

    // Logo and Business Name - Same Line
    const logoData = await getLogoDataUrl();
    if (logoData) {
        doc.addImage(logoData, 'PNG', 20, yPos - 3, 15, 15);
    } else {
        doc.setDrawColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
        doc.setLineWidth(1.2);
        doc.setTextColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text('A', 25, yPos + 6);
        doc.circle(27.5, yPos + 2, 7);
    }

    // Business Name next to logo
    doc.setFontSize(16);
    doc.setTextColor(textRgb[0], textRgb[1], textRgb[2]);
    doc.setFont('helvetica', 'bold');
    doc.text(userInfo?.business_name || 'Ailexity POS', 40, yPos + 5);

    // Report Title - Right aligned on same line
    doc.setFontSize(20);
    doc.setTextColor(textRgb[0], textRgb[1], textRgb[2]);
    doc.setFont('helvetica', 'bold');
    doc.text('SALES REPORT', 190, yPos + 5, { align: 'right' });

    yPos += 15;

    // Divider line
    doc.setDrawColor(borderRgb[0], borderRgb[1], borderRgb[2]);
    doc.setLineWidth(0.5);
    doc.line(20, yPos, 190, yPos);

    yPos += 8;

    // Date Range and Generated info - compact
    doc.setFontSize(9);
    doc.setTextColor(mutedRgb[0], mutedRgb[1], mutedRgb[2]);
    doc.setFont('helvetica', 'normal');
    const dateRangeText = startDate && endDate 
        ? `Period: ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`
        : startDate
        ? `Period: From ${new Date(startDate).toLocaleDateString()}`
        : endDate
        ? `Period: Until ${new Date(endDate).toLocaleDateString()}`
        : 'Period: All Time';
    doc.text(dateRangeText, 20, yPos);
    doc.text(`Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`, 190, yPos, { align: 'right' });

    // === SUMMARY SECTION ===
    yPos += 10;
    
    // Summary Box Background
    doc.setFillColor(softRgb[0], softRgb[1], softRgb[2]);
    doc.rect(20, yPos, 170, 30, 'F');
    doc.setDrawColor(borderRgb[0], borderRgb[1], borderRgb[2]);
    doc.setLineWidth(0.2);
    doc.rect(20, yPos, 170, 30);

    yPos += 8;

    // Calculate totals
    const totalInvoices = invoices.length;
    const totalRevenue = invoices.reduce((sum, inv) => sum + inv.total_amount, 0);
    const avgTransaction = totalInvoices > 0 ? totalRevenue / totalInvoices : 0;

    // Group by payment mode
    const paymentModes = invoices.reduce((acc, inv) => {
        const mode = inv.payment_mode || 'Cash';
        acc[mode] = (acc[mode] || 0) + inv.total_amount;
        return acc;
    }, {});

    // Summary Stats - 3 columns
    const col1X = 30;
    const col2X = 85;
    const col3X = 140;

    doc.setFontSize(9);
    doc.setTextColor(mutedRgb[0], mutedRgb[1], mutedRgb[2]);
    doc.setFont('helvetica', 'normal');

    // Column 1: Total Invoices
    doc.text('Total Invoices', col1X, yPos);
    doc.setFontSize(16);
    doc.setTextColor(textRgb[0], textRgb[1], textRgb[2]);
    doc.setFont('helvetica', 'bold');
    doc.text(String(totalInvoices), col1X, yPos + 8);

    // Column 2: Total Revenue
    doc.setFontSize(9);
    doc.setTextColor(mutedRgb[0], mutedRgb[1], mutedRgb[2]);
    doc.setFont('helvetica', 'normal');
    doc.text('Total Revenue', col2X, yPos);
    doc.setFontSize(16);
    doc.setTextColor(textRgb[0], textRgb[1], textRgb[2]);
    doc.setFont('helvetica', 'bold');
    doc.text(`₹${totalRevenue.toFixed(2)}`, col2X, yPos + 8);

    // Column 3: Avg Transaction
    doc.setFontSize(9);
    doc.setTextColor(mutedRgb[0], mutedRgb[1], mutedRgb[2]);
    doc.setFont('helvetica', 'normal');
    doc.text('Avg Transaction', col3X, yPos);
    doc.setFontSize(16);
    doc.setTextColor(textRgb[0], textRgb[1], textRgb[2]);
    doc.setFont('helvetica', 'bold');
    doc.text(`₹${avgTransaction.toFixed(2)}`, col3X, yPos + 8);

    yPos += 22;

    // === PAYMENT BREAKDOWN ===
    if (Object.keys(paymentModes).length > 0) {
        yPos += 8;
        doc.setFontSize(11);
        doc.setTextColor(textRgb[0], textRgb[1], textRgb[2]);
        doc.setFont('helvetica', 'bold');
        doc.text('Payment Breakdown', 20, yPos);
        
        yPos += 8;
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        
        Object.entries(paymentModes).forEach(([mode, amount]) => {
            doc.setTextColor(mutedRgb[0], mutedRgb[1], mutedRgb[2]);
            doc.text(`${mode}:`, 25, yPos);
            doc.setTextColor(textRgb[0], textRgb[1], textRgb[2]);
            doc.setFont('helvetica', 'bold');
            doc.text(`₹${amount.toFixed(2)}`, 60, yPos);
            doc.setFont('helvetica', 'normal');
            yPos += 5;
        });

        yPos += 3;
    }

    // === TRANSACTIONS TABLE ===
    yPos += 5;
    
    // Table Header Background
    doc.setFillColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
    doc.rect(20, yPos, 170, 8, 'F');

    // Table Header Text
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');

    const colInvoice = 25;
    const colDate = 60;
    const colCustomer = 95;
    const colPayment = 135;
    const colAmount = 170;

    doc.text('Invoice #', colInvoice, yPos + 5);
    doc.text('Date', colDate, yPos + 5);
    doc.text('Customer', colCustomer, yPos + 5);
    doc.text('Payment', colPayment, yPos + 5);
    doc.text('Amount', colAmount, yPos + 5);

    yPos += 10;

    // Table Rows
    doc.setTextColor(textRgb[0], textRgb[1], textRgb[2]);
    doc.setFont('helvetica', 'normal');

    invoices.forEach((invoice, index) => {
        // Check if we need a new page
        if (yPos > 270) {
            doc.addPage();
            yPos = 20;
            
            // Repeat header on new page
            doc.setFillColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
            doc.rect(20, yPos, 170, 8, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.text('Invoice #', colInvoice, yPos + 5);
            doc.text('Date', colDate, yPos + 5);
            doc.text('Customer', colCustomer, yPos + 5);
            doc.text('Payment', colPayment, yPos + 5);
            doc.text('Amount', colAmount, yPos + 5);
            yPos += 10;
            doc.setTextColor(textRgb[0], textRgb[1], textRgb[2]);
            doc.setFont('helvetica', 'normal');
        }

        // Alternate row background
        if (index % 2 === 0) {
            doc.setFillColor(softRgb[0], softRgb[1], softRgb[2]);
            doc.rect(20, yPos - 3, 170, 7, 'F');
        }

        doc.setFontSize(8);
        
        // Invoice Number
        doc.setFont('helvetica', 'bold');
        const invoiceNum = invoice.invoice_number.length > 12 
            ? invoice.invoice_number.substring(0, 12) + '...' 
            : invoice.invoice_number;
        doc.text(invoiceNum, colInvoice, yPos + 2);
        
        // Date
        doc.setFont('helvetica', 'normal');
        const date = new Date(invoice.created_at);
        doc.text(date.toLocaleDateString(), colDate, yPos + 2);
        
        // Customer
        const customerName = invoice.customer_name || 'Walk-in';
        const truncatedName = customerName.length > 18 
            ? customerName.substring(0, 18) + '...' 
            : customerName;
        doc.text(truncatedName, colCustomer, yPos + 2);
        
        // Payment Mode
        doc.text(invoice.payment_mode || 'Cash', colPayment, yPos + 2);
        
        // Amount
        doc.setFont('helvetica', 'bold');
        doc.text(`₹${invoice.total_amount.toFixed(2)}`, colAmount, yPos + 2);

        // Line separator
        doc.setDrawColor(borderRgb[0], borderRgb[1], borderRgb[2]);
        doc.setLineWidth(0.1);
        doc.line(20, yPos + 4, 190, yPos + 4);

        yPos += 7;
    });

    // === FOOTER ===
    yPos += 10;
    if (yPos > 260) {
        doc.addPage();
        yPos = 20;
    }

    doc.setDrawColor(borderRgb[0], borderRgb[1], borderRgb[2]);
    doc.setLineWidth(0.3);
    doc.line(20, yPos, 190, yPos);

    yPos += 8;

    // Footer note
    doc.setFontSize(8);
    doc.setTextColor(mutedRgb[0], mutedRgb[1], mutedRgb[2]);
    doc.setFont('helvetica', 'italic');
    doc.text(`This report contains ${totalInvoices} transaction(s) for the selected period.`, 20, yPos);
    
    if (userInfo?.business_address) {
        yPos += 5;
        doc.setFont('helvetica', 'normal');
        doc.text(userInfo.business_address, 20, yPos);
    }

    return doc;
};

/**
 * Download history report as PDF
 * @param {Object} params - Report parameters
 */
export const downloadHistoryReport = async (params) => {
    const doc = await generateHistoryReportPDF(params);
    const fileName = `Sales-Report-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
};
