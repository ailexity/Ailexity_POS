import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../api';

const AuthContext = createContext(null);

const TOKEN_KEY = 'token';
const REMEMBER_ME_KEY = 'remember_me';

const getStoredToken = () => localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);

const clearStoredAuth = () => {
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REMEMBER_ME_KEY);
};

const storeToken = (token, rememberMe) => {
    if (rememberMe) {
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(REMEMBER_ME_KEY, 'true');
        sessionStorage.removeItem(TOKEN_KEY);
    } else {
        sessionStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(REMEMBER_ME_KEY, 'false');
        localStorage.removeItem(TOKEN_KEY);
    }
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchUser = async () => {
        const token = getStoredToken();
        if (token) {
            try {
                const response = await api.get('/users/me');
                setUser(response.data);
            } catch (error) {
                console.error("Failed to fetch user", error);
                clearStoredAuth();
                setUser(null);
            }
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchUser();
    }, []);

    const login = async (username, password, rememberMe = false) => {
        const formData = new URLSearchParams();
        formData.append('username', username);
        formData.append('password', password);
        formData.append('remember_me', rememberMe ? 'true' : 'false');

        try {
            // Backend OAuth2 expects application/x-www-form-urlencoded
            const response = await api.post('/token', formData, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            });
            storeToken(response.data.access_token, rememberMe);
            await fetchUser();
            return { success: true };
        } catch (error) {
            console.error("Login failed detailed:", error);
            if (error.response) {
                // Server replied with an error (401, 403, etc.)
                const msg = error.response.data?.detail || "Invalid username or password.";
                return { success: false, error: typeof msg === "string" ? msg : msg.join?.(" ") || "Invalid credentials." };
            }
            // No response = backend not reachable (ERR_CONNECTION_REFUSED, etc.)
            if (error.code === "ERR_NETWORK" || !error.response) {
                return { success: false, error: "Cannot reach server. Start the backend (run start_backend.bat or start_all.bat)." };
            }
            return { success: false, error: "Login failed. Please try again." };
        }
    };

    const logout = () => {
        clearStoredAuth();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
