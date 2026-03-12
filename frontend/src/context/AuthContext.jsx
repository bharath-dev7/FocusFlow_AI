import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('access_token'));
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // On mount: validate existing token
    useEffect(() => {
        const validateToken = async () => {
            if (!token) {
                setIsLoading(false);
                return;
            }
            try {
                const userData = await authAPI.me();
                setUser(userData);
            } catch (err) {
                // Token is invalid — clear it
                localStorage.removeItem('access_token');
                setToken(null);
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        };
        validateToken();
    }, []);

    const login = async (email, password) => {
        setError(null);
        try {
            const data = await authAPI.login(email, password);
            localStorage.setItem('access_token', data.access_token);
            setToken(data.access_token);

            // Fetch user profile
            const userData = await authAPI.me();
            setUser(userData);
            return userData;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    const register = async (email, password) => {
        setError(null);
        try {
            await authAPI.register(email, password);
            // Auto-login after registration
            return await login(email, password);
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    const logout = () => {
        localStorage.removeItem('access_token');
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, isLoading, error, login, register, logout, setError }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
}
