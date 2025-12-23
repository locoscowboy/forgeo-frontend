export interface Company {
  id: string;
  name: string;
  domain: string;
  website: string;
  industry: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  description: string;
  founded_year: string;
  numberofemployees: string;
  lastmodifieddate: string;
  properties?: {
    [key: string]: string | number | boolean | null | undefined;
    linkedin_company_page?: string;
    linkedinbio?: string;
    createdate?: string;
    annualrevenue?: string;
    total_money_raised?: string;
    web_technologies?: string;
    hubspot_owner_id?: string;
    facebook_company_page?: string;
    twitterhandle?: string;
  };
}

export interface CompaniesResponse {
  companies: Company[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

// Interface pour la réponse brute du backend Airbyte
interface AirbyteCompany {
  id: string;
  [key: string]: string | number | boolean | null | undefined | object;
}

interface AirbyteCompaniesResponse {
  items: AirbyteCompany[];
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
 * Transforme une company Airbyte (avec préfixe properties_) vers le format attendu par le frontend
 */
function transformAirbyteCompany(airbyteCompany: AirbyteCompany): Company {
  // Extraire toutes les propriétés avec le préfixe properties_
  const properties: Record<string, string | number | boolean | null | undefined> = {};
  
  for (const [key, value] of Object.entries(airbyteCompany)) {
    if (key.startsWith('properties_') && key !== 'properties') {
      const cleanKey = key.replace('properties_', '');
      properties[cleanKey] = value as string | number | boolean | null | undefined;
    }
  }

  return {
    id: airbyteCompany.id || '',
    name: (airbyteCompany.properties_name as string) || properties.name as string || '',
    domain: (airbyteCompany.properties_domain as string) || properties.domain as string || '',
    website: (airbyteCompany.properties_website as string) || properties.website as string || '',
    industry: (airbyteCompany.properties_industry as string) || properties.industry as string || '',
    phone: (airbyteCompany.properties_phone as string) || properties.phone as string || '',
    address: (airbyteCompany.properties_address as string) || properties.address as string || '',
    city: (airbyteCompany.properties_city as string) || properties.city as string || '',
    state: (airbyteCompany.properties_state as string) || properties.state as string || '',
    zip: (airbyteCompany.properties_zip as string) || properties.zip as string || '',
    country: (airbyteCompany.properties_country as string) || properties.country as string || '',
    description: (airbyteCompany.properties_description as string) || properties.description as string || '',
    founded_year: (airbyteCompany.properties_founded_year as string) || properties.founded_year as string || '',
    numberofemployees: String((airbyteCompany.properties_numberofemployees as string | number) || properties.numberofemployees || ''),
    lastmodifieddate: (airbyteCompany.properties_lastmodifieddate as string) || properties.lastmodifieddate as string || '',
    properties: {
      ...properties,
      linkedin_company_page: (airbyteCompany.properties_linkedin_company_page as string) || properties.linkedin_company_page as string,
      linkedinbio: (airbyteCompany.properties_linkedinbio as string) || properties.linkedinbio as string,
      createdate: (airbyteCompany.properties_createdate as string) || properties.createdate as string,
      annualrevenue: String((airbyteCompany.properties_annualrevenue as string | number) || properties.annualrevenue || ''),
      total_money_raised: (airbyteCompany.properties_total_money_raised as string) || properties.total_money_raised as string,
      web_technologies: (airbyteCompany.properties_web_technologies as string) || properties.web_technologies as string,
      hubspot_owner_id: (airbyteCompany.properties_hubspot_owner_id as string) || properties.hubspot_owner_id as string,
      facebook_company_page: (airbyteCompany.properties_facebook_company_page as string) || properties.facebook_company_page as string,
      twitterhandle: (airbyteCompany.properties_twitterhandle as string) || properties.twitterhandle as string,
    }
  };
}

export async function getCompanies(
  token: string,
  page: number = 1,
  limit: number = 50,
  search?: string,
  sortField?: string,
  sortOrder?: string
): Promise<CompaniesResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  if (search && search.trim()) params.append('search', search.trim());
  if (sortField) params.append('sort_field', sortField);
  if (sortOrder) params.append('sort_order', sortOrder);

  // Nouveau endpoint Airbyte
  const url = `https://forgeo.store/api/v1/hubspot-data/companies?${params}`;
  
  console.log('🌐 API Request (Companies):', {
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

    console.log('📡 API Response Status (Companies):', response.status);

    if (!response.ok) {
      let errorData: APIError = {};
      
      try {
        errorData = await response.json();
      } catch (parseError) {
        console.error('❌ Failed to parse error response:', parseError);
      }

      const errorMessage = errorData.detail || errorData.message || `HTTP ${response.status}: ${response.statusText}`;
      
      console.error('❌ API Error (Companies):', {
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

    const data: AirbyteCompaniesResponse = await response.json();
    
    console.log('✅ API Success (Companies):', {
      companiesCount: data.items?.length || 0,
      total: data.total,
      page: data.page,
      totalPages: data.pages
    });

    // Validation basique des données
    if (!data.items || !Array.isArray(data.items)) {
      throw new Error('Format de réponse invalide: companies manquants ou malformés');
    }

    // Transformation des données Airbyte vers le format frontend
    const transformedCompanies = data.items.map(transformAirbyteCompany);

    return {
      companies: transformedCompanies,
      total: data.total,
      page: data.page,
      limit: data.limit,
      total_pages: data.pages
    };
  } catch (error) {
    console.error('💥 Network/Fetch Error (Companies):', error);
    
    if (error instanceof Error) {
      throw error; // Re-throw les erreurs que nous avons déjà gérées
    }
    
    // Erreur de réseau ou autre erreur inattendue
    throw new Error('Erreur de connexion. Vérifiez votre connexion internet et réessayez.');
  }
}
