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
 * Utilise uniquement les nouveaux endpoints Airbyte
 */
export async function getHubSpotDataStats(token: string): Promise<HubSpotConnectionStatus['dataStats']> {
  try {
    // Utiliser l'historique Airbyte pour les stats
    const history = await getAirbyteSyncHistory(token);
    
    if (history && history.length > 0) {
      // Prendre le dernier job réussi
      const successfulJob = history.find(job => job.status === 'succeeded');
      if (successfulJob && successfulJob.rows_synced) {
        // Airbyte ne donne pas le détail par type, on estime
        const totalRows = successfulJob.rows_synced;
        return {
          contacts: Math.floor(totalRows * 0.6), // Estimation: 60% contacts
          companies: Math.floor(totalRows * 0.25), // 25% companies
          deals: Math.floor(totalRows * 0.15) // 15% deals
        };
      }
    }

    // Si aucun job réussi, retourner 0
    return {
      contacts: 0,
      companies: 0,
      deals: 0
    };
  } catch (error) {
    console.warn('Impossible de récupérer les statistiques:', error);
    // Retourner 0 au lieu de throw pour ne pas bloquer
    return {
      contacts: 0,
      companies: 0,
      deals: 0
    };
  }
}

/**
 * Lancer une synchronisation HubSpot via Airbyte
 * Utilise le nouvel endpoint /sync/trigger
 */
export async function syncHubSpotData(token: string): Promise<{ sync_id: number; status: string }> {
  const airbyteResponse = await triggerAirbyteSync(token);
  
  // Transformer la réponse pour compatibilité avec l'ancien format
  return {
    sync_id: parseInt(airbyteResponse.job_id) || Date.now(), // job_id est une string, on la convertit
    status: airbyteResponse.status === 'running' ? 'in_progress' : airbyteResponse.status
  };
}

/**
 * Obtenir le statut d'une synchronisation
 * Utilise le nouvel endpoint Airbyte
 */
