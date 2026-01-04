import React, { useState } from 'react';
import { Plus, ChevronDown, Check, RotateCcw } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  HubSpotProperty, 
  CONTACT_PROPERTIES, 
  COMPANY_PROPERTIES,
  DEAL_PROPERTIES, 
  PROPERTY_CATEGORIES,
  getPropertiesByCategory,
  getCategoryInfo,
  CategoryInfo
} from '@/lib/hubspot-properties';

interface AddColumnDropdownProps {
  type: 'contact' | 'company' | 'deal';
  visibleColumns: string[];
  onColumnAdd: (columnKey: string) => void;
  onColumnRemove: (columnKey: string) => void;
  onReset: () => void;
}

const AddColumnDropdown: React.FC<AddColumnDropdownProps> = ({
  type,
  visibleColumns,
  onColumnAdd,
  onColumnRemove,
  onReset,
}) => {
  const [open, setOpen] = useState(false);
  
  // Obtenir la liste des propriétés selon le type
  const allProperties = type === 'contact' ? CONTACT_PROPERTIES : type === 'company' ? COMPANY_PROPERTIES : DEAL_PROPERTIES;
  
  // Propriétés non visibles
  const hiddenProperties = allProperties.filter(prop => !visibleColumns.includes(prop.key));
  
  // Grouper les propriétés cachées par catégorie - LOGIQUE CORRIGÉE
  const hiddenByCategory = PROPERTY_CATEGORIES.reduce((acc, category: CategoryInfo) => {
    const categoryProps = getPropertiesByCategory(category.key, type);
    const hiddenProps = categoryProps.filter(prop => !visibleColumns.includes(prop.key));
    if (hiddenProps.length > 0) {
      acc[category.key] = hiddenProps;
    }
    return acc;
  }, {} as Record<string, HubSpotProperty[]>);

  const handleToggleColumn = (columnKey: string) => {
    if (visibleColumns.includes(columnKey)) {
      onColumnRemove(columnKey);
    } else {
      onColumnAdd(columnKey);
    }
  };

  const handleAddAllCategory = (categoryKey: string) => {
    const categoryProps = hiddenByCategory[categoryKey] || [];
    categoryProps.forEach((prop: HubSpotProperty) => onColumnAdd(prop.key));
    setOpen(false);
  };

  const totalHidden = hiddenProperties.length;
  const totalVisible = visibleColumns.length;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Add Column
          {totalHidden > 0 && (
            <Badge variant="secondary" className="ml-1">
              {totalHidden}
            </Badge>
          )}
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-80 max-h-96 overflow-y-auto">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Available Columns</span>
          <span className="text-xs text-gray-500">
            {totalVisible} visible • {totalHidden} hidden
          </span>
        </DropdownMenuLabel>
        
        {/* Bouton Reset */}
        <DropdownMenuItem 
          onClick={() => {
            onReset();
            setOpen(false);
          }}
          className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 font-medium"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset to default columns
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        {Object.keys(hiddenByCategory).length === 0 ? (
          <DropdownMenuItem disabled>
            All columns are visible
          </DropdownMenuItem>
        ) : (
          Object.entries(hiddenByCategory).map(([categoryKey, properties]: [string, HubSpotProperty[]]) => {
            const categoryInfo = getCategoryInfo(categoryKey);
            if (!categoryInfo) return null;
            
            const Icon = categoryInfo.icon;
            
            return (
              <DropdownMenuSub key={categoryKey}>
                <DropdownMenuSubTrigger className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  <span>{categoryInfo.label}</span>
                  <Badge 
                    variant="outline" 
                    className={`ml-auto text-xs ${categoryInfo.color}`}
                  >
                    {properties.length}
                  </Badge>
                </DropdownMenuSubTrigger>
                
                <DropdownMenuSubContent className="w-64">
                  {/* Action rapide: Ajouter toutes les colonnes de la catégorie */}
                  <DropdownMenuItem 
                    onClick={() => handleAddAllCategory(categoryKey)}
                    className="font-medium border-b"
                  >
                    <Plus className="h-3 w-3 mr-2" />
                    Add all {categoryInfo.label}
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  
                  {/* Liste des propriétés individuelles */}
                  {properties.map((property: HubSpotProperty) => {
                    const PropertyIcon = property.icon;
                    const isVisible = visibleColumns.includes(property.key);
                    
                    return (
                      <DropdownMenuItem
                        key={property.key}
                        onClick={() => handleToggleColumn(property.key)}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <PropertyIcon className="h-3 w-3" />
                        <span className="flex-1">{property.label}</span>
                        {isVisible && <Check className="h-3 w-3 text-green-600" />}
                        {property.description && (
                          <span className="text-xs text-gray-400 ml-auto max-w-24 truncate" title={property.description}>
                            {property.description}
                          </span>
                        )}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            );
          })
        )}
        
        {/* Actions rapides si certaines catégories ont des colonnes */}
        {(hiddenByCategory.social?.length > 0 || hiddenByCategory.analytics?.length > 0) && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs">Quick Actions</DropdownMenuLabel>
            
            {hiddenByCategory.social?.length > 0 && (
              <DropdownMenuItem 
                onClick={() => handleAddAllCategory('social')}
                className="text-blue-600"
              >
                <Plus className="h-3 w-3 mr-2" />
                Add all Social columns ({hiddenByCategory.social.length})
              </DropdownMenuItem>
            )}
            
            {hiddenByCategory.analytics?.length > 0 && (
              <DropdownMenuItem 
                onClick={() => handleAddAllCategory('analytics')}
                className="text-purple-600"
              >
                <Plus className="h-3 w-3 mr-2" />
                Add all Analytics columns ({hiddenByCategory.analytics.length})
              </DropdownMenuItem>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AddColumnDropdown; 