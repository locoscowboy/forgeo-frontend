// Types pour les intégrations HubSpot
import {
  SmartSyncStatus,
  EnrichedSyncStatus,
  LoginSyncCheck,
  LatestSyncResponse,
  HubspotSyncData,
  AirbyteSyncJobResponse,
  AirbyteSyncJobStatus,
  AirbyteSyncHistoryItem,
  AirbyteConnectionInfo
} from '@/types/smart-sync';

export interface HubSpotAccount {
  id?: number;
  user_id: number;
  portal_id: string;
  access_token: string;
  refresh_token: string;
  expires_at: string;
  hub_domain: string;
  hub_id: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

// Interface pour le token backend
export interface HubSpotToken {
  id: number;
  user_id: number;
  access_token: string;
  refresh_token: string;
  expires_at: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface HubSpotConnectionStatus {
  isConnected: boolean;
  accountInfo?: {
    portalId: string;
    domain: string;
    timeZone: string;
    currency: string;
    subscription: string;
  };
  lastSync?: string;
  syncStatus: 'idle' | 'syncing' | 'success' | 'error';
  dataStats?: {
    contacts: number;
    companies: number;
    deals: number;
  };
}

export interface HubSpotAuthResponse {
  auth_url: string;
}

export interface HubSpotSyncResponse {
  id: number;
  user_id: number;
  status: string;
  total_contacts?: number;
  total_companies?: number;
  total_deals?: number;
  created_at: string;
  completed_at?: string;
}

export interface APIError {
  detail?: string;
  message?: string;
  status?: number;
}

// Configuration de l'API
const API_BASE = 'https://forgeo.store';

// Utilitaire pour les appels API
async function apiCall<T>(
  endpoint: string, 
  options: RequestInit = {},
  token?: string
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw {
      status: response.status,
      message: errorData.detail || errorData.message || `HTTP ${response.status}`,
      detail: errorData.detail
    } as APIError;
  }

