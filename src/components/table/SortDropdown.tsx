import React, { useState } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, Plus, X } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { HubSpotProperty, CONTACT_PROPERTIES, COMPANY_PROPERTIES, DEAL_PROPERTIES } from '@/lib/hubspot-properties';

interface SortCriteria {
  field: string;
  order: 'asc' | 'desc';
}

interface SortDropdownProps {
  type?: 'contact' | 'company' | 'deal';
  activeProperties: HubSpotProperty[];
  sortCriteria: SortCriteria[];
  onSortChange: (sortCriteria: SortCriteria[]) => void;
}

const SortDropdown: React.FC<SortDropdownProps> = ({
  type,
  activeProperties,
  sortCriteria,
  onSortChange,
}) => {
  const [open, setOpen] = useState(false);

  // Utiliser TOUTES les propriétés disponibles pour le type, pas seulement les actives
  const allProperties = type 
    ? (type === 'contact' ? CONTACT_PROPERTIES : type === 'company' ? COMPANY_PROPERTIES : DEAL_PROPERTIES)
    : activeProperties;

  const addSortCriteria = () => {
    const firstAvailableField = allProperties.find(
      prop => !sortCriteria.some(sort => sort.field === prop.key)
    );
    
    if (firstAvailableField) {
      onSortChange([...sortCriteria, { field: firstAvailableField.key, order: 'asc' }]);
    }
  };

  const updateSortCriteria = (index: number, updates: Partial<SortCriteria>) => {
    const newCriteria = [...sortCriteria];
    newCriteria[index] = { ...newCriteria[index], ...updates };
    onSortChange(newCriteria);
  };

  const removeSortCriteria = (index: number) => {
    const newCriteria = sortCriteria.filter((_, i) => i !== index);
    onSortChange(newCriteria);
  };

  // Fonction utilitaire supprimée car non utilisée

  const sortCount = sortCriteria.length;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <ArrowUpDown className="h-4 w-4" />
          Sort
          {sortCount > 0 && (
            <Badge variant="secondary" className="ml-1">
              {sortCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-96 max-h-96 overflow-y-auto">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Sorted by</span>
          {sortCount > 0 && (
            <Badge variant="outline" className="text-xs">
              {sortCount} active
            </Badge>
          )}
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        {sortCriteria.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <ArrowUpDown className="h-8 w-8 mx-auto mb-2 opacity-50" />
                         <p className="text-sm">No sorting applied</p>
             <p className="text-xs text-gray-400">Click &quot;Add sort&quot; to get started</p>
          </div>
        ) : (
          <div className="space-y-2 p-2">
            {sortCriteria.map((criteria, index) => (
              <div key={index} className="flex items-center gap-2 p-2 border rounded-md bg-gray-50">
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <ArrowUpDown className="h-3 w-3" />
                </div>
                
                <Select 
                  value={criteria.field}
                  onValueChange={(value) => updateSortCriteria(index, { field: value })}
                >
                  <SelectTrigger className="h-8 text-sm flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {allProperties.map((property) => (
                      <SelectItem key={property.key} value={property.key}>
                        <div className="flex items-center gap-2">
                          <property.icon className="h-3 w-3" />
                          {property.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select 
                  value={criteria.order}
                  onValueChange={(value: 'asc' | 'desc') => updateSortCriteria(index, { order: value })}
                >
                  <SelectTrigger className="h-8 text-sm w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">
                      <div className="flex items-center gap-2">
                        <ArrowUp className="h-3 w-3" />
                        Ascending
                      </div>
                    </SelectItem>
                    <SelectItem value="desc">
                      <div className="flex items-center gap-2">
                        <ArrowDown className="h-3 w-3" />
                        Descending
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeSortCriteria(index)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={addSortCriteria}
          disabled={sortCriteria.length >= allProperties.length}
          className="text-blue-600"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add sort
        </DropdownMenuItem>
        
        {sortCriteria.length > 0 && (
          <DropdownMenuItem 
            onClick={() => onSortChange([])}
            className="text-gray-500"
          >
            Learn about sorting
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default SortDropdown; 