'use client';

import React, { createContext, useContext, useCallback, useReducer, useRef } from 'react';
import {
  SmartSyncStatus,
  EnrichedSyncStatus,
  LatestSyncResponse,
  SyncRecommendation,
  DataFreshnessIndicator,
  SyncProgress,
  SyncOptions
} from '@/types/smart-sync';
import {
  getShouldSync,
  getEnrichedSyncStatus,
  getLatestSyncEnriched,
  syncHubSpotData,
  getSyncStatus,
  getAirbyteSyncHistory
} from '@/lib/api/integrations';

// Types pour le contexte
interface SyncState {
  // États de synchronisation
  isLoading: boolean;
  isError: boolean;
  errorMessage: string | null;
  
  // Données Smart Sync
  shouldSync: SmartSyncStatus | null;
  enrichedStatus: EnrichedSyncStatus | null;
  latestSync: LatestSyncResponse | null;
  
  // État de synchronisation en cours
  isSyncing: boolean;
  currentSyncId: number | string | null; // Supporte maintenant string pour job_id Airbyte
  syncProgress: SyncProgress | null;
  
  // Recommandations
  recommendation: SyncRecommendation | null;
  freshnessIndicator: DataFreshnessIndicator | null;
  
  // Timestamps pour cache
  lastCheck: number | null;
  cacheValidUntil: number | null;
}

type SyncAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SHOULD_SYNC'; payload: SmartSyncStatus }
  | { type: 'SET_ENRICHED_STATUS'; payload: EnrichedSyncStatus }
  | { type: 'SET_LATEST_SYNC'; payload: LatestSyncResponse }
  | { type: 'SET_SYNCING'; payload: { isSyncing: boolean; syncId?: number | string } }
  | { type: 'SET_SYNC_PROGRESS'; payload: SyncProgress | null }
  | { type: 'SET_RECOMMENDATION'; payload: SyncRecommendation | null }
  | { type: 'SET_FRESHNESS_INDICATOR'; payload: DataFreshnessIndicator | null }
  | { type: 'RESET_STATE' }
  | { type: 'UPDATE_CACHE'; payload: { lastCheck: number; validUntil: number } };

interface SyncContextType {
  // État
  state: SyncState;
  
  // Actions principales
  checkSyncStatus: (token: string, force?: boolean) => Promise<void>;
  startSync: (token: string, options?: SyncOptions) => Promise<number | string | null>;
  refreshStatus: (token: string) => Promise<void>;
  
  // Utilitaires
  getSyncRecommendation: () => SyncRecommendation | null;
  getDataFreshnessIndicator: () => DataFreshnessIndicator | null;
  shouldShowSyncButton: () => boolean;
  
  // Gestion du cache
  clearCache: () => void;
  isStale: () => boolean;
}

const initialState: SyncState = {
  isLoading: false,
  isError: false,
  errorMessage: null,
  shouldSync: null,
  enrichedStatus: null,
  latestSync: null,
  isSyncing: false,
  currentSyncId: null,
  syncProgress: null,
  recommendation: null,
  freshnessIndicator: null,
  lastCheck: null,
  cacheValidUntil: null,
};

