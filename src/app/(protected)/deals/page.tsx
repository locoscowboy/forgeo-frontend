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
  AlertCircle,
  DollarSign
} from "lucide-react";
import { PageHeader } from "@/components/page-header";

// Nos nouveaux composants
import AddColumnDropdown from "@/components/table/AddColumnDropdown";
import SortDropdown from "@/components/table/SortDropdown";
import FilterDropdown from "@/components/table/FilterDropdown";
import CellRenderer from "@/components/table/CellRenderer";
import { useTableColumns } from "@/hooks/useTableColumns";
import { DEFAULT_DEAL_COLUMNS } from "@/lib/hubspot-properties";

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
    background-color: #fafafa;
  }
  
  .resizer {
    position: absolute;
    top: 0;
    right: 0;
    width: 8px;
    height: 100%;
    cursor: col-resize;
    user-select: none;
    background-color: transparent;
    z-index: 10;
  }
  
  .resizer:hover, .resizer.isResizing {
    background-color: rgba(0, 128, 255, 0.3);
  }
  
  .notion-icon {
    flex-shrink: 0;
    width: 16px;
    height: 16px;
  }
`;

// Types
interface SortCriteria {
  field: string;
  order: 'asc' | 'desc';
}

interface FilterCriteria {
  field: string;
  operator: 'contains' | 'equals' | 'not_equals' | 'starts_with' | 'ends_with' | 'is_empty' | 'is_not_empty';
  value: string;
  connector?: 'and' | 'or';
}

interface FilterGroup {
  filters: FilterCriteria[];
  connector: 'and' | 'or';
}

export default function DealsPage() {
  const { token } = useAuth();
  
  // États principaux
  const [deals, setDeals] = useState<Deal[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // États des filtres/tri
  const [searchTerm, setSearchTerm] = useState("");
  const [sortCriteria, setSortCriteria] = useState<SortCriteria[]>([]);
  const [filterGroups, setFilterGroups] = useState<FilterGroup[]>([]);
  
  // États du redimensionnement
  const [resizingColumn, setResizingColumn] = useState<string | null>(null);
  
  // Hook personnalisé pour gérer les colonnes
  const {
    visibleColumns,
    columnWidths,
    activeProperties,
    addColumn,
    removeColumn,
    updateColumnWidth,
    resetColumns,
  } = useTableColumns({
    type: 'deal',
    defaultColumns: DEFAULT_DEAL_COLUMNS,
    storageKey: 'table-columns-deals'
  });

  const tableRef = useRef<HTMLTableElement>(null);

  // Fonction pour charger les deals
  const fetchDeals = useCallback(async () => {
    if (!token) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await getDeals(token, currentPage, pageSize);
      setDeals(response.deals);
      setTotalPages(response.total_pages);
    } catch (err) {
      console.error("Error fetching deals:", err);
      setError(err instanceof Error ? err.message : "Failed to load deals");
      setDeals([]);
    } finally {
      setLoading(false);
    }
  }, [token, currentPage, pageSize]);

  useEffect(() => {
    fetchDeals();
  }, [fetchDeals]);

  // Helper pour récupérer la valeur d'une cellule
  const getCellValue = (deal: Deal, field: string): string | number | boolean | null | undefined => {
    return deal[field as keyof Deal];
  };

  // Appliquer les filtres
  const applyFilters = useCallback((data: Deal[], filterGroups: FilterGroup[]): Deal[] => {
    if (filterGroups.length === 0) return data;

    return data.filter(deal => {
      return filterGroups.some(group => {
        return group.filters.every(filter => {
          const value = getCellValue(deal, filter.field);
          const stringValue = value?.toString().toLowerCase() || '';
          const filterValue = filter.value.toLowerCase();

          switch (filter.operator) {
            case 'contains':
              return stringValue.includes(filterValue);
            case 'equals':
              return stringValue === filterValue;
            case 'not_equals':
              return stringValue !== filterValue;
            case 'starts_with':
              return stringValue.startsWith(filterValue);
            case 'ends_with':
              return stringValue.endsWith(filterValue);
            case 'is_empty':
              return !value || value === '';
            case 'is_not_empty':
              return value && value !== '';
            default:
              return true;
          }
        });
      });
    });
  }, []);

  // Appliquer le tri
  const applySorting = useCallback((data: Deal[], sortCriteria: SortCriteria[]): Deal[] => {
    if (sortCriteria.length === 0) return data;

    const sortedData = [...data];
    
    sortedData.sort((a, b) => {
      for (const criteria of sortCriteria) {
        const aValue = getCellValue(a, criteria.field);
        const bValue = getCellValue(b, criteria.field);
        
        const aStr = aValue?.toString() || '';
        const bStr = bValue?.toString() || '';
        
        let comparison = 0;
        
        const aNum = parseFloat(aStr);
        const bNum = parseFloat(bStr);
        
        if (!isNaN(aNum) && !isNaN(bNum)) {
          comparison = aNum - bNum;
        } else {
          comparison = aStr.localeCompare(bStr);
        }
        
        if (comparison !== 0) {
          return criteria.order === 'asc' ? comparison : -comparison;
        }
      }
      return 0;
    });
    
    return sortedData;
  }, []);

  // Appliquer la recherche
  const applySearch = useCallback((data: Deal[], searchTerm: string): Deal[] => {
    if (!searchTerm) return data;
    
    const lowerSearch = searchTerm.toLowerCase();
    return data.filter(deal => {
      return Object.values(deal).some(value => 
        value?.toString().toLowerCase().includes(lowerSearch)
      );
    });
  }, []);

  // Données filtrées et triées
  const filteredAndSortedDeals = React.useMemo(() => {
    let result = deals;
    result = applySearch(result, searchTerm);
    result = applyFilters(result, filterGroups);
    result = applySorting(result, sortCriteria);
    return result;
  }, [deals, searchTerm, filterGroups, sortCriteria, applySearch, applyFilters, applySorting]);

  // Handlers
  const handleSortChange = (newSortCriteria: SortCriteria[]) => {
    setSortCriteria(newSortCriteria);
  };

  const handleFilterChange = (newFilterGroups: FilterGroup[]) => {
    setFilterGroups(newFilterGroups);
  };

  // Fonctions de redimensionnement
  const handleMouseDown = (e: React.MouseEvent, columnKey: string) => {
    e.preventDefault();
    setResizingColumn(columnKey);
    
    const startX = e.clientX;
    const startWidth = columnWidths[columnKey] || 150;

    const handleMouseMove = (e: MouseEvent) => {
      const diff = e.clientX - startX;
      const newWidth = Math.max(80, startWidth + diff);
      updateColumnWidth(columnKey, newWidth);
    };

    const handleMouseUp = () => {
      setResizingColumn(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Composants de rendu conditionnel
  if (loading && deals.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-forgeo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Chargement des deals...</p>
          <p className="mt-2 text-sm text-gray-500">Veuillez patienter</p>
        </div>
      </div>
    );
  }

  if (error && deals.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Deals</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={fetchDeals}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <style dangerouslySetInnerHTML={{ __html: tableStyles }} />
      
      <PageHeader
        title="Deals"
        description="Gérez et suivez vos opportunités commerciales"
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="px-6 py-4 bg-white border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Rechercher des deals..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-gray-300 focus:border-forgeo-500 focus:ring-forgeo-500"
                disabled={loading}
              />
            </div>
            
            <div className="flex items-center gap-4">
              <SortDropdown
                type="deal"
                activeProperties={activeProperties}
                sortCriteria={sortCriteria}
                onSortChange={handleSortChange}
              />
              
              <FilterDropdown
                type="deal"
                activeProperties={activeProperties}
                filterGroups={filterGroups}
                onFilterChange={handleFilterChange}
              />
              
              <AddColumnDropdown
                type="deal"
                visibleColumns={visibleColumns}
                onColumnAdd={addColumn}
                onColumnRemove={removeColumn}
                onReset={resetColumns}
              />
            </div>
          </div>
        </div>

        {/* Table Container */}
        <div className="flex-1 overflow-hidden min-h-0">
          <div className="h-full overflow-x-auto overflow-y-auto">
            <table ref={tableRef} className="notion-table">
              <thead>
                <tr className="notion-tr">
                  {activeProperties.map((property) => {
                    const Icon = property.icon;
                    const width = columnWidths[property.key] || property.width || 150;
                    
                    return (
                      <th
                        key={property.key}
                        className="notion-th"
                        style={{ width: `${width}px` }}
                      >
                        <div className="notion-th-content w-full text-left">
                          <Icon className="notion-icon" />
                          <span className="font-medium">{property.label}</span>
                        </div>
                        
                        <div
                          className={`resizer ${resizingColumn === property.key ? 'isResizing' : ''}`}
                          onMouseDown={(e) => handleMouseDown(e, property.key)}
                        />
                      </th>
                    );
                  })}
                </tr>
              </thead>

              <tbody>
                {!loading && filteredAndSortedDeals.length === 0 && !error ? (
                  <tr className="border-0">
                    <td colSpan={activeProperties.length} className="border-0 bg-transparent py-16 text-center">
                      <div className="flex flex-col items-center justify-center gap-4 text-gray-500">
                        <DollarSign className="h-16 w-16 text-gray-300" />
                        <div className="space-y-2">
                          <h3 className="text-lg font-semibold text-gray-900">Aucun deal trouvé</h3>
                          <p className="text-sm text-gray-600 max-w-md">
                            {filterGroups.length > 0 || sortCriteria.length > 0 
                              ? "Aucun deal ne correspond aux critères de filtrage ou de tri."
                              : "Commencez par créer votre premier deal ou ajustez vos filtres de recherche."
                            }
                          </p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : null}

                {filteredAndSortedDeals.map((deal) => (
                  <tr key={deal.id} className="notion-tr hover:bg-gray-50 cursor-pointer">
                    {activeProperties.map((property) => {
                      const width = columnWidths[property.key] || property.width || 150;
                      const value = getCellValue(deal, property.key);

                      return (
                        <td
                          key={property.key}
                          className="notion-td"
                          style={{ width: `${width}px` }}
                        >
                          <CellRenderer value={value} property={property} />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="border-t border-gray-200 px-6 py-3 bg-white flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  Page {currentPage} sur {totalPages} • {filteredAndSortedDeals.length} deals
                </span>
                <Select
                  value={pageSize.toString()}
                  onValueChange={(value) => {
                    setPageSize(Number(value));
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 / page</SelectItem>
                    <SelectItem value="25">25 / page</SelectItem>
                    <SelectItem value="50">50 / page</SelectItem>
                    <SelectItem value="100">100 / page</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1 || loading}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Précédent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages || loading}
                >
                  Suivant
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
