"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { getCompanies, Company } from "@/lib/api/companies";
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
  Building,
  Globe,
  Phone,
  MapPin,
  Users,
  Calendar,
  FileText,
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
    color: #facc15;
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
    background-color: #facc15;
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

export default function CompaniesPage() {
  const { token } = useAuth();
  
  // États principaux
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // États de pagination et recherche
  const [searchParams, setSearchParams] = useState<SearchParams>({
    page: 1,
    limit: 50,
    search: "",
    sortField: "name",
    sortOrder: "asc"
  });
  
  // États des métadonnées
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  
  // États de l'interface
  const [columnWidths, setColumnWidths] = useState({
    name: 200,
    domain: 180,
    website: 200,
    industry: 150,
    phone: 150,
    address: 200,
    city: 120,
    state: 100,
    zip: 80,
    country: 120,
    description: 250,
    founded_year: 100,
    numberofemployees: 120,
    lastmodifieddate: 150
  });
  
  const [isResizing, setIsResizing] = useState(false);
  const [resizingColumn, setResizingColumn] = useState<string | null>(null);
  const tableRef = useRef<HTMLTableElement>(null);

  // Debounce pour la recherche
  const [searchValue, setSearchValue] = useState("");
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fonction principale de récupération des companies
  const fetchCompanies = useCallback(async (params: SearchParams) => {
    if (!token) {
      console.log('❌ No token available');
      setError("Session expirée. Veuillez vous reconnecter.");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔥 Fetching companies with params:', params);
      
      const response = await getCompanies(
        token,
        params.page,
        params.limit,
        params.search || undefined,
        params.sortField,
        params.sortOrder
      );
      
      setCompanies(response.companies);
      setTotalPages(response.total_pages);
      setTotal(response.total);
      
      console.log('✅ Companies loaded successfully:', {
        count: response.companies.length,
        total: response.total,
        page: response.page
      });
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erreur lors du chargement des companies";
      setError(errorMessage);
      console.error('💥 Error fetching companies:', err);
      
      // Si c'est une erreur d'authentification, ne pas garder des données obsolètes
      if (errorMessage.includes('Session expirée') || errorMessage.includes('non autorisé')) {
        setCompanies([]);
      }
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Effect principal pour charger les companies
  useEffect(() => {
    if (token) {
      fetchCompanies(searchParams);
    }
  }, [token, searchParams, fetchCompanies]);

  // Fonction pour mettre à jour les paramètres de recherche
  const updateSearchParams = useCallback((updates: Partial<SearchParams>) => {
    setSearchParams(prev => {
      const newParams = { ...prev, ...updates };
      
      // Si on change autre chose que la page, remettre à la page 1
      if ('search' in updates || 'sortField' in updates || 'sortOrder' in updates || 'limit' in updates) {
        newParams.page = 1;
      }
      
      return newParams;
    });
  }, []);

  // Gestionnaires d'événements
  const handleSort = useCallback((field: string) => {
    console.log('🎯 Sort clicked:', field);
    
    updateSearchParams({
      sortField: field,
      sortOrder: searchParams.sortField === field && searchParams.sortOrder === "asc" ? "desc" : "asc"
    });
  }, [searchParams.sortField, searchParams.sortOrder, updateSearchParams]);

  const handleSearch = useCallback((value: string) => {
    setSearchValue(value);
    
    // Débounce de 300ms pour éviter trop d'appels API
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      console.log('🔍 Search:', value);
      updateSearchParams({ search: value });
    }, 300);
  }, [updateSearchParams]);

  const handlePageChange = useCallback((newPage: number) => {
    updateSearchParams({ page: newPage });
  }, [updateSearchParams]);

  const handleLimitChange = useCallback((newLimit: number) => {
    updateSearchParams({ limit: newLimit });
  }, [updateSearchParams]);

  const handleRetry = useCallback(() => {
    fetchCompanies(searchParams);
  }, [fetchCompanies, searchParams]);

  // Cleanup du timeout lors du démontage
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = null;
      }
    };
  }, []);

  // Fonctions utilitaires
  const getIndustryColor = (industry: string) => {
    const colors: { [key: string]: string } = {
      technology: "bg-forgeo-50 text-forgeo-700 border-forgeo-200",
      finance: "bg-green-50 text-green-700 border-green-200",
      healthcare: "bg-purple-50 text-purple-700 border-purple-200",
      education: "bg-orange-50 text-orange-700 border-orange-200",
      manufacturing: "bg-gray-50 text-gray-700 border-gray-200",
      retail: "bg-pink-50 text-pink-700 border-pink-200",
      other: "bg-gray-50 text-gray-700 border-gray-200",
    };
    return colors[industry?.toLowerCase()] || colors.other;
  };

  const getSortIcon = (field: string) => {
    const isActive = searchParams.sortField === field;
    const className = `sort-icon ${isActive ? 'active' : ''}`;
    
    if (!isActive) return <ArrowUpDown className={className} />;
    return searchParams.sortOrder === "asc" ? 
      <ArrowUp className={className} /> : 
      <ArrowDown className={className} />;
  };

  const columns = [
    { key: "name", label: "Name", icon: Building },
    { key: "domain", label: "Domain", icon: Globe },
    { key: "website", label: "Website", icon: Globe },
    { key: "industry", label: "Industry", icon: FileText },
    { key: "phone", label: "Phone", icon: Phone },
    { key: "city", label: "City", icon: MapPin },
    { key: "state", label: "State", icon: MapPin },
    { key: "country", label: "Country", icon: MapPin },
    { key: "founded_year", label: "Founded", icon: Calendar },
    { key: "numberofemployees", label: "Employees", icon: Users }
  ];

  // Fonctions de redimensionnement des colonnes
  const handleMouseDown = (e: React.MouseEvent, columnKey: string) => {
    e.preventDefault();
    setIsResizing(true);
    setResizingColumn(columnKey);
    
    const startX = e.clientX;
    const startWidth = columnWidths[columnKey as keyof typeof columnWidths];

    const handleMouseMove = (e: MouseEvent) => {
      const diff = e.clientX - startX;
      const newWidth = Math.max(80, startWidth + diff);
      
      setColumnWidths(prev => ({
        ...prev,
        [columnKey]: newWidth
      }));
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setResizingColumn(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Composants de rendu conditionnel
  if (loading && companies.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-forgeo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Chargement des companies...</p>
          <p className="mt-2 text-sm text-gray-500">Veuillez patienter</p>
        </div>
      </div>
    );
  }

  if (error && companies.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Erreur de chargement</h2>
          <p className="text-red-600 mb-4">{error}</p>
                        <Button onClick={handleRetry} className="bg-forgeo-400 hover:bg-forgeo-500 text-black">
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{tableStyles}</style>
      <div className={`h-full bg-gray-50 flex flex-col ${isResizing ? 'noselect' : ''}`}>
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 h-14 flex items-center justify-between flex-shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Companies</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button size="sm" className="gap-2 bg-forgeo-400 hover:bg-forgeo-500 text-black">
              <Plus className="h-4 w-4" />
              New
            </Button>
          </div>
        </div>

        {/* Message d'erreur en cas de problème pendant le chargement */}
        {error && companies.length > 0 && (
          <div className="bg-red-50 border-b border-red-200 px-6 py-3">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Erreur de mise à jour: {error}</span>
              <Button size="sm" variant="outline" onClick={handleRetry} className="ml-auto">
                Réessayer
              </Button>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="px-6 py-4 bg-white border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Rechercher des companies..."
                value={searchValue}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 border-gray-300 focus:border-forgeo-500 focus:ring-forgeo-500"
                disabled={loading}
              />
            </div>
            
            <div className="flex items-center gap-4">
              <Select 
                value={searchParams.limit.toString()} 
                onValueChange={(value) => handleLimitChange(Number(value))}
                disabled={loading}
              >
                <SelectTrigger className="w-40 border-gray-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25 lignes</SelectItem>
                  <SelectItem value="50">50 lignes</SelectItem>
                  <SelectItem value="100">100 lignes</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="text-sm text-gray-600">
                {total.toLocaleString()} companies • Page {searchParams.page} of {totalPages}
                {loading && " • Mise à jour..."}
              </div>
            </div>
          </div>
        </div>

        {/* Table Container */}
        <div className="flex-1 overflow-hidden min-h-0">
          <div className="h-full overflow-x-auto overflow-y-auto">
            <table ref={tableRef} className="notion-table">
              {/* Header */}
              <thead>
                <tr className="notion-tr">
                  {columns.map((column) => {
                    const Icon = column.icon;
                    const width = columnWidths[column.key as keyof typeof columnWidths];
                    
                    return (
                      <th
                        key={column.key}
                        className="notion-th"
                        style={{ width: `${width}px` }}
                      >
                        <button
                          onClick={() => handleSort(column.key)}
                          className="notion-th-content w-full text-left"
                          disabled={loading}
                        >
                          <Icon className="notion-icon" />
                          <span className="font-medium">{column.label}</span>
                          <div className="ml-auto">
                            {getSortIcon(column.key)}
                          </div>
                        </button>
                        
                        {/* Resizer */}
                        <div
                          className={`resizer ${resizingColumn === column.key ? 'isResizing' : ''}`}
                          onMouseDown={(e) => handleMouseDown(e, column.key)}
                        />
                      </th>
                    );
                  })}
                </tr>
              </thead>

              {/* Body */}
              <tbody>
                {!loading && companies.length === 0 && !error ? (
                  <tr className="border-0">
                    <td colSpan={columns.length} className="border-0 bg-transparent py-16 text-center">
                      <div className="flex flex-col items-center justify-center gap-4 text-gray-500">
                        <Building className="h-16 w-16 text-gray-300" />
                        <div className="space-y-2">
                          <h3 className="text-lg font-semibold text-gray-900">Aucune entreprise trouvée</h3>
                          <p className="text-sm text-gray-600 max-w-md">Commencez par créer votre première entreprise ou ajustez vos filtres de recherche.</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : null}
                
                {companies.map((company) => (
                  <tr key={company.id} className="notion-tr">
                    <td className="notion-td" style={{ width: `${columnWidths.name}px` }}>
                      {company.name || <span className="text-gray-400">—</span>}
                    </td>
                    
                    <td className="notion-td" style={{ width: `${columnWidths.domain}px` }}>
                      {company.domain || <span className="text-gray-400">—</span>}
                    </td>
                    
                    <td className="notion-td" style={{ width: `${columnWidths.website}px` }}>
                      {company.website ? (
                        <a 
                          href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-forgeo-600 hover:text-forgeo-800 hover:underline"
                        >
                          {company.website}
                        </a>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    
                    <td className="notion-td" style={{ width: `${columnWidths.industry}px` }}>
                      {company.industry ? (
                        <span className={`notion-tag ${getIndustryColor(company.industry)}`}>
                          {company.industry}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    
                    <td className="notion-td" style={{ width: `${columnWidths.phone}px` }}>
                      {company.phone || <span className="text-gray-400">—</span>}
                    </td>
                    
                    <td className="notion-td" style={{ width: `${columnWidths.city}px` }}>
                      {company.city || <span className="text-gray-400">—</span>}
                    </td>
                    
                    <td className="notion-td" style={{ width: `${columnWidths.state}px` }}>
                      {company.state || <span className="text-gray-400">—</span>}
                    </td>
                    
                    <td className="notion-td" style={{ width: `${columnWidths.country}px` }}>
                      {company.country || <span className="text-gray-400">—</span>}
                    </td>
                    
                    <td className="notion-td" style={{ width: `${columnWidths.founded_year}px` }}>
                      {company.founded_year || <span className="text-gray-400">—</span>}
                    </td>
                    
                    <td className="notion-td" style={{ width: `${columnWidths.numberofemployees}px` }}>
                      {company.numberofemployees ? (
                        <span className="text-gray-700">{parseInt(company.numberofemployees).toLocaleString()}</span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
                
                {/* Ligne de loading pendant la mise à jour */}
                {loading && companies.length > 0 && (
                  <tr className="notion-tr">
                    <td colSpan={columns.length} className="notion-td text-center py-4">
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
        </div>

        {/* Footer/Pagination */}
        <div className="px-6 py-4 bg-white border-t border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Affichage de {Math.min((searchParams.page - 1) * searchParams.limit + 1, total)} à {Math.min(searchParams.page * searchParams.limit, total)} sur {total.toLocaleString()} companies
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