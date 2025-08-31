/**
 * Types pour le système Smart Sync
 * Correspond aux réponses des endpoints backend Smart Sync
 */

export interface SmartSyncStatus {
  should_sync: boolean;
  reason: string;
  last_sync_ago_hours: number | null;
  data_quality: 'none' | 'fresh' | 'acceptable' | 'stale';
  auto_sync_recommended: boolean;
}

export interface EnrichedSyncStatus {
  needs_sync: boolean;
  reason: string;
  last_sync: HubspotSyncData | null;
  data_freshness: 'never' | 'fresh' | 'acceptable' | 'stale' | 'very_stale';
  hours_since_sync: number | null;
  recommendation: string;
}

export interface LoginSyncCheck {
  should_sync_on_login: boolean;
  has_data: boolean;
  last_sync: HubspotSyncData | null;
}

export interface LatestSyncResponse {
  sync: HubspotSyncData | null;
  has_data: boolean;
  needs_sync: boolean;
  reason: string;
  data_freshness: 'never' | 'fresh' | 'acceptable' | 'stale' | 'very_stale';
  hours_since_sync: number | null;
  recommendation: string;
}

export interface HubspotSyncData {
  id: number;
  user_id: number;
  status: 'in_progress' | 'completed' | 'failed';
  created_at: string;
  completed_at: string | null;
  total_contacts: number | null;
  total_companies: number | null;
  total_deals: number | null;
}

export interface SyncRecommendation {
  type: 'none' | 'optional' | 'recommended' | 'urgent';
  message: string;
  action: 'no_action' | 'sync_available' | 'sync_recommended' | 'sync_required';
  priority: 'low' | 'medium' | 'high';
}

export interface DataFreshnessIndicator {
  status: 'fresh' | 'acceptable' | 'stale' | 'very_stale' | 'never';
  color: 'green' | 'yellow' | 'orange' | 'red' | 'gray';
  text: string;
  icon: 'check' | 'clock' | 'alert' | 'x' | 'help';
}

export interface SyncProgress {
  contacts: number;
  companies: number;
  deals: number;
  total: number;
  isComplete: boolean;
  percentage: number;
}

export type SyncTrigger = 'manual' | 'login' | 'auto' | 'onboarding';

export interface SyncOptions {
  trigger: SyncTrigger;
  force?: boolean;
  background?: boolean;
}
