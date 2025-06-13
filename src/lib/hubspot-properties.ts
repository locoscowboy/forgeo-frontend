import { 
  User, Mail, Phone, Building, MapPin, Briefcase, Tag, Calendar, 
  Globe, DollarSign, BarChart3, Clock, Target, Star, Shield,
  Linkedin, Facebook, Twitter, Github, MessageCircle, Link,
  Activity, TrendingUp, Users, FileText, Hash, Zap
} from "lucide-react";

export interface HubSpotProperty {
  key: string;
  label: string;
  icon: any;
  category: 'basic' | 'contact' | 'social' | 'analytics' | 'dates' | 'advanced';
  type: 'text' | 'email' | 'url' | 'date' | 'number' | 'tag' | 'boolean';
  width?: number;
  description?: string;
}

// Configuration complète des propriétés pour les Contacts
export const CONTACT_PROPERTIES: HubSpotProperty[] = [
  // Propriétés de base (toujours visibles)
  { key: "firstname", label: "First Name", icon: User, category: 'basic', type: 'text', width: 150 },
  { key: "lastname", label: "Last Name", icon: User, category: 'basic', type: 'text', width: 150 },
  { key: "email", label: "Email", icon: Mail, category: 'basic', type: 'email', width: 250 },
  { key: "phone", label: "Phone", icon: Phone, category: 'basic', type: 'text', width: 150 },
  
  // Propriétés de contact étendues
  { key: "company", label: "Company", icon: Building, category: 'contact', type: 'text', width: 200 },
  { key: "jobtitle", label: "Job Title", icon: Briefcase, category: 'contact', type: 'text', width: 180 },
  { key: "lifecyclestage", label: "Lifecycle Stage", icon: Tag, category: 'contact', type: 'tag', width: 120 },
  { key: "hs_lead_status", label: "Lead Status", icon: Target, category: 'contact', type: 'tag', width: 120 },
  { key: "hs_lead_score", label: "Lead Score", icon: Star, category: 'analytics', type: 'number', width: 100 },
  
  // Informations géographiques
  { key: "city", label: "City", icon: MapPin, category: 'contact', type: 'text', width: 150 },
  { key: "state", label: "State", icon: MapPin, category: 'contact', type: 'text', width: 120 },
  { key: "country", label: "Country", icon: MapPin, category: 'contact', type: 'text', width: 120 },
  { key: "zip", label: "ZIP Code", icon: MapPin, category: 'contact', type: 'text', width: 100 },
  { key: "address", label: "Address", icon: MapPin, category: 'contact', type: 'text', width: 200 },
  { key: "website", label: "Website", icon: Globe, category: 'contact', type: 'url', width: 200 },
  
  // Réseaux sociaux
  { key: "hs_linkedin_url", label: "LinkedIn", icon: Linkedin, category: 'social', type: 'url', width: 200 },
  { key: "mobilephone", label: "Mobile Phone", icon: Phone, category: 'contact', type: 'text', width: 150 },
  
  // Analytics et sources
  { key: "hs_analytics_source", label: "Original Source", icon: BarChart3, category: 'analytics', type: 'text', width: 150 },
  { key: "hs_analytics_source_data_1", label: "Source Data", icon: BarChart3, category: 'analytics', type: 'text', width: 150 },
  { key: "hs_latest_source", label: "Latest Source", icon: Activity, category: 'analytics', type: 'text', width: 150 },
  { key: "hubspot_owner_id", label: "Owner", icon: User, category: 'advanced', type: 'text', width: 150 },
  
  // Dates importantes
  { key: "createdate", label: "Create Date", icon: Calendar, category: 'dates', type: 'date', width: 150 },
  { key: "lastmodifieddate", label: "Last Modified", icon: Clock, category: 'dates', type: 'date', width: 150 },
  { key: "hs_lifecyclestage_lead_date", label: "Lead Date", icon: Calendar, category: 'dates', type: 'date', width: 150 },
  { key: "hs_lifecyclestage_customer_date", label: "Customer Date", icon: Calendar, category: 'dates', type: 'date', width: 150 },
  
  // Engagement
  { key: "hs_latest_meeting_activity", label: "Last Meeting", icon: MessageCircle, category: 'analytics', type: 'date', width: 150 },
  { key: "notes_last_contacted", label: "Last Contacted", icon: MessageCircle, category: 'analytics', type: 'date', width: 150 },
  { key: "num_contacted_notes", label: "Contact Count", icon: Hash, category: 'analytics', type: 'number', width: 120 },
  { key: "num_notes", label: "Notes Count", icon: FileText, category: 'analytics', type: 'number', width: 120 },
  
  // Préférences
  { key: "hs_email_optout", label: "Email Opt-out", icon: Shield, category: 'advanced', type: 'boolean', width: 120 },
  { key: "hs_time_zone", label: "Time Zone", icon: Clock, category: 'advanced', type: 'text', width: 150 },
];

