import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = sessionStorage.getItem('token'); // Changed to sessionStorage for session-only persistence
        if (token) {
            setUser({ token });
        }
        setLoading(false);
    }, []);

    const login = async (username, password) => {
        try {
            const res = await axios.post('http://localhost:3000/api/login', { username, password });
            if (res.data.success) {
                sessionStorage.setItem('token', res.data.token); // Changed to sessionStorage
                setUser({ token: res.data.token });
                return true;
            }
        } catch (error) {
            console.error("Login Error", error);
            return false;
        }
        return false;
    };

    const logout = () => {
        sessionStorage.removeItem('token'); // Changed to sessionStorage
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
