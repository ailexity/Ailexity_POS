// Helper functions for invoice calculations and formatting

// Convert number to words (Indian Rupees)
export const numberToWords = (num) => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    
    const convertLessThan1000 = (n) => {
        if (n === 0) return '';
        if (n < 10) return ones[n];
        if (n < 20) return teens[n - 10];
        if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
        return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + convertLessThan1000(n % 100) : '');
    };
    
    if (num === 0) return 'Zero Rupees Only';
    
    const crore = Math.floor(num / 10000000);
    const lakh = Math.floor((num % 10000000) / 100000);
    const thousand = Math.floor((num % 100000) / 1000);
    const remainder = num % 1000;
    
    let words = '';
    if (crore > 0) words += convertLessThan1000(crore) + ' Crore ';
    if (lakh > 0) words += convertLessThan1000(lakh) + ' Lakh ';
    if (thousand > 0) words += convertLessThan1000(thousand) + ' Thousand ';
    if (remainder > 0) words += convertLessThan1000(remainder);
    
    return words.trim() + ' Rupees Only';
};

// Calculate tax breakdown (CGST + SGST or IGST)
export const calculateTaxBreakdown = (subtotal, taxRate, isInterState = false) => {
    const totalTax = (subtotal * taxRate) / 100;
    
    if (isInterState) {
        return {
            igst: totalTax,
            cgst: 0,
            sgst: 0
        };
    } else {
        return {
            igst: 0,
            cgst: totalTax / 2,
            sgst: totalTax / 2
        };
    }
};

// Calculate item-wise tax
export const calculateItemTax = (item, taxRate) => {
    const taxableValue = item.unit_price * item.quantity;
    const taxAmount = (taxableValue * taxRate) / 100;
    
    return {
        taxableValue,
        cgst: taxAmount / 2,
        sgst: taxAmount / 2,
        totalTax: taxAmount,
        total: taxableValue + taxAmount
    };
};

// Round off amount
export const roundOff = (amount) => {
    const rounded = Math.round(amount);
    return {
        roundedAmount: rounded,
        roundOffValue: rounded - amount
    };
};

// Format date for invoice
export const formatInvoiceDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
};

// Format time for invoice
export const formatInvoiceTime = (date) => {
    return new Date(date).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    });
};
