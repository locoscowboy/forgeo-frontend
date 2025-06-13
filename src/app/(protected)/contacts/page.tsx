"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { getContacts, Contact } from "@/lib/api/contacts";
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
  AlertCircle,
  User
} from "lucide-react";

// Nos nouveaux composants
import AddColumnDropdown from "@/components/table/AddColumnDropdown";
import CellRenderer from "@/components/table/CellRenderer";
import { useTableColumns } from "@/hooks/useTableColumns";
import { DEFAULT_CONTACT_COLUMNS } from "@/lib/hubspot-properties";

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

export default function ContactsPage() {
  const { token } = useAuth();
  
  // États principaux
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // États de pagination et recherche
  const [searchParams, setSearchParams] = useState<SearchParams>({
    page: 1,
    limit: 50,
    search: "",
    sortField: "firstname",
    sortOrder: "asc"
  });
  
  // États des métadonnées
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  
  // Notre nouveau système de colonnes
  const {
    visibleColumns,
    columnWidths,
    activeProperties,
    addColumn,
    removeColumn,
    updateColumnWidth,
    resetColumns,
    reorderColumns
  } = useTableColumns({
    type: 'contact',
    defaultColumns: [...DEFAULT_CONTACT_COLUMNS, 'company', 'jobtitle', 'lifecyclestage', 'city', 'hs_linkedin_url']
  });
  
  const [isResizing, setIsResizing] = useState(false);
  const [resizingColumn, setResizingColumn] = useState<string | null>(null);
  const [draggedColumn, setDraggedColumn] = useState<number | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<number | null>(null);
  const tableRef = useRef<HTMLTableElement>(null);

  // Debounce pour la recherche
  const [searchValue, setSearchValue] = useState("");
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fonctions de chargement des données
  const loadContacts = useCallback(async () => {
    if (!token) return;

    try {
      setError(null);
      if (contacts.length === 0) setLoading(true);

      const response = await getContacts(
        token,
        searchParams.page,
        searchParams.limit,
        searchParams.search,
        searchParams.sortField,
        searchParams.sortOrder
      );

      setContacts(response.contacts);
      setTotal(response.total);
      setTotalPages(response.total_pages);
    } catch (err) {
      console.error('Error loading contacts:', err);
      const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [token, searchParams, contacts.length]);

  // Chargement initial et lors des changements de paramètres
  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  // Gestionnaires d'événements
  const handleRetry = () => {
    setError(null);
    loadContacts();
  };

  const handleSearch = (value: string) => {
    setSearchValue(value);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setSearchParams(prev => ({
        ...prev,
        page: 1,
        search: value
      }));
    }, 300);
  };

  const handleSort = (field: string) => {
    setSearchParams(prev => ({
      ...prev,
      sortField: field,
      sortOrder: prev.sortField === field && prev.sortOrder === 'asc' ? 'desc' : 'asc',
      page: 1
    }));
  };

  const handlePageChange = (newPage: number) => {
    setSearchParams(prev => ({ ...prev, page: newPage }));
  };

  const handleLimitChange = (newLimit: number) => {
    setSearchParams(prev => ({ 
      ...prev, 
      limit: newLimit, 
      page: 1 
    }));
  };

  // Fonctions utilitaires
  const getSortIcon = (field: string) => {
    const isActive = searchParams.sortField === field;
    const className = `sort-icon ${isActive ? 'active' : ''}`;
    
    if (!isActive) return <ArrowUpDown className={className} />;
    return searchParams.sortOrder === "asc" ? 
      <ArrowUp className={className} /> : 
      <ArrowDown className={className} />;
  };

  // Fonctions de redimensionnement des colonnes
  const handleMouseDown = (e: React.MouseEvent, columnKey: string) => {
    e.preventDefault();
    setIsResizing(true);
    setResizingColumn(columnKey);
    
    const startX = e.clientX;
    const startWidth = columnWidths[columnKey] || 150;

    const handleMouseMove = (e: MouseEvent) => {
      const diff = e.clientX - startX;
      const newWidth = Math.max(80, startWidth + diff);
      updateColumnWidth(columnKey, newWidth);
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

  // Fonctions de drag & drop des colonnes
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedColumn(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', '');
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(index);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedColumn !== null && draggedColumn !== index) {
      reorderColumns(draggedColumn, index);
    }
    setDraggedColumn(null);
    setDragOverColumn(null);
  };

  const handleDragEnd = () => {
    setDraggedColumn(null);
    setDragOverColumn(null);
  };

  // Obtenir la valeur d'une cellule depuis les données du contact
  const getCellValue = (contact: Contact, columnKey: string): string | number | boolean | null | undefined => {
    // Essayer d'abord les propriétés de base
    if (columnKey in contact && columnKey !== 'properties') {
      return (contact as unknown as Record<string, unknown>)[columnKey] as string | number | boolean | null | undefined;
    }
    
    // Puis chercher dans les propriétés étendues
    if (contact.properties && columnKey in contact.properties) {
      return contact.properties[columnKey];
    }
    
    return null;
  };

  // Composants de rendu conditionnel
  if (loading && contacts.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-forgeo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Chargement des contacts...</p>
          <p className="mt-2 text-sm text-gray-500">Veuillez patienter</p>
        </div>
      </div>
    );
  }

  if (error && contacts.length === 0) {
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
            <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
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
        {error && contacts.length > 0 && (
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
                placeholder="Rechercher des contacts..."
                value={searchValue}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 border-gray-300 focus:border-forgeo-500 focus:ring-forgeo-500"
                disabled={loading}
              />
            </div>
            
            <div className="flex items-center gap-4">
              {/* Nouveau bouton Add Column */}
              <AddColumnDropdown
                type="contact"
                visibleColumns={visibleColumns}
                onColumnAdd={addColumn}
                onColumnRemove={removeColumn}
                onReset={resetColumns}
              />
              
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
                {total.toLocaleString()} contacts • Page {searchParams.page} of {totalPages}
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
                  {activeProperties.map((property, index) => {
                    const Icon = property.icon;
                    const width = columnWidths[property.key] || property.width || 150;
                    const isDragging = draggedColumn === index;
                    const isDragOver = dragOverColumn === index;
                    
                    return (
                      <th
                        key={property.key}
                        className={`notion-th ${isDragging ? 'dragging' : ''} ${isDragOver ? 'drag-over' : ''}`}
                        style={{ width: `${width}px` }}
                        draggable={!isResizing}
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, index)}
                        onDragEnd={handleDragEnd}
                      >
                        <button
                          onClick={() => handleSort(property.key)}
                          className="notion-th-content w-full text-left"
                          disabled={loading}
                        >
                          <Icon className="notion-icon" />
                          <span className="font-medium">{property.label}</span>
                          <div className="ml-auto">
                            {getSortIcon(property.key)}
                          </div>
                        </button>
                        
                        {/* Resizer */}
                        <div
                          className={`resizer ${resizingColumn === property.key ? 'isResizing' : ''}`}
                          onMouseDown={(e) => handleMouseDown(e, property.key)}
                        />
                      </th>
                    );
                  })}
                </tr>
              </thead>

              {/* Body */}
              <tbody>
                {!loading && contacts.length === 0 && !error ? (
                  <tr className="border-0">
                    <td colSpan={activeProperties.length} className="border-0 bg-transparent py-16 text-center">
                      <div className="flex flex-col items-center justify-center gap-4 text-gray-500">
                        <User className="h-16 w-16 text-gray-300" />
                        <div className="space-y-2">
                          <h3 className="text-lg font-semibold text-gray-900">Aucun contact trouvé</h3>
                          <p className="text-sm text-gray-600 max-w-md">Commencez par créer votre premier contact ou ajustez vos filtres de recherche.</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : null}
                
                {contacts.map((contact) => (
                  <tr key={contact.id} className="notion-tr">
                    {activeProperties.map((property) => {
                      const width = columnWidths[property.key] || property.width || 150;
                      const value = getCellValue(contact, property.key);
                      
                      return (
                        <td 
                          key={property.key} 
                          className="notion-td" 
                          style={{ width: `${width}px` }}
                        >
                          <CellRenderer 
                            value={value}
                            property={property}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
                
                {/* Ligne de loading pendant la mise à jour */}
                {loading && contacts.length > 0 && (
                  <tr className="notion-tr">
                    <td colSpan={activeProperties.length} className="notion-td text-center py-4">
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
              Affichage de {Math.min((searchParams.page - 1) * searchParams.limit + 1, total)} à {Math.min(searchParams.page * searchParams.limit, total)} sur {total.toLocaleString()} contacts
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
                {(() => {
                  const maxVisiblePages = Math.min(5, totalPages);
                  const halfVisible = Math.floor(maxVisiblePages / 2);
                  let startPage = Math.max(1, searchParams.page - halfVisible);
                  const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
                  
                  // Ajuster startPage si endPage est trop proche de totalPages
                  if (endPage - startPage + 1 < maxVisiblePages) {
                    startPage = Math.max(1, endPage - maxVisiblePages + 1);
                  }
                  
                  return Array.from({ length: endPage - startPage + 1 }, (_, i) => {
                    const page = startPage + i;
                    return (
                      <Button
                        key={page}
                        variant={page === searchParams.page ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(page)}
                        disabled={loading}
                        className="px-3 py-1 text-sm"
                      >
                        {page}
                      </Button>
                    );
                  });
                })()}
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