/**
 * KOT (Kitchen Order Ticket) Generator
 * Generates and handles printing of kitchen order tickets to Bluetooth printers
 */

export class KOTGenerator {
    constructor() {
        this.connectedPrinter = null;
        this.printerCharacteristic = null;
    }

    /**
     * Request Bluetooth device selection
     */
    async requestBluetoothDevice() {
        try {
            const device = await navigator.bluetooth.requestDevice({
                filters: [
                    { services: ['serial'] },
                    { name: /Printer|Print|BT|Thermal/ },
                ],
                optionalServices: ['serial', 'device_information']
            });
            return device;
        } catch (error) {
            console.error('Bluetooth device request failed:', error);
            throw new Error('Failed to select Bluetooth device: ' + error.message);
        }
    }

    /**
     * Connect to Bluetooth printer
     */
    async connectToPrinter(device) {
        try {
            const server = await device.gatt.connect();
            const service = await server.getPrimaryService('serial');
            this.printerCharacteristic = await service.getCharacteristic('serial_port');
            this.connectedPrinter = device;
            return device;
        } catch (error) {
            console.error('Failed to connect to printer:', error);
            throw new Error('Failed to connect to printer: ' + error.message);
        }
    }

    /**
     * Check if a printer is already connected
     */
    async checkConnectedPrinter() {
        if (this.connectedPrinter) {
            return this.connectedPrinter;
        }

        try {
            const devices = await navigator.bluetooth.getDevices();
            if (devices.length > 0) {
                return devices[0]; // Return first paired device
            }
        } catch (error) {
            console.log('No paired Bluetooth devices found');
        }
        return null;
    }

    /**
     * Disconnect from printer
     */
    async disconnectPrinter() {
        if (this.connectedPrinter) {
            try {
                this.connectedPrinter.gatt.disconnect();
                this.connectedPrinter = null;
                this.printerCharacteristic = null;
            } catch (error) {
                console.error('Failed to disconnect printer:', error);
            }
        }
    }

    /**
     * Send data to printer
     */
    async sendToPrinter(data) {
        if (!this.printerCharacteristic) {
            throw new Error('Printer not connected');
        }

        try {
            const buffer = new TextEncoder().encode(data);
            // Split into chunks for some printers that have size limits
            const chunkSize = 20;
            for (let i = 0; i < buffer.length; i += chunkSize) {
                const chunk = buffer.slice(i, i + chunkSize);
                await this.printerCharacteristic.writeValue(chunk);
            }
        } catch (error) {
            console.error('Failed to send data to printer:', error);
            throw new Error('Failed to send data to printer: ' + error.message);
        }
    }

    /**
     * Generate KOT text format for thermal printer
     */
    generateKOTText(order, businessName = 'Ailexity POS', tableInfo = null) {
        const timestamp = new Date().toLocaleString('en-IN', {
            timeZone: 'Asia/Kolkata',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });

        let kot = '';

        // Header
        kot += this.centerText('═════════════════════', 22) + '\n';
        kot += this.centerText('KITCHEN ORDER TICKET', 22) + '\n';
        kot += this.centerText('═════════════════════', 22) + '\n\n';

        // Business & Table Info
        kot += this.centerText(businessName, 22) + '\n';
        
        if (tableInfo) {
            kot += this.centerText(`Table: ${tableInfo.table_name || 'N/A'}`, 22) + '\n';
            if (tableInfo.table_number) {
                kot += this.centerText(`#${tableInfo.table_number}`, 22) + '\n';
            }
        }

        kot += this.centerText(timestamp, 22) + '\n';
        kot += '\n' + '─'.repeat(22) + '\n';

        // Order items header
        kot += 'ITEM'.padEnd(12) + 'QTY'.padEnd(5) + 'NOTE\n';
        kot += '─'.repeat(22) + '\n';

        // Items
        if (order.items && Array.isArray(order.items)) {
            order.items.forEach(item => {
                const itemName = (item.item_name || item.name || 'Unknown').substring(0, 10);
                const qty = String(item.quantity || 1).padEnd(4);
                const note = item.special_instructions || item.notes || '';
                
                kot += itemName.padEnd(12) + qty + (note ? ' ' + note.substring(0, 8) : '') + '\n';
            });
        }

        // Footer
        kot += '─'.repeat(22) + '\n';
        kot += this.centerText('END OF ORDER', 22) + '\n';
        kot += '═════════════════════\n\n\n';

        return kot;
    }

