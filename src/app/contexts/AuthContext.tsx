'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  surname?: string;
  profileImgUrl?: string;
  role: 'client' | 'provider';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (user: Record<string, unknown>, token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window === 'undefined') return null;

    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        return JSON.parse(storedUser);
      } catch (err) {
        console.error('Error parsing stored user:', err);
        localStorage.removeItem('user');
        return null;
      }
    }
    return null;
  });

  const [token, setToken] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  });

  // Sincronizar cambios de storage en otras ventanas
  useEffect(() => {
    const handleStorageChange = () => {
      const storedUser = localStorage.getItem('user');
      const storedToken = localStorage.getItem('token');

      if (storedUser && storedToken) {
        try {
          setUser(JSON.parse(storedUser));
          setToken(storedToken);
        } catch (err) {
          console.error('Error parsing stored user:', err);
        }
      } else {
        setUser(null);
        setToken(null);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const login = (rawUser: Record<string, unknown>, token: string) => {
    // Validar y normalizar el rol
    const validRoles = ['client', 'provider'];
    const role = validRoles.includes(String(rawUser.role)) ? String(rawUser.role) : 'client';

    const normalizedUser: User = {
      id: String(rawUser.id),
      email: String(rawUser.email),
      name: String(rawUser.name || rawUser.full_name || ''),
      surname: String(rawUser.surname || ''),
      profileImgUrl: String(rawUser.profileImgUrl || rawUser.avatar_url || ''),
      role: role as 'client' | 'provider',
    };

    setUser(normalizedUser);
    setToken(token);

    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(normalizedUser));
      localStorage.setItem('token', token);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);

    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>{children}</AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};
