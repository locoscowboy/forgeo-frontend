'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, User } from '../api/auth';
import { getHubSpotStatus, HubSpotConnectionStatus, getLoginSyncCheck } from '../api/integrations';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  needsOnboarding: boolean;
  onboardingStep: 'selection' | 'connecting' | 'syncing' | 'completed';
  hubspotStatus: HubSpotConnectionStatus | null;
  login: (token: string) => void;
  logout: () => void;
  checkOnboardingStatus: () => Promise<void>;
  setOnboardingStep: (step: 'selection' | 'connecting' | 'syncing' | 'completed') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState<'selection' | 'connecting' | 'syncing' | 'completed'>('selection');
  const [hubspotStatus, setHubspotStatus] = useState<HubSpotConnectionStatus | null>(null);
  const router = useRouter();

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

  const checkOnboardingStatus = useCallback(async () => {
    if (!token) return;
    
    try {
      console.log('🔄 Checking onboarding status...');
      
      // Récupérer le statut HubSpot (connexion + données)
      const hubspotStatusResult = await getHubSpotStatus(token);
      setHubspotStatus(hubspotStatusResult);
      
      // Vérifier si HubSpot est connecté
      const hasConnection = hubspotStatusResult.isConnected;
      
      // Vérifier si on a des données (via dataStats ou via loginSyncCheck)
      let hasData = hubspotStatusResult.dataStats && (
        (hubspotStatusResult.dataStats.contacts || 0) > 0 ||
        (hubspotStatusResult.dataStats.companies || 0) > 0 ||
        (hubspotStatusResult.dataStats.deals || 0) > 0
      );

      // Si pas de données via dataStats, essayer getLoginSyncCheck
      if (!hasData && hasConnection) {
        try {
          const loginSyncCheck = await getLoginSyncCheck(token);
          hasData = loginSyncCheck.has_data;
        } catch (e) {
          console.warn('getLoginSyncCheck échoué, utilisation des dataStats:', e);
        }
      }
      
      const needsOnboardingNow = !hasConnection;
      setNeedsOnboarding(needsOnboardingNow);
      
      // Définir l'étape d'onboarding
      if (!hasConnection) {
        setOnboardingStep('selection');
        console.log('📝 Onboarding: Connexion CRM requise');
      } else if (!hasData) {
        // Connecté mais pas de données - proposer sync mais ne pas bloquer
        setOnboardingStep('syncing');
        console.log('🔄 Onboarding: Synchronisation suggérée (mais pas bloquante)');
        // Ne pas bloquer l'utilisateur s'il a déjà connecté HubSpot
        setNeedsOnboarding(false);
      } else {
        setOnboardingStep('completed');
        console.log('✅ Onboarding: Terminé');
      }
      
    } catch (error) {
      console.error('❌ Erreur lors de la vérification du statut d\'onboarding:', error);
      // En cas d'erreur, NE PAS bloquer l'utilisateur
      setNeedsOnboarding(false);
      setOnboardingStep('completed');
    }
  }, [token]);

  useEffect(() => {
    async function fetchUser(authToken: string) {
      console.log('🔄 Fetching user data with token...');
      try {
        const userData = await getCurrentUser(authToken);
        console.log('✅ User data fetched successfully:', userData);
        setUser(userData);
        
        // Vérifier le statut d'onboarding après avoir récupéré l'utilisateur
        await checkOnboardingStatus();
        
        setIsLoading(false);
      } catch (error) {
        console.error('❌ Failed to fetch user:', error);
        deleteCookie('token');
        setToken(null);
        setUser(null);
        setIsLoading(false);
      }
    }

    const storedToken = getCookieValue('token');
    if (storedToken) {
      setToken(storedToken);
      fetchUser(storedToken);
    } else {
      setIsLoading(false);
    }
  }, [checkOnboardingStatus]);

  const login = (newToken: string) => {
    console.log("🔐 AuthContext: login called with token");
    
    document.cookie = `token=${newToken}; path=/; secure; samesite=strict; max-age=86400`;
    
    setToken(newToken);
    
    async function fetchUserAfterLogin(authToken: string) {
      try {
        const userData = await getCurrentUser(authToken);
        setUser(userData);
        
        // Vérifier le statut d'onboarding après connexion
        await checkOnboardingStatus();
        
        setIsLoading(false);
      } catch (error) {
        console.error('❌ Failed to fetch user after login:', error);
        deleteCookie('token');
        setToken(null);
        setUser(null);
        setIsLoading(false);
      }
    }
    
    fetchUserAfterLogin(newToken);
    console.log("✅ AuthContext: token set and user fetch initiated");
  };

  const logout = () => {
    console.log("🔓 AuthContext: logout called");
    
    deleteCookie('token');
    
    setUser(null);
    setToken(null);
    setIsLoading(false);
    
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      isLoading, 
      needsOnboarding,
      onboardingStep,
      hubspotStatus,
      login, 
      logout,
      checkOnboardingStatus,
      setOnboardingStep
    }}>
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