  return response.json();
}

// Fonctions pour les intégrations HubSpot

/**
 * Obtenir l'URL d'autorisation HubSpot
 */
export async function getHubSpotAuthUrl(token: string): Promise<{ auth_url: string }> {
  return apiCall<HubSpotAuthResponse>('/api/v1/hubspot/auth', {
    method: 'GET',
  }, token);
}

/**
 * Échanger le code d'autorisation contre un token d'accès
 * Note: Le backend utilise GET avec query params au lieu de POST avec body
 */
export async function exchangeHubSpotCode(
  code: string, 
  token: string
): Promise<{ message: string }> {
  // Le backend utilise un GET avec query param et redirige automatiquement
  // On simule juste un succès ici puisque la redirection se fait côté backend
  return apiCall<{ message: string }>(`/api/v1/hubspot/callback?code=${code}`, {
    method: 'GET',
  }, token);
}

/**
 * Obtenir le statut de connexion HubSpot
 */
export async function getHubSpotStatus(token: string): Promise<HubSpotConnectionStatus> {
  try {
    const tokenData = await apiCall<HubSpotToken>('/api/v1/hubspot/token', {
      method: 'GET',
    }, token);

    // Si on a un token actif, récupérer les statistiques des données
    if (tokenData && tokenData.is_active) {
      try {
        const dataStats = await getHubSpotDataStats(token);
        
        // Vérifier si on a vraiment des données ou si c'est juste un token vide
        const hasRealData = dataStats && (
          (dataStats.contacts && dataStats.contacts > 0) ||
          (dataStats.companies && dataStats.companies > 0) ||
          (dataStats.deals && dataStats.deals > 0)
        );

        return {
          isConnected: true,
          dataStats,
          syncStatus: hasRealData ? 'success' : 'idle',
          lastSync: tokenData.updated_at || tokenData.created_at
        };
      } catch (statsError) {
        // Si on ne peut pas récupérer les stats, on considère que la connexion n'est pas complète
        console.warn('Impossible de récupérer les statistiques HubSpot:', statsError);
        return {
          isConnected: true,
          syncStatus: 'idle',
          lastSync: tokenData.updated_at || tokenData.created_at,
          dataStats: {
            contacts: 0,
            companies: 0,
            deals: 0
          }
        };
      }
    }

    return {
      isConnected: false,
      syncStatus: 'idle'
    };
  } catch (error) {
    // Si l'erreur est 404, l'utilisateur n'a pas de token HubSpot
    if ((error as APIError).status === 404) {
      return {
        isConnected: false,
        syncStatus: 'idle'
      };
    }
    
    console.error('Erreur lors de la vérification du statut HubSpot:', error);
    return {
      isConnected: false,
      syncStatus: 'error'
    };
  }
}

/**
 * Obtenir les statistiques des données HubSpot depuis la dernière synchronisation
 */
export async function getHubSpotDataStats(token: string): Promise<HubSpotConnectionStatus['dataStats']> {
  try {
    // Essayer d'abord l'historique Airbyte pour les stats
    const history = await getAirbyteSyncHistory(token).catch(() => null);
    
    if (history && history.length > 0) {
      // Prendre le dernier job réussi
      const successfulJob = history.find(job => job.status === 'succeeded');
      if (successfulJob && successfulJob.rows_synced) {
        // Airbyte ne donne pas le détail par type, on estime
        const totalRows = successfulJob.rows_synced;
        return {
          contacts: Math.floor(totalRows * 0.6), // Estimation
          companies: Math.floor(totalRows * 0.25),
          deals: Math.floor(totalRows * 0.15)
        };
      }
    }

    // Fallback: Récupérer la dernière synchronisation ancienne méthode
    const latestSync = await apiCall<HubSpotSyncResponse>('/api/v1/hubspot-sync/latest', {
      method: 'GET',
    }, token);

    // Vérifier qu'on a une synchronisation complétée avec des données réelles
    if (!latestSync || latestSync.status !== 'completed') {
      throw new Error('Aucune synchronisation complétée trouvée');
    }

    // Vérifier qu'il y a au moins quelques données
    const totalData = (latestSync.total_contacts || 0) + 
                      (latestSync.total_companies || 0) + 
                      (latestSync.total_deals || 0);

    if (totalData === 0) {
      throw new Error('Aucune donnée synchronisée');
    }

    return {
      contacts: latestSync.total_contacts || 0,
      companies: latestSync.total_companies || 0,
      deals: latestSync.total_deals || 0
    };
  } catch (error) {
    console.warn('Aucune donnée synchronisée disponible:', error);
    throw error; // On laisse l'erreur remonter pour que getHubSpotStatus puisse la gérer
  }
}

/**
 * Lancer une synchronisation HubSpot via Airbyte
 * Utilise le nouvel endpoint /sync/trigger
 */
export async function syncHubSpotData(token: string): Promise<{ sync_id: number; status: string }> {
  try {
    // Essayer d'abord le nouvel endpoint Airbyte
    const airbyteResponse = await triggerAirbyteSync(token);
    
    // Transformer la réponse pour compatibilité avec l'ancien format
    return {
      sync_id: parseInt(airbyteResponse.job_id) || Date.now(), // job_id est une string, on la convertit
      status: airbyteResponse.status === 'running' ? 'in_progress' : airbyteResponse.status
    };
  } catch (airbyteError) {
    console.warn('Erreur Airbyte sync, fallback vers ancien endpoint:', airbyteError);
    
    // Fallback vers l'ancien endpoint
    const response = await apiCall<HubSpotSyncResponse>('/api/v1/hubspot-sync', {
      method: 'POST',
    }, token);

    return {
      sync_id: response.id,
      status: response.status
    };
  }
}

/**
 * Obtenir le statut d'une synchronisation
 * Supporte les deux formats (ancien ID numérique et nouveau job_id string)
 */
export async function getSyncStatus(syncId: number | string, token: string): Promise<{ status: string; progress?: number }> {
  try {
    // Essayer d'abord le nouvel endpoint Airbyte
    const airbyteStatus = await getAirbyteSyncStatus(String(syncId), token);
    
    // Mapper le status Airbyte vers l'ancien format
    let mappedStatus = 'in_progress';
    let progress = 50;
    
    switch (airbyteStatus.status) {
      case 'succeeded':
        mappedStatus = 'completed';
        progress = 100;
        break;
      case 'failed':
      case 'cancelled':
        mappedStatus = 'failed';
        progress = 0;
        break;
      case 'running':
        mappedStatus = 'in_progress';
        progress = 50;
        break;
      case 'pending':
        mappedStatus = 'in_progress';
        progress = 10;
        break;
      default:
        mappedStatus = 'in_progress';
        progress = 25;
    }
    
    return { status: mappedStatus, progress };
  } catch (airbyteError) {
    console.warn('Erreur Airbyte status, fallback vers ancien endpoint:', airbyteError);
    
    // Fallback vers l'ancien endpoint
    const response = await apiCall<HubSpotSyncResponse>(`/api/v1/hubspot-sync/${syncId}`, {
      method: 'GET',
    }, token);

    return {
      status: response.status,
      progress: response.status === 'completed' ? 100 : response.status === 'in_progress' ? 50 : 0
    };
  }
}

/**
 * Déconnecter le compte HubSpot
 */
export async function disconnectHubSpot(token: string): Promise<{ message: string }> {
  return apiCall<{ message: string }>('/api/v1/hubspot/disconnect', {
    method: 'DELETE',
  }, token);
}

/**
 * Rafraîchir le token d'accès HubSpot
 * Note: Le backend gère automatiquement le refresh dans l'endpoint /token
 */
export async function refreshHubSpotToken(token: string): Promise<HubSpotToken> {
  return apiCall<HubSpotToken>('/api/v1/hubspot/token', {
    method: 'GET',
  }, token);
}

// ========================================
// ENDPOINTS AIRBYTE SYNC (NOUVEAUX)
// ========================================

/**
 * Déclencher une synchronisation via Airbyte
 * POST /api/v1/sync/trigger
 */
export async function triggerAirbyteSync(token: string): Promise<AirbyteSyncJobResponse> {
  return apiCall<AirbyteSyncJobResponse>('/api/v1/sync/trigger', {
    method: 'POST',
  }, token);
}

/**
 * Obtenir le statut d'un job de synchronisation Airbyte
 * GET /api/v1/sync/status/{job_id}
 */
export async function getAirbyteSyncStatus(jobId: string, token: string): Promise<AirbyteSyncJobStatus> {
  return apiCall<AirbyteSyncJobStatus>(`/api/v1/sync/status/${jobId}`, {
    method: 'GET',
  }, token);
}

/**
 * Obtenir l'historique des synchronisations Airbyte
 * GET /api/v1/sync/history
 */
export async function getAirbyteSyncHistory(token: string): Promise<AirbyteSyncHistoryItem[]> {
  return apiCall<AirbyteSyncHistoryItem[]>('/api/v1/sync/history', {
    method: 'GET',
  }, token);
}

/**
 * Obtenir les informations de connexion Airbyte
 * GET /api/v1/sync/connection-info
 */
export async function getAirbyteConnectionInfo(token: string): Promise<AirbyteConnectionInfo> {
  return apiCall<AirbyteConnectionInfo>('/api/v1/sync/connection-info', {
    method: 'GET',
  }, token);
}

// ========================================
// ENDPOINTS SMART SYNC (EXISTANTS)
// ========================================

/**
 * Vérifier si une synchronisation est recommandée (endpoint Smart Sync)
 */
export async function getShouldSync(token: string): Promise<SmartSyncStatus> {
  return apiCall<SmartSyncStatus>('/api/v1/hubspot-sync/should-sync', {
    method: 'GET',
  }, token);
}

/**
 * Obtenir le statut enrichi de synchronisation avec recommandations
 */
export async function getEnrichedSyncStatus(token: string): Promise<EnrichedSyncStatus> {
  return apiCall<EnrichedSyncStatus>('/api/v1/hubspot-sync/status', {
    method: 'GET',
  }, token);
}

/**
 * Vérifier si une synchronisation est nécessaire au login
 */
export async function getLoginSyncCheck(token: string): Promise<LoginSyncCheck> {
  return apiCall<LoginSyncCheck>('/api/v1/hubspot-sync/login-check', {
    method: 'GET',
  }, token);
}

/**
 * Obtenir la dernière synchronisation avec informations enrichies
 */
export async function getLatestSyncEnriched(token: string): Promise<LatestSyncResponse> {
  return apiCall<LatestSyncResponse>('/api/v1/hubspot-sync/latest', {
    method: 'GET',
  }, token);
}

/**
 * Obtenir une synchronisation spécifique par ID
 */
export async function getSyncById(syncId: number, token: string): Promise<HubspotSyncData> {
  return apiCall<HubspotSyncData>(`/api/v1/hubspot-sync/${syncId}`, {
    method: 'GET',
  }, token);
}

/**
 * Obtenir l'historique des synchronisations (ancien format)
 */
export async function getSyncHistory(
  token: string,
  skip: number = 0,
  limit: number = 100
): Promise<HubspotSyncData[]> {
  return apiCall<HubspotSyncData[]>(`/api/v1/hubspot-sync?skip=${skip}&limit=${limit}`, {
    method: 'GET',
  }, token);
}
