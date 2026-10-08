import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { AuthContext } from './authContextDef';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('wishwin_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('wishwin_token') || null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem('wishwin_token');
    localStorage.removeItem('wishwin_user');
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    const verifyUser = async () => {
      const savedToken = localStorage.getItem('wishwin_token');
      if (savedToken) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data.user);
          localStorage.setItem('wishwin_user', JSON.stringify(res.data.user));
        } catch (err) {
          console.error('Session expired or invalid:', err);
          logout();
        }
      }
      setLoading(false);
    };

    verifyUser();
  }, [logout]);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token: authToken, user: userData } = res.data;
    localStorage.setItem('wishwin_token', authToken);
    localStorage.setItem('wishwin_user', JSON.stringify(userData));
    setToken(authToken);
    setUser(userData);
    return userData;
  };

  const register = async (payload) => {
    const res = await api.post('/auth/register', payload);
    const { token: authToken, user: userData } = res.data;
    localStorage.setItem('wishwin_token', authToken);
    localStorage.setItem('wishwin_user', JSON.stringify(userData));
    setToken(authToken);
    setUser(userData);
    return userData;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role: user?.role || null,
        isAuthenticated: !!token && !!user,
        loading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
