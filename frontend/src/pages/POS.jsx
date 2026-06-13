import React, { useEffect, useMemo, useRef, useState } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { Search, Plus, Minus, Trash2, ShoppingCart, Grid, Package, Smartphone, FileText, Grid3x3, Printer } from 'lucide-react';
import KOTPrintDialog from '../components/KOTPrintDialog';
import { POSItemsSkeleton } from '../components/Skeleton';
import { usePOSItems } from '../hooks/usePOSItems';
import { useKOTStatus } from '../hooks/useKOTStatus';
import './POS.css';

const normalizeBusinessType = (businessType) => {
    const value = String(businessType || '').toLowerCase();
    if (value.includes('retail')) return 'retailer';
    return 'restaurant';
};

const POS = () => {
    const DESKTOP_BREAKPOINT = 1024;
    const { selectedTable, selectTable, cartItems, addToCart, removeFromCart, updateQty, cartTotal, cartTax, grandTotal, clearCart, setUserTaxRate, tableCarts, multiDeviceSyncEnabled, setMultiDeviceSync, fetchTableCartFromBackend, discountType, discountValue, discountAmount, setDiscountType, setDiscountValue, clearDiscount, updateItemNotes } = useCart();
    const { user } = useAuth();
    const businessType = normalizeBusinessType(user?.business_type);
    const isRetailerEarly = businessType === 'retailer';

    // Custom hooks — replace inline state + effects for items and KOT polling
    const { items, loading: itemsLoading, filteredItems, search, setSearch, activeCategory, setActiveCategory, categories } = usePOSItems();
    const { kotStatuses, refresh: refreshKotStatuses } = useKOTStatus(isRetailerEarly);

    const [checkoutLoading, setCheckoutLoading] = useState(false);
    const [paymentMode, setPaymentMode] = useState('Cash');
    const [transactionId, setTransactionId] = useState('');
    const [expandedNoteId, setExpandedNoteId] = useState(null);

    const [customerName, setCustomerName] = useState("");
    const [customerPhone, setCustomerPhone] = useState("");
    const [customerGstin, setCustomerGstin] = useState("");
    const [parties, setParties] = useState([]);
    const [selectedPartyId, setSelectedPartyId] = useState('');
    const [lastInvoice, setLastInvoice] = useState(null);
    const [tables, setTables] = useState([]);
    const [showTableSelector, setShowTableSelector] = useState(false);
    const [showCart, setShowCart] = useState(false);
    const [showKOTPrint, setShowKOTPrint] = useState(false);
    const [showKOTOptions, setShowKOTOptions] = useState(false);
    const [autoPrintKOT, setAutoPrintKOT] = useState(false);
    const [isDesktopView, setIsDesktopView] = useState(() => window.innerWidth >= DESKTOP_BREAKPOINT);
    const [cartMaxHeight, setCartMaxHeight] = useState(null);
    const cartPanelRef = useRef(null);
    const isCartOpen = isDesktopView || showCart;

    const isRetailer = isRetailerEarly;
    const isAttendee = user?.role === 'attendee';
    const retailBillingTable = useMemo(() => ({
        id: 'retail-billing',
        table_number: null,
        table_name: 'Retail Billing',
        capacity: 1,
        is_virtual: true,
    }), []);

    const attendeeBillingTable = useMemo(() => ({
        id: 'attendee-billing',
        table_number: null,
        table_name: 'Attendee Billing',
        capacity: 1,
        is_virtual: true,
    }), []);

    useEffect(() => {
        const handleResize = () => {
            setIsDesktopView(window.innerWidth >= DESKTOP_BREAKPOINT);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Enable multi-device sync when user loads
    useEffect(() => {
        if (user) {
            setMultiDeviceSync(!isRetailer && (user.enable_multi_device_sync || false), user);
            if (user.tax_rate != null && setUserTaxRate) {
                setUserTaxRate(user.tax_rate);
            }
        }
    }, [user, isRetailer, setUserTaxRate, setMultiDeviceSync]);

    // Periodic polling for cart updates when multi-device sync is enabled
    useEffect(() => {
        if (!multiDeviceSyncEnabled || !selectedTable || !fetchTableCartFromBackend) {
            return;
        }

        const pollInterval = setInterval(async () => {
            try {
                await fetchTableCartFromBackend(selectedTable.id);
            } catch (error) {
                console.error('Error polling cart data:', error);
            }
        }, 3000); // Poll every 3 seconds

        return () => clearInterval(pollInterval);
    }, [multiDeviceSyncEnabled, selectedTable, fetchTableCartFromBackend]);

    // Set tax rate when user loads
    useEffect(() => {
        if (user && setUserTaxRate) {
            setUserTaxRate(user.tax_rate || 0);
        }
    }, [user, setUserTaxRate]);

    useEffect(() => {
        const fetchTables = async () => {
            if (isRetailer) {
                setTables([]);
                return;
            }
            try {
                const res = await api.get('/tables/');
                const data = Array.isArray(res.data) ? res.data : [];
                setTables(data.filter(t => t.is_active));
            } catch (e) {
                console.error('Error fetching tables:', e);
                setTables([]);
            }
        };
        fetchTables();
    }, [isRetailer]);

    useEffect(() => {
        const fetchParties = async () => {
            if (!isRetailer) {
                setParties([]);
                setSelectedPartyId('');
                return;
            }
            try {
                const res = await api.get('/parties/', { params: { is_active: true } });
                setParties(Array.isArray(res.data) ? res.data : []);
            } catch (error) {
                if (error?.response?.status === 404) {
                    setParties([]);
                    return;
                }
                console.error('Failed to fetch parties for POS', error);
                setParties([]);
            }
        };
        fetchParties();
    }, [isRetailer]);

    useEffect(() => {
        if (!isRetailer) return;
        if (!selectedPartyId) return;
        const party = parties.find((p) => p.id === selectedPartyId);
        if (!party) return;
        setCustomerName(party.party_name || '');
        setCustomerPhone(party.phone || '');
        setCustomerGstin(party.gstin || '');
    }, [isRetailer, selectedPartyId, parties]);

    useEffect(() => {
        if (isRetailer) {
            if (!selectedTable || !selectedTable.is_virtual) {
                selectTable(retailBillingTable);
            }
            setShowTableSelector(false);
            return;
        }

        if (isAttendee) {
            if (!selectedTable) {
                selectTable(attendeeBillingTable);
            }
            setShowTableSelector(false);
            return;
        }

        if (selectedTable?.is_virtual) {
            selectTable(null);
        }
    }, [isRetailer, isAttendee, selectedTable, selectTable, retailBillingTable, attendeeBillingTable]);

    useEffect(() => {
        if (!cartPanelRef.current) return;
        let frameId = null;

        const updateCartHeight = () => {
            if (!cartPanelRef.current) return;
            if (!isCartOpen) return;
            const rawHeight = cartPanelRef.current.scrollHeight;
            const cap = Math.round(window.innerHeight * 0.8);
            const minHeight = cartItems.length > 0 ? 380 : 300;
            const nextHeight = Math.min(Math.max(rawHeight, minHeight), cap);
            setCartMaxHeight(nextHeight);
        };

        const observer = new ResizeObserver(() => {
            if (frameId) cancelAnimationFrame(frameId);
            frameId = requestAnimationFrame(updateCartHeight);
        });

        observer.observe(cartPanelRef.current);
        updateCartHeight();
        window.addEventListener('resize', updateCartHeight);

        return () => {
            observer.disconnect();
            window.removeEventListener('resize', updateCartHeight);
            if (frameId) cancelAnimationFrame(frameId);
        };
    }, [cartItems.length, isCartOpen, lastInvoice, customerName, customerPhone]);

    const handleCheckout = async () => {
        if (!cartItems?.length) {
            alert("Please add items to cart before completing order");
            return;
        }

        if (isAttendee) {
            alert("Attendee logins can access billing but cannot complete or send orders. Please ask an admin to finalize the invoice.");
            return;
        }

        setCheckoutLoading(true);
        try {
            const taxRate = user?.tax_rate ?? 0;
            const selectedParty = parties.find((p) => p.id === selectedPartyId);
            const checkoutCustomerName = selectedParty?.party_name || customerName || "Walk-in Customer";
            const checkoutCustomerPhone = selectedParty?.phone || customerPhone || "";
            // Get current local date and time
            const now = new Date();
            // Create local datetime string (YYYY-MM-DDTHH:mm:ss format without timezone)
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const seconds = String(now.getSeconds()).padStart(2, '0');
            const localDateTime = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
            
            const payload = {
                customer_name: checkoutCustomerName,
                customer_phone: checkoutCustomerPhone,
                customer_gstin: customerGstin.trim() || null,
                payment_mode: paymentMode,
                transaction_id: transactionId.trim() || null,
                discount_amount: discountAmount > 0 ? discountAmount : 0,
                discount_type: discountAmount > 0 ? discountType : null,
                table_number: isRetailer ? null : (selectedTable?.table_number || null),
                table_name: isRetailer ? null : (selectedTable?.table_name || null),
                created_at: localDateTime, // Send local datetime without timezone conversion
                items: cartItems.map((i) => ({
                    item_id: i.id != null ? String(i.id) : null,
                    item_name: String(i.name || ""),
                    quantity: Math.max(1, Math.floor(Number(i.qty) || 1)),
                    unit_price: Number(i.price) || 0,
                    tax_amount: (Number(i.price) || 0) * (Math.floor(Number(i.qty) || 1)) * (taxRate / 100),
                })),
            };

            const res = await api.post("/invoices/", payload);
            const invoice = res.data;
            setLastInvoice(invoice);
            clearCart();
            setCustomerName("");
            setCustomerPhone("");
            setCustomerGstin("");
            setSelectedPartyId('');
            setPaymentMode('Cash');
            setTransactionId('');
            clearDiscount();

            if (invoice._offline) {
                // Invoice was queued — no real number yet, no WhatsApp prompt
                // The OfflineBanner in App.jsx will show the pending count
                return;
            }

            if (checkoutCustomerPhone) {
                const sendWhatsApp = window.confirm(
                    `Invoice Created: ${invoice.invoice_number}${(!isRetailer && selectedTable) ? `\nTable: ${selectedTable.table_name}` : ''}\n\nWould you like to send this invoice via WhatsApp?`
                );
                if (sendWhatsApp) {
                    shareWhatsApp(invoice);
                }
            } else {
                alert(`Invoice Created: ${invoice.invoice_number}${(!isRetailer && selectedTable) ? `\nTable: ${selectedTable.table_name}` : ''}`);
            }
        } catch (e) {
            console.error("Checkout error:", e);
            let errorMessage = "Unknown error occurred";
            if (e.response?.data?.detail != null) {
                const d = e.response.data.detail;
                if (typeof d === "string") {
                    errorMessage = d;
                } else if (Array.isArray(d)) {
                    errorMessage = d.map((x) => (x.msg != null ? x.msg : String(x))).join("; ");
                } else {
                    errorMessage = String(d);
                }
            } else if (e.message) {
                errorMessage = e.message;
            }
            if (e.code === "ERR_NETWORK" || (!e.response && e.message)) {
                errorMessage = "Cannot reach server. Make sure the backend is running (start_backend.bat or start_all.bat).";
            }
            alert(`Checkout Failed: ${errorMessage}`);
        } finally {
            setCheckoutLoading(false);
        }
    };

        const sendToKOTDisplay = async () => {
            if (!cartItems?.length) return;
            try {
                const payload = {
                    table_number: isRetailer ? null : (selectedTable?.table_number || null),
                    table_name: isRetailer ? null : (selectedTable?.table_name || null),
                    items: cartItems.map((i) => ({
                        item_id: i.id != null ? String(i.id) : null,
                        item_name: String(i.name || ""),
                        quantity: Math.max(1, Math.floor(Number(i.qty) || 1)),
                        unit_price: Number(i.price) || 0,
                        notes: i.notes || '',
                    })),
                    notes: cartItems.filter(i => i.notes).map(i => `${i.name}: ${i.notes}`).join(' | ')
                };

                await api.post('/kots/', payload);
                alert('Order sent to KOT display');
                setShowKOTOptions(false);
                refreshKotStatuses();
            } catch (e) {
                console.error('KOT send error', e);
                let msg = 'Failed to send order to KOT display';
                if (e.response?.data?.detail) msg = e.response.data.detail;
                alert(msg);
            }
        };

        const printViaBluetooth = () => {
            // Admin flow: open KOT print dialog and trigger auto-print
            setShowKOTOptions(false);
            setAutoPrintKOT(true);
            setShowKOTPrint(true);
        };

    const shareWhatsApp = async (invoice) => {
        const phone = invoice.customer_phone || customerPhone;
        if (!phone) return;

        const invoiceUrl = `${window.location.origin}/invoice/${invoice.id}`;

        // ── Path A: Backend WhatsApp Business API (one-click, no redirect) ──
        if (user?.whatsapp_enabled) {
            try {
                await api.post('/whatsapp/send', {
                    to_phone: phone,
                    invoice_id: invoice.id,
                    invoice_number: invoice.invoice_number,
                    customer_name: invoice.customer_name || customerName || null,
                    total_amount: invoice.total_amount,
                    invoice_url: invoiceUrl,
                });
                // Silent success — the banner/toast can show confirmation
                return;
            } catch (err) {
                // If backend API fails, fall through to wa.me link
                console.warn('WhatsApp API send failed, falling back to wa.me:', err.response?.data?.detail || err.message);
            }
        }

        // ── Path B: wa.me redirect (fallback or API not configured) ──
        const custName = invoice.customer_name || customerName || 'Valued Customer';
        const businessName = invoice.business_name || user?.business_name || 'Our Store';

        let template = {
            greeting: 'Dear {customer_name},',
            thank_you: 'Thank you for your recent order at {business_name}!\nYour invoice is now available. 🪄',
            closing: 'Loved your experience? Or something to improve? Tap to tell us! 🌟',
            show_invoice_link: true,
            show_date: true,
            show_total: true,
        };
        try {
            const saved = localStorage.getItem('whatsapp_template');
            if (saved) template = { ...template, ...JSON.parse(saved) };
        } catch { /* ignore */ }

        let message = template.greeting.replace('{customer_name}', custName);
        message += '\n\n' + template.thank_you.replace('{business_name}', businessName);
        if (template.show_total) message += `\n💰 Amount : ₹${invoice.total_amount.toFixed(0)}`;
        if (template.show_date) {
            const d = new Date(invoice.created_at);
            const dateStr = d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Kolkata' });
            const timeStr = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Kolkata' });
            message += `\n📅 Date : ${dateStr} ${timeStr}`;
        }
        if (template.show_invoice_link) message += `\n👁 View Invoice : ${invoiceUrl}`;
        message += '\n\n' + template.closing;

        window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
    };


    return (
        <div
            className={`pos-container${isCartOpen ? '' : ' cart-collapsed'}${cartItems.length === 0 ? ' cart-empty' : ''}${cartItems.length > 0 && cartItems.length <= 2 ? ' cart-small' : ''}`}
            style={cartMaxHeight ? { '--pos-cart-max-height': `${cartMaxHeight}px` } : undefined}
        >
            {/* Mobile-only branding bar */}
            <div className="mobile-branding-bar">
                <span>Ailexity POS Powered by Ailexity</span>
            </div>

            <div className="pos-header-wrapper">
                {/* Header with Table Selector */}
                <div className="header-section">
                    <div className="pos-title-section">
                        <div className="pos-title-left">
                            <div className="pos-icon">
                                <Grid size={18} />
                            </div>
                            <div className="pos-title-text">
                                <h1 className="pos-title">Billing</h1>
                                <p className="pos-subtitle">{isRetailer ? 'Retail billing mode' : 'Select items below'}</p>
                            </div>
                        </div>
                        {!isRetailer && (
                            <div className="pos-header-actions">
                                <button
                                    onClick={() => setShowTableSelector(!showTableSelector)}
                                    className="btn table-selector-btn"
                                >
                                    <Grid3x3 size={18} />
                                    <span className="font-medium">
                                        {selectedTable ? selectedTable.table_name : 'Select Table'}
                                    </span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Table Selector Dropdown */}
                {!isRetailer && showTableSelector && (
                    <div className="pos-table-dropdown">
                        <div className="table-dropdown-header">
                            <h3>Select a Table</h3>
                        </div>
                        <div className="table-dropdown-body">
                            {tables.length === 0 ? (
                                <div className="empty-table-state">
                                    <p>No tables configured</p>
                                    <p>Go to Settings to add tables</p>
                                </div>
                            ) : (
                                <div className="table-grid">
                                    {tables.map(table => {
                                        const hasOrders = tableCarts[table.id] && tableCarts[table.id].length > 0;
                                        const tableStatus = kotStatuses[String(table.table_number)];
                                        const hasActiveKot = tableStatus && ['pending', 'preparing', 'ready', 'printed'].includes(tableStatus.status);
                                        const statusText = tableStatus?.label || (hasOrders ? 'Occupied' : 'Available');
                                        return (
                                            <button
                                                key={table.id}
                                                onClick={() => {
                                                    selectTable(table);
                                                    setShowTableSelector(false);
                                                }}
                                                className={`table-btn ${selectedTable?.id === table.id ? 'selected' : ''} ${hasOrders ? 'has-orders' : ''} ${hasActiveKot ? 'has-kot' : ''}`}
                                            >
                                                {hasActiveKot && (
                                                    <span
                                                        className="table-badge"
                                                        title={`KOT ${statusText}`}
                                                        style={{
                                                            backgroundColor: tableStatus.color,
                                                            boxShadow: `0 0 0 3px ${tableStatus.color}22`,
                                                        }}
                                                    />
                                                )}
                                                <div className="table-name">{table.table_name}</div>
                                                <div className="table-details">#{table.table_number}</div>
                                                <div className="table-details">{table.capacity} seats</div>
                                                <div className={`table-status ${tableStatus ? `kot-${tableStatus.status}` : ''}`}>{statusText}</div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* LEFT PANEL: Categories sidebar + Items Grid */}
            <div className="pos-left-panel" style={{ position: 'relative' }}>
                {/* Categories Sidebar - Fixed on mobile */}
                <div className="category-bar">
                    <div className="pos-category-list">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`category-tab ${activeCategory.toLowerCase() === cat.toLowerCase() ? 'active' : ''}`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                    <div className="pos-search-wrapper pos-category-search">
                        <Search className="pos-search-icon" size={18} />
                        <input
                            className="pos-search-input-field"
                            placeholder="Search items..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {/* Item Grid */}
                <div className="pos-grid-area custom-scrollbar">
                    {itemsLoading ? (
                        <POSItemsSkeleton count={12} />
                    ) : null}
                    <div className="pos-grid" style={itemsLoading ? { display: 'none' } : undefined}>
                        {filteredItems.map(item => (
                            <div
                                key={item.id}
                                className="pos-item-card"
                                onClick={() => addToCart(item)}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div style={{ width: '28px', height: '28px', background: '#eff6ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.875rem' }}>
                                        {item.name.charAt(0)}
                                    </div>
                                    <span className="price-badge" style={{ fontSize: '0.75rem', padding: '0.15rem 0.4rem' }}>
                                        ₹{item.price}
                                    </span>
                                </div>

                                <h3 style={{ marginBottom: '0.125rem', fontSize: '0.875rem' }}>{item.name}</h3>
                                <p className="text-xs text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.625rem' }}>{item.category}</p>

                                <div className="flex items-center justify-end mt-2 pt-2 border-t border-gray-100" style={{ borderTop: '1px solid #f1f5f9' }}>
                                    <div style={{ padding: '0.25rem', background: '#f8fafc', color: '#64748b', display: 'flex' }}>
                                        <Plus size={12} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Mobile-only cart peek bar — always visible at bottom, tapping opens full cart */}
            {!isDesktopView && !showCart && (
                <button
                    className="mobile-cart-peek"
                    onClick={() => setShowCart(true)}
                    aria-label="Open cart"
                >
                    <div className="mobile-cart-peek-left">
                        <span className="mobile-cart-badge">{cartItems.reduce((s, i) => s + i.qty, 0)}</span>
                        <span className="mobile-cart-peek-label">View Cart</span>
                    </div>
                    <div className="mobile-cart-peek-total">
                        <span>₹{(cartTotal + cartTax).toFixed(2)}</span>
                        <span style={{ fontSize: 18, lineHeight: 1 }}>›</span>
                    </div>
                </button>
            )}

            {/* RIGHT: Cart Panel */}
            <div ref={cartPanelRef} className={`pos-cart-panel${isCartOpen ? '' : ' is-collapsed'}`}>
                {/* Cart Header */}
                <div
                    className="cart-header"
                    onClick={() => {
                        if (!isDesktopView) {
                            setShowCart(!showCart);
                        }
                    }}
                    style={{ cursor: isDesktopView ? 'default' : 'pointer' }}
                >
                    <div className="flex items-center gap-2">
                        <ShoppingCart size={20} className="text-muted" />
                        <h2>Current Order</h2>
                        {cartItems.length > 0 && (
                            <span style={{ background: 'var(--accent-color)', color: '#fff', borderRadius: 999, fontSize: 11, fontWeight: 700, padding: '1px 7px', lineHeight: '18px' }}>
                                {cartItems.reduce((s, i) => s + i.qty, 0)}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <div
                            className={`cart-toggle-icon${isCartOpen ? '' : ' rotate-180'}`}
                            style={{ fontSize: '1.2rem', color: '#64748b', transition: 'transform 0.3s' }}
                        >
                            ▲
                        </div>
                    </div>
                </div>

                {/* Cart Items - Collapsible */}
                {isCartOpen && (
                <>
                <div className="cart-list custom-scrollbar">
                    {cartItems.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-muted">
                            <Package size={48} style={{ opacity: 0.4, marginBottom: '1rem' }} />
                            <p className="text-sm">No items yet</p>
                        </div>
                    ) : (
                        cartItems.map(item => (
                            <div key={item.id} className="cart-item">
                                <div className="flex justify-between items-center">
                                    <div className="flex-1 flex flex-col justify-center">
                                        <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1e293b', marginBottom: '0.125rem' }}>{item.name}</h4>
                                        <div className="text-xs text-muted">₹{item.price} × {item.qty}</div>
                                    </div>

                                    <div className="cart-item-actions">
                                        <div className="cart-item-qty" style={{ border: '1px solid #e2e8f0', background: 'white' }}>
                                            <button
                                                className="btn-icon"
                                                style={{ padding: '0.25rem' }}
                                                onClick={(e) => { e.stopPropagation(); updateQty(item.id, item.qty - 1); }}
                                            >
                                                <Minus size={12} />
                                            </button>
                                            <span style={{ width: '32px', textAlign: 'center', fontSize: '0.75rem', fontWeight: 700 }}>{item.qty}</span>
                                            <button
                                                className="btn-icon"
                                                style={{ padding: '0.25rem' }}
                                                onClick={(e) => { e.stopPropagation(); updateQty(item.id, item.qty + 1); }}
                                            >
                                                <Plus size={12} />
                                            </button>
                                        </div>

                                        <span className="cart-item-total" style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1e293b' }}>₹{(item.price * item.qty).toFixed(2)}</span>

                                        <button
                                            className="btn-icon danger"
                                            style={{ padding: '0.25rem' }}
                                            onClick={(e) => { e.stopPropagation(); removeFromCart(item.id); }}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>

                                    {/* Per-item notes */}
                                    <div style={{ marginTop: 4 }}>
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); setExpandedNoteId(expandedNoteId === item.id ? null : item.id); }}
                                            style={{ fontSize: 10, color: item.notes ? 'var(--accent-color)' : 'var(--text-light)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 3 }}
                                        >
                                            ✏ {item.notes ? `Note: ${item.notes}` : 'Add note'}
                                        </button>
                                        {expandedNoteId === item.id && (
                                            <input
                                                autoFocus
                                                className="input"
                                                type="text"
                                                maxLength={80}
                                                placeholder="e.g. no onion, extra spicy…"
                                                value={item.notes || ''}
                                                onChange={(e) => updateItemNotes(item.id, e.target.value)}
                                                onClick={(e) => e.stopPropagation()}
                                                style={{ fontSize: '0.75rem', padding: '4px 8px', marginTop: 4 }}
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Cart Footer */}
                <div className="cart-footer">
                    {/* Customer Info Section */}
                    {cartItems.length > 0 && (
                        <div className="mb-4 pb-4 border-b" style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <h3 className="text-sm font-bold mb-3 text-main">Customer Details (Optional)</h3>
                            <div className="flex flex-col gap-2">
                                {isRetailer && (
                                    <select
                                        className="input"
                                        value={selectedPartyId}
                                        onChange={(e) => setSelectedPartyId(e.target.value)}
                                        style={{ fontSize: '0.875rem', padding: '0.5rem 0.75rem' }}
                                    >
                                        <option value="">Select Party (Optional)</option>
                                        {parties.map((party) => (
                                            <option key={party.id} value={party.id}>
                                                {party.party_name} ({party.party_type})
                                            </option>
                                        ))}
                                    </select>
                                )}
                                <input
                                    className="input"
                                    type="text"
                                    placeholder="Customer Name"
                                    value={customerName}
                                    onChange={(e) => setCustomerName(e.target.value)}
                                    style={{ fontSize: '0.875rem', padding: '0.5rem 0.75rem' }}
                                />
                                <input
                                    className="input"
                                    type="tel"
                                    placeholder="Phone Number (for WhatsApp)"
                                    value={customerPhone}
                                    onChange={(e) => setCustomerPhone(e.target.value)}
                                    style={{ fontSize: '0.875rem', padding: '0.5rem 0.75rem' }}
                                />
                                {/* Customer GSTIN removed to simplify cart UI */}
                            </div>
                            {customerPhone && (
                                <p className="text-xs text-muted mt-2" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <span style={{ color: '#10b981' }}>✓</span> Invoice will be sent via WhatsApp
                                </p>
                            )}
                        </div>
                    )}

                    {cartItems.length > 0 && (
                        <div className="mb-3 pb-3" style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 8 }}>Payment Method</p>
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                                {['Cash', 'UPI', 'Card', 'Split'].map((mode) => (
                                    <button
                                        key={mode}
                                        type="button"
                                        onClick={() => setPaymentMode(mode)}
                                        style={{
                                            flex: '1 1 auto',
                                            padding: '6px 10px',
                                            fontSize: 12,
                                            fontWeight: 600,
                                            borderRadius: 8,
                                            border: `1.5px solid ${paymentMode === mode ? 'var(--accent-color)' : 'var(--border-color)'}`,
                                            background: paymentMode === mode ? 'var(--accent-light)' : 'white',
                                            color: paymentMode === mode ? 'var(--accent-color)' : 'var(--text-muted)',
                                            cursor: 'pointer',
                                            transition: 'all 0.15s',
                                        }}
                                    >
                                        {mode === 'Cash' ? '💵' : mode === 'UPI' ? '📱' : mode === 'Card' ? '💳' : '⚖️'} {mode}
                                    </button>
                                ))}
                            </div>
                            {(paymentMode === 'UPI' || paymentMode === 'Card') && (
                                <input
                                    className="input"
                                    type="text"
                                    placeholder={paymentMode === 'UPI' ? 'UPI Ref / UTR number' : 'Card last 4 digits / ref'}
                                    value={transactionId}
                                    onChange={(e) => setTransactionId(e.target.value)}
                                    style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem' }}
                                />
                            )}
                        </div>
                    )}

                    {cartItems.length > 0 && (
                        <div className="mb-3 pb-3" style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 8 }}>Discount</p>
                            <div style={{ display: 'flex', gap: 6 }}>
                                <div style={{ display: 'flex', borderRadius: 8, border: '1.5px solid var(--border-color)', overflow: 'hidden', flexShrink: 0 }}>
                                    {['flat', 'percent'].map((t) => (
                                        <button
                                            key={t}
                                            type="button"
                                            onClick={() => setDiscountType(t)}
                                            style={{
                                                padding: '6px 10px', fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer',
                                                background: discountType === t ? 'var(--accent-color)' : 'white',
                                                color: discountType === t ? '#fff' : 'var(--text-muted)',
                                            }}
                                        >
                                            {t === 'flat' ? '₹' : '%'}
                                        </button>
                                    ))}
                                </div>
                                <input
                                    className="input"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder={discountType === 'percent' ? 'e.g. 10' : 'e.g. 50'}
                                    value={discountValue || ''}
                                    onChange={(e) => setDiscountValue(Math.max(0, Number(e.target.value)))}
                                    style={{ flex: 1, fontSize: '0.8rem', padding: '0.4rem 0.6rem' }}
                                />
                                {discountValue > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => setDiscountValue(0)}
                                        style={{ padding: '0 8px', background: 'var(--danger-light)', color: 'var(--danger-color)', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700 }}
                                        title="Clear discount"
                                    >✕</button>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="mb-3">
                        <div className="summary-row">
                            <span>Subtotal</span>
                            <span>₹{cartTotal.toFixed(2)}</span>
                        </div>
                        <div className="summary-row">
                            <span>Tax ({user?.tax_rate || 0}%)</span>
                            <span>₹{cartTax.toFixed(2)}</span>
                        </div>
                        {discountAmount > 0 && (
                            <div className="summary-row" style={{ color: 'var(--success-color)' }}>
                                <span>Discount {discountType === 'percent' ? `(${discountValue}%)` : ''}</span>
                                <span>−₹{discountAmount.toFixed(2)}</span>
                            </div>
                        )}
                        <div className="total-row">
                            <span>Total</span>
                            <span>₹{grandTotal.toFixed(2)}</span>
                        </div>
                    </div>

                    {/* Success / Queued message */}
                    {lastInvoice && (
                        lastInvoice._offline ? (
                            /* ── Offline: invoice was queued ── */
                            <div className="mb-4 p-4 border" style={{ background: '#fffbeb', borderColor: '#fcd34d' }}>
                                <div className="flex items-center gap-2 mb-2">
                                    <span style={{ fontSize: '1.25rem' }}>📶</span>
                                    <h3 className="text-sm font-bold" style={{ color: '#92400e' }}>Order Queued Offline</h3>
                                </div>
                                <p className="text-xs mb-1" style={{ color: '#78350f' }}>
                                    Ref: <strong>{lastInvoice.invoice_number}</strong>
                                </p>
                                <p className="text-xs mb-3" style={{ color: '#92400e' }}>
                                    This invoice is saved on your device and will sync to the server automatically when you're back online.
                                </p>
                                <button
                                    className="text-xs text-muted mt-2 w-full text-center"
                                    onClick={() => setLastInvoice(null)}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                                >
                                    Start New Order
                                </button>
                            </div>
                        ) : (
                            /* ── Online: invoice created on server ── */
                            <div className="mb-4 p-4 border" style={{ background: '#f0fdf4', borderColor: '#86efac' }}>
                                <div className="flex items-center gap-2 mb-2">
                                    <span style={{ color: '#16a34a', fontSize: '1.25rem' }}>✓</span>
                                    <h3 className="text-sm font-bold" style={{ color: '#16a34a' }}>Order Completed!</h3>
                                </div>
                                <p className="text-xs mb-3" style={{ color: '#15803d' }}>
                                    Invoice #{lastInvoice.invoice_number} created successfully
                                </p>
                                {lastInvoice.customer_phone && (
                                    <button
                                        className="btn w-full"
                                        onClick={() => shareWhatsApp(lastInvoice)}
                                        style={{ background: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                                    >
                                        <Smartphone size={16} />
                                        Send Invoice via WhatsApp
                                    </button>
                                )}
                                {!lastInvoice.customer_phone && (
                                    <p className="text-xs text-center text-muted">
                                        Add phone number to send via WhatsApp
                                    </p>
                                )}
                                <button
                                    className="text-xs text-muted mt-2 w-full text-center"
                                    onClick={() => setLastInvoice(null)}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                                >
                                    Start New Order
                                </button>
                            </div>
                        )
                    )}

                    <div className="cart-actions" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <button
                            type="button"
                            className="btn w-full"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (!cartItems?.length) return;
                                setShowKOTOptions(true);
                            }}
                            disabled={!cartItems?.length}
                            aria-label="Print / Send Kitchen Order"
                            style={{
                                background: '#f59e0b',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px'
                            }}
                        >
                            <Printer size={16} />
                            PRINT TO KITCHEN
                        </button>

                        <button
                            type="button"
                            className="btn w-full cart-complete-btn"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleCheckout();
                            }}
                            disabled={!!(checkoutLoading || isAttendee || !cartItems?.length)}
                            aria-label="Complete order and create invoice"
                        >
                            {checkoutLoading ? "Processing…" : "COMPLETE ORDER"}
                        </button>
                    </div>
                </div>
                </>
                )}
            </div>

            {/* KOT Options Modal */}
            {showKOTOptions && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
                    <div style={{ width: 360, background: '#fff', borderRadius: 8, padding: 16, boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
                        <h3 style={{ margin: 0, marginBottom: 12 }}>Send order to kitchen</h3>
                        <p style={{ marginTop: 0, marginBottom: 12, color: '#374151' }}>Choose how to send this order to the kitchen.</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <button className="btn" onClick={async () => await sendToKOTDisplay()} style={{ background: '#06b6d4', color: '#fff' }}>Send to KOT Display</button>
                            {!isAttendee && (
                                <button className="btn" onClick={() => printViaBluetooth()} style={{ background: '#f59e0b', color: '#fff' }}>Print via Bluetooth</button>
                            )}
                            <button className="btn" onClick={() => setShowKOTOptions(false)} style={{ background: '#efefef' }}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {/* KOT Print Dialog */}
            <KOTPrintDialog
                isOpen={showKOTPrint}
                order={{ items: cartItems }}
                tableInfo={isRetailer ? null : selectedTable}
                businessName={user?.business_name || 'Ailexity POS'}
                autoPrint={autoPrintKOT}
                onClose={() => {
                    setShowKOTPrint(false);
                    setAutoPrintKOT(false);
                }}
                onSuccess={() => {
                    refreshKotStatuses();
                }}
            />
        </div>
    );
};

export default POS;
