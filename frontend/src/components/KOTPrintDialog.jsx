import React, { useState, useEffect } from 'react';
import { PrinterIcon, Send, X, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../api';
import { kotGenerator } from '../utils/kotGenerator';

const KOTPrintDialog = ({ isOpen, order, tableInfo, businessName, onClose, onSuccess, autoPrint = false }) => {
    const [printType, setPrintType] = useState('bluetooth'); // bluetooth | regular | preview
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(null); // null | 'success' | 'error'
    const [message, setMessage] = useState('');

    if (!isOpen) return null;

    const createKOTRecord = async () => {
        await api.post('/kots/', {
            table_number: tableInfo?.table_number,
            table_name: tableInfo?.table_name,
            items: order.items || [],
            notes: order.notes || ''
        });
    };

    const handlePrintBluetoothPrinter = async () => {
        setLoading(true);
        setStatus(null);
        try {
            await createKOTRecord();
            const result = await kotGenerator.printToBluetoothPrinter(order, {
                businessName,
                tableInfo
            });
            setStatus('success');
            setMessage(`✓ KOT sent to ${result.printer}`);
            if (onSuccess) onSuccess();
            setTimeout(() => {
                handleClose();
            }, 2000);
        } catch (error) {
            setStatus('error');
            setMessage(error.response?.data?.detail || error.message || 'Failed to print to Bluetooth printer');
            console.error('KOT Bluetooth print error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePrintRegularPrinter = async () => {
        setLoading(true);
        setStatus(null);
        try {
            await createKOTRecord();
            kotGenerator.printToRegularPrinter(order, {
                businessName,
                tableInfo
            });
            setStatus('success');
            setMessage('✓ Print dialog opened. Select your printer.');
            if (onSuccess) onSuccess();
            setTimeout(() => {
                handleClose();
            }, 2000);
        } catch (error) {
            setStatus('error');
            setMessage(error.response?.data?.detail || error.message || 'Failed to open print dialog');
            console.error('KOT print error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePreviewKOT = async () => {
        setStatus(null);
        setLoading(true);
        try {
            await createKOTRecord();
            kotGenerator.previewKOT(order, {
                businessName,
                tableInfo
            });
            setStatus('success');
            setMessage('✓ Preview opened in new window');
        } catch (error) {
            setStatus('error');
            setMessage(error.response?.data?.detail || error.message || 'Failed to open preview');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setPrintType('bluetooth');
        setLoading(false);
        setStatus(null);
        setMessage('');
        onClose();
    };

    useEffect(() => {
        if (isOpen && autoPrint) {
            // small delay to allow dialog to mount
            setTimeout(() => {
                setPrintType('bluetooth');
                handlePrintBluetoothPrinter();
            }, 250);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, autoPrint]);

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(4px)'
        }}>
            <div style={{
                background: 'white',
                borderRadius: '8px',
                padding: '24px',
                maxWidth: '400px',
                width: '90%',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                animation: 'slideUp 0.3s ease-out'
            }}>
                {/* Header */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '16px',
                    paddingBottom: '12px',
                    borderBottom: '1px solid #e2e8f0'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <PrinterIcon size={20} style={{ color: '#3b82f6' }} />
                        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
                            Print Kitchen Order
                        </h2>
                    </div>
                    <button
                        onClick={handleClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            color: '#64748b'
                        }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Order Summary */}
                <div style={{
                    background: '#f8fafc',
                    padding: '12px',
                    borderRadius: '6px',
                    marginBottom: '16px',
                    fontSize: '13px'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ color: '#64748b' }}>Items:</span>
                        <span style={{ fontWeight: 600 }}>
                            {order.items?.length || 0} item{order.items?.length !== 1 ? 's' : ''}
                        </span>
                    </div>
                    {tableInfo && (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#64748b' }}>Table:</span>
                            <span style={{ fontWeight: 600 }}>
                                {tableInfo.table_name || 'N/A'} {tableInfo.table_number ? `(#${tableInfo.table_number})` : ''}
                            </span>
                        </div>
                    )}
                </div>

                {/* Status Messages */}
                {status === 'success' && (
                    <div style={{
                        background: '#f0fdf4',
                        border: '1px solid #86efac',
                        borderRadius: '6px',
                        padding: '12px',
                        marginBottom: '16px',
                        display: 'flex',
                        gap: '8px',
                        alignItems: 'flex-start',
                        fontSize: '13px',
                        color: '#16a34a'
                    }}>
                        <CheckCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                        <div>{message}</div>
                    </div>
                )}

                {status === 'error' && (
                    <div style={{
                        background: '#fef2f2',
                        border: '1px solid #fca5a5',
                        borderRadius: '6px',
                        padding: '12px',
                        marginBottom: '16px',
                        display: 'flex',
                        gap: '8px',
                        alignItems: 'flex-start',
                        fontSize: '13px',
                        color: '#dc2626'
                    }}>
                        <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                        <div>{message}</div>
                    </div>
                )}

                {/* Print Options */}
                {!status && (
                    <>
                        <div style={{
                            display: 'grid',
                            gap: '12px',
                            marginBottom: '16px'
                        }}>
                            {/* Bluetooth Printer Option */}
                            <label style={{
                                display: 'flex',
                                alignItems: 'center',
                                padding: '12px',
                                border: '2px solid ' + (printType === 'bluetooth' ? '#3b82f6' : '#e2e8f0'),
                                borderRadius: '6px',
                                cursor: 'pointer',
                                background: printType === 'bluetooth' ? '#eff6ff' : 'white',
                                transition: 'all 0.2s'
                            }}>
                                <input
                                    type="radio"
                                    name="printType"
                                    value="bluetooth"
                                    checked={printType === 'bluetooth'}
                                    onChange={(e) => setPrintType(e.target.value)}
                                    style={{ marginRight: '8px' }}
                                />
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: '14px' }}>Bluetooth Printer</div>
                                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                                        Send directly to kitchen thermal printer
                                    </div>
                                </div>
                            </label>

                            {/* Regular Printer Option */}
                            <label style={{
                                display: 'flex',
                                alignItems: 'center',
                                padding: '12px',
                                border: '2px solid ' + (printType === 'regular' ? '#3b82f6' : '#e2e8f0'),
                                borderRadius: '6px',
                                cursor: 'pointer',
                                background: printType === 'regular' ? '#eff6ff' : 'white',
                                transition: 'all 0.2s'
                            }}>
                                <input
                                    type="radio"
                                    name="printType"
                                    value="regular"
                                    checked={printType === 'regular'}
                                    onChange={(e) => setPrintType(e.target.value)}
                                    style={{ marginRight: '8px' }}
                                />
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: '14px' }}>Regular Printer</div>
                                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                                        Use system print dialog
                                    </div>
                                </div>
                            </label>

                            {/* Preview Option */}
                            <label style={{
                                display: 'flex',
                                alignItems: 'center',
                                padding: '12px',
                                border: '2px solid ' + (printType === 'preview' ? '#3b82f6' : '#e2e8f0'),
                                borderRadius: '6px',
                                cursor: 'pointer',
                                background: printType === 'preview' ? '#eff6ff' : 'white',
                                transition: 'all 0.2s'
                            }}>
                                <input
                                    type="radio"
                                    name="printType"
                                    value="preview"
                                    checked={printType === 'preview'}
                                    onChange={(e) => setPrintType(e.target.value)}
                                    style={{ marginRight: '8px' }}
                                />
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: '14px' }}>Preview</div>
                                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                                        View KOT before printing
                                    </div>
                                </div>
                            </label>
                        </div>

                        {/* Action Buttons */}
                        <div style={{
                            display: 'flex',
                            gap: '8px'
                        }}>
                            <button
                                onClick={handleClose}
                                disabled={loading}
                                style={{
                                    flex: 1,
                                    padding: '10px 16px',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '6px',
                                    background: 'white',
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    fontSize: '14px',
                                    fontWeight: 600,
                                    color: '#64748b',
                                    opacity: loading ? 0.6 : 1
                                }}
                            >
                                Cancel
                            </button>

                            <button
                                onClick={() => {
                                    if (printType === 'bluetooth') {
                                        handlePrintBluetoothPrinter();
                                    } else if (printType === 'regular') {
                                        handlePrintRegularPrinter();
                                    } else if (printType === 'preview') {
                                        handlePreviewKOT();
                                    }
                                }}
                                disabled={loading}
                                style={{
                                    flex: 1,
                                    padding: '10px 16px',
                                    border: 'none',
                                    borderRadius: '6px',
                                    background: '#3b82f6',
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    color: 'white',
                                    fontSize: '14px',
                                    fontWeight: 600,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px',
                                    opacity: loading ? 0.7 : 1
                                }}
                            >
                                <Send size={16} />
                                {loading ? 'Printing...' : 'Print KOT'}
                            </button>
                        </div>
                    </>
                )}

                {/* Success/Error Buttons */}
                {status && (
                    <button
                        onClick={handleClose}
                        style={{
                            width: '100%',
                            padding: '10px 16px',
                            border: 'none',
                            borderRadius: '6px',
                            background: '#3b82f6',
                            cursor: 'pointer',
                            color: 'white',
                            fontSize: '14px',
                            fontWeight: 600
                        }}
                    >
                        Close
                    </button>
                )}
            </div>

            <style>{`
                @keyframes slideUp {
                    from {
                        transform: translateY(20px);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }
            `}</style>
        </div>
    );
};

export default KOTPrintDialog;
