"use client"

import * as React from "react"
import { PageSyncHeader } from "@/components/sync-status-indicator"
import { cn } from "@/lib/utils"

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
  showSyncIndicator?: boolean;
}

export function PageHeader({ 
  title, 
  description, 
  children, 
  className,
  showSyncIndicator = true 
}: PageHeaderProps) {
  if (showSyncIndicator) {
    return (
      <div className={cn("bg-white border-b border-gray-200 px-6 py-4", className)}>
        <PageSyncHeader 
          title={title} 
          description={description}
        />
        {children}
      </div>
    );
  }

  return (
    <div className={cn("bg-white border-b border-gray-200 px-6 py-4", className)}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {description && (
            <p className="text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}
