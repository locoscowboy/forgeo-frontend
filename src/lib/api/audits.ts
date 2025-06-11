export interface AuditResult {
  id: number;
  category: string;
  criterion: string;
  field_name: string;
  empty_count: number;
  total_count: number;
}

export interface HubSpotObjectData {
  [key: string]: string | number | boolean | null | undefined;
}

export interface AuditDetail {
  id: number;
  result_id: number;
  hubspot_id: string;
  object_data: HubSpotObjectData;
}

export interface Audit {
  id: number;
  user_id: number;
  sync_id?: number;
  status: string;
  created_at: string;
  completed_at?: string;
  title?: string;
  description?: string;
  results?: AuditResult[];
}

export interface AuditResponse {
  id: number;
  user_id: number;
  sync_id?: number;
  status: string;
  created_at: string;
  completed_at?: string;
  title?: string;
  description?: string;
  quality_score?: number;
  total_contacts?: number;
  total_companies?: number;
  total_deals?: number;
  total_issues?: number;
  data_sync_id?: number;
}

export interface APIError {
  detail?: string;
  message?: string;
  status?: number;
}

// Créer un nouvel audit
export async function createAudit(
  token: string,
  title: string = "Audit de qualité des données",
  description: string = "Analyse automatique des données HubSpot"
): Promise<AuditResponse> {
  const url = 'https://forgeo.store/api/v1/audits';
  
  console.log('🌐 API Request (Create Audit):', {
    url,
    title,
    description,
    hasToken: !!token
  });

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title, description }),
    });

    console.log('📡 API Response Status (Create Audit):', response.status);

    if (!response.ok) {
      let errorData: APIError = {};
      
      try {
        errorData = await response.json();
      } catch (parseError) {
        console.error('❌ Failed to parse error response:', parseError);
      }

      const errorMessage = errorData.detail || errorData.message || `HTTP ${response.status}: ${response.statusText}`;
      
      console.error('❌ API Error (Create Audit):', {
        status: response.status,
        statusText: response.statusText,
        errorData,
        errorMessage
      });

      if (response.status === 401) {
        throw new Error('Session expirée. Veuillez vous reconnecter.');
      }
      
      if (response.status === 403) {
        throw new Error('Accès non autorisé à cette ressource.');
      }
      
      if (response.status >= 500) {
        throw new Error('Erreur serveur. Veuillez réessayer plus tard.');
      }

      throw new Error(errorMessage);
    }

    const data = await response.json();
    
    console.log('✅ API Success (Create Audit):', data);

    return data;
  } catch (error) {
    console.error('💥 Network/Fetch Error (Create Audit):', error);
    
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error('Erreur de connexion. Vérifiez votre connexion internet et réessayez.');
  }
}

// Exécuter un audit
export async function runAudit(
  token: string,
  auditId: number
): Promise<void> {
  const url = `https://forgeo.store/api/v1/audits/${auditId}/run`;
  
  console.log('🌐 API Request (Run Audit):', {
    url,
    auditId,
    hasToken: !!token
  });

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('📡 API Response Status (Run Audit):', response.status);

    if (!response.ok) {
      let errorData: APIError = {};
      
      try {
        errorData = await response.json();
      } catch (parseError) {
        console.error('❌ Failed to parse error response:', parseError);
      }

      const errorMessage = errorData.detail || errorData.message || `HTTP ${response.status}: ${response.statusText}`;
      
      console.error('❌ API Error (Run Audit):', {
        status: response.status,
        statusText: response.statusText,
        errorData,
        errorMessage
      });

      if (response.status === 401) {
        throw new Error('Session expirée. Veuillez vous reconnecter.');
      }
      
      if (response.status === 403) {
        throw new Error('Accès non autorisé à cette ressource.');
      }
      
      if (response.status >= 500) {
        throw new Error('Erreur serveur. Veuillez réessayer plus tard.');
      }

      throw new Error(errorMessage);
    }

    console.log('✅ API Success (Run Audit)');
  } catch (error) {
    console.error('💥 Network/Fetch Error (Run Audit):', error);
    
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error('Erreur de connexion. Vérifiez votre connexion internet et réessayez.');
  }
}

// Récupérer les résultats d'un audit
export async function getAuditResults(
  token: string,
  auditId: number
): Promise<AuditResult[]> {
  const url = `https://forgeo.store/api/v1/audits/${auditId}/results`;
  
  console.log('🌐 API Request (Get Audit Results):', {
    url,
    auditId,
    hasToken: !!token
  });

  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('📡 API Response Status (Get Audit Results):', response.status);

    if (!response.ok) {
      let errorData: APIError = {};
      
      try {
        errorData = await response.json();
      } catch (parseError) {
        console.error('❌ Failed to parse error response:', parseError);
      }

      const errorMessage = errorData.detail || errorData.message || `HTTP ${response.status}: ${response.statusText}`;
      
      console.error('❌ API Error (Get Audit Results):', {
        status: response.status,
        statusText: response.statusText,
        errorData,
        errorMessage
      });

      if (response.status === 401) {
        throw new Error('Session expirée. Veuillez vous reconnecter.');
      }
      
      if (response.status === 403) {
        throw new Error('Accès non autorisé à cette ressource.');
      }
      
      if (response.status >= 500) {
        throw new Error('Erreur serveur. Veuillez réessayer plus tard.');
      }

      throw new Error(errorMessage);
    }

    const data = await response.json();
    
    console.log('✅ API Success (Get Audit Results):', {
      resultsCount: data?.length || 0
    });

    if (!Array.isArray(data)) {
      throw new Error('Format de réponse invalide: résultats manquants ou malformés');
    }

    return data;
  } catch (error) {
    console.error('💥 Network/Fetch Error (Get Audit Results):', error);
    
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error('Erreur de connexion. Vérifiez votre connexion internet et réessayez.');
  }
}

