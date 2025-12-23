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

// Interface pour la réponse brute du backend Airbyte
interface AirbyteDeal {
  id: string;
  [key: string]: string | number | boolean | null | undefined | object;
}

interface AirbyteDealsResponse {
  items: AirbyteDeal[];
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

/**
 * Transforme un deal Airbyte (avec préfixe properties_) vers le format attendu par le frontend
 */
function transformAirbyteDeal(airbyteDeal: AirbyteDeal): Deal {
  // Extraire toutes les propriétés avec le préfixe properties_
  const properties: Record<string, string | number | boolean | null | undefined> = {};
  
  for (const [key, value] of Object.entries(airbyteDeal)) {
    if (key.startsWith('properties_') && key !== 'properties') {
      const cleanKey = key.replace('properties_', '');
      properties[cleanKey] = value as string | number | boolean | null | undefined;
    }
  }

  return {
    id: airbyteDeal.id || '',
    dealname: (airbyteDeal.properties_dealname as string) || properties.dealname as string || '',
    amount: String((airbyteDeal.properties_amount as string | number) || properties.amount || ''),
    closedate: (airbyteDeal.properties_closedate as string) || properties.closedate as string || '',
    dealstage: (airbyteDeal.properties_dealstage as string) || properties.dealstage as string || '',
    pipeline: (airbyteDeal.properties_pipeline as string) || properties.pipeline as string || '',
    dealtype: (airbyteDeal.properties_dealtype as string) || properties.dealtype as string || '',
    description: (airbyteDeal.properties_description as string) || properties.description as string || '',
    hubspot_owner_id: (airbyteDeal.properties_hubspot_owner_id as string) || properties.hubspot_owner_id as string || '',
    hs_deal_stage_probability: String((airbyteDeal.properties_hs_deal_stage_probability as string | number) || properties.hs_deal_stage_probability || ''),
    hs_forecast_amount: String((airbyteDeal.properties_hs_forecast_amount as string | number) || properties.hs_forecast_amount || ''),
    hs_deal_priority: (airbyteDeal.properties_hs_deal_priority as string) || properties.hs_deal_priority as string || '',
    associatedcompanyids: (airbyteDeal.properties_associatedcompanyids as string) || properties.associatedcompanyids as string || '',
    associatedvids: (airbyteDeal.properties_associatedvids as string) || properties.associatedvids as string || '',
    createdate: (airbyteDeal.properties_createdate as string) || properties.createdate as string || '',
    lastmodifieddate: (airbyteDeal.properties_lastmodifieddate as string) || properties.lastmodifieddate as string || '',
    hs_lastmodifieddate: (airbyteDeal.properties_hs_lastmodifieddate as string) || properties.hs_lastmodifieddate as string || '',
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

    // Transformation des données Airbyte vers le format frontend
    const transformedDeals = data.items.map(transformAirbyteDeal);

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