function syncReducer(state: SyncState, action: SyncAction): SyncState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, isError: !!action.payload, errorMessage: action.payload };
    case 'SET_SHOULD_SYNC':
      return { ...state, shouldSync: action.payload };
    case 'SET_ENRICHED_STATUS':
      return { ...state, enrichedStatus: action.payload };
    case 'SET_LATEST_SYNC':
      return { ...state, latestSync: action.payload };
    case 'SET_SYNCING':
      return { 
        ...state, 
        isSyncing: action.payload.isSyncing,
        currentSyncId: action.payload.syncId ?? null
      };
    case 'SET_SYNC_PROGRESS':
      return { ...state, syncProgress: action.payload };
    case 'SET_RECOMMENDATION':
      return { ...state, recommendation: action.payload };
    case 'SET_FRESHNESS_INDICATOR':
      return { ...state, freshnessIndicator: action.payload };
    case 'RESET_STATE':
      return initialState;
    case 'UPDATE_CACHE':
      return {
        ...state,
        lastCheck: action.payload.lastCheck,
        cacheValidUntil: action.payload.validUntil
      };
    default:
      return state;
  }
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(syncReducer, initialState);
  const isSyncingRef = useRef(false);

  // Cache de 2 minutes pour éviter les appels répétés
  const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

  const isStale = useCallback(() => {
    if (!state.cacheValidUntil) return true;
    return Date.now() > state.cacheValidUntil;
  }, [state.cacheValidUntil]);

  const clearCache = useCallback(() => {
    dispatch({ type: 'UPDATE_CACHE', payload: { lastCheck: 0, validUntil: 0 } });
  }, []);

  // Vérifier le statut de synchronisation
  const checkSyncStatus = useCallback(async (token: string, force = false) => {
    if (!force && !isStale()) {
      console.log('📦 Using cached sync status');
      return;
    }

    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      console.log('🔄 Checking sync status...');
      
      // Récupérer toutes les données en parallèle
      // On utilise Promise.allSettled pour ne pas bloquer si un endpoint échoue
      const results = await Promise.allSettled([
        getShouldSync(token),
        getEnrichedSyncStatus(token),
        getLatestSyncEnriched(token)
      ]);

      // Traiter les résultats
      if (results[0].status === 'fulfilled') {
        dispatch({ type: 'SET_SHOULD_SYNC', payload: results[0].value });
      }
      if (results[1].status === 'fulfilled') {
        dispatch({ type: 'SET_ENRICHED_STATUS', payload: results[1].value });
      }
      if (results[2].status === 'fulfilled') {
        dispatch({ type: 'SET_LATEST_SYNC', payload: results[2].value });
      }

      // Mettre à jour le cache
      const now = Date.now();
      dispatch({ 
        type: 'UPDATE_CACHE', 
        payload: { 
          lastCheck: now, 
          validUntil: now + CACHE_DURATION 
        }
      });

      console.log('✅ Sync status updated');
    } catch (error) {
      console.error('❌ Error checking sync status:', error);
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error instanceof Error ? error.message : 'Erreur lors de la vérification du statut'
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [isStale, CACHE_DURATION]);

  // Démarrer une synchronisation
  const startSync = useCallback(async (token: string, options: SyncOptions = { trigger: 'manual' }) => {
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      console.log('🚀 Starting sync...', options);
      
      // Déclencher la synchronisation (utilise maintenant Airbyte en priorité)
      const syncResponse = await syncHubSpotData(token);
      const syncId = syncResponse.sync_id;

      dispatch({ type: 'SET_SYNCING', payload: { isSyncing: true, syncId } });
      isSyncingRef.current = true;

      // Progress initial
      dispatch({ 
        type: 'SET_SYNC_PROGRESS', 
        payload: { 
          contacts: 0, 
          companies: 0, 
          deals: 0, 
          total: 0, 
          isComplete: false, 
          percentage: 10 
        }
      });

      // Polling pour vérifier le statut
      const pollInterval = setInterval(async () => {
        try {
          // Utiliser getSyncStatus qui supporte maintenant les deux formats
          const statusData = await getSyncStatus(syncId, token);
          
          console.log('📊 Sync status poll:', statusData);

          if (statusData.status === 'completed') {
            clearInterval(pollInterval);
            isSyncingRef.current = false;
            dispatch({ type: 'SET_SYNCING', payload: { isSyncing: false } });
            
            // Essayer de récupérer les stats depuis l'historique Airbyte
            try {
              const history = await getAirbyteSyncHistory(token);
              const latestJob = history.find(job => job.status === 'succeeded');
              const rowsSynced = latestJob?.rows_synced || 0;
              
              dispatch({ 
                type: 'SET_SYNC_PROGRESS', 
                payload: {
                  contacts: Math.floor(rowsSynced * 0.6),
                  companies: Math.floor(rowsSynced * 0.25),
                  deals: Math.floor(rowsSynced * 0.15),
                  total: rowsSynced,
                  isComplete: true,
                  percentage: 100
                }
              });
            } catch {
              dispatch({ 
                type: 'SET_SYNC_PROGRESS', 
                payload: {
                  contacts: 0,
                  companies: 0,
                  deals: 0,
                  total: 0,
                  isComplete: true,
                  percentage: 100
                }
              });
            }
            
            // Rafraîchir le statut après synchronisation
            await checkSyncStatus(token, true);
            console.log('✅ Sync completed successfully');
            
          } else if (statusData.status === 'failed') {
            clearInterval(pollInterval);
            isSyncingRef.current = false;
            dispatch({ type: 'SET_SYNCING', payload: { isSyncing: false } });
            dispatch({ type: 'SET_ERROR', payload: 'La synchronisation a échoué' });
            
          } else {
            // Sync en cours, mettre à jour le progress estimé
            const progress = statusData.progress || 50;
            dispatch({ 
              type: 'SET_SYNC_PROGRESS', 
              payload: { 
                contacts: 0, 
                companies: 0, 
                deals: 0, 
                total: 0, 
                isComplete: false, 
                percentage: progress 
              }
            });
          }
        } catch (error) {
          console.error('Error polling sync status:', error);
          clearInterval(pollInterval);
          isSyncingRef.current = false;
          dispatch({ type: 'SET_SYNCING', payload: { isSyncing: false } });
          dispatch({ type: 'SET_ERROR', payload: 'Erreur lors du suivi de la synchronisation' });
        }
      }, 3000); // Poll toutes les 3 secondes (Airbyte peut être plus lent)

      // Timeout de sécurité (10 minutes max pour Airbyte)
      setTimeout(() => {
        clearInterval(pollInterval);
        if (isSyncingRef.current) {
          isSyncingRef.current = false;
          dispatch({ type: 'SET_SYNCING', payload: { isSyncing: false } });
          dispatch({ type: 'SET_ERROR', payload: 'Timeout de synchronisation' });
        }
      }, 10 * 60 * 1000);

      return syncId;
    } catch (error) {
      console.error('❌ Error starting sync:', error);
      isSyncingRef.current = false;
      dispatch({ type: 'SET_SYNCING', payload: { isSyncing: false } });
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error instanceof Error ? error.message : 'Erreur lors du démarrage de la synchronisation'
      });
      return null;
    }
  }, [checkSyncStatus]);

  // Rafraîchir le statut
  const refreshStatus = useCallback(async (token: string) => {
    await checkSyncStatus(token, true);
  }, [checkSyncStatus]);

  // Obtenir la recommendation
  const getSyncRecommendation = useCallback((): SyncRecommendation | null => {
    if (!state.shouldSync || !state.enrichedStatus) return null;

    const { should_sync, data_quality, auto_sync_recommended } = state.shouldSync;
    const { recommendation } = state.enrichedStatus;

    if (!should_sync) {
      return {
        type: 'none',
        message: 'Vos données sont à jour',
        action: 'no_action',
        priority: 'low'
      };
    }

    if (data_quality === 'stale' || auto_sync_recommended) {
      return {
        type: 'recommended',
        message: recommendation,
        action: 'sync_recommended',
        priority: 'medium'
      };
    }

    if (data_quality === 'none') {
      return {
        type: 'urgent',
        message: 'Première synchronisation requise',
        action: 'sync_required',
        priority: 'high'
      };
    }

    return {
      type: 'optional',
      message: 'Synchronisation disponible',
      action: 'sync_available',
      priority: 'low'
    };
  }, [state.shouldSync, state.enrichedStatus]);

  // Obtenir l'indicateur de fraîcheur
  const getDataFreshnessIndicator = useCallback((): DataFreshnessIndicator | null => {
    if (!state.latestSync) return null;

    const { data_freshness } = state.latestSync;

    switch (data_freshness) {
      case 'fresh':
        return {
          status: 'fresh',
          color: 'green',
          text: 'Données fraîches',
          icon: 'check'
        };
      case 'acceptable':
        return {
          status: 'acceptable',
          color: 'yellow',
          text: 'Données acceptables',
          icon: 'clock'
        };
      case 'stale':
        return {
          status: 'stale',
          color: 'orange',
          text: 'Données obsolètes',
          icon: 'alert'
        };
      case 'very_stale':
        return {
          status: 'very_stale',
          color: 'red',
          text: 'Données très obsolètes',
          icon: 'x'
        };
      case 'never':
        return {
          status: 'never',
          color: 'gray',
          text: 'Aucune donnée',
          icon: 'help'
        };
      default:
        return null;
    }
  }, [state.latestSync]);

  // Déterminer si le bouton sync doit être affiché
  const shouldShowSyncButton = useCallback(() => {
    return state.shouldSync?.should_sync || false;
  }, [state.shouldSync]);

  const contextValue: SyncContextType = {
    state,
    checkSyncStatus,
    startSync,
    refreshStatus,
    getSyncRecommendation,
    getDataFreshnessIndicator,
    shouldShowSyncButton,
    clearCache,
    isStale,
  };

  return (
    <SyncContext.Provider value={contextValue}>
      {children}
    </SyncContext.Provider>
  );
}

export function useSync(): SyncContextType {
  const context = useContext(SyncContext);
  if (context === undefined) {
    throw new Error('useSync must be used within a SyncProvider');
  }
  return context;
}