// Récupérer les détails d'un résultat d'audit
export async function getAuditResultDetails(
  token: string,
  auditId: number,
  resultId: number,
  page: number = 1,
  limit: number = 50
): Promise<AuditDetail[]> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  const url = `https://forgeo.store/api/v1/audits/${auditId}/results/${resultId}/details?${params}`;
  
  console.log('🌐 API Request (Get Audit Details):', {
    url,
    auditId,
    resultId,
    page,
    limit,
    hasToken: !!token
  });

  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('📡 API Response Status (Get Audit Details):', response.status);

    if (!response.ok) {
      let errorData: APIError = {};
      
      try {
        errorData = await response.json();
      } catch (parseError) {
        console.error('❌ Failed to parse error response:', parseError);
      }

      const errorMessage = errorData.detail || errorData.message || `HTTP ${response.status}: ${response.statusText}`;
      
      console.error('❌ API Error (Get Audit Details):', {
        status: response.status,
        statusText: response.statusText,
        errorData,
        errorMessage
      });

      if (response.status === 401) {
        throw new Error('Session expirée. Veuillez vous reconnecter.');
      }
      
      if (response.status === 403) {
        throw new Error('Accès non autorisé à cette ressource.');
      }
      
      if (response.status >= 500) {
        throw new Error('Erreur serveur. Veuillez réessayer plus tard.');
      }

      throw new Error(errorMessage);
    }

    const data = await response.json();
    
    console.log('✅ API Success (Get Audit Details):', {
      detailsCount: data?.length || 0
    });

    if (!Array.isArray(data)) {
      throw new Error('Format de réponse invalide: détails manquants ou malformés');
    }

    return data;
  } catch (error) {
    console.error('💥 Network/Fetch Error (Get Audit Details):', error);
    
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error('Erreur de connexion. Vérifiez votre connexion internet et réessayez.');
  }
}

// Récupérer la liste des audits
export async function getAudits(
  token: string
): Promise<Audit[]> {
  const url = 'https://forgeo.store/api/v1/audits';
  
  console.log('🌐 API Request (Get Audits List):', {
    url,
    hasToken: !!token
  });

  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('📡 API Response Status (Get Audits List):', response.status);

    if (!response.ok) {
      let errorData: APIError = {};
      
      try {
        errorData = await response.json();
      } catch (parseError) {
        console.error('❌ Failed to parse error response:', parseError);
      }

      const errorMessage = errorData.detail || errorData.message || `HTTP ${response.status}: ${response.statusText}`;
      
      console.error('❌ API Error (Get Audits List):', {
        status: response.status,
        statusText: response.statusText,
        errorData,
        errorMessage
      });

      if (response.status === 401) {
        throw new Error('Session expirée. Veuillez vous reconnecter.');
      }
      
      if (response.status === 403) {
        throw new Error('Accès non autorisé à cette ressource.');
      }
      
      if (response.status >= 500) {
        throw new Error('Erreur serveur. Veuillez réessayer plus tard.');
      }

      throw new Error(errorMessage);
    }

    const data = await response.json();
    
    console.log('✅ API Success (Get Audits List):', {
      auditsCount: data?.length || 0
    });

    if (!Array.isArray(data)) {
      throw new Error('Format de réponse invalide: audits manquants ou malformés');
    }

    return data;
  } catch (error) {
    console.error('💥 Network/Fetch Error (Get Audits List):', error);
    
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error('Erreur de connexion. Vérifiez votre connexion internet et réessayez.');
  }
}

// Récupérer un audit spécifique
export async function getAudit(
  token: string,
  auditId: number
): Promise<Audit> {
  const url = `https://forgeo.store/api/v1/audits/${auditId}`;
  
  console.log('🌐 API Request (Get Audit):', {
    url,
    auditId,
    hasToken: !!token
  });

  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('📡 API Response Status (Get Audit):', response.status);

    if (!response.ok) {
      let errorData: APIError = {};
      
      try {
        errorData = await response.json();
      } catch (parseError) {
        console.error('❌ Failed to parse error response:', parseError);
      }

      const errorMessage = errorData.detail || errorData.message || `HTTP ${response.status}: ${response.statusText}`;
      
      console.error('❌ API Error (Get Audit):', {
        status: response.status,
        statusText: response.statusText,
        errorData,
        errorMessage
      });

      if (response.status === 401) {
        throw new Error('Session expirée. Veuillez vous reconnecter.');
      }
      
      if (response.status === 403) {
        throw new Error('Accès non autorisé à cette ressource.');
      }
      
      if (response.status >= 500) {
        throw new Error('Erreur serveur. Veuillez réessayer plus tard.');
      }

      throw new Error(errorMessage);
    }

    const data = await response.json();
    
    console.log('✅ API Success (Get Audit):', data);

    return data;
  } catch (error) {
    console.error('💥 Network/Fetch Error (Get Audit):', error);
    
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error('Erreur de connexion. Vérifiez votre connexion internet et réessayez.');
  }
} 