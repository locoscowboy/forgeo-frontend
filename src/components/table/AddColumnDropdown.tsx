import React, { useState } from 'react';
import { Plus, ChevronDown, Check } from 'lucide-react';
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
  PROPERTY_CATEGORIES,
  getPropertiesByCategory 
} from '@/lib/hubspot-properties';

interface AddColumnDropdownProps {
  type: 'contact' | 'company';
  visibleColumns: string[];
  onColumnToggle: (columnKey: string) => void;
  onColumnAdd: (columnKey: string) => void;
  onColumnRemove: (columnKey: string) => void;
}

const AddColumnDropdown: React.FC<AddColumnDropdownProps> = ({
  type,
  visibleColumns,
  onColumnToggle,
  onColumnAdd,
  onColumnRemove
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const allProperties = type === 'contact' ? CONTACT_PROPERTIES : COMPANY_PROPERTIES;
  const availableProperties = allProperties.filter(prop => !visibleColumns.includes(prop.key));
  const hiddenProperties = allProperties.filter(prop => visibleColumns.includes(prop.key));

  const getCategoryColor = (category: string) => {
    const colorMap = {
      basic: "bg-blue-100 text-blue-800",
      contact: "bg-green-100 text-green-800", 
      social: "bg-purple-100 text-purple-800",
      analytics: "bg-orange-100 text-orange-800",
      dates: "bg-gray-100 text-gray-800",
      advanced: "bg-red-100 text-red-800"
    };
    return colorMap[category as keyof typeof colorMap] || "bg-gray-100 text-gray-800";
  };

  const renderPropertyItem = (property: HubSpotProperty, isVisible: boolean) => {
    const Icon = property.icon;
    
    return (
      <DropdownMenuItem
        key={property.key}
        onClick={() => {
          if (isVisible) {
            onColumnRemove(property.key);
          } else {
            onColumnAdd(property.key);
          }
        }}
        className="flex items-center justify-between gap-2 px-3 py-2 cursor-pointer hover:bg-gray-50"
      >
        <div className="flex items-center gap-3 flex-1">
          <Icon className="h-4 w-4 text-gray-500" />
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-900">{property.label}</span>
            {property.description && (
              <span className="text-xs text-gray-500">{property.description}</span>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge 
            variant="secondary" 
            className={`text-xs ${getCategoryColor(property.category)}`}
          >
            {PROPERTY_CATEGORIES[property.category]?.label || property.category}
          </Badge>
          
          {isVisible && (
            <Check className="h-4 w-4 text-green-600" />
          )}
        </div>
      </DropdownMenuItem>
    );
  };

  const renderCategorySection = (category: string, properties: HubSpotProperty[]) => {
    if (properties.length === 0) return null;
    
    const categoryInfo = PROPERTY_CATEGORIES[category as keyof typeof PROPERTY_CATEGORIES];
    
    return (
      <DropdownMenuSub key={category}>
        <DropdownMenuSubTrigger className="flex items-center gap-2">
          <Badge 
            variant="secondary" 
            className={`text-xs ${getCategoryColor(category)}`}
          >
            {categoryInfo?.label || category}
          </Badge>
          <span className="text-xs text-gray-500">({properties.length})</span>
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent className="w-80 max-h-96 overflow-y-auto">
          {properties.map(property => 
            renderPropertyItem(property, visibleColumns.includes(property.key))
          )}
        </DropdownMenuSubContent>
      </DropdownMenuSub>
    );
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 border-dashed border-gray-300 text-gray-600 hover:border-forgeo-400 hover:text-forgeo-700 hover:bg-forgeo-50"
        >
          <Plus className="h-4 w-4" />
          Add column
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-80 max-h-[600px] overflow-y-auto" align="start">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Add Column</span>
          <Badge variant="secondary" className="text-xs">
            {availableProperties.length} available
          </Badge>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* Toutes les colonnes disponibles organisées par catégorie */}
        {Object.keys(PROPERTY_CATEGORIES).map(category => {
          const categoryProperties = getPropertiesByCategory(category, type);
          return renderCategorySection(category, categoryProperties);
        })}
        
        <DropdownMenuSeparator />
        
        {/* Section "Currently Visible" */}
        {hiddenProperties.length > 0 && (
          <>
            <DropdownMenuLabel className="text-xs text-gray-500 uppercase tracking-wider">
              Currently Visible ({hiddenProperties.length})
            </DropdownMenuLabel>
            <div className="max-h-32 overflow-y-auto">
              {hiddenProperties.map(property =>
                renderPropertyItem(property, true)
              )}
            </div>
          </>
        )}
        
        {/* Quick Actions */}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            // Ajouter toutes les colonnes sociales
            const socialProps = getPropertiesByCategory('social', type);
            socialProps.forEach(prop => {
              if (!visibleColumns.includes(prop.key)) {
                onColumnAdd(prop.key);
              }
            });
            setIsOpen(false);
          }}
          className="text-xs text-forgeo-600 hover:text-forgeo-700 hover:bg-forgeo-50"
        >
          + Add all Social Media columns
        </DropdownMenuItem>
        
        <DropdownMenuItem
          onClick={() => {
            // Ajouter toutes les colonnes analytics
            const analyticsProps = getPropertiesByCategory('analytics', type);
            analyticsProps.forEach(prop => {
              if (!visibleColumns.includes(prop.key)) {
                onColumnAdd(prop.key);
              }
            });
            setIsOpen(false);
          }}
          className="text-xs text-forgeo-600 hover:text-forgeo-700 hover:bg-forgeo-50"
        >
          + Add all Analytics columns
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AddColumnDropdown; 