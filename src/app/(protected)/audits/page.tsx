"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { 
  createAudit, 
  runAudit, 
  getAuditResults, 
  getAuditResultDetails,
  AuditResult,
  AuditDetail,
  HubSpotObjectData
} from "@/lib/api/audits";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3,
  Plus,
  Play,
  ChevronDown,
  ChevronRight,
  Users,
  Building,
  DollarSign,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  Loader2
} from "lucide-react";

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
  "inactive_30days": "Contacts inactifs (180 jours)",
  
  // Companies
  "empty_name": "Entreprises sans nom",
  "empty_domain": "Entreprises sans domaine",
  "duplicate_domain": "Entreprises avec domaine en double",
  "missing_industry": "Entreprises sans secteur",
  "missing_owner_company": "Entreprises sans propriétaire",
  
  // Deals
  "missing_amount": "Transactions sans montant",
  "missing_stage": "Transactions sans étape",
  "missing_closedate": "Transactions sans date de fermeture",
  "missing_owner_deal": "Transactions sans propriétaire"
};

// Composant pour afficher les détails d'un critère
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

  const loadDetails = async () => {
    if (loading || details.length > 0) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const fetchedDetails = await getAuditResultDetails(token, auditId, result.id, 1, 10);
      setDetails(fetchedDetails);
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
      loadDetails();
    }
  };

  const getDisplayValue = (data: HubSpotObjectData, fieldName: string) => {
    if (!data || !fieldName) return 'N/A';
    
    const value = data[fieldName];
    if (value === null || value === undefined || value === '') {
      return <span className="text-red-500 italic">Manquant</span>;
    }
    
    // Formatage spécial pour certains champs
    if (fieldName === 'email' && typeof value === 'string') {
      return <span className="text-blue-600">{value}</span>;
    }
    
    if (fieldName === 'phone' && typeof value === 'string') {
      return <span className="text-green-600">{value}</span>;
    }
    
    return String(value);
  };

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
        <div className="border-t bg-gray-50">
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
            <div className="p-4">
              <div className="mb-3">
                <h5 className="font-medium text-gray-900 mb-1">
                  Exemples d&apos;enregistrements problématiques
                </h5>
                <p className="text-xs text-gray-500">
                  Affichage des 10 premiers résultats sur {result.empty_count}
                </p>
              </div>
              
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {details.map((detail, index) => (
                  <div key={detail.id} className="flex items-center justify-between p-3 bg-white rounded border text-sm">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-mono">
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-medium text-gray-900">
                          HubSpot ID: {detail.hubspot_id}
                        </p>
                        {detail.object_data && (
                          <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                            {detail.object_data.firstname && (
                              <span>👤 {detail.object_data.firstname}</span>
                            )}
                            {detail.object_data.lastname && (
                              <span>{detail.object_data.lastname}</span>
                            )}
                            {detail.object_data.name && (
                              <span>🏢 {detail.object_data.name}</span>
                            )}
                            {detail.object_data.dealname && (
                              <span>💼 {detail.object_data.dealname}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-xs text-gray-500 mb-1">Valeur manquante:</p>
                      <p className="font-medium">
                        {getDisplayValue(detail.object_data, result.field_name)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              
              {result.empty_count > 10 && (
                <div className="mt-3 p-2 bg-blue-50 rounded text-center">
                  <p className="text-xs text-blue-700">
                    Et {result.empty_count - 10} autres enregistrements...
                  </p>
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
  const [error, setError] = useState<string | null>(null);
  const [currentAuditId, setCurrentAuditId] = useState<number | null>(null);
  const [auditStatus, setAuditStatus] = useState<'idle' | 'creating' | 'running' | 'completed'>('idle');
  
  // États pour les sections expansées
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    contact: true,
    company: true,
    deal: true
  });
  const [expandedCriteria, setExpandedCriteria] = useState<Record<number, boolean>>({});

  // Lancer un nouvel audit
  const handleNewAudit = async () => {
    if (!token) return;
    
    setLoading(true);
    setError(null);
    setAuditStatus('creating');
    setAuditResults([]);
    
                         try {
                       // Pour cet exemple, on utilise sync_id = 1 (la dernière sync)
                       // Dans une vraie app, on pourrait permettre à l&apos;utilisateur de choisir
      const auditResponse = await createAudit(token, 1);
      setCurrentAuditId(auditResponse.id);
      
      setAuditStatus('running');
      
      // Exécuter l'audit
      await runAudit(token, auditResponse.id);
      
      // Récupérer les résultats
      const results = await getAuditResults(token, auditResponse.id);
      setAuditResults(results);
      setAuditStatus('completed');
      
         } catch (err) {
       console.error('Error during audit:', err);
       setError(err instanceof Error ? err.message : 'Erreur lors de l&apos;audit');
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Audits</h1>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button 
                onClick={handleNewAudit}
                disabled={loading}
                className="flex items-center gap-2"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Lancer nouvel audit
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        
        {/* État de l'audit */}
        {auditStatus !== 'idle' && (
          <div className="mb-8 p-6 bg-white rounded-lg border">
            <div className="flex items-center gap-3 mb-4">
              {auditStatus === 'creating' && (
                <>
                  <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
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
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="h-5 w-5 text-blue-500" />
                    <span className="font-medium text-blue-700">Total analysé</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">{totalRecords.toLocaleString()}</p>
                  <p className="text-sm text-blue-600">enregistrements</p>
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

        {/* État initial */}
        {auditStatus === 'idle' && auditResults.length === 0 && (
          <div className="text-center py-12">
            <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Prêt à analyser vos données
            </h3>
                         <p className="text-gray-500 mb-6">
               Lancez un audit pour identifier les problèmes de qualité dans vos données HubSpot
             </p>
            <Button onClick={handleNewAudit} size="lg">
              <Play className="h-4 w-4 mr-2" />
                             Démarrer l&apos;audit
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