// Configuration complète des propriétés pour les Companies
export const COMPANY_PROPERTIES: HubSpotProperty[] = [
  // Propriétés de base (toujours visibles)
  { key: "name", label: "Company Name", icon: Building, category: 'basic', type: 'text', width: 200 },
  { key: "domain", label: "Domain", icon: Globe, category: 'basic', type: 'text', width: 180 },
  { key: "website", label: "Website", icon: Globe, category: 'basic', type: 'url', width: 200 },
  { key: "industry", label: "Industry", icon: Briefcase, category: 'basic', type: 'tag', width: 150 },
  
  // Informations de contact
  { key: "phone", label: "Phone", icon: Phone, category: 'contact', type: 'text', width: 150 },
  { key: "city", label: "City", icon: MapPin, category: 'contact', type: 'text', width: 150 },
  { key: "state", label: "State", icon: MapPin, category: 'contact', type: 'text', width: 120 },
  { key: "country", label: "Country", icon: MapPin, category: 'contact', type: 'text', width: 120 },
  { key: "zip", label: "ZIP Code", icon: MapPin, category: 'contact', type: 'text', width: 100 },
  { key: "address", label: "Address", icon: MapPin, category: 'contact', type: 'text', width: 200 },
  { key: "address_2", label: "Address 2", icon: MapPin, category: 'contact', type: 'text', width: 200 },
  
  // Informations sur l'entreprise
  { key: "description", label: "Description", icon: FileText, category: 'contact', type: 'text', width: 250 },
  { key: "founded_year", label: "Founded Year", icon: Calendar, category: 'contact', type: 'text', width: 120 },
  { key: "numberofemployees", label: "Employees", icon: Users, category: 'contact', type: 'number', width: 120 },
  { key: "annualrevenue", label: "Annual Revenue", icon: DollarSign, category: 'analytics', type: 'number', width: 150 },
  { key: "total_money_raised", label: "Money Raised", icon: TrendingUp, category: 'analytics', type: 'number', width: 150 },
  
  // Réseaux sociaux
  { key: "linkedin_company_page", label: "LinkedIn", icon: Linkedin, category: 'social', type: 'url', width: 200 },
  { key: "linkedinbio", label: "LinkedIn Bio", icon: Linkedin, category: 'social', type: 'text', width: 200 },
  { key: "facebook_company_page", label: "Facebook", icon: Facebook, category: 'social', type: 'url', width: 200 },
  { key: "twitterhandle", label: "Twitter", icon: Twitter, category: 'social', type: 'text', width: 150 },
  
  // Métadonnées
  { key: "hubspot_owner_id", label: "Owner", icon: User, category: 'advanced', type: 'text', width: 150 },
  { key: "createdate", label: "Create Date", icon: Calendar, category: 'dates', type: 'date', width: 150 },
  { key: "lastmodifieddate", label: "Last Modified", icon: Clock, category: 'dates', type: 'date', width: 150 },
  { key: "notes_last_contacted", label: "Last Contacted", icon: MessageCircle, category: 'analytics', type: 'date', width: 150 },
  
  // Informations techniques
  { key: "web_technologies", label: "Web Technologies", icon: Zap, category: 'advanced', type: 'text', width: 200 },
  { key: "is_public", label: "Public Company", icon: Building, category: 'advanced', type: 'boolean', width: 120 },
  { key: "timezone", label: "Time Zone", icon: Clock, category: 'advanced', type: 'text', width: 150 },
];

// Catégories pour l'organisation du menu
export const PROPERTY_CATEGORIES = {
  basic: { label: "Basic Info", color: "blue" },
  contact: { label: "Contact Details", color: "green" },
  social: { label: "Social Media", color: "purple" },
  analytics: { label: "Analytics", color: "orange" },
  dates: { label: "Dates", color: "gray" },
  advanced: { label: "Advanced", color: "red" }
};

// Colonnes par défaut (toujours visibles)
export const DEFAULT_CONTACT_COLUMNS = ["firstname", "lastname", "email", "phone"];
export const DEFAULT_COMPANY_COLUMNS = ["name", "domain", "website", "industry"];

// Utilitaires
export function getPropertyByKey(key: string, type: 'contact' | 'company'): HubSpotProperty | undefined {
  const properties = type === 'contact' ? CONTACT_PROPERTIES : COMPANY_PROPERTIES;
  return properties.find(prop => prop.key === key);
}

export function getPropertiesByCategory(category: string, type: 'contact' | 'company'): HubSpotProperty[] {
  const properties = type === 'contact' ? CONTACT_PROPERTIES : COMPANY_PROPERTIES;
  return properties.filter(prop => prop.category === category);
} 