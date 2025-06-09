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
  access_token: string;
  refresh_token: string;
  expires_at: string;
  hub_domain: string;
  hub_id: string;
}

export interface APIError {
  detail?: string;
  message?: string;
  status?: number;
}

// Configuration de l'API
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

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
  return apiCall<{ auth_url: string }>('/api/v1/hubspot/auth-url', {
    method: 'GET',
  }, token);
}

/**
 * Échanger le code d'autorisation contre un token d'accès
 */
export async function exchangeHubSpotCode(
  code: string, 
  token: string
): Promise<HubSpotAuthResponse> {
  return apiCall<HubSpotAuthResponse>('/api/v1/hubspot/callback', {
    method: 'POST',
    body: JSON.stringify({ code }),
  }, token);
}

/**
 * Obtenir le statut de connexion HubSpot
 */
export async function getHubSpotStatus(token: string): Promise<HubSpotConnectionStatus> {
  try {
    const account = await apiCall<HubSpotAccount>('/api/v1/hubspot/account', {
      method: 'GET',
    }, token);

    // Si on a un compte, récupérer les informations détaillées
    if (account) {
      const [accountInfo, dataStats] = await Promise.all([
        getHubSpotAccountInfo(token),
        getHubSpotDataStats(token)
      ]);

      return {
        isConnected: true,
        accountInfo,
        dataStats,
        syncStatus: 'success', // TODO: récupérer le vrai statut
        lastSync: account.updated_at
      };
    }

    return {
      isConnected: false,
      syncStatus: 'idle'
    };
  } catch (error) {
    // Si l'erreur est 404, l'utilisateur n'a pas de compte HubSpot connecté
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
 * Obtenir les informations du compte HubSpot
 */
export async function getHubSpotAccountInfo(token: string): Promise<HubSpotConnectionStatus['accountInfo']> {
  return apiCall<HubSpotConnectionStatus['accountInfo']>('/api/v1/hubspot/account-info', {
    method: 'GET',
  }, token);
}

/**
 * Obtenir les statistiques des données HubSpot
 */
export async function getHubSpotDataStats(token: string): Promise<HubSpotConnectionStatus['dataStats']> {
  return apiCall<HubSpotConnectionStatus['dataStats']>('/api/v1/hubspot/data-stats', {
    method: 'GET',
  }, token);
}

/**
 * Lancer une synchronisation HubSpot
 */
export async function syncHubSpotData(token: string): Promise<{ sync_id: number; status: string }> {
  return apiCall<{ sync_id: number; status: string }>('/api/v1/hubspot/sync', {
    method: 'POST',
  }, token);
}

/**
 * Obtenir le statut d'une synchronisation
 */
export async function getSyncStatus(syncId: number, token: string): Promise<{ status: string; progress?: number }> {
  return apiCall<{ status: string; progress?: number }>(`/api/v1/hubspot/sync/${syncId}/status`, {
    method: 'GET',
  }, token);
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
 */
export async function refreshHubSpotToken(token: string): Promise<HubSpotAuthResponse> {
  return apiCall<HubSpotAuthResponse>('/api/v1/hubspot/refresh-token', {
    method: 'POST',
  }, token);
} 