import React, { createContext, useState, useContext, useMemo, useEffect } from 'react';
import api from '../api';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [multiDeviceSyncEnabled, setMultiDeviceSyncEnabled] = useState(false);

    // Initialize selected table from localStorage
    const [selectedTable, setSelectedTable] = useState(() => {
        try {
            const savedTable = localStorage.getItem('selectedTable');
            return savedTable ? JSON.parse(savedTable) : null;
        } catch (error) {
            console.error('Error loading selected table from localStorage:', error);
            return null;
        }
    });

    // Initialize table carts from localStorage (separate cart for each table)
    const [tableCarts, setTableCarts] = useState(() => {
        try {
            const savedTableCarts = localStorage.getItem('tableCarts');
            return savedTableCarts ? JSON.parse(savedTableCarts) : {};
        } catch (error) {
            console.error('Error loading table carts from localStorage:', error);
            return {};
        }
    });

    // Initialize tax rate from localStorage
    const [taxRate, setTaxRate] = useState(() => {
        try {
            const savedTaxRate = localStorage.getItem('taxRate');
            return savedTaxRate ? parseFloat(savedTaxRate) : 0;
        } catch (error) {
            console.error('Error loading tax rate from localStorage:', error);
            return 0;
        }
    });

    // Get current table's cart items
    const cartItems = useMemo(() => {
        if (!selectedTable) return [];
        return tableCarts[selectedTable.id] || [];
    }, [selectedTable, tableCarts]);

    // Persist selected table to localStorage
    useEffect(() => {
        try {
            if (selectedTable) {
                localStorage.setItem('selectedTable', JSON.stringify(selectedTable));
            } else {
                localStorage.removeItem('selectedTable');
            }
        } catch (error) {
            console.error('Error saving selected table to localStorage:', error);
        }
    }, [selectedTable]);

    // Persist table carts to localStorage
    useEffect(() => {
        try {
            localStorage.setItem('tableCarts', JSON.stringify(tableCarts));
        } catch (error) {
            console.error('Error saving table carts to localStorage:', error);
        }
    }, [tableCarts]);

    // Persist tax rate to localStorage whenever it changes
    useEffect(() => {
        try {
            localStorage.setItem('taxRate', taxRate.toString());
        } catch (error) {
            console.error('Error saving tax rate to localStorage:', error);
        }
    }, [taxRate]);

    // Fetch cart from backend when multi-device sync is enabled
    const fetchTableCartFromBackend = async (tableId) => {
        if (!multiDeviceSyncEnabled || !tableId) return null;
        
        try {
            const response = await api.get(`/table-carts/${tableId}`);
            const backendCart = response.data.items || [];
            
            // Update local state with backend data
            setTableCarts(prev => ({
                ...prev,
                [tableId]: backendCart
            }));
            
            return backendCart;
        } catch (error) {
            console.error('Error fetching table cart from backend:', error);
            return null;
        }
    };

    // Sync cart to backend when multi-device sync is enabled
    const syncTableCartToBackend = async (tableId, items) => {
        if (!multiDeviceSyncEnabled || !tableId) return;
        
        try {
            await api.put(`/table-carts/${tableId}`, { items });
        } catch (error) {
            console.error('Error syncing table cart to backend:', error);
        }
    };

    // Clear cart from backend when multi-device sync is enabled
    const clearTableCartFromBackend = async (tableId) => {
        if (!multiDeviceSyncEnabled || !tableId) return;
        
        try {
            await api.delete(`/table-carts/${tableId}`);
        } catch (error) {
            console.error('Error clearing table cart from backend:', error);
        }
    };

    // Load cart from backend when table is selected and multi-device sync is enabled
    useEffect(() => {
        const loadCartFromBackend = async () => {
            if (multiDeviceSyncEnabled && selectedTable) {
                await fetchTableCartFromBackend(selectedTable.id);
            }
        };
        
        loadCartFromBackend();
    }, [selectedTable?.id, multiDeviceSyncEnabled]);

    const selectTable = (table) => {
        setSelectedTable(table);
    };

    const addToCart = async (item) => {
        if (!selectedTable) {
            alert('Please select a table first');
            return;
        }
        
        setTableCarts(prev => {
            const tableCart = prev[selectedTable.id] || [];
            const existing = tableCart.find(i => i.id === item.id);
            
            const newTableCart = existing
                ? tableCart.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i)
                : [...tableCart, { ...item, qty: 1 }];
            
            // Sync to backend if enabled
            if (multiDeviceSyncEnabled) {
                syncTableCartToBackend(selectedTable.id, newTableCart);
            }
            
            return {
                ...prev,
                [selectedTable.id]: newTableCart
            };
        });
    };

    const removeFromCart = async (itemId) => {
        if (!selectedTable) return;
        
        setTableCarts(prev => {
            const newTableCart = (prev[selectedTable.id] || []).filter(i => i.id !== itemId);
            
            // Sync to backend if enabled
            if (multiDeviceSyncEnabled) {
                syncTableCartToBackend(selectedTable.id, newTableCart);
            }
            
            return {
                ...prev,
                [selectedTable.id]: newTableCart
            };
        });
    };

    const updateQty = async (itemId, qty) => {
        if (!selectedTable) return;
        
        if (qty <= 0) {
            removeFromCart(itemId);
            return;
        }
        
        setTableCarts(prev => {
            const newTableCart = (prev[selectedTable.id] || []).map(i => 
                i.id === itemId ? { ...i, qty } : i
            );
            
            // Sync to backend if enabled
            if (multiDeviceSyncEnabled) {
                syncTableCartToBackend(selectedTable.id, newTableCart);
            }
            
            return {
                ...prev,
                [selectedTable.id]: newTableCart
            };
        });
    };

    const clearCart = async () => {
        if (!selectedTable) return;
        
        setTableCarts(prev => {
            // Clear from backend if enabled
            if (multiDeviceSyncEnabled) {
                clearTableCartFromBackend(selectedTable.id);
            }
            
            return {
                ...prev,
                [selectedTable.id]: []
            };
        });
    };

    const clearTableCart = async (tableId) => {
        setTableCarts(prev => {
            const newCarts = { ...prev };
            delete newCarts[tableId];
            
            // Clear from backend if enabled
            if (multiDeviceSyncEnabled) {
                clearTableCartFromBackend(tableId);
            }
            
            return newCarts;
        });
    };

    const setUserTaxRate = (rate) => setTaxRate(rate || 0);

    // Function to enable/disable multi-device sync
    const setMultiDeviceSync = (enabled, user) => {
        setMultiDeviceSyncEnabled(enabled);
        setCurrentUser(user);
    };

    const cartTotal = useMemo(() => {
        return cartItems.reduce((acc, item) => acc + (item.price * item.qty), 0);
    }, [cartItems]);

    const cartTax = useMemo(() => {
        // Use global tax rate for all items
        return cartItems.reduce((acc, item) => acc + (item.price * item.qty * (taxRate / 100)), 0);
    }, [cartItems, taxRate]);

    const grandTotal = useMemo(() => {
        return cartTotal + cartTax;
    }, [cartTotal, cartTax]);

    return (
        <CartContext.Provider value={{
            selectedTable,
            selectTable,
            cartItems,
            taxRate,
            addToCart,
            removeFromCart,
            updateQty,
            clearCart,
            clearTableCart,
            setUserTaxRate,
            cartTotal,
            cartTax,
            grandTotal,
            tableCarts,
            multiDeviceSyncEnabled,
            setMultiDeviceSync,
            fetchTableCartFromBackend
        }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => useContext(CartContext);
