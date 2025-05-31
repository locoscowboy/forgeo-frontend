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
    } catch (error) {
      console.error('Failed to fetch user:', error);
      localStorage.removeItem('token');
      setToken(null);
      setIsLoading(false);
    }
  }

  const login = (token: string) => {
    console.log("AuthContext: login appelé avec token");
    
    // Stocker dans localStorage ET cookie
    localStorage.setItem('token', token);
    document.cookie = `token=${token}; path=/; secure; samesite=strict; max-age=86400`;
    
    setToken(token);
    
    // Fetch user data après avoir défini le token
    fetchUser(token);
    
    console.log("AuthContext: état mis à jour - token défini");
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setToken(null);
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