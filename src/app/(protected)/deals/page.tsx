"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { getDeals, Deal } from "@/lib/api/deals";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
  Download,
  Plus,
  DollarSign,
  TrendingUp,
  Calendar,
  Target,
  Users,
  Building,
  AlertCircle
} from "lucide-react";

// Notion-like Table Styles
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
    cursor: pointer;
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
  
  .notion-th:hover {
    background-color: #f5f5f5;
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
    padding-right: 20px;
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
  
  .sort-icon {
    width: 12px;
    height: 12px;
    opacity: 0.5;
  }
  
  .sort-icon.active {
    opacity: 1;
    color: #2563eb;
  }

  .resizer {
    display: inline-block;
    background: transparent;
    width: 8px;
    height: 100%;
    position: absolute;
    right: 0;
    top: 0;
    transform: translateX(50%);
    z-index: 1;
    cursor: col-resize;
    touch-action: none;
  }

  .resizer:hover {
    background-color: #8ecae6;
  }

  .resizer.isResizing {
    background-color: #2563eb;
  }

  .noselect {
    -webkit-touch-callout: none;
    -webkit-user-select: none;
    -khtml-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
  }
`;

// Interface pour les paramètres de recherche
interface SearchParams {
  page: number;
  limit: number;
  search: string;
  sortField: string;
  sortOrder: 'asc' | 'desc';
}

export default function DealsPage() {
  const { token } = useAuth();
  
  // États principaux
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // États de pagination et recherche
  const [searchParams, setSearchParams] = useState<SearchParams>({
    page: 1,
    limit: 50,
    search: "",
    sortField: "dealname",
    sortOrder: "asc"
  });
  
  // États des métadonnées
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  
  // États de l'interface
  const [isResizing, setIsResizing] = useState(false);
  const [columnWidths, setColumnWidths] = useState({
    dealname: 250,
    amount: 120,
    dealstage: 150,
    closedate: 120,
    pipeline: 150,
    description: 300,
    lastmodifieddate: 150
  });

  // Fonction principale de récupération des deals
  const fetchDeals = useCallback(async (params: SearchParams) => {
    if (!token) {
      console.log('❌ No token available');
      setError("Session expirée. Veuillez vous reconnecter.");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔥 Fetching deals with params:', params);
      
      const response = await getDeals(
        token,
        params.page,
        params.limit,
        params.search || undefined,
        params.sortField,
        params.sortOrder
      );
      
      setDeals(response.deals);
      setTotalPages(response.total_pages);
      setTotal(response.total);
      
      console.log('✅ Deals loaded successfully:', {
        count: response.deals.length,
        total: response.total,
        page: response.page
      });
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erreur lors du chargement des deals";
      setError(errorMessage);
      console.error('💥 Error fetching deals:', err);
      
      // Si c'est une erreur d'authentification, ne pas garder des données obsolètes
      if (errorMessage.includes('Session expirée') || errorMessage.includes('non autorisé')) {
        setDeals([]);
      }
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Effect principal pour charger les deals
  useEffect(() => {
    if (token) {
      fetchDeals(searchParams);
    }
  }, [token, searchParams, fetchDeals]);

  // Fonction pour changer de page
  const handlePageChange = (newPage: number) => {
    setSearchParams(prev => ({ ...prev, page: newPage }));
  };

  // Fonction pour changer la recherche
  const handleSearchChange = (search: string) => {
    setSearchParams(prev => ({ ...prev, search, page: 1 }));
  };

  // Fonction pour changer le tri
  const handleSort = (field: string) => {
    setSearchParams(prev => ({
      ...prev,
      sortField: field,
      sortOrder: prev.sortField === field && prev.sortOrder === 'asc' ? 'desc' : 'asc',
      page: 1
    }));
  };

  // Fonction pour changer la limite
  const handleLimitChange = (limit: string) => {
    setSearchParams(prev => ({ ...prev, limit: parseInt(limit), page: 1 }));
  };

  // Fonction pour obtenir la couleur du stage
  const getDealStageColor = (stage: string) => {
    const stageColors: { [key: string]: string } = {
      'appointmentscheduled': 'bg-blue-100 text-blue-800',
      'qualifiedtobuy': 'bg-green-100 text-green-800',
      'presentationscheduled': 'bg-yellow-100 text-yellow-800',
      'decisionmakerboughtin': 'bg-purple-100 text-purple-800',
      'contractsent': 'bg-orange-100 text-orange-800',
      'closedwon': 'bg-green-100 text-green-800',
      'closedlost': 'bg-red-100 text-red-800',
    };
    return stageColors[stage.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  // Fonction pour obtenir l'icône de tri
  const getSortIcon = (field: string) => {
    if (searchParams.sortField !== field) {
      return <ArrowUpDown className="sort-icon" />;
    }
    return searchParams.sortOrder === 'asc' 
      ? <ArrowUp className="sort-icon active" />
      : <ArrowDown className="sort-icon active" />;
  };

  // Fonction pour formater le montant
  const formatAmount = (amount: string) => {
    if (!amount || amount === '0' || amount === '') return '—';
    const num = parseFloat(amount);
    if (isNaN(num)) return amount;
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0
    }).format(num);
  };

  // Fonction pour formater la date
  const formatDate = (dateString: string) => {
    if (!dateString) return '—';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR');
    } catch {
      return dateString;
    }
  };

  // Gestion du redimensionnement des colonnes
  const handleMouseDown = (e: React.MouseEvent, columnKey: string) => {
    e.preventDefault();
    setIsResizing(true);
    
    const startX = e.clientX;
    const startWidth = columnWidths[columnKey as keyof typeof columnWidths];
    
    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX;
      const newWidth = Math.max(80, startWidth + deltaX);
      
      setColumnWidths(prev => ({
        ...prev,
        [columnKey]: newWidth
      }));
    };
    
    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <>
      <style>{tableStyles}</style>
      <div className="flex flex-col h-full bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-lg">
                <DollarSign className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Deals</h1>
                <p className="text-sm text-gray-500">
                  {loading ? 'Chargement...' : `${total} deal${total > 1 ? 's' : ''} au total`}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-1" />
                Filtrer
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-1" />
                Exporter
              </Button>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Nouveau deal
              </Button>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="bg-white border-b px-6 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher des deals..."
                  value={searchParams.search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={searchParams.limit.toString()} onValueChange={handleLimitChange}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Erreur de chargement</h3>
                <p className="text-gray-500 mb-4">{error}</p>
                <Button onClick={() => fetchDeals(searchParams)}>
                  Réessayer
                </Button>
              </div>
            </div>
          ) : (
            <div className="h-full overflow-auto">
              <table className="notion-table">
                <thead>
                  <tr>
                    <th 
                      className="notion-th noselect" 
                      style={{ width: `${columnWidths.dealname}px` }}
                      onClick={() => handleSort('dealname')}
                    >
                      <div className="notion-th-content">
                        <DollarSign className="notion-icon" />
                        Nom du deal
                        {getSortIcon('dealname')}
                        <div 
                          className={`resizer ${isResizing ? 'isResizing' : ''}`}
                          onMouseDown={(e) => handleMouseDown(e, 'dealname')}
                        />
                      </div>
                    </th>
                    
                    <th 
                      className="notion-th noselect" 
                      style={{ width: `${columnWidths.amount}px` }}
                      onClick={() => handleSort('amount')}
                    >
                      <div className="notion-th-content">
                        <TrendingUp className="notion-icon" />
                        Montant
                        {getSortIcon('amount')}
                        <div 
                          className={`resizer ${isResizing ? 'isResizing' : ''}`}
                          onMouseDown={(e) => handleMouseDown(e, 'amount')}
                        />
                      </div>
                    </th>
                    
                    <th 
                      className="notion-th noselect" 
                      style={{ width: `${columnWidths.dealstage}px` }}
                      onClick={() => handleSort('dealstage')}
                    >
                      <div className="notion-th-content">
                        <Target className="notion-icon" />
                        Étape
                        {getSortIcon('dealstage')}
                        <div 
                          className={`resizer ${isResizing ? 'isResizing' : ''}`}
                          onMouseDown={(e) => handleMouseDown(e, 'dealstage')}
                        />
                      </div>
                    </th>
                    
                    <th 
                      className="notion-th noselect" 
                      style={{ width: `${columnWidths.closedate}px` }}
                      onClick={() => handleSort('closedate')}
                    >
                      <div className="notion-th-content">
                        <Calendar className="notion-icon" />
                        Date de clôture
                        {getSortIcon('closedate')}
                        <div 
                          className={`resizer ${isResizing ? 'isResizing' : ''}`}
                          onMouseDown={(e) => handleMouseDown(e, 'closedate')}
                        />
                      </div>
                    </th>
                    
                    <th 
                      className="notion-th noselect" 
                      style={{ width: `${columnWidths.pipeline}px` }}
                      onClick={() => handleSort('pipeline')}
                    >
                      <div className="notion-th-content">
                        <Building className="notion-icon" />
                        Pipeline
                        {getSortIcon('pipeline')}
                        <div 
                          className={`resizer ${isResizing ? 'isResizing' : ''}`}
                          onMouseDown={(e) => handleMouseDown(e, 'pipeline')}
                        />
                      </div>
                    </th>
                    
                    <th 
                      className="notion-th noselect" 
                      style={{ width: `${columnWidths.description}px` }}
                    >
                      <div className="notion-th-content">
                        Description
                        <div 
                          className={`resizer ${isResizing ? 'isResizing' : ''}`}
                          onMouseDown={(e) => handleMouseDown(e, 'description')}
                        />
                      </div>
                    </th>
                    
                    <th 
                      className="notion-th noselect" 
                      style={{ width: `${columnWidths.lastmodifieddate}px` }}
                      onClick={() => handleSort('lastmodifieddate')}
                    >
                      <div className="notion-th-content">
                        <Calendar className="notion-icon" />
                        Modifié
                        {getSortIcon('lastmodifieddate')}
                      </div>
                    </th>
                  </tr>
                </thead>
                
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8">
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                          <span className="ml-2">Chargement des deals...</span>
                        </div>
                      </td>
                    </tr>
                  ) : deals.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-gray-500">
                        Aucun deal trouvé
                      </td>
                    </tr>
                  ) : (
                    deals.map((deal) => (
                      <tr key={deal.id} className="notion-tr">
                        <td className="notion-td" style={{ width: `${columnWidths.dealname}px` }}>
                          {deal.dealname || <span className="text-gray-400">—</span>}
                        </td>
                        
                        <td className="notion-td" style={{ width: `${columnWidths.amount}px` }}>
                          <span className="font-medium">
                            {formatAmount(deal.amount)}
                          </span>
                        </td>
                        
                        <td className="notion-td" style={{ width: `${columnWidths.dealstage}px` }}>
                          {deal.dealstage ? (
                            <span className={`notion-tag ${getDealStageColor(deal.dealstage)}`}>
                              {deal.dealstage}
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        
                        <td className="notion-td" style={{ width: `${columnWidths.closedate}px` }}>
                          {formatDate(deal.closedate)}
                        </td>
                        
                        <td className="notion-td" style={{ width: `${columnWidths.pipeline}px` }}>
                          {deal.pipeline || <span className="text-gray-400">—</span>}
                        </td>
                        
                        <td className="notion-td" style={{ width: `${columnWidths.description}px` }}>
                          <div className="truncate" title={deal.description}>
                            {deal.description || <span className="text-gray-400">—</span>}
                          </div>
                        </td>
                        
                        <td className="notion-td" style={{ width: `${columnWidths.lastmodifieddate}px` }}>
                          {formatDate(deal.lastmodifieddate)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer avec pagination */}
        <div className="bg-white border-t px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              {loading ? (
                'Chargement...'
              ) : (
                `${((searchParams.page - 1) * searchParams.limit) + 1}-${Math.min(searchParams.page * searchParams.limit, total)} sur ${total} deals`
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(Math.max(1, searchParams.page - 1))}
                disabled={searchParams.page === 1 || loading}
                className="px-3 py-1 text-sm"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="flex items-center gap-1">
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  const pageNum = Math.max(1, Math.min(totalPages - 4, searchParams.page - 2)) + i;
                  if (pageNum > totalPages) return null;
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={pageNum === searchParams.page ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(pageNum)}
                      disabled={loading}
                      className={`px-3 py-1 text-sm ${
                        pageNum === searchParams.page 
                          ? "bg-blue-600 text-white hover:bg-blue-700" 
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
                onClick={() => handlePageChange(Math.min(totalPages, searchParams.page + 1))}
                disabled={searchParams.page === totalPages || loading}
                className="px-3 py-1 text-sm"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 