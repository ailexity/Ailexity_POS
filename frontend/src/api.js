    import axios from 'axios';

// Use environment variable for API URL when available.
// In production, this should be a relative path: /api
// In development, the dev proxy or localhost backend is used.
const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:8000' : '/api');

if (import.meta.env.PROD && !import.meta.env.VITE_API_URL) {
    throw new Error(
        '❌ VITE_API_URL must be configured for production!\n' +
        'Create frontend/.env with:\n' +
        '  VITE_API_URL=/api'
    );
}

const api = axios.create({
    baseURL: API_BASE_URL.replace(/\/$/, ''),
    timeout: 30000,  // Increased to 30 seconds
});

const getStoredToken = () => localStorage.getItem('token') || sessionStorage.getItem('token');

const clearStoredToken = () => {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    localStorage.removeItem('remember_me');
};

    // Request interceptor - Add token to requests
    api.interceptors.request.use(
        (config) => {
            // Skip auth for public invoice endpoint
            if (!config.url.includes('/invoices/public/')) {
                const token = getStoredToken();
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
            }
            return config;
        },
        (error) => Promise.reject(error)
    );

    // Response interceptor - Handle 401 errors
    api.interceptors.response.use(
        (response) => response,
        (error) => {
            if (error.response && error.response.status === 401) {
                // Don't redirect for public invoice page
                if (!window.location.pathname.includes('/invoice/')) {
                    // Token is invalid or expired
                    console.warn('Authentication failed - redirecting to login');
                    clearStoredToken();

                    // Only redirect if not already on login page
                    if (!window.location.pathname.includes('/login')) {
                        window.location.href = '/login';
                    }
                }
            }
            return Promise.reject(error);
        }
    );

    export default api;
