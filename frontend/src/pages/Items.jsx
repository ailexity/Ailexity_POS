import React, { useEffect, useState } from 'react';
import api from '../api';
import { Plus, Edit, Trash, Package, Search } from 'lucide-react';
import './Items.css';

const Items = () => {
    const [items, setItems] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [newItem, setNewItem] = useState({ name: '', price: '', category: '', stock_quantity: '', manufacturing_cost: '0' });
    const [editingItem, setEditingItem] = useState(null);
    const [search, setSearch] = useState('');

    const fetchItems = async () => {
        try {
            const res = await api.get('/items/');
            console.log('Items fetched:', res.data);
            setItems(Array.isArray(res.data) ? res.data : []);
        } catch (error) {
            console.error('Error fetching items:', error);
            setItems([]);
        }
    };

    useEffect(() => {
        fetchItems();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingItem) {
                // Update existing item
                await api.put(`/items/${editingItem.id}`, newItem);
            } else {
                // Create new item
                await api.post('/items/', newItem);
            }
            setShowModal(false);
            setNewItem({ name: '', price: '', category: '', stock_quantity: '', manufacturing_cost: '0' });
            setEditingItem(null);
            fetchItems();
        } catch (error) {
            console.error(error);
        }
    };

    const handleEdit = (item) => {
        setEditingItem(item);
        setNewItem({
            name: item.name,
            price: item.price,
            category: item.category,
            stock_quantity: item.stock_quantity,
            manufacturing_cost: item.manufacturing_cost || 0
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (confirm("Are you sure?")) {
            await api.delete(`/items/${id}`);
            fetchItems();
        }
    };

    const handleAddNew = () => {
        setEditingItem(null);
        setNewItem({ name: '', price: '', category: '', stock_quantity: '', manufacturing_cost: '0' });
        setShowModal(true);
    };

    // Filter items based on search
    const filteredItems = items.filter(item => {
        const searchLower = search.toLowerCase();
        return (
            item.name.toLowerCase().includes(searchLower) ||
            item.category.toLowerCase().includes(searchLower)
        );
    });

    return (
        <div className="items-page with-mobile-header-offset">
            {/* Header Section */}
            <div className="items-header">
                <div className="items-title-section">
                    <div className="items-title-left">
                        <div className="items-icon">
                            <Package size={20} />
                        </div>
                        <h1 className="items-title">Inventory Management</h1>
                    </div>
                    <button className="items-add-btn" onClick={handleAddNew}>
                        <Plus size={18} /> Add Inventory Item
                    </button>
                </div>

                {/* Search Bar */}
                <div className="items-search-wrapper">
                    <Search className="items-search-icon" size={18} />
                    <input
                        className="items-search-input"
                        placeholder="Search by name or category..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Content Area */}
            <div className="items-content">
                <div className="items-table-container">
                    <table className="items-table">
                        <thead>
                            <tr>
                                <th>Item</th>
                                <th>Price</th>
                                <th>Stock</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredItems.map(item => (
                                <tr key={item.id}>
                                    <td data-label="Item">
                                        <div className="items-name-group">
                                            <span className="items-name">{item.name}</span>
                                            <span className="items-category-text">{item.category}</span>
                                        </div>
                                    </td>
                                    <td data-label="Price">
                                        <span className="items-price">₹{item.price}</span>
                                    </td>
                                    <td data-label="Stock">
                                        <span className={`items-stock-badge ${item.stock_quantity < 10 ? 'low' : 'normal'}`}>
                                            {item.stock_quantity}
                                        </span>
                                    </td>
                                    <td data-label="Actions">
                                        <div className="items-actions">
                                            <button className="items-action-btn edit" onClick={() => handleEdit(item)} title="Edit Item">
                                                <Edit size={16} />
                                            </button>
                                            <button className="items-action-btn delete" onClick={() => handleDelete(item.id)} title="Delete Item">
                                                <Trash size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredItems.length === 0 && (
                                <tr>
                                    <td colSpan="4">
                                        <div className="items-empty-state">
                                            <Package size={48} className="items-empty-icon" />
                                            <p className="items-empty-text">
                                                {search ? `No inventory items found matching "${search}"` : 'No inventory items found. Click "Add Inventory Item" to create your first item.'}
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="items-modal-overlay" onClick={() => {
                    setShowModal(false);
                    setEditingItem(null);
                    setNewItem({ name: '', price: '', category: '', stock_quantity: '', manufacturing_cost: '0' });
                }}>
                    <div className="items-modal" onClick={e => e.stopPropagation()}>
                        <div className="items-modal-header">
                            <h2>{editingItem ? 'Edit Inventory Item' : 'Add New Inventory Item'}</h2>
                        </div>

                        <div className="items-modal-body">
                            <form onSubmit={handleSubmit} className="items-form" id="itemForm">
                                <div className="items-form-group">
                                    <label className="items-form-label">Item Name</label>
                                    <input 
                                        className="items-form-input" 
                                        placeholder="Enter item name" 
                                        value={newItem.name} 
                                        onChange={e => setNewItem({ ...newItem, name: e.target.value })} 
                                        required 
                                    />
                                </div>

                                <div className="items-form-row">
                                    <div className="items-form-group">
                                        <label className="items-form-label">Category</label>
                                        <input 
                                            className="items-form-input" 
                                            placeholder="e.g., Beverages" 
                                            value={newItem.category} 
                                            onChange={e => setNewItem({ ...newItem, category: e.target.value })} 
                                            required 
                                        />
                                    </div>
                                    <div className="items-form-group">
                                        <label className="items-form-label">Price (₹)</label>
                                        <input 
                                            className="items-form-input" 
                                            placeholder="0.00" 
                                            type="number" 
                                            step="0.01" 
                                            value={newItem.price} 
                                            onChange={e => setNewItem({ ...newItem, price: e.target.value })} 
                                            required 
                                        />
                                    </div>
                                </div>

                                <div className="items-form-row">
                                    <div className="items-form-group">
                                        <label className="items-form-label">Manufacturing Cost (₹)</label>
                                        <input 
                                            className="items-form-input" 
                                            placeholder="0.00" 
                                            type="number" 
                                            step="0.01" 
                                            value={newItem.manufacturing_cost} 
                                            onChange={e => setNewItem({ ...newItem, manufacturing_cost: e.target.value })} 
                                            required 
                                        />
                                    </div>
                                    <div className="items-form-group">
                                        <label className="items-form-label">Stock Quantity</label>
                                        <input 
                                            className="items-form-input" 
                                            placeholder="0" 
                                            type="number" 
                                            value={newItem.stock_quantity} 
                                            onChange={e => setNewItem({ ...newItem, stock_quantity: e.target.value })} 
                                            required 
                                        />
                                    </div>
                                </div>
                            </form>
                        </div>

                        <div className="items-modal-footer">
                            <button 
                                type="button" 
                                className="items-modal-btn cancel" 
                                onClick={() => {
                                    setShowModal(false);
                                    setEditingItem(null);
                                    setNewItem({ name: '', price: '', category: '', stock_quantity: '', manufacturing_cost: '0' });
                                }}
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit" 
                                form="itemForm" 
                                className="items-modal-btn submit"
                            >
                                {editingItem ? 'Update Inventory Item' : 'Save Inventory Item'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Items;
