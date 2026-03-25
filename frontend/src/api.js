    import axios from 'axios';

// Use environment variable for API URL - NO FALLBACK for production
// For production, this MUST be set to relative path: /api
// For local dev, set to: http://localhost:8000
const API_BASE_URL = import.meta.env.VITE_API_URL;

// Fail fast if VITE_API_URL is not configured
if (!API_BASE_URL) {
    throw new Error(
        '❌ VITE_API_URL is not configured!\n' +
        'Create frontend/.env with:\n' +
        '  Development: VITE_API_URL=http://localhost:8000\n' +
        '  Production:  VITE_API_URL=/api'
    );
}

const api = axios.create({
    baseURL: API_BASE_URL,
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