export async function getSyncStatus(syncId: number | string, token: string): Promise<{ status: string; progress?: number }> {
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
// ENDPOINTS SMART SYNC (ADAPTÉS POUR AIRBYTE)
// ========================================

/**
 * Vérifier si une synchronisation est recommandée
 * Adapté pour utiliser l'historique Airbyte
 */
export async function getShouldSync(token: string): Promise<SmartSyncStatus> {
  try {
    const history = await getAirbyteSyncHistory(token);
    
    // Si pas d'historique, recommander une sync
    if (!history || history.length === 0) {
      return {
        should_sync: true,
        reason: 'no_previous_sync',
        last_sync_ago_hours: null,
        data_quality: 'none',
        auto_sync_recommended: true
      };
    }

    // Trouver la dernière sync réussie
    const lastSuccessful = history.find(job => job.status === 'succeeded');
    
    if (!lastSuccessful || !lastSuccessful.started_at) {
      return {
        should_sync: true,
        reason: 'no_successful_sync',
        last_sync_ago_hours: null,
        data_quality: 'none',
        auto_sync_recommended: true
      };
    }

    // Calculer le temps depuis la dernière sync
    const lastSyncDate = new Date(lastSuccessful.started_at);
    const hoursSinceLastSync = (Date.now() - lastSyncDate.getTime()) / (1000 * 60 * 60);

    // Déterminer la qualité des données
    let dataQuality: 'none' | 'fresh' | 'acceptable' | 'stale' = 'fresh';
    if (hoursSinceLastSync > 72) dataQuality = 'stale';
    else if (hoursSinceLastSync > 24) dataQuality = 'acceptable';

    // Recommander une sync si > 24h
    return {
      should_sync: hoursSinceLastSync > 24,
      reason: hoursSinceLastSync > 24 ? 'stale_data' : 'recent_sync',
      last_sync_ago_hours: Math.floor(hoursSinceLastSync),
      data_quality: dataQuality,
      auto_sync_recommended: hoursSinceLastSync > 72
    };
  } catch (error) {
    console.warn('Erreur getShouldSync:', error);
    // En cas d'erreur, ne pas bloquer et ne pas recommander de sync
    return {
      should_sync: false,
      reason: 'error',
      last_sync_ago_hours: null,
      data_quality: 'none',
      auto_sync_recommended: false
    };
  }
}

/**
 * Obtenir le statut enrichi de synchronisation avec recommandations
 * Adapté pour utiliser l'historique Airbyte
 */
export async function getEnrichedSyncStatus(token: string): Promise<EnrichedSyncStatus> {
  try {
    const history = await getAirbyteSyncHistory(token);
    const shouldSync = await getShouldSync(token);
    
    if (!history || history.length === 0) {
      return {
        needs_sync: true,
        reason: 'no_previous_sync',
        last_sync: null,
        data_freshness: 'never',
        hours_since_sync: null,
        recommendation: 'Aucune synchronisation effectuée'
      };
    }

    const latest = history[0];
    const lastSyncData = latest.started_at;
    const hoursSinceSync = lastSyncData ? (Date.now() - new Date(lastSyncData).getTime()) / (1000 * 60 * 60) : null;
    
    let dataFreshness: 'never' | 'fresh' | 'acceptable' | 'stale' | 'very_stale' = 'fresh';
    if (!lastSyncData) dataFreshness = 'never';
    else if (hoursSinceSync && hoursSinceSync > 168) dataFreshness = 'very_stale';
    else if (hoursSinceSync && hoursSinceSync > 72) dataFreshness = 'stale';
    else if (hoursSinceSync && hoursSinceSync > 24) dataFreshness = 'acceptable';
    
    return {
      needs_sync: shouldSync.should_sync,
      reason: shouldSync.reason,
      last_sync: null, // On ne retourne pas les détails complets
      data_freshness: dataFreshness,
      hours_since_sync: hoursSinceSync ? Math.floor(hoursSinceSync) : null,
      recommendation: shouldSync.should_sync ? 'Synchronisation recommandée' : 'Données à jour'
    };
  } catch (error) {
    console.warn('Erreur getEnrichedSyncStatus:', error);
    return {
      needs_sync: false,
      reason: 'error',
      last_sync: null,
      data_freshness: 'never',
      hours_since_sync: null,
      recommendation: 'Statut indisponible'
    };
  }
}

/**
 * Vérifier si une synchronisation est nécessaire au login
 * Adapté pour utiliser l'historique Airbyte
 */
export async function getLoginSyncCheck(token: string): Promise<LoginSyncCheck> {
  try {
    const history = await getAirbyteSyncHistory(token);
    const shouldSync = await getShouldSync(token);
    
    const hasData = history && history.length > 0 && history.some(job => job.status === 'succeeded');
    
    return {
      should_sync_on_login: shouldSync.auto_sync_recommended,
      has_data: hasData,
      last_sync: null // On ne retourne pas les détails complets
    };
  } catch (error) {
    console.warn('Erreur getLoginSyncCheck:', error);
    return {
      should_sync_on_login: false,
      has_data: false,
      last_sync: null
    };
  }
}

/**
 * Obtenir la dernière synchronisation avec informations enrichies
 * Adapté pour utiliser l'historique Airbyte
 */
export async function getLatestSyncEnriched(token: string): Promise<LatestSyncResponse> {
  try {
    const history = await getAirbyteSyncHistory(token);
    const shouldSync = await getShouldSync(token);
    
    if (!history || history.length === 0) {
      return {
        sync: null,
        has_data: false,
        needs_sync: true,
        reason: 'no_previous_sync',
        data_freshness: 'never',
        hours_since_sync: null,
        recommendation: 'Aucune synchronisation effectuée'
      };
    }

    const latest = history[0];
    const hasData = history.some(job => job.status === 'succeeded' && job.rows_synced && job.rows_synced > 0);
    const hoursSinceSync = latest.started_at ? (Date.now() - new Date(latest.started_at).getTime()) / (1000 * 60 * 60) : null;
    
    let dataFreshness: 'never' | 'fresh' | 'acceptable' | 'stale' | 'very_stale' = 'fresh';
    if (!latest.started_at) dataFreshness = 'never';
    else if (hoursSinceSync && hoursSinceSync > 168) dataFreshness = 'very_stale';
    else if (hoursSinceSync && hoursSinceSync > 72) dataFreshness = 'stale';
    else if (hoursSinceSync && hoursSinceSync > 24) dataFreshness = 'acceptable';
    
    return {
      sync: null, // On ne retourne pas les détails complets pour simplifier
      has_data: hasData,
      needs_sync: shouldSync.should_sync,
      reason: shouldSync.reason,
      data_freshness: dataFreshness,
      hours_since_sync: hoursSinceSync ? Math.floor(hoursSinceSync) : null,
      recommendation: shouldSync.should_sync ? 'Synchronisation recommandée' : 'Données à jour'
    };
  } catch (error) {
    console.warn('Erreur getLatestSyncEnriched:', error);
    return {
      sync: null,
      has_data: false,
      needs_sync: false,
      reason: 'error',
      data_freshness: 'never',
      hours_since_sync: null,
      recommendation: 'Statut indisponible'
    };
  }
}

/**
 * Obtenir une synchronisation spécifique par ID
 * Note: Non supporté par Airbyte, retourne null
 * @deprecated Utiliser getAirbyteSyncStatus à la place
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function getSyncById(syncId: number, token: string): Promise<HubspotSyncData | null> {
  console.warn('getSyncById is deprecated, use getAirbyteSyncStatus instead');
  return null;
}

/**
 * Obtenir l'historique des synchronisations
 * Utilise le nouvel endpoint Airbyte
 */
export async function getSyncHistory(
  token: string,
  skip: number = 0,
  limit: number = 100
): Promise<HubspotSyncData[]> {
  try {
    const airbyteHistory = await getAirbyteSyncHistory(token);
    
    // Convertir le format Airbyte vers l'ancien format pour compatibilité
    return airbyteHistory.slice(skip, skip + limit).map(job => {
      // Mapper les status Airbyte vers les anciens status
      let mappedStatus: 'in_progress' | 'completed' | 'failed' = 'in_progress';
      if (job.status === 'succeeded') mappedStatus = 'completed';
      else if (job.status === 'failed' || job.status === 'cancelled') mappedStatus = 'failed';
      else if (job.status === 'running' || job.status === 'pending') mappedStatus = 'in_progress';
      
      return {
        id: parseInt(job.job_id) || 0,
        user_id: 0, // Non disponible
        status: mappedStatus,
        total_contacts: job.rows_synced ? Math.floor(job.rows_synced * 0.6) : null,
        total_companies: job.rows_synced ? Math.floor(job.rows_synced * 0.25) : null,
        total_deals: job.rows_synced ? Math.floor(job.rows_synced * 0.15) : null,
        created_at: job.created_at || new Date().toISOString(),
        completed_at: job.started_at || null // Airbyte n'a pas completed_at, on utilise started_at
      };
    });
  } catch (error) {
    console.warn('Erreur getSyncHistory:', error);
    return [];
  }
}