    /**
     * Generate HTML format for preview/printing (for regular printers)
     */
    generateKOTHTML(order, businessName = 'Ailexity POS', tableInfo = null) {
        const timestamp = new Date().toLocaleString('en-IN', {
            timeZone: 'Asia/Kolkata',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });

        const itemsHTML = (order.items || []).map(item => `
            <tr>
                <td>${item.item_name || item.name || 'Unknown'}</td>
                <td style="text-align: center;">${item.quantity || 1}</td>
                <td>${item.special_instructions || item.notes || '-'}</td>
            </tr>
        `).join('');

        const tableSection = tableInfo ? `
            <div style="text-align: center; font-weight: bold; margin: 10px 0;">
                Table: ${tableInfo.table_name || 'N/A'} ${tableInfo.table_number ? `(#${tableInfo.table_number})` : ''}
            </div>
        ` : '';

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Kitchen Order Ticket</title>
                <style>
                    body {
                        font-family: 'Courier New', monospace;
                        width: 80mm;
                        margin: 0;
                        padding: 10px;
                    }
                    .kot-header {
                        text-align: center;
                        font-weight: bold;
                        margin-bottom: 10px;
                        border-bottom: 2px solid #000;
                        padding-bottom: 10px;
                    }
                    .business-name {
                        font-size: 14px;
                        font-weight: bold;
                    }
                    .timestamp {
                        font-size: 11px;
                        margin-top: 5px;
                    }
                    ${tableSection ? '.table-info { text-align: center; font-weight: bold; margin: 10px 0; }' : ''}
                    .items-table {
                        width: 100%;
                        border-collapse: collapse;
                        margin: 10px 0;
                    }
                    .items-table th {
                        border-bottom: 1px solid #000;
                        text-align: left;
                        padding: 5px 0;
                        font-size: 11px;
                    }
                    .items-table td {
                        padding: 5px 0;
                        font-size: 11px;
                        border-bottom: 1px solid #ddd;
                    }
                    .kot-footer {
                        text-align: center;
                        margin-top: 10px;
                        border-top: 2px solid #000;
                        padding-top: 10px;
                        font-weight: bold;
                    }
                </style>
            </head>
            <body>
                <div class="kot-header">
                    <div class="business-name">${businessName}</div>
                    <div class="timestamp">${timestamp}</div>
                </div>
                
                ${tableSection}
                
                <table class="items-table">
                    <thead>
                        <tr>
                            <th>Item</th>
                            <th style="text-align: center;">Qty</th>
                            <th>Notes</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHTML}
                    </tbody>
                </table>
                
                <div class="kot-footer">
                    END OF ORDER
                </div>
            </body>
            </html>
        `;
    }

    /**
     * Center text for thermal printer display
     */
    centerText(text, width = 40) {
        const padding = Math.floor((width - text.length) / 2);
        return ' '.repeat(Math.max(0, padding)) + text;
    }

    /**
     * Print KOT to Bluetooth printer
     */
    async printToBluetoothPrinter(order, options = {}) {
        const {
            businessName = 'Ailexity POS',
            tableInfo = null,
            selectNewDevice = false
        } = options;

        try {
            // Get or select printer
            let printer = this.connectedPrinter;
            if (!printer || selectNewDevice) {
                printer = await this.requestBluetoothDevice();
                await this.connectToPrinter(printer);
            }

            // Generate and send KOT
            const kotText = this.generateKOTText(order, businessName, tableInfo);
            await this.sendToPrinter(kotText);

            return {
                success: true,
                message: 'KOT sent to printer successfully',
                printer: printer.name
            };
        } catch (error) {
            console.error('Print to Bluetooth error:', error);
            throw error;
        }
    }

    /**
     * Print KOT to regular printer using browser print dialog
     */
    printToRegularPrinter(order, options = {}) {
        const {
            businessName = 'Ailexity POS',
            tableInfo = null
        } = options;

        try {
            const kotHTML = this.generateKOTHTML(order, businessName, tableInfo);
            const printWindow = window.open('', '', 'width=800,height=600');
            printWindow.document.write(kotHTML);
            printWindow.document.close();
            
            // Wait for content to load before printing
            setTimeout(() => {
                printWindow.print();
            }, 250);

            return {
                success: true,
                message: 'Print dialog opened. Please select printer.'
            };
        } catch (error) {
            console.error('Print error:', error);
            throw error;
        }
    }

    /**
     * Preview KOT
     */
    previewKOT(order, options = {}) {
        const {
            businessName = 'Ailexity POS',
            tableInfo = null
        } = options;

        const kotHTML = this.generateKOTHTML(order, businessName, tableInfo);
        const previewWindow = window.open('', '', 'width=400,height=600');
        previewWindow.document.write(kotHTML);
        previewWindow.document.close();

        return {
            success: true,
            message: 'KOT preview opened in new window'
        };
    }
}

// Export singleton instance
export const kotGenerator = new KOTGenerator();
