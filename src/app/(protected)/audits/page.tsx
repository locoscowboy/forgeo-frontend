"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/auth/AuthContext";

export default function AuditsPage() {
  const { token } = useAuth();
  const [connecting, setConnecting] = useState(false);

  const connectHubSpot = async () => {
    setConnecting(true);
    try {
      const response = await fetch("https://forgeo.store/api/v1/hubspot/auth", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error("Failed to get auth URL");
      }
      
      const data = await response.json();
      
      // Redirect to HubSpot auth URL
      window.location.href = data.auth_url;
    } catch (error) {
      console.error("Error connecting to HubSpot:", error);
      setConnecting(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col items-center justify-center p-6">
      <div className="w-full max-w-md text-center">
        <h1 className="mb-2 text-2xl font-bold">HubSpot Audits</h1>
        <p className="mb-8 text-muted-foreground">
          Connect your HubSpot account to start analyzing your data quality
        </p>
        
        <button 
          className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          onClick={connectHubSpot}
          disabled={connecting}
        >
          {connecting ? "Connecting..." : "Connect your HubSpot"}
        </button>
      </div>
    </div>
  );
}
