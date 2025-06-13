import React from 'react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ExternalLink, Mail, Check, X, Linkedin } from 'lucide-react';
import { HubSpotProperty } from '@/lib/hubspot-properties';
import { Badge } from '@/components/ui/badge';

interface CellRendererProps {
  value: string | number | boolean | null | undefined;
  property: HubSpotProperty;
}

const CellRenderer: React.FC<CellRendererProps> = ({ value, property }) => {
  // Valeur vide ou nulle
  if (value === null || value === undefined || value === '') {
    return <span className="text-gray-400">—</span>;
  }

  // Rendu selon le type de propriété
  switch (property.type) {
    case 'email':
      return (
        <a 
          href={`mailto:${value}`}
          className="text-forgeo-600 hover:text-forgeo-800 hover:underline flex items-center gap-1"
        >
          <Mail className="h-3 w-3" />
          {value}
        </a>
      );

    case 'url':
      const urlValue = String(value);
      const isLinkedIn = property.key.includes('linkedin') || urlValue.includes('linkedin.com');
      
      return (
        <a 
          href={urlValue.startsWith('http') ? urlValue : `https://${urlValue}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
        >
          {isLinkedIn ? <Linkedin className="h-3 w-3" /> : <ExternalLink className="h-3 w-3" />}
          <span className="truncate max-w-[150px]">
            {isLinkedIn ? 'LinkedIn' : urlValue}
          </span>
        </a>
      );

    case 'date':
      try {
        const date = typeof value === 'string' ? parseISO(value) : new Date(value as string | number);
        return (
          <span className="text-gray-700">
            {format(date, 'dd/MM/yyyy', { locale: fr })}
          </span>
        );
      } catch {
        return <span className="text-gray-400">Date invalide</span>;
      }

    case 'number':
      const numValue = typeof value === 'string' ? parseFloat(value) : Number(value);
      if (isNaN(numValue)) return <span className="text-gray-400">—</span>;
      
      // Formatage spécial pour certaines propriétés
      if (property.key.includes('revenue') || property.key.includes('value')) {
        return (
          <span className="text-green-600 font-medium">
            {numValue.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
          </span>
        );
      }
      
      return (
        <span className="text-gray-700">
          {numValue.toLocaleString('fr-FR')}
        </span>
      );

    case 'boolean':
      const boolValue = value === true || value === 'true';
      return (
        <span className={`flex items-center gap-1 ${boolValue ? 'text-green-600' : 'text-gray-500'}`}>
          {boolValue ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
          {boolValue ? 'Oui' : 'Non'}
        </span>
      );

    case 'tag':
      // Couleurs selon la valeur pour les tags/statuts
      const getTagColor = (val: string | number) => {
        const stringVal = String(val).toLowerCase();
        if (stringVal.includes('lead') || stringVal.includes('prospect')) return 'bg-forgeo-50 text-forgeo-700 border-forgeo-200';
        if (stringVal.includes('customer') || stringVal.includes('client')) return 'bg-green-50 text-green-700 border-green-200';
        if (stringVal.includes('opportunity') || stringVal.includes('qualified')) return 'bg-orange-50 text-orange-700 border-orange-200';
        if (stringVal.includes('subscriber')) return 'bg-purple-50 text-purple-700 border-purple-200';
        return 'bg-gray-50 text-gray-700 border-gray-200';
      };

      return (
        <Badge variant="outline" className={`${getTagColor(String(value))} border text-xs`}>
          {value}
        </Badge>
      );

    default:
      // Rendu texte par défaut
      return (
        <span className="text-gray-700 truncate" title={String(value)}>
          {value}
        </span>
      );
  }
};

export default CellRenderer; 