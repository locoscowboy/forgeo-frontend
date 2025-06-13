import { useState, useEffect, useMemo } from 'react';
import { 
  HubSpotProperty, 
  CONTACT_PROPERTIES, 
  COMPANY_PROPERTIES,
  getPropertyByKey
} from '@/lib/hubspot-properties';

interface ColumnState {
  [key: string]: number; // key: width
}

interface UseTableColumnsOptions {
  type: 'contact' | 'company';
  defaultColumns: string[];
  storageKey?: string;
}

interface UseTableColumnsReturn {
  visibleColumns: string[];
  columnWidths: ColumnState;
  activeProperties: HubSpotProperty[];
  addColumn: (columnKey: string) => void;
  removeColumn: (columnKey: string) => void;
  updateColumnWidth: (columnKey: string, width: number) => void;
  resetColumns: () => void;
  reorderColumns: (fromIndex: number, toIndex: number) => void;
}

export function useTableColumns({
  type,
  defaultColumns,
  storageKey = `${type}-table-columns`
}: UseTableColumnsOptions): UseTableColumnsReturn {
  
  const allProperties = type === 'contact' ? CONTACT_PROPERTIES : COMPANY_PROPERTIES;
  
  // Initialiser les colonnes depuis le localStorage ou les colonnes par défaut
  const initializeColumns = () => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.columns || defaultColumns;
      }
    } catch (error) {
      console.warn('Failed to load columns from localStorage:', error);
    }
    return defaultColumns;
  };

  // Initialiser les largeurs depuis le localStorage ou les largeurs par défaut
  const initializeWidths = () => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.widths || {};
      }
    } catch (error) {
      console.warn('Failed to load column widths from localStorage:', error);
    }
    return {};
  };

  const [visibleColumns, setVisibleColumns] = useState<string[]>(initializeColumns);
  const [columnWidths, setColumnWidths] = useState<ColumnState>(initializeWidths);

  // Sauvegarder dans localStorage quand les colonnes ou largeurs changent
  useEffect(() => {
    try {
      const dataToSave = {
        columns: visibleColumns,
        widths: columnWidths,
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem(storageKey, JSON.stringify(dataToSave));
    } catch (error) {
      console.warn('Failed to save columns to localStorage:', error);
    }
  }, [visibleColumns, columnWidths, storageKey]);

  // Calculer les propriétés actives avec largeurs par défaut
  const activeProperties = useMemo(() => {
    return visibleColumns
      .map(columnKey => getPropertyByKey(columnKey, type))
      .filter(Boolean) as HubSpotProperty[];
  }, [visibleColumns, type]);

  // Obtenir la largeur d'une colonne (sauvegardée ou par défaut)
  const getColumnWidth = (columnKey: string): number => {
    if (columnWidths[columnKey]) {
      return columnWidths[columnKey];
    }
    
    const property = getPropertyByKey(columnKey, type);
    return property?.width || 150; // largeur par défaut
  };

  // Créer l'objet columnWidths avec toutes les colonnes visibles
  const computedColumnWidths = useMemo(() => {
    const widths: ColumnState = {};
    visibleColumns.forEach(columnKey => {
      widths[columnKey] = getColumnWidth(columnKey);
    });
    return widths;
  }, [visibleColumns, columnWidths]);

  const addColumn = (columnKey: string) => {
    if (!visibleColumns.includes(columnKey)) {
      setVisibleColumns(prev => [...prev, columnKey]);
      
      // Ajouter la largeur par défaut si elle n'existe pas
      const property = getPropertyByKey(columnKey, type);
      if (property?.width && !columnWidths[columnKey]) {
        setColumnWidths(prev => ({
          ...prev,
          [columnKey]: property.width!
        }));
      }
    }
  };

  const removeColumn = (columnKey: string) => {
    // Ne pas permettre de supprimer les colonnes de base essentielles
    const essentialColumns = type === 'contact' 
      ? ['firstname', 'lastname', 'email'] 
      : ['name', 'domain'];
    
    if (!essentialColumns.includes(columnKey)) {
      setVisibleColumns(prev => prev.filter(col => col !== columnKey));
    }
  };

  const updateColumnWidth = (columnKey: string, width: number) => {
    setColumnWidths(prev => ({
      ...prev,
      [columnKey]: Math.max(80, width) // largeur minimum de 80px
    }));
  };

  const resetColumns = () => {
    setVisibleColumns(defaultColumns);
    setColumnWidths({});
  };

  const reorderColumns = (fromIndex: number, toIndex: number) => {
    setVisibleColumns(prev => {
      const newColumns = [...prev];
      const [removed] = newColumns.splice(fromIndex, 1);
      newColumns.splice(toIndex, 0, removed);
      return newColumns;
    });
  };

  return {
    visibleColumns,
    columnWidths: computedColumnWidths,
    activeProperties,
    addColumn,
    removeColumn,
    updateColumnWidth,
    resetColumns,
    reorderColumns
  };
} 