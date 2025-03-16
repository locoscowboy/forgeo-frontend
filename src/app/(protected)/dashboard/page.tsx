"use client";

import { useAuth } from "@/lib/auth/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Bienvenue, {user?.full_name || user?.email}!
        </p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h3 className="text-lg font-semibold">Accès HubSpot</h3>
          <p className="text-sm text-muted-foreground">
            Configurez votre connexion à HubSpot
          </p>
        </div>
        
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h3 className="text-lg font-semibold">Audits</h3>
          <p className="text-sm text-muted-foreground">
            Visualisez vos audits récents
          </p>
        </div>
        
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h3 className="text-lg font-semibold">Paramètres</h3>
          <p className="text-sm text-muted-foreground">
            Gérez votre compte et vos préférences
          </p>
        </div>
      </div>
    </div>
  );
}
