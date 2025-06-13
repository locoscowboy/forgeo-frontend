import React, { useState } from 'react';
import { Filter, Plus, X } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { HubSpotProperty } from '@/lib/hubspot-properties';

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

interface FilterDropdownProps {
  activeProperties: HubSpotProperty[];
  filterGroups: FilterGroup[];
  onFilterChange: (filterGroups: FilterGroup[]) => void;
}

const FilterDropdown: React.FC<FilterDropdownProps> = ({
  activeProperties,
  filterGroups,
  onFilterChange,
}) => {
  const [open, setOpen] = useState(false);

  const addFilterGroup = () => {
    const firstAvailableField = activeProperties[0];
    if (firstAvailableField) {
      const newGroup: FilterGroup = {
        filters: [{
          field: firstAvailableField.key,
          operator: 'contains',
          value: '',
        }],
        connector: 'and'
      };
      onFilterChange([...filterGroups, newGroup]);
    }
  };

  const addFilterToGroup = (groupIndex: number) => {
    const firstAvailableField = activeProperties[0];
    if (firstAvailableField) {
      const newGroups = [...filterGroups];
      newGroups[groupIndex].filters.push({
        field: firstAvailableField.key,
        operator: 'contains',
        value: '',
        connector: 'and'
      });
      onFilterChange(newGroups);
    }
  };

  const updateFilter = (groupIndex: number, filterIndex: number, updates: Partial<FilterCriteria>) => {
    const newGroups = [...filterGroups];
    newGroups[groupIndex].filters[filterIndex] = { 
      ...newGroups[groupIndex].filters[filterIndex], 
      ...updates 
    };
    onFilterChange(newGroups);
  };

  const removeFilter = (groupIndex: number, filterIndex: number) => {
    const newGroups = [...filterGroups];
    newGroups[groupIndex].filters = newGroups[groupIndex].filters.filter((_, i) => i !== filterIndex);
    
    // Si le groupe n'a plus de filtres, le supprimer
    if (newGroups[groupIndex].filters.length === 0) {
      newGroups.splice(groupIndex, 1);
    }
    
    onFilterChange(newGroups);
  };

  const removeGroup = (groupIndex: number) => {
    const newGroups = filterGroups.filter((_, i) => i !== groupIndex);
    onFilterChange(newGroups);
  };

  const clearAllFilters = () => {
    onFilterChange([]);
  };

  const getPropertyLabel = (fieldKey: string) => {
    const property = activeProperties.find(prop => prop.key === fieldKey);
    return property?.label || fieldKey;
  };

  const totalFilterCount = filterGroups.reduce((acc, group) => acc + group.filters.length, 0);

  const operatorLabels = {
    contains: 'contains',
    equals: 'equals',
    not_equals: 'does not equal',
    starts_with: 'starts with',
    ends_with: 'ends with',
    is_empty: 'is empty',
    is_not_empty: 'is not empty'
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Filter className="h-4 w-4" />
          Filter
          {totalFilterCount > 0 && (
            <Badge variant="secondary" className="ml-1">
              {totalFilterCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-[500px] max-h-96 overflow-y-auto">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Advanced filter</span>
          {totalFilterCount > 0 && (
            <Badge variant="outline" className="text-xs">
              {totalFilterCount} active
            </Badge>
          )}
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        {filterGroups.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <Filter className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No filters applied</p>
            <p className="text-xs text-gray-400">Click "Add filter" to get started</p>
          </div>
        ) : (
          <div className="space-y-4 p-2">
            {filterGroups.map((group, groupIndex) => (
              <div key={groupIndex} className="border rounded-md p-3 bg-gray-50">
                <div className="space-y-2">
                  {group.filters.map((filter, filterIndex) => (
                    <div key={filterIndex}>
                      {filterIndex > 0 && (
                        <div className="flex items-center gap-2 my-2">
                          <Select 
                            value={filter.connector || 'and'}
                            onValueChange={(value: 'and' | 'or') => updateFilter(groupIndex, filterIndex, { connector: value })}
                          >
                            <SelectTrigger className="h-8 text-sm w-20">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="and">And</SelectItem>
                              <SelectItem value="or">Or</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">Where</span>
                        
                        <Select 
                          value={filter.field}
                          onValueChange={(value) => updateFilter(groupIndex, filterIndex, { field: value })}
                        >
                          <SelectTrigger className="h-8 text-sm flex-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {activeProperties.map((property) => (
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
                          value={filter.operator}
                          onValueChange={(value: any) => updateFilter(groupIndex, filterIndex, { operator: value })}
                        >
                          <SelectTrigger className="h-8 text-sm w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(operatorLabels).map(([key, label]) => (
                              <SelectItem key={key} value={key}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        
                        {!['is_empty', 'is_not_empty'].includes(filter.operator) && (
                          <Input
                            placeholder="Enter value..."
                            value={filter.value}
                            onChange={(e) => updateFilter(groupIndex, filterIndex, { value: e.target.value })}
                            className="h-8 text-sm flex-1"
                          />
                        )}
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFilter(groupIndex, filterIndex)}
                          className="h-8 w-8 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex items-center justify-between mt-3 pt-2 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => addFilterToGroup(groupIndex)}
                    className="text-blue-600 text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add filter
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeGroup(groupIndex)}
                    className="text-red-600 text-xs"
                  >
                    Delete group
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <DropdownMenuSeparator />
        
        <div className="flex items-center justify-between p-2">
          <DropdownMenuItem 
            onClick={addFilterGroup}
            className="text-blue-600"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add filter
          </DropdownMenuItem>
          
          {totalFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="text-red-600 text-xs"
            >
              Clear all filters
            </Button>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default FilterDropdown; 