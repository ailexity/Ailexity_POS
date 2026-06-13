import React, { useEffect, useMemo, useRef, useState } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { Search, Plus, Minus, Trash2, ShoppingCart, Grid, Package, Smartphone, FileText, Grid3x3 } from 'lucide-react';
import './POS.css';

const normalizeBusinessType = (businessType) => {
    const value = String(businessType || '').toLowerCase();
    if (value.includes('retail')) return 'retailer';
    return 'restaurant';
};

const POS = () => {
    const DESKTOP_BREAKPOINT = 1024;
    const [items, setItems] = useState([]);
    const [search, setSearch] = useState("");
    const { selectedTable, selectTable, cartItems, addToCart, removeFromCart, updateQty, cartTotal, cartTax, grandTotal, clearCart, setUserTaxRate, tableCarts, multiDeviceSyncEnabled, setMultiDeviceSync, fetchTableCartFromBackend } = useCart();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [activeCategory, setActiveCategory] = useState("All");
    const [customerName, setCustomerName] = useState("");
    const [customerPhone, setCustomerPhone] = useState("");
    const [customerGstin, setCustomerGstin] = useState("");
    const [parties, setParties] = useState([]);
    const [selectedPartyId, setSelectedPartyId] = useState('');
    const [lastInvoice, setLastInvoice] = useState(null);
    const [tables, setTables] = useState([]);
    const [showTableSelector, setShowTableSelector] = useState(false);
    const [showCart, setShowCart] = useState(false);
    const [isDesktopView, setIsDesktopView] = useState(() => window.innerWidth >= DESKTOP_BREAKPOINT);
    const [cartMaxHeight, setCartMaxHeight] = useState(null);
    const cartPanelRef = useRef(null);
    const isCartOpen = isDesktopView || showCart;
    const businessType = normalizeBusinessType(user?.business_type);
    const isRetailer = businessType === 'retailer';
    const retailBillingTable = useMemo(() => ({
        id: 'retail-billing',
        table_number: null,
        table_name: 'Retail Billing',
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
        const fetchItems = async () => {
            try {
                const res = await api.get('/items/');
                setItems(Array.isArray(res.data) ? res.data : []);
            } catch (e) {
                console.error(e);
                setItems([]);
            }
        };
        fetchItems();
    }, []);

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

        if (selectedTable?.is_virtual) {
            selectTable(null);
        }
    }, [isRetailer, selectedTable, selectTable, retailBillingTable]);

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

    // Get unique categories (case-insensitive grouping, but keep original case for display)
    const categoryMap = new Map();
    items.forEach(item => {
        if (item.category) {
            const lowerKey = item.category.toLowerCase();
            if (!categoryMap.has(lowerKey)) {
                categoryMap.set(lowerKey, item.category);
            }
        }
    });
    const categories = ["All", ...categoryMap.values()];

    const filteredItems = items.filter(i =>
        (activeCategory === "All" || i.category?.toLowerCase() === activeCategory.toLowerCase()) &&
        i.name.toLowerCase().includes(search.toLowerCase())
    );

    const handleCheckout = async () => {
        if (!cartItems?.length) {
            alert("Please add items to cart before completing order");
            return;
        }

        setLoading(true);
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
                payment_mode: "Cash",
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
            setLastInvoice(res.data);
            clearCart();
            setCustomerName("");
            setCustomerPhone("");
            setCustomerGstin("");
            setSelectedPartyId('');

            if (checkoutCustomerPhone) {
                const sendWhatsApp = window.confirm(
                    `Invoice Created: ${res.data.invoice_number}${(!isRetailer && selectedTable) ? `\nTable: ${selectedTable.table_name}` : ''}\n\nWould you like to send this invoice via WhatsApp?`
                );
                if (sendWhatsApp) {
                    shareWhatsApp(res.data);
                }
            } else {
                alert(`Invoice Created: ${res.data.invoice_number}${(!isRetailer && selectedTable) ? `\nTable: ${selectedTable.table_name}` : ''}`);
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
            setLoading(false);
        }
    };

    const shareWhatsApp = async (invoice) => {
        // Get customer name for personalization
        const custName = invoice.customer_name || customerName || 'Valued Customer';
        const businessName = invoice.business_name || user?.business_name || 'Our Store';

        // Generate invoice URLs
        const invoiceUrl = `${window.location.origin}/invoice/${invoice.id}`;
        const apiBase = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
        const resolvedApiBase = apiBase.startsWith('http') ? apiBase : `${window.location.origin}${apiBase}`;
        const sharePreviewUrl = `${resolvedApiBase}/invoices/public/${invoice.id}/share`;

        // Load WhatsApp template from localStorage
        let template = {
            greeting: 'Dear {customer_name},',
            thank_you: 'Thank you for your recent order at {business_name}!\nYour invoice is now available. 🪄',
            closing: 'Loved your experience? Or something to improve? Tap to tell us! 🌟',
            show_invoice_link: true,
            show_date: true,
            show_total: true
        };
        
        try {
            const savedTemplate = localStorage.getItem('whatsapp_template');
            if (savedTemplate) {
                template = { ...template, ...JSON.parse(savedTemplate) };
            }
        } catch (e) {
            console.error('Error loading WhatsApp template:', e);
        }

        // Build the message using template
        let message = template.greeting.replace('{customer_name}', custName);
        message += '\n\n' + template.thank_you.replace('{business_name}', businessName);
        message += '\n';
        
        if (template.show_total) {
            message += `\n💰 Amount : Rs.${invoice.total_amount.toFixed(0)}`;
        }
        
        if (template.show_date) {
            const date = new Date(invoice.created_at);
            const dateStr = date.toLocaleDateString('en-IN', { 
                day: '2-digit',
                month: '2-digit', 
                year: 'numeric',
                timeZone: 'Asia/Kolkata' 
            }).replace(/\//g, '/');
            const timeStr = date.toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
                timeZone: 'Asia/Kolkata'
            });
            message += `\n📅 Date : ${dateStr} ${timeStr}`;
        }
        
        if (template.show_invoice_link) {
            message += `\n👁 View Invoice : ${sharePreviewUrl}`;
        }
        
        message += '\n\n' + template.closing;

        const phone = invoice.customer_phone || customerPhone;
        const url = `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
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
                                    className={`btn table-selector-btn${showTableSelector ? ' is-active' : ''}`}
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
                        <div className="table-dropdown-body custom-scrollbar">
                            {tables.length === 0 ? (
                                <div className="table-dropdown-empty">
                                    <p>No tables configured</p>
                                    <p>Go to Settings to add tables</p>
                                </div>
                            ) : (
                                <div className="table-grid">
                                    {tables.map(table => {
                                        const hasOrders = tableCarts[table.id] && tableCarts[table.id].length > 0;
                                        const isSelected = selectedTable?.id === table.id;
                                        return (
                                            <button
                                                key={table.id}
                                                onClick={() => {
                                                    selectTable(table);
                                                    setShowTableSelector(false);
                                                }}
                                                className={`table-btn${isSelected ? ' selected' : ''}`}
                                            >
                                                {hasOrders && (
                                                    <span className="table-btn-indicator" title="Has ongoing orders"></span>
                                                )}
                                                <span className="table-btn-name">{table.table_name}</span>
                                                <span className="table-btn-number">#{table.table_number}</span>
                                                <span className="table-btn-capacity">{table.capacity} seats</span>
                                                {hasOrders && (
                                                    <span className="table-btn-status">Occupied</span>
                                                )}
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
                    <div className="pos-grid">
                        {filteredItems.length === 0 ? (
                            <div className="pos-grid-empty">
                                <Package size={40} style={{ opacity: 0.4 }} />
                                <p>No items match your search</p>
                            </div>
                        ) : (
                            filteredItems.map(item => (
                                <div
                                    key={item.id}
                                    className="pos-item-card"
                                    onClick={() => addToCart(item)}
                                >
                                    <div className="pos-item-top">
                                        <div className="pos-item-avatar">
                                            {item.name.charAt(0).toUpperCase()}
                                        </div>
                                        <span className="price-badge">
                                            ₹{item.price}
                                        </span>
                                    </div>

                                    <h3>{item.name}</h3>
                                    <p>{item.category}</p>

                                    <div className="pos-item-footer">
                                        <div className="pos-item-add">
                                            <Plus size={14} />
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

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
                >
                    <div className="cart-header-title">
                        <div className="cart-header-icon">
                            <ShoppingCart size={18} />
                        </div>
                        <div>
                            <h2>Current Order</h2>
                            <p className="cart-header-sub">
                                {cartItems.length === 0 ? 'No items added yet' : `${cartItems.length} item${cartItems.length > 1 ? 's' : ''} in cart`}
                            </p>
                        </div>
                    </div>
                    <div className="cart-header-meta">
                        <div className="cart-trx-id">
                            #TRX-{Math.floor(Math.random() * 1000)}
                        </div>
                        <div className={`cart-toggle-icon${isCartOpen ? '' : ' rotate-180'}`}>
                            ▲
                        </div>
                    </div>
                </div>

                {/* Cart Items - Collapsible */}
                {isCartOpen && (
                <>
                <div className="cart-list custom-scrollbar">
                    {cartItems.length === 0 ? (
                        <div className="cart-empty">
                            <Package size={44} style={{ opacity: 0.4, marginBottom: '0.75rem' }} />
                            <p>Your cart is empty</p>
                            <span>Tap an item on the left to add it</span>
                        </div>
                    ) : (
                        cartItems.map(item => (
                            <div key={item.id} className="cart-item">
                                <div className="cart-item-row">
                                    <div className="cart-item-info">
                                        <h4 className="cart-item-name">{item.name}</h4>
                                        <div className="cart-item-meta">₹{item.price} × {item.qty}</div>
                                    </div>

                                    <div className="cart-item-actions">
                                        <div className="cart-item-qty">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); updateQty(item.id, item.qty - 1); }}
                                            >
                                                <Minus size={12} />
                                            </button>
                                            <span className="cart-item-qty-value">{item.qty}</span>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); updateQty(item.id, item.qty + 1); }}
                                            >
                                                <Plus size={12} />
                                            </button>
                                        </div>

                                        <span className="cart-item-total">₹{(item.price * item.qty).toFixed(2)}</span>

                                        <button
                                            className="btn-icon danger"
                                            style={{ padding: '0.25rem' }}
                                            onClick={(e) => { e.stopPropagation(); removeFromCart(item.id); }}
                                        >
                                            <Trash2 size={14} />
                                        </button>
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
                        <div className="customer-details-section">
                            <h3>Customer Details (Optional)</h3>
                            <div className="customer-details-fields">
                                {isRetailer && (
                                    <select
                                        className="input"
                                        value={selectedPartyId}
                                        onChange={(e) => setSelectedPartyId(e.target.value)}
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
                                />
                                <input
                                    className="input"
                                    type="tel"
                                    placeholder="Phone Number (for WhatsApp)"
                                    value={customerPhone}
                                    onChange={(e) => setCustomerPhone(e.target.value)}
                                />
                                <input
                                    className="input"
                                    type="text"
                                    placeholder="Customer GSTIN (optional)"
                                    value={customerGstin}
                                    onChange={(e) => setCustomerGstin(e.target.value.toUpperCase())}
                                />
                            </div>
                            {customerPhone && (
                                <p className="customer-whatsapp-hint">
                                    <span className="icon-check">✓</span> Invoice will be sent via WhatsApp
                                </p>
                            )}
                        </div>
                    )}

                    <div className="order-summary">
                        <div className="summary-row">
                            <span>Subtotal</span>
                            <span>₹{cartTotal.toFixed(2)}</span>
                        </div>
                        <div className="summary-row">
                            <span>Tax ({user?.tax_rate || 0}%)</span>
                            <span>₹{cartTax.toFixed(2)}</span>
                        </div>
                        <div className="total-row">
                            <span>Total</span>
                            <span>₹{(cartTotal + cartTax).toFixed(2)}</span>
                        </div>
                    </div>

                    {/* Success Message with WhatsApp Button */}
                    {lastInvoice && (
                        <div className="order-success-card">
                            <div className="order-success-header">
                                <span className="order-success-icon">✓</span>
                                <h3>Order Completed!</h3>
                            </div>
                            <p>
                                Invoice #{lastInvoice.invoice_number} created successfully
                            </p>
                            {lastInvoice.customer_phone && (
                                <button
                                    className="whatsapp-btn"
                                    onClick={() => shareWhatsApp(lastInvoice)}
                                >
                                    <Smartphone size={16} />
                                    Send Invoice via WhatsApp
                                </button>
                            )}
                            {!lastInvoice.customer_phone && (
                                <p className="order-success-hint">
                                    Add phone number to send via WhatsApp
                                </p>
                            )}
                            <button
                                className="order-success-new-btn"
                                onClick={() => setLastInvoice(null)}
                            >
                                Start New Order
                            </button>
                        </div>
                    )}

                    {/* Complete Order Button */}
                    <div className="cart-actions">
                        <button
                            type="button"
                            className="btn w-full cart-complete-btn"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleCheckout();
                            }}
                            disabled={!!(loading || !cartItems?.length)}
                            aria-label="Complete order and create invoice"
                        >
                            {loading ? "Processing…" : "COMPLETE ORDER"}
                        </button>
                    </div>
                </div>
                </>
                )}
            </div>
        </div>
    );
};

export default POS;
