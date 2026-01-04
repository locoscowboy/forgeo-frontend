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

export interface APIError {
  detail?: string;
  message?: string;
  status?: number;
}

// Interface pour les données brutes Airbyte
interface AirbyteDealRaw {
  id: string;
  [key: string]: string | number | boolean | null | undefined;
}

// Interface pour la réponse du nouveau backend Airbyte (données brutes)
interface AirbyteDealsResponse {
  items: AirbyteDealRaw[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

/**
 * Transformer les données Airbyte (avec properties_*) vers le format frontend
 * Convertit automatiquement tous les types en string
 */
function transformAirbyteDeal(airbyteDeal: AirbyteDealRaw): Deal {
  const toString = (value: string | number | boolean | null | undefined): string => {
    if (value === null || value === undefined) return '';
    return String(value);
  };

  return {
    id: airbyteDeal.id,
    dealname: toString(airbyteDeal.properties_dealname || airbyteDeal.dealname),
    amount: toString(airbyteDeal.properties_amount || airbyteDeal.amount),
    closedate: toString(airbyteDeal.properties_closedate || airbyteDeal.closedate),
    dealstage: toString(airbyteDeal.properties_dealstage || airbyteDeal.dealstage),
    pipeline: toString(airbyteDeal.properties_pipeline || airbyteDeal.pipeline),
    dealtype: toString(airbyteDeal.properties_dealtype || airbyteDeal.dealtype),
    description: toString(airbyteDeal.properties_description || airbyteDeal.description),
    hubspot_owner_id: toString(airbyteDeal.properties_hubspot_owner_id || airbyteDeal.hubspot_owner_id),
    hs_deal_stage_probability: toString(airbyteDeal.properties_hs_deal_stage_probability || airbyteDeal.hs_deal_stage_probability),
    hs_forecast_amount: toString(airbyteDeal.properties_hs_forecast_amount || airbyteDeal.hs_forecast_amount),
    hs_deal_priority: toString(airbyteDeal.properties_hs_deal_priority || airbyteDeal.hs_deal_priority),
    associatedcompanyids: toString(airbyteDeal.properties_associatedcompanyids || airbyteDeal.associatedcompanyids),
    associatedvids: toString(airbyteDeal.properties_associatedvids || airbyteDeal.associatedvids),
    createdate: toString(airbyteDeal.properties_createdate || airbyteDeal.createdate),
    lastmodifieddate: toString(airbyteDeal.properties_lastmodifieddate || airbyteDeal.lastmodifieddate),
    hs_lastmodifieddate: toString(airbyteDeal.properties_hs_lastmodifieddate || airbyteDeal.hs_lastmodifieddate),
  };
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
    const transformedDeals = data.items.map(transformAirbyteDeal);
    
    console.log('🔄 Transformed deals sample:', transformedDeals[0]);
    
    return {
      deals: transformedDeals,
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
