import { useState, useEffect, useMemo } from 'react';
import api from '../api';

/**
 * Fetches and filters POS items.
 * Returns { items, loading, categories, filteredItems, search, setSearch, activeCategory, setActiveCategory }
 */
export function usePOSItems() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        api.get('/items/')
            .then((res) => {
                if (!cancelled) {
                    setItems(Array.isArray(res.data) ? res.data : []);
                    setLoading(false);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setItems([]);
                    setLoading(false);
                }
            });
        return () => { cancelled = true; };
    }, []);

    // Case-insensitive category deduplication
    const categories = useMemo(() => {
        const map = new Map();
        items.forEach((item) => {
            if (item.category) {
                const key = item.category.toLowerCase();
                if (!map.has(key)) map.set(key, item.category);
            }
        });
        return ['All', ...Array.from(map.values())];
    }, [items]);

    const filteredItems = useMemo(() => {
        const q = search.trim().toLowerCase();
        return items.filter((item) => {
            const matchCat = activeCategory === 'All' || item.category?.toLowerCase() === activeCategory.toLowerCase();
            const matchSearch = !q || item.name?.toLowerCase().includes(q) || item.category?.toLowerCase().includes(q);
            return matchCat && matchSearch;
        });
    }, [items, search, activeCategory]);

    return { items, loading, categories, filteredItems, search, setSearch, activeCategory, setActiveCategory };
}
