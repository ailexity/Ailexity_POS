import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:8000' : '/api');

if (import.meta.env.PROD && !import.meta.env.VITE_API_URL) {
    console.warn(
        '⚠️ VITE_API_URL was not set at build time, falling back to "/api".\n' +
        'Create frontend/.env with:\n' +
        '  VITE_API_URL=/api'
    );
}

const api = axios.create({
    baseURL: API_BASE_URL.replace(/\/$/, ''),
    timeout: 30000,
});

const getStoredToken = () => localStorage.getItem('token') || sessionStorage.getItem('token');

const clearStoredToken = () => {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    localStorage.removeItem('remember_me');
};

// ── Request interceptor: attach auth token ───────────────────────────────
api.interceptors.request.use(
    (config) => {
        if (!config.url.includes('/invoices/public/')) {
            const token = getStoredToken();
            if (token) config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ── Response interceptor: handle 401 + offline invoice queuing ──────────
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const isNetworkError = !error.response && (error.code === 'ERR_NETWORK' || !navigator.onLine);

        // Offline invoice queuing — only for invoice POST, and not for sync retries
        if (
            isNetworkError &&
            !error.config?._skipOfflineQueue &&
            error.config?.url?.includes('/invoices/') &&
            error.config?.method === 'post'
        ) {
            try {
                const { queueInvoice } = await import('./utils/offlineQueue.js');
                const payload = JSON.parse(error.config.data || '{}');
                const queuedId = await queueInvoice(payload);

                // Build a temporary invoice number so the POS can display something meaningful
                const d = new Date();
                const datePart = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
                const tempNum = `OFFLINE-${datePart}-${String(queuedId).padStart(3, '0')}`;

                // Notify the rest of the app so the banner count updates
                window.dispatchEvent(new CustomEvent('invoice-queued', { detail: { queuedId } }));

                // Return a synthetic response so handleCheckout sees a "success"
                return {
                    data: {
                        _offline: true,
                        _queued_id: queuedId,
                        id: `offline-${queuedId}`,
                        invoice_number: tempNum,
                        admin_id: '',
                        customer_name: payload.customer_name || null,
                        customer_phone: payload.customer_phone || null,
                        total_amount:
                            (payload.items || []).reduce(
                                (s, i) => s + (Number(i.unit_price) || 0) * (Number(i.quantity) || 1) + (Number(i.tax_amount) || 0),
                                0
                            ) - (Number(payload.discount_amount) || 0),
                        items: payload.items || [],
                        created_at: new Date().toISOString(),
                        payment_mode: payload.payment_mode || 'Cash',
                    },
                };
            } catch {
                // IndexedDB unavailable — fall through to normal network error
            }
        }

        // Session expiry: show toast then redirect
        if (error.response?.status === 401) {
            if (!window.location.pathname.includes('/invoice/')) {
                clearStoredToken();
                if (!window.location.pathname.includes('/login')) {
                    window.dispatchEvent(new CustomEvent('session-expired'));
                    setTimeout(() => { window.location.href = '/login?expired=1'; }, 2200);
                }
            }
        }

        return Promise.reject(error);
    }
);

export default api;
