"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { 
  createAudit, 
  runAudit, 
  getAudits,
  getAuditResults, 
  getAuditResultDetails,
  AuditResult,
  AuditDetail,
  HubSpotObjectData,
  Audit
} from "@/lib/api/audits";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3,
  Plus,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Users,
  Building,
  DollarSign,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  Loader2,
  User,
  Mail,
  Phone,
  Briefcase,
  Calendar,
  FileText,
  Hash
} from "lucide-react";

// Notion-like Table Styles (same as other pages)
const tableStyles = `
  @import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap");
  
  .notion-table {
    font-family: "Inter", sans-serif;
    border-spacing: 0;
    border-top: 1px solid #e0e0e0;
    border-bottom: 1px solid #e0e0e0;
    width: 100%;
    background: white;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    table-layout: fixed;
  }
  
  .notion-th {
    color: #9e9e9e;
    font-weight: 500;
    font-size: 0.875rem;
    border-bottom: 1px solid #e0e0e0;
    border-right: 1px solid #e0e0e0;
    background-color: #fafafa;
    position: relative;
    padding: 0;
    white-space: nowrap;
    margin: 0;
    text-align: left;
    vertical-align: middle;
  }
  
  .notion-th:last-child {
    border-right: 0;
  }
  
  .notion-th-content {
    overflow-x: hidden;
    text-overflow: ellipsis;
    padding: 0.75rem 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    min-height: 40px;
    width: 100%;
  }
  
  .notion-td {
    color: #424242;
    border-bottom: 1px solid #e0e0e0;
    border-right: 1px solid #e0e0e0;
    position: relative;
    margin: 0;
    padding: 0.5rem;
    text-align: left;
    vertical-align: middle;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    min-height: 48px;
  }
  
  .notion-td:last-child {
    border-right: 0;
  }
  
  .notion-tr:hover .notion-td {
    background-color: #f8f9fa;
  }
  
  .notion-tag {
    display: inline-flex;
    align-items: center;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 500;
    white-space: nowrap;
  }
  
  .notion-icon {
    width: 14px;
    height: 14px;
    margin-right: 6px;
    opacity: 0.6;
  }
`;

// Interface pour les critères d'audit groupés
interface AuditCriteriaGroup {
  category: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  title: string;
  criteria: AuditResult[];
  isExpanded: boolean;
}

// Mapping des critères vers des labels lisibles
const criteriaLabels: Record<string, string> = {
  // Contacts
  "missing_email": "Contacts sans email",
  "invalid_email": "Contacts avec email invalide",
  "duplicate_email": "Contacts avec email en double",
  "missing_firstname": "Contacts sans prénom",
  "missing_lastname": "Contacts sans nom",
  "missing_owner": "Contacts sans propriétaire",
  "inactive_30days": "Contacts inactifs (180 jours)",
  
  // Companies
  "missing_name": "Entreprises sans nom",
  "missing_domain": "Entreprises sans domaine",
  "duplicate_domain": "Entreprises avec domaine en double",
  "missing_industry": "Entreprises sans secteur",
  
  // Deals
  "missing_amount": "Transactions sans montant",
  "missing_stage": "Transactions sans étape",
  "missing_closedate": "Transactions sans date de fermeture",
  
  // Fallback pour les anciens critères du backend
  "empty_name": "Entreprises sans nom",
  "empty_domain": "Entreprises sans domaine",
  "missing_owner_company": "Entreprises sans propriétaire",
  "missing_owner_deal": "Transactions sans propriétaire"
};

// Configuration des colonnes pour chaque type d'objet
const getColumnsForCategory = (category: string) => {
  switch (category) {
    case 'contact':
      return [
        { key: 'hubspot_id', label: 'HubSpot ID', icon: Hash, width: 120 },
        { key: 'firstname', label: 'Prénom', icon: User, width: 150 },
        { key: 'lastname', label: 'Nom', icon: User, width: 150 },
        { key: 'email', label: 'Email', icon: Mail, width: 250 },
        { key: 'phone', label: 'Téléphone', icon: Phone, width: 150 },
        { key: 'jobtitle', label: 'Fonction', icon: Briefcase, width: 180 }
      ];
    case 'company':
      return [
        { key: 'hubspot_id', label: 'HubSpot ID', icon: Hash, width: 120 },
        { key: 'name', label: 'Nom', icon: Building, width: 200 },
        { key: 'domain', label: 'Domaine', icon: FileText, width: 180 },
        { key: 'industry', label: 'Secteur', icon: Briefcase, width: 150 },
        { key: 'phone', label: 'Téléphone', icon: Phone, width: 150 }
      ];
    case 'deal':
      return [
        { key: 'hubspot_id', label: 'HubSpot ID', icon: Hash, width: 120 },
        { key: 'dealname', label: 'Nom', icon: DollarSign, width: 200 },
        { key: 'amount', label: 'Montant', icon: DollarSign, width: 120 },
        { key: 'dealstage', label: 'Étape', icon: TrendingUp, width: 150 },
        { key: 'closedate', label: 'Date fermeture', icon: Calendar, width: 150 }
      ];
    default:
      return [
        { key: 'hubspot_id', label: 'HubSpot ID', icon: Hash, width: 120 }
      ];
  }
};

