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
 * Generate a professional invoice PDF matching the specific design
 * @param {Object} invoice - Invoice data
 * @returns {Promise<jsPDF>} doc
 */
export const generateInvoicePDF = async (invoice) => {
    const doc = new jsPDF();
    const primaryRgb = [17, 24, 39];
    const textRgb = [17, 24, 39];
    const mutedRgb = [107, 114, 128];
    const borderRgb = [229, 231, 235];

    // Fonts
    doc.setFont('helvetica');

    // === HEADER ===

    // Logo
    const logoData = await getLogoDataUrl();
    if (logoData) {
        // Place logo image (approx size of previous circle)
        // Previous circle center (28, 22), radius 12 -> Bounds approx x=16, y=10, w=24, h=24
        doc.addImage(logoData, 'PNG', 16, 10, 24, 24);
    } else {
        // Fallback to stylized 'A'
        doc.setDrawColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
        doc.setLineWidth(1.5);
        doc.setTextColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
        doc.setFontSize(36);
        doc.setFont('helvetica', 'bold');
        doc.text('A', 25, 32);
        doc.circle(28, 22, 12);
    }

    // Business Name
    doc.setFontSize(22);
    doc.setTextColor(textRgb[0], textRgb[1], textRgb[2]);
    doc.setFont('helvetica', 'bold');
    doc.text(invoice.business_name || 'Ailexity POS', 20, 48);

    // INVOICE Title - Right Top
    doc.setFontSize(28);
    doc.setTextColor(textRgb[0], textRgb[1], textRgb[2]);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE', 190, 30, { align: 'right' });

    // Date below INVOICE
    doc.setFontSize(10);
    doc.setTextColor(mutedRgb[0], mutedRgb[1], mutedRgb[2]);
    doc.setFont('helvetica', 'bold');
    const dateStr = new Date(invoice.created_at || new Date()).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    doc.text(dateStr, 190, 38, { align: 'right' });


    // === DETAILS SECTION (Two Columns) ===
    let yPos = 70;

    // Left Column: Office Address
    doc.setFontSize(10);
    doc.setTextColor(textRgb[0], textRgb[1], textRgb[2]);
    doc.setFont('helvetica', 'bold');
    doc.text('Office Address', 20, yPos);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(mutedRgb[0], mutedRgb[1], mutedRgb[2]);
    doc.setFontSize(9);
    // Use real business address or placeholder
    const addressLines = (invoice.business_address || 'Please update your business address in Settings').split('\n');
    addressLines.forEach((line, index) => {
        doc.text(line, 20, yPos + 6 + (index * 5));
    });

    const phoneYPos = yPos + 6 + (addressLines.length * 5) + 5;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(textRgb[0], textRgb[1], textRgb[2]);
    doc.text(invoice.store_phone || invoice.business_phone || '(Update phone in Settings)', 20, phoneYPos);

    // Right Column: To: Customer
    doc.setFont('helvetica', 'bold');
    doc.text('To:', 120, yPos);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(textRgb[0], textRgb[1], textRgb[2]);
    doc.setFontSize(10);
    doc.text(invoice.customer_name || 'Walking Customer', 120, yPos + 6);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(mutedRgb[0], mutedRgb[1], mutedRgb[2]);
    doc.setFontSize(9);
    if (invoice.customer_phone) {
        doc.text(`Phone: ${invoice.customer_phone}`, 120, yPos + 11);
    }


    // === ITEMS TABLE ===
    yPos = 110;

    // Table Header Background
    doc.setFillColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
    doc.rect(20, yPos, 170, 10, 'F');

    // Table Header Text
    doc.setTextColor(255, 255, 255); // White
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');

    const col1 = 25; // Item Desc
    const col2 = 110; // Unit Price
    const col3 = 140; // Qnt
    const col4 = 170; // Total

    doc.text('Items Description', col1, yPos + 7);
    doc.text('Unit Price', col2, yPos + 7);
    doc.text('Qnt', col3, yPos + 7);
    doc.text('Total', col4, yPos + 7);

    // Table Rows
    yPos += 14;
    doc.setTextColor(textRgb[0], textRgb[1], textRgb[2]); // Black text for rows

    const items = invoice.items || [];
    items.forEach((item) => {
        // Item Name
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text(item.item_name, col1, yPos);

        // Values
        doc.setFontSize(10);
        doc.setTextColor(textRgb[0], textRgb[1], textRgb[2]);
        doc.setFont('helvetica', 'bold');

        doc.text(`₹ ${item.unit_price.toFixed(2)}`, col2, yPos + 4);
        doc.text(`${item.quantity}`, col3, yPos + 4);
        const lineTotal = item.unit_price * item.quantity;
        doc.text(`₹ ${lineTotal.toFixed(2)}`, col4, yPos + 4);

        // Separator Line
        doc.setDrawColor(borderRgb[0], borderRgb[1], borderRgb[2]); // Light grey line
        doc.setLineWidth(0.1);
        doc.line(20, yPos + 12, 190, yPos + 12);

        yPos += 16; // Reduced row height since no description
    });


    // === TOTALS SECTION ===
    yPos += 5;

    const subtotal = items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
    const taxRate = 0.15; // 15% from image
    const taxAmt = subtotal * taxRate;
    const discount = 0; // 0 for now
    const totalDue = invoice.total_amount ? invoice.total_amount : (subtotal + taxAmt - discount);

    const summaryX = 130;
    const valueX = 170; // Align with total column

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(textRgb[0], textRgb[1], textRgb[2]);

    // Subtotal
    doc.text('SUBTOTAL :', summaryX, yPos, { align: 'right' });
    doc.text(`₹ ${subtotal.toFixed(2)}`, valueX, yPos);

    // Tax
    yPos += 8;
    doc.text('Tax VAT 15% :', summaryX, yPos, { align: 'right' });
    doc.text(`₹ ${taxAmt.toFixed(2)}`, valueX, yPos);

    // Discount
    yPos += 8;
    doc.text('DISCOUNT 0% :', summaryX, yPos, { align: 'right' });
    doc.text(`₹ ${discount.toFixed(2)}`, valueX, yPos);

    // Total Due Box
    yPos += 10;
    // Primary total box
    doc.setFillColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
    doc.rect(120, yPos - 6, 70, 12, 'F');

    doc.setTextColor(255, 255, 255); // White
    doc.setFontSize(12);
    doc.text('TOTAL DUE :', 125, yPos + 2);
    doc.text(`₹ ${totalDue.toFixed(2)}`, 185, yPos + 2, { align: 'right' });


    // === NOTES / Footer Message ===
    if (invoice.invoice_notes) {
        const noteY = yPos - 20;
        doc.setFontSize(9);
        doc.setTextColor(textRgb[0], textRgb[1], textRgb[2]);
        doc.setFont('helvetica', 'bold');
        doc.text('Note:', 20, noteY);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(mutedRgb[0], mutedRgb[1], mutedRgb[2]);
        const noteLines = doc.splitTextToSize(invoice.invoice_notes, 150);
        noteLines.forEach((line, index) => {
            doc.text(line, 20, noteY + 5 + (index * 4));
        });
    }


    // Thank you message
    yPos += 30; // Move down below totals
    doc.setFontSize(12);
    doc.setTextColor(textRgb[0], textRgb[1], textRgb[2]);
    doc.setFont('helvetica', 'bold');
    doc.text('Thank you for your Business', 20, yPos);


    // === BOTTOM FOOTER (3 Cols) ===
    yPos += 15;
    // Line separator
    doc.setDrawColor(borderRgb[0], borderRgb[1], borderRgb[2]);
    doc.line(20, yPos, 190, yPos);
    yPos += 10;

    // Col 1: Questions?
    doc.setFontSize(10);
    doc.setTextColor(textRgb[0], textRgb[1], textRgb[2]);
    doc.setFont('helvetica', 'bold');
    doc.text('Questions?', 20, yPos);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(mutedRgb[0], mutedRgb[1], mutedRgb[2]);
    doc.text(`Email us     : ${invoice.store_email || 'Update email in Settings'}`, 20, yPos + 6);
    doc.text(`Call us       : ${invoice.store_phone || 'Update phone in Settings'}`, 20, yPos + 11);

    // Col 2: Payment Info
    doc.setFontSize(10);
    doc.setTextColor(textRgb[0], textRgb[1], textRgb[2]);
    doc.setFont('helvetica', 'bold');
    doc.text('Payment Info :', 80, yPos);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(mutedRgb[0], mutedRgb[1], mutedRgb[2]);
    doc.text(`Account       : ${invoice.bank_account || 'N/A'}`, 80, yPos + 6);
    doc.text(`A/C Name    : ${invoice.account_name || 'N/A'}`, 80, yPos + 11);
    doc.text(`Bank Detail  : ${invoice.bank_name || 'N/A'}`, 80, yPos + 16);

    // Col 3: Terms
    doc.setFontSize(10);
    doc.setTextColor(textRgb[0], textRgb[1], textRgb[2]);
    doc.setFont('helvetica', 'bold');
    doc.text('Terms & Conditions:', 140, yPos);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(mutedRgb[0], mutedRgb[1], mutedRgb[2]);
    if (invoice.invoice_terms) {
        const termsLines = doc.splitTextToSize(invoice.invoice_terms, 50);
        termsLines.slice(0, 3).forEach((line, index) => {
            doc.text(line, 140, yPos + 6 + (index * 5));
        });
    } else {
        doc.text('Update terms in Settings', 140, yPos + 6);
    }

    return doc;
};

/**
 * Download invoice as PDF
 * @param {Object} invoice - Invoice data
 */
export const downloadInvoicePDF = async (invoice) => {
    const doc = await generateInvoicePDF(invoice);
    doc.save(`Invoice-${invoice.invoice_number || 'draft'}.pdf`);
};

/**
 * Get PDF as blob for sharing
 * @param {Object} invoice - Invoice data
 * @returns {Promise<Blob>} PDF blob
 */
export const getInvoicePDFBlob = async (invoice) => {
    const doc = await generateInvoicePDF(invoice);
    return doc.output('blob');
};
