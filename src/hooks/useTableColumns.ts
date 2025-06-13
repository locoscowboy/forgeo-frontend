import { useState, useEffect, useMemo, useCallback } from 'react';
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
  storageKey = `table-columns-${type}`
}: UseTableColumnsOptions): UseTableColumnsReturn {
  
  const properties = type === 'contact' ? CONTACT_PROPERTIES : COMPANY_PROPERTIES;
  
  // État des colonnes visibles
  const [visibleColumns, setVisibleColumns] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`${storageKey}-visible`);
      return saved ? JSON.parse(saved) : defaultColumns;
    }
    return defaultColumns;
  });

  // État des largeurs de colonnes
  const [columnWidths, setColumnWidths] = useState<ColumnState>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`${storageKey}-widths`);
      return saved ? JSON.parse(saved) : {};
    }
    return {};
  });

  // Fonction pour obtenir la largeur d'une colonne
  const getColumnWidth = useCallback((columnKey: string): number => {
    if (columnWidths[columnKey]) {
      return columnWidths[columnKey];
    }
    
    const property = getPropertyByKey(columnKey, type);
    return property?.width || 150;
  }, [columnWidths, type]);

  // Sauvegarder dans localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`${storageKey}-visible`, JSON.stringify(visibleColumns));
    }
  }, [visibleColumns, storageKey]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`${storageKey}-widths`, JSON.stringify(columnWidths));
    }
  }, [columnWidths, storageKey]);

  // Propriétés actives (visibles) avec leurs métadonnées
  const activeProperties = useMemo(() => {
    return visibleColumns
      .map(columnKey => getPropertyByKey(columnKey, type))
      .filter((prop): prop is HubSpotProperty => prop !== undefined);
  }, [visibleColumns, type, getColumnWidth]);

  // Actions
  const addColumn = useCallback((columnKey: string) => {
    if (!visibleColumns.includes(columnKey)) {
      setVisibleColumns(prev => [...prev, columnKey]);
    }
  }, [visibleColumns]);

  const removeColumn = useCallback((columnKey: string) => {
    // Protéger certaines colonnes essentielles
    const protectedColumns = type === 'contact' 
      ? ['firstname', 'lastname', 'email'] 
      : ['name', 'domain'];
    
    if (!protectedColumns.includes(columnKey)) {
      setVisibleColumns(prev => prev.filter(col => col !== columnKey));
    }
  }, [type]);

  const updateColumnWidth = useCallback((columnKey: string, width: number) => {
    setColumnWidths(prev => ({
      ...prev,
      [columnKey]: Math.max(80, Math.min(500, width)) // Min 80px, Max 500px
    }));
  }, []);

  const resetColumns = useCallback(() => {
    setVisibleColumns(defaultColumns);
    setColumnWidths({});
  }, [defaultColumns]);

  const reorderColumns = useCallback((fromIndex: number, toIndex: number) => {
    setVisibleColumns(prev => {
      const newColumns = [...prev];
      const [removed] = newColumns.splice(fromIndex, 1);
      newColumns.splice(toIndex, 0, removed);
      return newColumns;
    });
  }, []);

  return {
    visibleColumns,
    columnWidths,
    activeProperties,
    addColumn,
    removeColumn,
    updateColumnWidth,
    resetColumns,
    reorderColumns
  };
} 