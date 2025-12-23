export interface Contact {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
  company: string;
  website: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  jobtitle: string;
  lifecyclestage: string;
  hs_lead_status: string;
  lastmodifieddate: string;
  properties?: {
    [key: string]: string | number | boolean | null | undefined;
    hs_linkedin_url?: string;
    createdate?: string;
    hs_analytics_source?: string;
    hubspot_owner_id?: string;
    mobilephone?: string;
    hs_lead_score?: string;
  };
}

export interface ContactsResponse {
  contacts: Contact[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

// Interface pour la réponse brute du backend Airbyte
interface AirbyteContact {
  id: string;
  [key: string]: string | number | boolean | null | undefined | object;
}

interface AirbyteContactsResponse {
  items: AirbyteContact[];
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
 * Transforme un contact Airbyte (avec préfixe properties_) vers le format attendu par le frontend
 */
function transformAirbyteContact(airbyteContact: AirbyteContact): Contact {
  // Extraire toutes les propriétés avec le préfixe properties_
  const properties: Record<string, string | number | boolean | null | undefined> = {};
  
  for (const [key, value] of Object.entries(airbyteContact)) {
    if (key.startsWith('properties_') && key !== 'properties') {
      const cleanKey = key.replace('properties_', '');
      properties[cleanKey] = value as string | number | boolean | null | undefined;
    }
  }

  return {
    id: airbyteContact.id || '',
    firstname: (airbyteContact.properties_firstname as string) || properties.firstname as string || '',
    lastname: (airbyteContact.properties_lastname as string) || properties.lastname as string || '',
    email: (airbyteContact.email as string) || (airbyteContact.properties_email as string) || properties.email as string || '',
    phone: (airbyteContact.properties_phone as string) || properties.phone as string || '',
    company: (airbyteContact.properties_company as string) || properties.company as string || '',
    website: (airbyteContact.properties_website as string) || properties.website as string || '',
    address: (airbyteContact.properties_address as string) || properties.address as string || '',
    city: (airbyteContact.properties_city as string) || properties.city as string || '',
    state: (airbyteContact.properties_state as string) || properties.state as string || '',
    zip: (airbyteContact.properties_zip as string) || properties.zip as string || '',
    country: (airbyteContact.properties_country as string) || properties.country as string || '',
    jobtitle: (airbyteContact.properties_jobtitle as string) || properties.jobtitle as string || '',
    lifecyclestage: (airbyteContact.properties_lifecyclestage as string) || properties.lifecyclestage as string || '',
    hs_lead_status: (airbyteContact.properties_hs_lead_status as string) || properties.hs_lead_status as string || '',
    lastmodifieddate: (airbyteContact.properties_lastmodifieddate as string) || properties.lastmodifieddate as string || '',
    properties: {
      ...properties,
      hs_linkedin_url: (airbyteContact.properties_hs_linkedin_url as string) || properties.hs_linkedin_url as string,
      createdate: (airbyteContact.properties_createdate as string) || properties.createdate as string,
      hs_analytics_source: (airbyteContact.properties_hs_analytics_source as string) || properties.hs_analytics_source as string,
      hubspot_owner_id: (airbyteContact.properties_hubspot_owner_id as string) || properties.hubspot_owner_id as string,
      mobilephone: (airbyteContact.properties_mobilephone as string) || properties.mobilephone as string,
      hs_lead_score: (airbyteContact.properties_hs_lead_score as string) || properties.hs_lead_score as string,
    }
  };
}

export async function getContacts(
  token: string,
  page: number = 1,
  limit: number = 50,
  search?: string,
  sortField?: string,
  sortOrder?: string
): Promise<ContactsResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  if (search && search.trim()) params.append('search', search.trim());
  if (sortField) params.append('sort_field', sortField);
  if (sortOrder) params.append('sort_order', sortOrder);

  // Nouveau endpoint Airbyte
  const url = `https://forgeo.store/api/v1/hubspot-data/contacts?${params}`;
  
  console.log('🌐 API Request:', {
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

    console.log('📡 API Response Status:', response.status);

    if (!response.ok) {
      let errorData: APIError = {};
      
      try {
        errorData = await response.json();
      } catch (parseError) {
        console.error('❌ Failed to parse error response:', parseError);
      }

      const errorMessage = errorData.detail || errorData.message || `HTTP ${response.status}: ${response.statusText}`;
      
      console.error('❌ API Error:', {
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

    const data: AirbyteContactsResponse = await response.json();
    
    console.log('✅ API Success:', {
      contactsCount: data.items?.length || 0,
      total: data.total,
      page: data.page,
      totalPages: data.pages
    });

    // Validation basique des données
    if (!data.items || !Array.isArray(data.items)) {
      throw new Error('Format de réponse invalide: contacts manquants ou malformés');
    }

    // Transformation des données Airbyte vers le format frontend
    const transformedContacts = data.items.map(transformAirbyteContact);

    return {
      contacts: transformedContacts,
      total: data.total,
      page: data.page,
      limit: data.limit,
      total_pages: data.pages
    };
  } catch (error) {
    console.error('💥 Network/Fetch Error:', error);
    
    if (error instanceof Error) {
      throw error; // Re-throw les erreurs que nous avons déjà gérées
    }
    
    // Erreur de réseau ou autre erreur inattendue
    throw new Error('Erreur de connexion. Vérifiez votre connexion internet et réessayez.');
  }
}
