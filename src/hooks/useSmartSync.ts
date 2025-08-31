'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSync } from '@/lib/sync/SyncContext';
import { useAuth } from '@/lib/auth/AuthContext';
import {
  SyncRecommendation,
  DataFreshnessIndicator,
  SyncOptions
} from '@/types/smart-sync';

/**
 * Hook principal pour la gestion Smart Sync
 */
export function useSmartSync() {
  const { state, checkSyncStatus, startSync, refreshStatus } = useSync();
  const { token } = useAuth();

  // Auto-vérification au montage si token disponible
  useEffect(() => {
    if (token && state.isStale()) {
      checkSyncStatus(token);
    }
  }, [token, checkSyncStatus, state]);

  // Démarrer une sync avec options
  const handleStartSync = useCallback(async (options?: SyncOptions) => {
    if (!token) return null;
    return await startSync(token, options);
  }, [token, startSync]);

  // Rafraîchir le statut
  const handleRefresh = useCallback(async () => {
    if (!token) return;
    await refreshStatus(token);
  }, [token, refreshStatus]);

  return {
    // État
    isLoading: state.isLoading,
    isError: state.isError,
    errorMessage: state.errorMessage,
    isSyncing: state.isSyncing,
    
    // Données
    shouldSync: state.shouldSync,
    enrichedStatus: state.enrichedStatus,
    latestSync: state.latestSync,
    syncProgress: state.syncProgress,
    
    // Actions
    startSync: handleStartSync,
    refreshStatus: handleRefresh,
    
    // Utilitaires
    hasToken: !!token,
    isReady: !!token && !state.isLoading,
  };
}

/**
 * Hook pour les recommandations de synchronisation
 */
export function useSyncRecommendations() {
  const { getSyncRecommendation, shouldShowSyncButton } = useSync();
  const [recommendation, setRecommendation] = useState<SyncRecommendation | null>(null);

  useEffect(() => {
    const rec = getSyncRecommendation();
    setRecommendation(rec);
  }, [getSyncRecommendation]);

  return {
    recommendation,
    shouldShowSyncButton: shouldShowSyncButton(),
    hasRecommendation: !!recommendation,
    isUrgent: recommendation?.type === 'urgent',
    isRecommended: recommendation?.type === 'recommended',
  };
}

/**
 * Hook pour les indicateurs de fraîcheur des données
 */
export function useDataFreshness() {
  const { getDataFreshnessIndicator } = useSync();
  const [indicator, setIndicator] = useState<DataFreshnessIndicator | null>(null);

  useEffect(() => {
    const ind = getDataFreshnessIndicator();
    setIndicator(ind);
  }, [getDataFreshnessIndicator]);

  return {
    indicator,
    hasIndicator: !!indicator,
    isFresh: indicator?.status === 'fresh',
    isStale: indicator?.status === 'stale' || indicator?.status === 'very_stale',
    isEmpty: indicator?.status === 'never',
  };
}

/**
 * Hook pour la synchronisation automatique au login
 */
export function useLoginSync() {
  const { token } = useAuth();
  const { checkSyncStatus } = useSync();
  const [hasChecked, setHasChecked] = useState(false);

  const performLoginCheck = useCallback(async () => {
    if (!token || hasChecked) return;

    try {
      console.log('🔄 Performing login sync check...');
      
      // Vérifier le statut
      await checkSyncStatus(token, true);
      
      // TODO: Implémenter la logique de sync automatique si nécessaire
      // Basé sur le résultat de /login-check endpoint
      
      setHasChecked(true);
    } catch (error) {
      console.error('❌ Error during login sync check:', error);
      setHasChecked(true);
    }
  }, [token, hasChecked, checkSyncStatus]);

  useEffect(() => {
    if (token && !hasChecked) {
      // Attendre un peu avant de déclencher le check pour éviter les appels simultanés
      const timer = setTimeout(() => {
        performLoginCheck();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [token, hasChecked, performLoginCheck]);

  return {
    hasChecked,
    performLoginCheck,
  };
}

/**
 * Hook pour le statut de synchronisation avec polling
 */
export function useSyncPolling(intervalMs: number = 30000) {
  const { token } = useAuth();
  const { checkSyncStatus, state } = useSync();
  const [isPolling, setIsPolling] = useState(false);

  const startPolling = useCallback(() => {
    setIsPolling(true);
  }, []);

  const stopPolling = useCallback(() => {
    setIsPolling(false);
  }, []);

  useEffect(() => {
    if (!isPolling || !token) return;

    const interval = setInterval(() => {
      if (!state.isSyncing) { // Ne pas polluer pendant une sync active
        checkSyncStatus(token, true);
      }
    }, intervalMs);

    return () => clearInterval(interval);
  }, [isPolling, token, intervalMs, checkSyncStatus, state.isSyncing]);

  return {
    isPolling,
    startPolling,
    stopPolling,
  };
}

/**
 * Hook pour les statistiques de synchronisation
 */
export function useSyncStats() {
  const { state } = useSync();

  const stats = {
    totalContacts: state.latestSync?.sync?.total_contacts || 0,
    totalCompanies: state.latestSync?.sync?.total_companies || 0,
    totalDeals: state.latestSync?.sync?.total_deals || 0,
  };

  const totalRecords = stats.totalContacts + stats.totalCompanies + stats.totalDeals;
  const hasData = totalRecords > 0;
  const lastSyncDate = state.latestSync?.sync?.completed_at;

  return {
    stats,
    totalRecords,
    hasData,
    lastSyncDate,
    formatLastSync: () => {
      if (!lastSyncDate) return 'Jamais synchronisé';
      
      const date = new Date(lastSyncDate);
      const now = new Date();
      const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
      
      if (diffHours < 1) return 'Il y a moins d\'une heure';
      if (diffHours < 24) return `Il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`;
      
      const diffDays = Math.floor(diffHours / 24);
      return `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
    }
  };
}

/**
 * Hook pour les actions de synchronisation avec états
 */
export function useSyncActions() {
  const { startSync } = useSmartSync();
  const [actionState, setActionState] = useState<{
    isStarting: boolean;
    error: string | null;
    lastSyncId: number | null;
  }>({
    isStarting: false,
    error: null,
    lastSyncId: null,
  });

  const handleSync = useCallback(async (options?: SyncOptions) => {
    setActionState(prev => ({ ...prev, isStarting: true, error: null }));
    
    try {
      const syncId = await startSync(options);
      setActionState(prev => ({ 
        ...prev, 
        isStarting: false, 
        lastSyncId: syncId,
        error: null 
      }));
      return syncId;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur de synchronisation';
      setActionState(prev => ({ 
        ...prev, 
        isStarting: false, 
        error: errorMessage 
      }));
      return null;
    }
  }, [startSync]);

  const clearError = useCallback(() => {
    setActionState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...actionState,
    handleSync,
    clearError,
  };
}
