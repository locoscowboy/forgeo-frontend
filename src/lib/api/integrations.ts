// Types pour les intégrations HubSpot
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

    // Si on a un token, récupérer les statistiques des données
    if (tokenData && tokenData.is_active) {
      const dataStats = await getHubSpotDataStats(token).catch(() => undefined);

      return {
        isConnected: true,
        dataStats,
        syncStatus: 'success',
        lastSync: tokenData.updated_at || tokenData.created_at
      };
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
    throw error;
  }
}



/**
 * Obtenir les statistiques des données HubSpot depuis la dernière synchronisation
 */
export async function getHubSpotDataStats(token: string): Promise<HubSpotConnectionStatus['dataStats']> {
  try {
    // Récupérer la dernière synchronisation
    const latestSync = await apiCall<HubSpotSyncResponse>('/api/v1/hubspot-sync/latest', {
      method: 'GET',
    }, token);

    if (!latestSync) {
      return {
        contacts: 0,
        companies: 0,
        deals: 0
      };
    }

    return {
      contacts: latestSync.total_contacts || 0,
      companies: latestSync.total_companies || 0,
      deals: latestSync.total_deals || 0
    };
  } catch (error) {
    console.error('Error fetching HubSpot data stats:', error);
    return {
      contacts: 0,
      companies: 0,
      deals: 0
    };
  }
}

/**
 * Lancer une synchronisation HubSpot
 */
export async function syncHubSpotData(token: string): Promise<{ sync_id: number; status: string }> {
  const response = await apiCall<HubSpotSyncResponse>('/api/v1/hubspot-sync', {
    method: 'POST',
  }, token);

  return {
    sync_id: response.id,
    status: response.status
  };
}

/**
 * Obtenir le statut d'une synchronisation
 */
export async function getSyncStatus(syncId: number, token: string): Promise<{ status: string; progress?: number }> {
  const response = await apiCall<HubSpotSyncResponse>(`/api/v1/hubspot-sync/${syncId}`, {
    method: 'GET',
  }, token);

  return {
    status: response.status,
    // Le backend n'a pas de champ progress, on peut le calculer selon le statut
    progress: response.status === 'completed' ? 100 : response.status === 'in_progress' ? 50 : 0
  };
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