'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, User } from '../api/auth';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Modifier la clé ici pour utiliser 'token' au lieu de 'auth_token'
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
      fetchUser(storedToken);
    } else {
      setIsLoading(false);
    }
  }, []);

  async function fetchUser(authToken: string) {
    console.log('Fetching user data with token...');
    try {
      const userData = await getCurrentUser(authToken);
      console.log('User data fetched successfully:', userData);
      setUser(userData);
      setIsLoading(false);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      localStorage.removeItem('token');
      setToken(null);
      setIsLoading(false);
      setIsAuthenticated(false);
    }
  }

  const login = (token: string) => {
    console.log("AuthContext: login appelé avec token");
    localStorage.setItem('token', token);
    setToken(token);
    setIsAuthenticated(true);
    console.log("AuthContext: état mis à jour - isAuthenticated:", true);
  };

  const logout = () => {
    // Modifier la clé ici aussi pour utiliser 'token' au lieu de 'auth_token'
    localStorage.removeItem('token');
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 