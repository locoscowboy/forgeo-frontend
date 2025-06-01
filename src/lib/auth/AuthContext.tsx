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
  const router = useRouter();

  useEffect(() => {
    const storedToken = getCookieValue('token');
    if (storedToken) {
      setToken(storedToken);
      fetchUser(storedToken);
    } else {
      setIsLoading(false);
    }
  }, []);

  function getCookieValue(name: string) {
    if (typeof document === 'undefined') return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift();
    return null;
  }

  function deleteCookie(name: string) {
    if (typeof document === 'undefined') return;
    document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; secure; samesite=strict`;
  }

  async function fetchUser(authToken: string) {
    console.log('🔄 Fetching user data with token...');
    try {
      const userData = await getCurrentUser(authToken);
      console.log('✅ User data fetched successfully:', userData);
      setUser(userData);
      setIsLoading(false);
    } catch (error) {
      console.error('❌ Failed to fetch user:', error);
      // Si l'API échoue, supprimer le token invalide
      deleteCookie('token');
      setToken(null);
      setUser(null);
      setIsLoading(false);
    }
  }

  const login = (newToken: string) => {
    console.log("🔐 AuthContext: login called with token");
    
    // Stocker le token dans un cookie sécurisé (24h d'expiration)
    document.cookie = `token=${newToken}; path=/; secure; samesite=strict; max-age=86400`;
    
    setToken(newToken);
    fetchUser(newToken);
    
    console.log("✅ AuthContext: token set and user fetch initiated");
  };

  const logout = () => {
    console.log("🔓 AuthContext: logout called");
    
    // Supprimer le cookie de manière sécurisée
    deleteCookie('token');
    
    // Réinitialiser l'état
    setUser(null);
    setToken(null);
    setIsLoading(false);
    
    // Rediriger vers la page de login
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