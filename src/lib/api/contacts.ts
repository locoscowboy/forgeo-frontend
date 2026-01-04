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

export interface APIError {
  detail?: string;
  message?: string;
  status?: number;
}

// Interface pour les données brutes Airbyte
interface AirbyteContactRaw {
  id: string;
  [key: string]: string | number | boolean | null | undefined;
}

// Interface pour la réponse du nouveau backend Airbyte (données brutes)
interface AirbyteContactsResponse {
  items: AirbyteContactRaw[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

/**
 * Transformer les données Airbyte (avec properties_*) vers le format frontend
 * Convertit automatiquement tous les types en string
 */
function transformAirbyteContact(airbyteContact: AirbyteContactRaw): Contact {
  const toString = (value: string | number | boolean | null | undefined): string => {
    if (value === null || value === undefined) return '';
    return String(value);
  };

  return {
    id: airbyteContact.id,
    firstname: toString(airbyteContact.properties_firstname || airbyteContact.firstname),
    lastname: toString(airbyteContact.properties_lastname || airbyteContact.lastname),
    email: toString(airbyteContact.properties_email || airbyteContact.email),
    phone: toString(airbyteContact.properties_phone || airbyteContact.phone),
    company: toString(airbyteContact.properties_company || airbyteContact.company),
    website: toString(airbyteContact.properties_website || airbyteContact.website),
    address: toString(airbyteContact.properties_address || airbyteContact.address),
    city: toString(airbyteContact.properties_city || airbyteContact.city),
    state: toString(airbyteContact.properties_state || airbyteContact.state),
    zip: toString(airbyteContact.properties_zip || airbyteContact.zip),
    country: toString(airbyteContact.properties_country || airbyteContact.country),
    jobtitle: toString(airbyteContact.properties_jobtitle || airbyteContact.jobtitle),
    lifecyclestage: toString(airbyteContact.properties_lifecyclestage || airbyteContact.lifecyclestage),
    hs_lead_status: toString(airbyteContact.properties_hs_lead_status || airbyteContact.hs_lead_status),
    lastmodifieddate: toString(airbyteContact.properties_lastmodifieddate || airbyteContact.lastmodifieddate),
    properties: {
      hs_linkedin_url: toString(airbyteContact.properties_hs_linkedin_url || airbyteContact.hs_linkedin_url),
      createdate: toString(airbyteContact.properties_createdate || airbyteContact.createdate),
      hs_analytics_source: toString(airbyteContact.properties_hs_analytics_source || airbyteContact.hs_analytics_source),
      hubspot_owner_id: toString(airbyteContact.properties_hubspot_owner_id || airbyteContact.hubspot_owner_id),
      mobilephone: toString(airbyteContact.properties_mobilephone || airbyteContact.mobilephone),
      hs_lead_score: toString(airbyteContact.properties_hs_lead_score || airbyteContact.hs_lead_score),
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

    // Transformation du format Airbyte vers le format attendu par le frontend
    const transformedContacts = data.items.map(transformAirbyteContact);
    
    console.log('🔄 Transformed contacts sample:', transformedContacts[0]);
    
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
