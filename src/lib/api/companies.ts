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

export interface APIError {
  detail?: string;
  message?: string;
  status?: number;
}

// Interface pour les données brutes Airbyte
interface AirbyteCompanyRaw {
  id: string;
  [key: string]: string | number | boolean | null | undefined;
}

// Interface pour la réponse du nouveau backend Airbyte (données brutes)
interface AirbyteCompaniesResponse {
  items: AirbyteCompanyRaw[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

/**
 * Transformer les données Airbyte (avec properties_*) vers le format frontend
 * Convertit automatiquement tous les types en string
 */
function transformAirbyteCompany(airbyteCompany: AirbyteCompanyRaw): Company {
  const toString = (value: string | number | boolean | null | undefined): string => {
    if (value === null || value === undefined) return '';
    return String(value);
  };

  return {
    id: airbyteCompany.id,
    name: toString(airbyteCompany.properties_name || airbyteCompany.name),
    domain: toString(airbyteCompany.properties_domain || airbyteCompany.domain),
    website: toString(airbyteCompany.properties_website || airbyteCompany.website),
    industry: toString(airbyteCompany.properties_industry || airbyteCompany.industry),
    phone: toString(airbyteCompany.properties_phone || airbyteCompany.phone),
    address: toString(airbyteCompany.properties_address || airbyteCompany.address),
    city: toString(airbyteCompany.properties_city || airbyteCompany.city),
    state: toString(airbyteCompany.properties_state || airbyteCompany.state),
    zip: toString(airbyteCompany.properties_zip || airbyteCompany.zip),
    country: toString(airbyteCompany.properties_country || airbyteCompany.country),
    description: toString(airbyteCompany.properties_description || airbyteCompany.description),
    founded_year: toString(airbyteCompany.properties_founded_year || airbyteCompany.founded_year),
    numberofemployees: toString(airbyteCompany.properties_numberofemployees || airbyteCompany.numberofemployees),
    lastmodifieddate: toString(airbyteCompany.properties_lastmodifieddate || airbyteCompany.lastmodifieddate),
    properties: {
      linkedin_company_page: toString(airbyteCompany.properties_linkedin_company_page || airbyteCompany.linkedin_company_page),
      linkedinbio: toString(airbyteCompany.properties_linkedinbio || airbyteCompany.linkedinbio),
      createdate: toString(airbyteCompany.properties_createdate || airbyteCompany.createdate),
      annualrevenue: toString(airbyteCompany.properties_annualrevenue || airbyteCompany.annualrevenue),
      total_money_raised: toString(airbyteCompany.properties_total_money_raised || airbyteCompany.total_money_raised),
      web_technologies: toString(airbyteCompany.properties_web_technologies || airbyteCompany.web_technologies),
      hubspot_owner_id: toString(airbyteCompany.properties_hubspot_owner_id || airbyteCompany.hubspot_owner_id),
      facebook_company_page: toString(airbyteCompany.properties_facebook_company_page || airbyteCompany.facebook_company_page),
      twitterhandle: toString(airbyteCompany.properties_twitterhandle || airbyteCompany.twitterhandle),
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

    // Transformation du format Airbyte vers le format attendu par le frontend
    const transformedCompanies = data.items.map(transformAirbyteCompany);
    
    console.log('🔄 Transformed companies sample:', transformedCompanies[0]);
    
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
