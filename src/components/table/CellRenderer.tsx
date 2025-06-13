import React from 'react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ExternalLink, Mail, Phone, Check, X, Linkedin } from 'lucide-react';
import { HubSpotProperty } from '@/lib/hubspot-properties';
import { Badge } from '@/components/ui/badge';

interface CellRendererProps {
  value: any;
  property: HubSpotProperty;
  allProperties?: { [key: string]: any };
}

const CellRenderer: React.FC<CellRendererProps> = ({ value, property, allProperties }) => {
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
          className="flex items-center gap-1 text-forgeo-600 hover:text-forgeo-800 hover:underline"
        >
          <Mail className="h-3 w-3" />
          {value}
        </a>
      );

    case 'url':
      // Traitement spécial pour LinkedIn
      if (property.key === 'hs_linkedin_url' || property.key === 'linkedin_company_page') {
        return (
          <a 
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 hover:underline"
          >
            <Linkedin className="h-4 w-4" />
            <span>LinkedIn</span>
          </a>
        );
      }
      
      // Autres URLs
      const displayUrl = value.length > 30 ? `${value.substring(0, 30)}...` : value;
      const fullUrl = value.startsWith('http') ? value : `https://${value}`;
      
      return (
        <a 
          href={fullUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-forgeo-600 hover:text-forgeo-800 hover:underline"
          title={value}
        >
          <ExternalLink className="h-3 w-3" />
          {displayUrl}
        </a>
      );

    case 'date':
      try {
        // Gérer différents formats de dates
        let date: Date;
        if (typeof value === 'string') {
          // Format timestamp Unix (HubSpot)
          if (/^\d+$/.test(value)) {
            date = new Date(parseInt(value));
          } else {
            date = parseISO(value);
          }
        } else if (typeof value === 'number') {
          date = new Date(value);
        } else {
          return <span className="text-gray-400">—</span>;
        }

        if (isNaN(date.getTime())) {
          return <span className="text-gray-400">—</span>;
        }

        return (
          <span className="text-gray-700" title={date.toLocaleDateString('fr-FR')}>
            {format(date, 'dd/MM/yyyy', { locale: fr })}
          </span>
        );
      } catch (error) {
        return <span className="text-gray-400">—</span>;
      }

    case 'number':
      const numValue = typeof value === 'string' ? parseFloat(value) : value;
      if (isNaN(numValue)) {
        return <span className="text-gray-400">—</span>;
      }

      // Formatage spécial pour certains champs
      if (property.key === 'annualrevenue' || property.key === 'total_money_raised') {
        return (
          <span className="text-gray-700 font-medium">
            {new Intl.NumberFormat('fr-FR', { 
              style: 'currency', 
              currency: 'EUR',
              minimumFractionDigits: 0
            }).format(numValue)}
          </span>
        );
      }

      if (property.key === 'numberofemployees') {
        return (
          <span className="text-gray-700">
            {numValue.toLocaleString('fr-FR')} emp.
          </span>
        );
      }

      return (
        <span className="text-gray-700">
          {numValue.toLocaleString('fr-FR')}
        </span>
      );

    case 'boolean':
      return (
        <div className="flex items-center">
          {value ? (
            <Check className="h-4 w-4 text-green-600" />
          ) : (
            <X className="h-4 w-4 text-red-600" />
          )}
        </div>
      );

    case 'tag':
      // Couleurs spécifiques pour certains tags
      const getTagColor = () => {
        if (property.key === 'lifecyclestage') {
          const colors: { [key: string]: string } = {
            lead: "bg-forgeo-50 text-forgeo-700 border-forgeo-200",
            customer: "bg-green-50 text-green-700 border-green-200",
            subscriber: "bg-purple-50 text-purple-700 border-purple-200",
            opportunity: "bg-orange-50 text-orange-700 border-orange-200",
            other: "bg-gray-50 text-gray-700 border-gray-200",
          };
          return colors[value?.toLowerCase()] || colors.other;
        }

        if (property.key === 'industry') {
          const colors: { [key: string]: string } = {
            technology: "bg-forgeo-50 text-forgeo-700 border-forgeo-200",
            finance: "bg-green-50 text-green-700 border-green-200",
            healthcare: "bg-purple-50 text-purple-700 border-purple-200",
            education: "bg-orange-50 text-orange-700 border-orange-200",
            manufacturing: "bg-gray-50 text-gray-700 border-gray-200",
            retail: "bg-pink-50 text-pink-700 border-pink-200",
            other: "bg-gray-50 text-gray-700 border-gray-200",
          };
          return colors[value?.toLowerCase()] || colors.other;
        }

        return "bg-gray-50 text-gray-700 border-gray-200";
      };

      return (
        <Badge variant="secondary" className={`${getTagColor()} text-xs`}>
          {value}
        </Badge>
      );

    case 'text':
    default:
      // Traitement spécial pour certains champs texte
      if (property.key === 'phone' || property.key === 'mobilephone') {
        return (
          <span className="flex items-center gap-1 text-gray-700">
            <Phone className="h-3 w-3" />
            {value}
          </span>
        );
      }

      // Limitation de la longueur pour les textes longs
      if (typeof value === 'string' && value.length > 50) {
        return (
          <span className="text-gray-700" title={value}>
            {value.substring(0, 50)}...
          </span>
        );
      }

      return <span className="text-gray-700">{value}</span>;
  }
};

export default CellRenderer; 