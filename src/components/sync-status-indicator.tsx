"use client"

import * as React from "react"
import { CheckCircle, Clock, AlertCircle, XCircle, HelpCircle, RefreshCw, Loader2 } from "lucide-react"
import { useDataFreshness, useSyncRecommendations, useSyncActions } from "@/hooks/useSmartSync"
import { useSync } from "@/lib/sync/SyncContext"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface SyncStatusIndicatorProps {
  className?: string;
  showSyncButton?: boolean;
  variant?: 'badge' | 'full' | 'compact';
  size?: 'sm' | 'md' | 'lg';
}

const iconMap = {
  'check': CheckCircle,
  'clock': Clock,
  'alert': AlertCircle,
  'x': XCircle,
  'help': HelpCircle,
};

const colorMap = {
  'green': 'bg-green-100 text-green-800 border-green-200',
  'yellow': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'orange': 'bg-orange-100 text-orange-800 border-orange-200',
  'red': 'bg-red-100 text-red-800 border-red-200',
  'gray': 'bg-gray-100 text-gray-800 border-gray-200',
};

export function SyncStatusIndicator({ 
  className, 
  showSyncButton = true, 
  variant = 'full',
  size = 'md'
}: SyncStatusIndicatorProps) {
  const { indicator } = useDataFreshness();
  const { recommendation, shouldShowSyncButton } = useSyncRecommendations();
  const { handleSync, isStarting, error } = useSyncActions();

  // Valeurs par défaut si pas d'indicateur
  const defaultIndicator = {
    icon: 'check' as const,
    color: 'green' as const,
    text: 'Données à jour'
  };

  const currentIndicator = indicator || defaultIndicator;
  const Icon = iconMap[currentIndicator.icon];
  const colorClass = colorMap[currentIndicator.color];

  const handleSyncClick = () => {
    handleSync({ trigger: 'manual' });
  };

  // Variant Badge - Simple badge sans bouton
  if (variant === 'badge') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge 
              variant="outline" 
              className={cn(colorClass, "gap-1.5", className)}
            >
              <Icon className="h-3 w-3" />
              {currentIndicator.text}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>{recommendation?.message || currentIndicator.text}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Variant Compact - Badge + bouton sync si nécessaire
  if (variant === 'compact') {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Badge 
          variant="outline" 
          className={cn(colorClass, "gap-1.5")}
        >
          <Icon className="h-3 w-3" />
          {size === 'sm' ? '' : currentIndicator.text}
        </Badge>
        
        {showSyncButton && shouldShowSyncButton && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSyncClick}
                  disabled={isStarting}
                  className="h-6 w-6 p-0"
                >
                  {isStarting ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3 w-3" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{recommendation?.message || 'Synchroniser les données'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    );
  }

  // Variant Full - Affichage complet avec détails
  return (
    <div className={cn("flex items-center justify-between gap-3 p-3 border rounded-lg", className)}>
      <div className="flex items-center gap-2">
        <div className={cn("flex items-center gap-1.5 px-2 py-1 rounded-md", colorClass)}>
          <Icon className="h-4 w-4" />
          <span className="text-sm font-medium">{currentIndicator.text}</span>
        </div>
        
        {recommendation && (
          <span className="text-sm text-muted-foreground">
            {recommendation.message}
          </span>
        )}
      </div>

      {showSyncButton && shouldShowSyncButton && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleSyncClick}
          disabled={isStarting}
          className="gap-2"
        >
          {isStarting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Synchronisation...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" />
              Synchroniser
            </>
          )}
        </Button>
      )}
      
      {error && (
        <span className="text-sm text-red-600">{error}</span>
      )}
    </div>
  );
}

// Composant pour afficher les statistiques de sync
export function SyncStatsDisplay({ className }: { className?: string }) {
  const { stats, totalRecords, hasData, formatLastSync } = useSyncStats();

  if (!hasData) {
    return (
      <div className={cn("text-sm text-muted-foreground", className)}>
        Aucune donnée synchronisée
      </div>
    );
  }

  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex items-center gap-4 text-sm">
        <span className="font-medium">{totalRecords.toLocaleString()} enregistrements</span>
        <span className="text-muted-foreground">•</span>
        <span className="text-muted-foreground">{formatLastSync()}</span>
      </div>
      
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span>{stats.totalContacts.toLocaleString()} contacts</span>
        <span>{stats.totalCompanies.toLocaleString()} entreprises</span>
        <span>{stats.totalDeals.toLocaleString()} deals</span>
      </div>
    </div>
  );
}

// Composant pour les pages avec indicateur en header
export function PageSyncHeader({ 
  title, 
  description,
  className 
}: { 
  title: string; 
  description?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-between", className)}>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      
      <div className="flex items-center gap-3">
        <SyncStatsDisplay />
        <SyncStatusIndicator variant="compact" />
      </div>
    </div>
  );
}

// Hook pour utiliser les statistiques de sync (déplacé ici depuis useSmartSync)
export function useSyncStats() {
  const { state } = useSync();

  const stats = {
    totalContacts: state.latestSync?.sync?.total_contacts || 0,
    totalCompanies: state.latestSync?.sync?.total_companies || 0,
    totalDeals: state.latestSync?.sync?.total_deals || 0,
  };

  const totalRecords = stats.totalContacts + stats.totalCompanies + stats.totalDeals;
  const hasData = totalRecords > 0;
  const lastSyncDate = state.latestSync?.sync?.completed_at;

  return {
    stats,
    totalRecords,
    hasData,
    lastSyncDate,
    formatLastSync: () => {
      if (!lastSyncDate) return 'Jamais synchronisé';
      
      const date = new Date(lastSyncDate);
      const now = new Date();
      const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
      
      if (diffHours < 1) return 'Il y a moins d\'une heure';
      if (diffHours < 24) return `Il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`;
      
      const diffDays = Math.floor(diffHours / 24);
      return `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
    }
  };
}
