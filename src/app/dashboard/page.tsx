import React from 'react';
import Link from 'next/link';

export default function DashboardPage() {
  return (
    <div className="flex flex-col p-6">
      <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
      <p className="text-muted-foreground">Welcome to Forgeo!</p>
      
      <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h3 className="mb-2 text-lg font-medium">HubSpot Audits</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Analyze your HubSpot data quality
          </p>
          <Link 
            href="/audits"
            className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Go to Audits
          </Link>
        </div>
      </div>
    </div>
  );
} 