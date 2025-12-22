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

    // Si on a un token actif, récupérer les statistiques des données via Airbyte
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
        // Si on ne peut pas récupérer les stats, on considère que la connexion est ok mais pas de données
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
 * Obtenir les statistiques des données HubSpot depuis Airbyte sync history
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
          contacts: Math.floor(totalRows * 0.6), // Estimation
          companies: Math.floor(totalRows * 0.25),
          deals: Math.floor(totalRows * 0.15)
        };
      }
    }

    // Si pas d'historique Airbyte, retourner des zéros
    return {
      contacts: 0,
      companies: 0,
      deals: 0
    };
  } catch (error) {
    console.warn('Erreur lors de la récupération des stats:', error);
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
export async function syncHubSpotData(token: string): Promise<{ sync_id: number | string; status: string }> {
  const airbyteResponse = await triggerAirbyteSync(token);
  
  return {
    sync_id: airbyteResponse.job_id,
    status: airbyteResponse.status === 'running' ? 'in_progress' : airbyteResponse.status
  };
}

/**
 * Obtenir le statut d'une synchronisation
 * Utilise le nouvel endpoint Airbyte
 */
export async function getSyncStatus(syncId: number | string, token: string): Promise<{ status: string; progress?: number }> {
  try {
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
  } catch (error) {
    console.error('Erreur lors de la récupération du statut sync:', error);
    throw error;
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
// SMART SYNC ENDPOINTS (ÉMULÉS)
// Ces fonctions retournent des valeurs par défaut car les anciens
// endpoints n'existent plus - elles utilisent maintenant Airbyte
// ========================================

/**
 * Vérifier si une synchronisation est recommandée
 * ÉMULÉ: Utilise l'historique Airbyte
 */
export async function getShouldSync(token: string): Promise<SmartSyncStatus> {
  try {
    const history = await getAirbyteSyncHistory(token);
    const lastJob = history[0];
    
    if (!lastJob) {
      return {
        should_sync: true,
        reason: 'Aucune synchronisation effectuée',
        last_sync_ago_hours: null,
        data_quality: 'none',
        auto_sync_recommended: true
      };
    }

    // Calculer les heures depuis la dernière sync
    const lastSyncDate = lastJob.started_at ? new Date(lastJob.started_at) : null;
    const hoursSinceSync = lastSyncDate 
      ? Math.floor((Date.now() - lastSyncDate.getTime()) / (1000 * 60 * 60))
      : null;

    // Déterminer la qualité des données
    let dataQuality: 'none' | 'fresh' | 'acceptable' | 'stale' = 'fresh';
    if (!hoursSinceSync) dataQuality = 'none';
    else if (hoursSinceSync > 24) dataQuality = 'stale';
    else if (hoursSinceSync > 6) dataQuality = 'acceptable';

    return {
      should_sync: dataQuality === 'stale' || dataQuality === 'none',
      reason: dataQuality === 'stale' ? 'Données obsolètes' : 'Données à jour',
      last_sync_ago_hours: hoursSinceSync,
      data_quality: dataQuality,
      auto_sync_recommended: dataQuality === 'stale'
    };
  } catch (error) {
    console.warn('getShouldSync émulé échoué:', error);
    return {
      should_sync: false,
      reason: 'Impossible de vérifier',
      last_sync_ago_hours: null,
      data_quality: 'fresh',
      auto_sync_recommended: false
    };
  }
}

/**
 * Obtenir le statut enrichi de synchronisation
 * ÉMULÉ: Utilise l'historique Airbyte
 */
export async function getEnrichedSyncStatus(token: string): Promise<EnrichedSyncStatus> {
  try {
    const history = await getAirbyteSyncHistory(token);
    const lastJob = history[0];
    
    if (!lastJob) {
      return {
        needs_sync: true,
        reason: 'Aucune synchronisation effectuée',
        last_sync: null,
        data_freshness: 'never',
        hours_since_sync: null,
        recommendation: 'Effectuez votre première synchronisation'
      };
    }

    const lastSyncDate = lastJob.started_at ? new Date(lastJob.started_at) : null;
    const hoursSinceSync = lastSyncDate 
      ? Math.floor((Date.now() - lastSyncDate.getTime()) / (1000 * 60 * 60))
      : null;

    let dataFreshness: 'never' | 'fresh' | 'acceptable' | 'stale' | 'very_stale' = 'fresh';
    if (!hoursSinceSync) dataFreshness = 'never';
    else if (hoursSinceSync > 72) dataFreshness = 'very_stale';
    else if (hoursSinceSync > 24) dataFreshness = 'stale';
    else if (hoursSinceSync > 6) dataFreshness = 'acceptable';

    // Convertir en format HubspotSyncData
    const lastSync: HubspotSyncData | null = lastJob ? {
      id: parseInt(lastJob.job_id) || 0,
      user_id: 0,
      status: lastJob.status === 'succeeded' ? 'completed' : lastJob.status === 'failed' ? 'failed' : 'in_progress',
      created_at: lastJob.created_at || '',
      completed_at: lastJob.started_at || null,
      total_contacts: lastJob.rows_synced ? Math.floor(lastJob.rows_synced * 0.6) : null,
      total_companies: lastJob.rows_synced ? Math.floor(lastJob.rows_synced * 0.25) : null,
      total_deals: lastJob.rows_synced ? Math.floor(lastJob.rows_synced * 0.15) : null,
    } : null;

    return {
      needs_sync: dataFreshness === 'stale' || dataFreshness === 'very_stale',
      reason: dataFreshness === 'fresh' ? 'Données à jour' : 'Synchronisation recommandée',
      last_sync: lastSync,
      data_freshness: dataFreshness,
      hours_since_sync: hoursSinceSync,
      recommendation: dataFreshness === 'fresh' ? 'Vos données sont à jour' : 'Une synchronisation est recommandée'
    };
  } catch (error) {
    console.warn('getEnrichedSyncStatus émulé échoué:', error);
    return {
      needs_sync: false,
      reason: 'Impossible de vérifier',
      last_sync: null,
      data_freshness: 'fresh',
      hours_since_sync: null,
      recommendation: ''
    };
  }
}

/**
 * Vérifier si une synchronisation est nécessaire au login
 * ÉMULÉ: Utilise l'historique Airbyte et le statut HubSpot
 */
export async function getLoginSyncCheck(token: string): Promise<LoginSyncCheck> {
  try {
    const [hubspotStatus, history] = await Promise.all([
      getHubSpotStatus(token),
      getAirbyteSyncHistory(token).catch(() => [])
    ]);

    const hasData = hubspotStatus.dataStats && (
      (hubspotStatus.dataStats.contacts || 0) > 0 ||
      (hubspotStatus.dataStats.companies || 0) > 0 ||
      (hubspotStatus.dataStats.deals || 0) > 0
    );

    const lastJob = history[0];
    let shouldSyncOnLogin = false;

    if (lastJob) {
      const lastSyncDate = lastJob.started_at ? new Date(lastJob.started_at) : null;
      const hoursSinceSync = lastSyncDate 
        ? Math.floor((Date.now() - lastSyncDate.getTime()) / (1000 * 60 * 60))
        : null;
      shouldSyncOnLogin = hoursSinceSync ? hoursSinceSync > 24 : true;
    }

    // Convertir en format HubspotSyncData
    const lastSync: HubspotSyncData | null = lastJob ? {
      id: parseInt(lastJob.job_id) || 0,
      user_id: 0,
      status: lastJob.status === 'succeeded' ? 'completed' : lastJob.status === 'failed' ? 'failed' : 'in_progress',
      created_at: lastJob.created_at || '',
      completed_at: lastJob.started_at || null,
      total_contacts: lastJob.rows_synced ? Math.floor(lastJob.rows_synced * 0.6) : null,
      total_companies: lastJob.rows_synced ? Math.floor(lastJob.rows_synced * 0.25) : null,
      total_deals: lastJob.rows_synced ? Math.floor(lastJob.rows_synced * 0.15) : null,
    } : null;

    return {
      should_sync_on_login: shouldSyncOnLogin,
      has_data: hasData || false,
      last_sync: lastSync
    };
  } catch (error) {
    console.warn('getLoginSyncCheck émulé échoué:', error);
    return {
      should_sync_on_login: false,
      has_data: true,
      last_sync: null
    };
  }
}

/**
 * Obtenir la dernière synchronisation avec informations enrichies
 * ÉMULÉ: Utilise l'historique Airbyte
 */
export async function getLatestSyncEnriched(token: string): Promise<LatestSyncResponse> {
  try {
    const history = await getAirbyteSyncHistory(token);
    const lastJob = history[0];
    
    if (!lastJob) {
      return {
        sync: null,
        has_data: false,
        needs_sync: true,
        reason: 'Aucune synchronisation effectuée',
        data_freshness: 'never',
        hours_since_sync: null,
        recommendation: 'Effectuez votre première synchronisation'
      };
    }

    const lastSyncDate = lastJob.started_at ? new Date(lastJob.started_at) : null;
    const hoursSinceSync = lastSyncDate 
      ? Math.floor((Date.now() - lastSyncDate.getTime()) / (1000 * 60 * 60))
      : null;

    let dataFreshness: 'never' | 'fresh' | 'acceptable' | 'stale' | 'very_stale' = 'fresh';
    if (!hoursSinceSync) dataFreshness = 'never';
    else if (hoursSinceSync > 72) dataFreshness = 'very_stale';
    else if (hoursSinceSync > 24) dataFreshness = 'stale';
    else if (hoursSinceSync > 6) dataFreshness = 'acceptable';

    // Convertir en format HubspotSyncData
    const sync: HubspotSyncData = {
      id: parseInt(lastJob.job_id) || 0,
      user_id: 0,
      status: lastJob.status === 'succeeded' ? 'completed' : lastJob.status === 'failed' ? 'failed' : 'in_progress',
      created_at: lastJob.created_at || '',
      completed_at: lastJob.started_at || null,
      total_contacts: lastJob.rows_synced ? Math.floor(lastJob.rows_synced * 0.6) : null,
      total_companies: lastJob.rows_synced ? Math.floor(lastJob.rows_synced * 0.25) : null,
      total_deals: lastJob.rows_synced ? Math.floor(lastJob.rows_synced * 0.15) : null,
    };

    return {
      sync,
      has_data: (lastJob.rows_synced || 0) > 0,
      needs_sync: dataFreshness === 'stale' || dataFreshness === 'very_stale',
      reason: dataFreshness === 'fresh' ? 'Données à jour' : 'Synchronisation recommandée',
      data_freshness: dataFreshness,
      hours_since_sync: hoursSinceSync,
      recommendation: dataFreshness === 'fresh' ? 'Vos données sont à jour' : 'Une synchronisation est recommandée'
    };
  } catch (error) {
    console.warn('getLatestSyncEnriched émulé échoué:', error);
    return {
      sync: null,
      has_data: false,
      needs_sync: false,
      reason: 'Impossible de vérifier',
      data_freshness: 'fresh',
      hours_since_sync: null,
      recommendation: ''
    };
  }
}

/**
 * Obtenir une synchronisation spécifique par ID
 * ÉMULÉ: Utilise getAirbyteSyncStatus
 */
export async function getSyncById(syncId: number | string, token: string): Promise<HubspotSyncData> {
  try {
    const status = await getAirbyteSyncStatus(String(syncId), token);
    
    return {
      id: parseInt(status.job_id) || 0,
      user_id: 0,
      status: status.status === 'succeeded' ? 'completed' : status.status === 'failed' ? 'failed' : 'in_progress',
      created_at: status.created_at || '',
      completed_at: status.started_at || null,
      total_contacts: status.rows_synced ? Math.floor(status.rows_synced * 0.6) : null,
      total_companies: status.rows_synced ? Math.floor(status.rows_synced * 0.25) : null,
      total_deals: status.rows_synced ? Math.floor(status.rows_synced * 0.15) : null,
    };
  } catch (error) {
    console.error('getSyncById échoué:', error);
    throw error;
  }
}

/**
 * Obtenir l'historique des synchronisations (ancien format)
 * ÉMULÉ: Utilise l'historique Airbyte
 */
export async function getSyncHistory(
  token: string,
  skip: number = 0,
  limit: number = 100
): Promise<HubspotSyncData[]> {
  try {
    const history = await getAirbyteSyncHistory(token);
    
    return history.slice(skip, skip + limit).map(job => ({
      id: parseInt(job.job_id) || 0,
      user_id: 0,
      status: job.status === 'succeeded' ? 'completed' : job.status === 'failed' ? 'failed' : 'in_progress',
      created_at: job.created_at || '',
      completed_at: job.started_at || null,
      total_contacts: job.rows_synced ? Math.floor(job.rows_synced * 0.6) : null,
      total_companies: job.rows_synced ? Math.floor(job.rows_synced * 0.25) : null,
      total_deals: job.rows_synced ? Math.floor(job.rows_synced * 0.15) : null,
    }));
  } catch (error) {
    console.warn('getSyncHistory émulé échoué:', error);
    return [];
  }
}
