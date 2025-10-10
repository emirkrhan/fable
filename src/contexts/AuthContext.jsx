"use client"

import { createContext, useContext, useEffect, useState, useCallback } from 'react';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bootstrapped, setBootstrapped] = useState(false);
  useEffect(() => {
    try {
      const storedUser = typeof window !== 'undefined' ? window.localStorage.getItem('auth_user') : null;
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        setUser({
          id: parsed.id,
          uid: parsed.id,
          email: parsed.email,
          displayName: parsed.name || parsed.email?.split('@')[0] || 'User',
          photoURL: parsed.photoURL || ''
        });
      } else {
        setUser(null);
      }
    } catch (e) {
      setUser(null);
    } finally {
      setBootstrapped(true);
      setLoading(false);
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    throw new Error('Google sign-in is disabled');
  }, []);

  const logout = useCallback(async () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('auth_token');
      window.localStorage.removeItem('auth_user');
    }
    setUser(null);
    window.location.replace('/login');
  }, []);

  const login = useCallback((user, token) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('auth_token', token);
      if (user) {
        const userToStore = {
          id: user.id,
          uid: user.id,
          email: user.email,
          displayName: user.name || user.email?.split('@')[0] || 'User',
          photoURL: user.photoURL || ''
        };
        window.localStorage.setItem('auth_user', JSON.stringify(userToStore));
        setUser(userToStore);
      }
    }
  }, []);

  const value = {
    user,
    loading,
    bootstrapped,
    signInWithGoogle,
    logout,
    login
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}