// Composant pour afficher les détails d'un critère avec tableau
const CriteriaDetails: React.FC<{
  auditId: number;
  result: AuditResult;
  token: string;
  isExpanded: boolean;
  onToggle: () => void;
}> = ({ auditId, result, token, isExpanded, onToggle }) => {
  const [details, setDetails] = useState<AuditDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // États de pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10); // Nombre d'éléments par page
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);

  const loadDetails = async (page: number = 1) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔍 Loading audit details:', { page, limit, resultId: result.id });
      
      // Charger tous les résultats avec pagination
      const fetchedDetails = await getAuditResultDetails(token, auditId, result.id, page, limit);
      
      console.log('📊 Fetched details:', { 
        count: fetchedDetails.length, 
        page, 
        firstItemId: fetchedDetails[0]?.hubspot_id,
        lastItemId: fetchedDetails[fetchedDetails.length - 1]?.hubspot_id 
      });
      
      setDetails(fetchedDetails);
      
      // Calculer la pagination basée sur le nombre total d'éléments problématiques
      const totalItems = result.empty_count;
      setTotal(totalItems);
      setTotalPages(Math.ceil(totalItems / limit));
      
    } catch (err) {
      console.error('Error loading details:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des détails');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = () => {
    onToggle();
    if (!isExpanded && details.length === 0) {
      loadDetails(1);
    }
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    loadDetails(newPage);
  };

  const getDisplayValue = (data: HubSpotObjectData, fieldName: string) => {
    if (!data || !fieldName) return <span className="text-gray-400">—</span>;
    
    // Accéder aux données dans la structure HubSpot: data.properties[fieldName]
    const properties = data.properties || {};
    const value = properties[fieldName as keyof typeof properties];
    
    // Vérification plus précise des valeurs vides
    if (value === null || value === undefined || value === '' || value === 'null') {
      return <span className="text-red-500 italic">Manquant</span>;
    }
    
    // Formatage spécial pour certains champs
    if (fieldName === 'email' && typeof value === 'string') {
                  return <span className="text-forgeo-600">{value}</span>;
    }
    
    if (fieldName === 'phone' && typeof value === 'string') {
      return <span className="text-green-600">{value}</span>;
    }

    if (fieldName === 'amount' && typeof value === 'string') {
      const amount = parseFloat(value);
      if (!isNaN(amount)) {
        return <span className="font-medium">{amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</span>;
      }
    }
    
    return String(value);
  };

  const columns = getColumnsForCategory(result.category);

  return (
    <div className="border rounded-lg bg-white">
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={handleToggle}
      >
        <div className="flex items-center gap-3">
          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          <AlertCircle className="h-4 w-4 text-red-500" />
          <div>
            <h4 className="font-medium text-gray-900">
              {criteriaLabels[result.criterion] || result.criterion}
            </h4>
            <p className="text-sm text-gray-500">
              Champ: {result.field_name}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <Badge variant={result.empty_count > 0 ? "destructive" : "default"}>
            {result.empty_count} / {result.total_count}
          </Badge>
          <div className="text-sm text-gray-500">
            {result.empty_count > 0 ? (
              <span className="text-red-600 font-medium">
                {((result.empty_count / result.total_count) * 100).toFixed(1)}% problématiques
              </span>
            ) : (
              <span className="text-green-600 font-medium">✓ Aucun problème</span>
            )}
          </div>
        </div>
      </div>
      
      {isExpanded && (
        <div className="border-t bg-white">
          {loading && (
            <div className="p-8 text-center">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
              <p className="text-sm text-gray-500">Chargement des détails...</p>
            </div>
          )}
          
          {error && (
            <div className="p-4 text-center text-red-600 bg-red-50">
              <AlertCircle className="h-5 w-5 mx-auto mb-2" />
              <p className="text-sm">{error}</p>
            </div>
          )}
          
          {!loading && !error && details.length === 0 && result.empty_count > 0 && (
            <div className="p-4 text-center text-gray-500">
              <p className="text-sm">Aucun détail disponible</p>
            </div>
          )}
          
          {!loading && !error && details.length > 0 && (
            <div className="flex flex-col h-full">
              {/* Table avec style Notion - sans padding, hauteur fixe */}
              <div className="overflow-auto" style={{ height: '440px' }}>
                <table className="notion-table">
                  <thead>
                    <tr className="notion-tr">
                      {columns.map((column) => {
                        const Icon = column.icon;
                        return (
                          <th
                            key={column.key}
                            className="notion-th"
                            style={{ width: `${column.width}px` }}
                          >
                            <div className="notion-th-content">
                              <Icon className="notion-icon" />
                              <span className="font-medium">{column.label}</span>
                            </div>
                          </th>
                        );
                      })}
                      <th className="notion-th" style={{ width: '200px' }}>
                        <div className="notion-th-content">
                          <AlertCircle className="notion-icon" />
                          <span className="font-medium">Champ problématique</span>
                        </div>
                      </th>
                      <th className="notion-th" style={{ width: '120px' }}>
                        <div className="notion-th-content">
                          <AlertCircle className="notion-icon" />
                          <span className="font-medium">Statut</span>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {details.map((detail) => (
                      <tr key={detail.id} className="notion-tr">
                        {columns.map((column) => (
                          <td key={column.key} className="notion-td" style={{ width: `${column.width}px` }}>
                            {column.key === 'hubspot_id' ? (
                              <span className="font-mono text-sm">{detail.hubspot_id}</span>
                            ) : (
                              getDisplayValue(detail.object_data, column.key)
                            )}
                          </td>
                        ))}
                        <td className="notion-td" style={{ width: '200px' }}>
                          <div className="flex flex-col">
                            <span className="text-xs text-gray-500 mb-1">{result.field_name}:</span>
                            <span className="text-sm">
                              {getDisplayValue(detail.object_data, result.field_name)}
                            </span>
                          </div>
                        </td>
                        <td className="notion-td" style={{ width: '120px' }}>
                          <span className="notion-tag bg-red-50 text-red-700 border-red-200">
                            Problématique
                          </span>
                        </td>
                      </tr>
                    ))}
                    
                    {/* Ligne de loading pendant la mise à jour */}
                    {loading && details.length > 0 && (
                      <tr className="notion-tr">
                        <td colSpan={columns.length + 2} className="notion-td text-center py-4">
                          <div className="flex items-center justify-center gap-2 text-gray-500">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-forgeo-600"></div>
                            <span>Mise à jour des données...</span>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* Footer/Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 bg-white border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Affichage de {Math.min((currentPage - 1) * limit + 1, total)} à {Math.min(currentPage * limit, total)} sur {total.toLocaleString()} enregistrements
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1 || loading}
                        className="px-3 py-1 text-sm"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      
                      <div className="flex items-center gap-1">
                        {[...Array(Math.min(5, totalPages))].map((_, i) => {
                          const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                          if (pageNum > totalPages) return null;
                          
                          return (
                            <Button
                              key={pageNum}
                              variant={pageNum === currentPage ? "default" : "outline"}
                              size="sm"
                              onClick={() => handlePageChange(pageNum)}
                              disabled={loading}
                              className={`px-3 py-1 text-sm ${
                                                        pageNum === currentPage 
                          ? "bg-forgeo-400 text-black hover:bg-forgeo-500" 
                          : "border-gray-300 text-gray-700 hover:bg-gray-50"
                              }`}
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages || loading}
                        className="px-3 py-1 text-sm"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default function AuditsPage() {
  const { token } = useAuth();
  
  // États principaux
  const [auditResults, setAuditResults] = useState<AuditResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentAuditId, setCurrentAuditId] = useState<number | null>(null);
  const [auditStatus, setAuditStatus] = useState<'idle' | 'creating' | 'running' | 'completed'>('idle');
  const [lastAudit, setLastAudit] = useState<Audit | null>(null);
  
  // États pour les sections expansées
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    contact: true,
    company: true,
    deal: true
  });
  const [expandedCriteria, setExpandedCriteria] = useState<Record<number, boolean>>({});

  // Charger le dernier audit au démarrage
  useEffect(() => {
    const loadLastAudit = async () => {
      if (!token) return;
      
      setInitialLoading(true);
      setError(null);
      
    try {
        console.log('🔄 Chargement des audits existants...');
        const audits = await getAudits(token);
        console.log('📋 Audits récupérés:', audits);
        
        if (audits.length > 0) {
          // Trier par date de création (plus récent en premier)
          const sortedAudits = audits.sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
          
          const latestAudit = sortedAudits[0];
          console.log('🎯 Dernier audit trouvé:', latestAudit);
          console.log('📊 Statut du dernier audit:', latestAudit.status);
          
          setLastAudit(latestAudit);
          setCurrentAuditId(latestAudit.id);
          
          // Si l'audit est terminé, charger ses résultats
          if (latestAudit.status === 'completed') {
            console.log('📊 Chargement des résultats du dernier audit...');
            const results = await getAuditResults(token, latestAudit.id);
            console.log('📈 Résultats récupérés:', results);
            setAuditResults(results);
            setAuditStatus('completed');
          } else if (latestAudit.status === 'running') {
            console.log('🏃 Audit en cours d\'exécution');
            setAuditStatus('running');
          } else {
            console.log('⚠️ Statut d\'audit non reconnu:', latestAudit.status);
            setAuditStatus('idle');
          }
        } else {
          console.log('📝 Aucun audit existant trouvé');
          setAuditStatus('idle');
        }
      } catch (err) {
        console.error('❌ Erreur lors du chargement des audits:', err);
        setError(err instanceof Error ? err.message : 'Erreur lors du chargement des audits');
        setAuditStatus('idle');
      } finally {
        console.log('🏁 Fin du chargement initial');
        setInitialLoading(false);
      }
    };

    loadLastAudit();
  }, [token]);

  // Lancer un nouvel audit
  const handleNewAudit = async () => {
    if (!token) return;
    
    setLoading(true);
    setError(null);
    setAuditStatus('creating');
    setAuditResults([]);
    
                         try {
      // Créer l'audit avec un titre et description par défaut
      // Le backend gèrera automatiquement la synchronisation
      const auditResponse = await createAudit(token);
      setCurrentAuditId(auditResponse.id);
      
      // Créer l'objet audit pour le state
      const newAudit: Audit = {
        id: auditResponse.id,
        user_id: auditResponse.user_id,
        sync_id: auditResponse.sync_id, // Maintenant optionnel
        status: 'running',
        created_at: auditResponse.created_at,
        completed_at: undefined,
        title: auditResponse.title,
        description: auditResponse.description
      };
      setLastAudit(newAudit);
      
      setAuditStatus('running');
      
      // Exécuter l'audit - le backend utilisera automatiquement la dernière sync
      await runAudit(token, auditResponse.id);
      
      // Récupérer les résultats
      const results = await getAuditResults(token, auditResponse.id);
      setAuditResults(results);
      
      // Mettre à jour l'audit comme terminé
      setLastAudit(prev => prev ? {
        ...prev,
        status: 'completed',
        completed_at: new Date().toISOString()
      } : null);
      
      setAuditStatus('completed');
      
         } catch (err) {
       console.error('Error during audit:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'audit');
       setAuditStatus('idle');
    } finally {
      setLoading(false);
    }
  };

  // Grouper les résultats par catégorie
  const groupedResults: AuditCriteriaGroup[] = React.useMemo(() => {
    const groups = [
      {
        category: 'contact',
        icon: Users,
        title: 'Contact Cleaning',
        criteria: auditResults.filter(r => r.category === 'contact'),
        isExpanded: expandedGroups.contact
      },
      {
        category: 'company',
        icon: Building,
        title: 'Company Cleaning',
        criteria: auditResults.filter(r => r.category === 'company'),
        isExpanded: expandedGroups.company
      },
      {
        category: 'deal',
        icon: DollarSign,
        title: 'Deals Cleaning',
        criteria: auditResults.filter(r => r.category === 'deal'),
        isExpanded: expandedGroups.deal
      }
    ];
    
    return groups;
  }, [auditResults, expandedGroups]);

  // Statistiques globales
  const totalIssues = auditResults.reduce((sum, result) => sum + result.empty_count, 0);
  const totalRecords = auditResults.reduce((sum, result) => sum + result.total_count, 0);
  const issuePercentage = totalRecords > 0 ? (totalIssues / totalRecords) * 100 : 0;

  return (
    <>
      <style>{tableStyles}</style>
      <div className="h-full bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Audits</h1>
          </div>
          {!initialLoading && lastAudit && auditStatus === 'completed' && (
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-forgeo-600" />
              <span className="text-forgeo-700 font-medium">Dernier audit disponible:</span>
              <span className="text-forgeo-600">
                Audit #{lastAudit.id} • Créé le {new Date(lastAudit.created_at).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
                {lastAudit.completed_at && (
                  <> • Terminé le {new Date(lastAudit.completed_at).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</>
                )}
              </span>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleNewAudit}
            disabled={loading}
            size="sm"
            className="gap-2 bg-forgeo-400 hover:bg-forgeo-500 text-black"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Nouvel Audit
          </Button>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Chargement initial */}
        {initialLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-forgeo-500" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Chargement des audits...
              </h3>
              <p className="text-gray-500">
                Recherche du dernier audit disponible
              </p>
            </div>
          </div>
        )}


        
        {/* État de l'audit */}
        {!initialLoading && auditStatus !== 'idle' && (
          <div className="mb-8 p-6 bg-white rounded-lg border">
            <div className="flex items-center gap-3 mb-4">
              {auditStatus === 'creating' && (
                <>
                  <Loader2 className="h-5 w-5 animate-spin text-forgeo-500" />
                                     <span className="font-medium">Création de l&apos;audit en cours...</span>
                </>
              )}
              {auditStatus === 'running' && (
                <>
                  <Loader2 className="h-5 w-5 animate-spin text-orange-500" />
                  <span className="font-medium">Analyse en cours...</span>
                </>
              )}
              {auditStatus === 'completed' && (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                                     <span className="font-medium">Audit terminé !</span>
                </>
              )}
            </div>
            
            {auditStatus === 'completed' && auditResults.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    <span className="font-medium text-red-700">Problèmes détectés</span>
                  </div>
                  <p className="text-2xl font-bold text-red-600">{totalIssues.toLocaleString()}</p>
                  <p className="text-sm text-red-600">{issuePercentage.toFixed(1)}% des enregistrements</p>
                </div>
                
                <div className="bg-forgeo-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="h-5 w-5 text-forgeo-600" />
                    <span className="font-medium text-forgeo-700">Total analysé</span>
                  </div>
                  <p className="text-2xl font-bold text-forgeo-600">{totalRecords.toLocaleString()}</p>
                  <p className="text-sm text-forgeo-600">enregistrements</p>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    <span className="font-medium text-green-700">Score de qualité</span>
                  </div>
                  <p className="text-2xl font-bold text-green-600">{(100 - issuePercentage).toFixed(1)}%</p>
                  <p className="text-sm text-green-600">des données correctes</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Erreur */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <span className="font-medium text-red-700">Erreur</span>
            </div>
            <p className="mt-1 text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Résultats de l'audit */}
        {auditResults.length > 0 && (
          <div className="space-y-6">
            {groupedResults.map((group) => {
              const Icon = group.icon;
              const hasIssues = group.criteria.some(c => c.empty_count > 0);
              const totalIssuesInGroup = group.criteria.reduce((sum, c) => sum + c.empty_count, 0);
              
              return (
                <div key={group.category} className="bg-white rounded-lg border">
                  {/* Header du groupe */}
                  <div 
                    className="flex items-center justify-between p-6 cursor-pointer hover:bg-gray-50 transition-colors border-b"
                    onClick={() => setExpandedGroups(prev => ({
                      ...prev,
                      [group.category]: !prev[group.category]
                    }))}
                  >
                    <div className="flex items-center gap-4">
                      {group.isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                      <Icon className="h-6 w-6 text-gray-600" />
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{group.title}</h3>
                        <p className="text-sm text-gray-500">
                          {group.criteria.length} critères analysés
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      {hasIssues ? (
                        <Badge variant="destructive">
                          {totalIssuesInGroup} problèmes
                        </Badge>
                      ) : (
                        <Badge variant="default">
                          ✓ Aucun problème
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {/* Contenu du groupe */}
                  {group.isExpanded && (
                    <div className="p-6 space-y-4">
                      {group.criteria.length === 0 && (
                        <p className="text-gray-500 text-center py-8">
                          Aucun critère trouvé pour cette catégorie
                        </p>
                      )}
                      
                      {group.criteria.map((result) => (
                        <CriteriaDetails
                          key={result.id}
                          auditId={currentAuditId!}
                          result={result}
                          token={token!}
                          isExpanded={expandedCriteria[result.id] || false}
                          onToggle={() => setExpandedCriteria(prev => ({
                            ...prev,
                            [result.id]: !prev[result.id]
                          }))}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

                {/* État initial - Aucun audit existant */}
        {!initialLoading && auditStatus === 'idle' && auditResults.length === 0 && !lastAudit && (
          <div className="text-center py-12">
            <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Prêt à analyser vos données
            </h3>
            <p className="text-gray-500">
              Aucun audit trouvé. Lancez votre premier audit pour identifier les problèmes de qualité dans vos données HubSpot.
            </p>
          </div>
        )}
        </div>
      </div>
    </div>
    </>
  );
}
