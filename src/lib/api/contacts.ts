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
    [key: string]: any;
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

  const url = `https://forgeo.store/api/v1/contacts?${params}`;
  
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

    const data = await response.json();
    
    console.log('✅ API Success:', {
      contactsCount: data.contacts?.length || 0,
      total: data.total,
      page: data.page,
      totalPages: data.total_pages
    });

    // Validation basique des données
    if (!data.contacts || !Array.isArray(data.contacts)) {
      throw new Error('Format de réponse invalide: contacts manquants ou malformés');
    }

    return data;
  } catch (error) {
    console.error('💥 Network/Fetch Error:', error);
    
    if (error instanceof Error) {
      throw error; // Re-throw les erreurs que nous avons déjà gérées
    }
    
    // Erreur de réseau ou autre erreur inattendue
    throw new Error('Erreur de connexion. Vérifiez votre connexion internet et réessayez.');
  }
} 
