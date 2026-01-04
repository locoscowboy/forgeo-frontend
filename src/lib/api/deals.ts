export interface Deal {
  id: string;
  dealname: string;
  amount: string;
  closedate: string;
  dealstage: string;
  pipeline: string;
  dealtype: string;
  description: string;
  hubspot_owner_id: string;
  hs_deal_stage_probability: string;
  hs_forecast_amount: string;
  hs_deal_priority: string;
  associatedcompanyids: string;
  associatedvids: string;
  createdate: string;
  lastmodifieddate: string;
  hs_lastmodifieddate: string;
}

export interface DealsResponse {
  deals: Deal[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

// Interface pour la réponse du nouveau backend Airbyte
interface AirbyteDealsResponse {
  items: Deal[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface APIError {
  detail?: string;
  message?: string;
  status?: number;
}

export async function getDeals(
  token: string,
  page: number = 1,
  limit: number = 50,
  search?: string,
  sortField?: string,
  sortOrder?: string
): Promise<DealsResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  if (search && search.trim()) params.append('search', search.trim());
  if (sortField) params.append('sort_field', sortField);
  if (sortOrder) params.append('sort_order', sortOrder);

  // Nouveau endpoint Airbyte
  const url = `https://forgeo.store/api/v1/hubspot-data/deals?${params}`;
  
  console.log('🌐 API Request (Deals):', {
    url,
    params: Object.fromEntries(params),
    hasToken: !!token
  });

  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('📡 API Response Status (Deals):', response.status);

    if (!response.ok) {
      let errorData: APIError = {};
      
      try {
        errorData = await response.json();
      } catch (parseError) {
        console.error('❌ Failed to parse error response:', parseError);
      }

      const errorMessage = errorData.detail || errorData.message || `HTTP ${response.status}: ${response.statusText}`;
      
      console.error('❌ API Error (Deals):', {
        status: response.status,
        statusText: response.statusText,
        errorData,
        errorMessage
      });

      // Gestion spécifique des erreurs d'authentification
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

    const data: AirbyteDealsResponse = await response.json();
    
    console.log('✅ API Success (Deals):', {
      dealsCount: data.items?.length || 0,
      total: data.total,
      page: data.page,
      totalPages: data.pages
    });

    // Validation basique des données
    if (!data.items || !Array.isArray(data.items)) {
      throw new Error('Format de réponse invalide: deals manquants ou malformés');
    }

    // Transformation du format Airbyte vers le format attendu par le frontend
    return {
      deals: data.items,
      total: data.total,
      page: data.page,
      limit: data.limit,
      total_pages: data.pages
    };
  } catch (error) {
    console.error('💥 Network/Fetch Error (Deals):', error);
    
    if (error instanceof Error) {
      throw error; // Re-throw les erreurs que nous avons déjà gérées
    }
    
    // Erreur de réseau ou autre erreur inattendue
    throw new Error('Erreur de connexion. Vérifiez votre connexion internet et réessayez.');
  }
} 
