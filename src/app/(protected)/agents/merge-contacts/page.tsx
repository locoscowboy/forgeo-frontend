"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft,
  Users,
  Search,
  GitMerge,
  CheckCircle,
  Settings,
  Play,
  Clock
} from "lucide-react";

export default function MergeContactsPage() {
  const router = useRouter();

  const agents = [
    {
      id: 1,
      name: "Detect Duplicates",
      description: "Identify potential duplicate contacts based on email, name, and phone similarities",
      icon: Search,
      status: "ready",
      estimatedTime: "2-5 min",
      color: "blue"
    },
    {
      id: 2,
      name: "Analyze Conflicts",
      description: "Compare duplicate contacts and identify data conflicts that need resolution",
      icon: Users,
      status: "pending",
      estimatedTime: "1-3 min",
      color: "orange"
    },
    {
      id: 3,
      name: "Smart Merge",
      description: "Automatically merge contacts using intelligent data consolidation rules",
      icon: GitMerge,
      status: "pending",
      estimatedTime: "3-8 min",
      color: "green"
    },
    {
      id: 4,
      name: "Validate Results",
      description: "Verify merged contacts and ensure data integrity across HubSpot",
      icon: CheckCircle,
      status: "pending",
      estimatedTime: "1-2 min",
      color: "purple"
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ready":
        return <Badge className="bg-green-100 text-green-700 border-green-200">Prêt</Badge>;
      case "running":
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200">En cours</Badge>;
      case "completed":
        return <Badge className="bg-forgeo-100 text-forgeo-700 border-forgeo-200">Terminé</Badge>;
      case "pending":
      default:
        return <Badge variant="secondary">En attente</Badge>;
    }
  };

  const getIconColor = (color: string) => {
    switch (color) {
      case "blue":
        return "text-blue-600";
      case "orange":
        return "text-orange-600";
      case "green":
        return "text-green-600";
      case "purple":
        return "text-purple-600";
      default:
        return "text-gray-600";
    }
  };

  const getBackgroundColor = (color: string) => {
    switch (color) {
      case "blue":
        return "bg-blue-100";
      case "orange":
        return "bg-orange-100";
      case "green":
        return "bg-green-100";
      case "purple":
        return "bg-purple-100";
      default:
        return "bg-gray-100";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-forgeo-100 rounded-lg flex items-center justify-center">
              <Users className="h-4 w-4 text-forgeo-600" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">Merge Contacts Duplicates</h1>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Settings className="h-4 w-4" />
            Configurer
          </Button>
          <Button size="sm" className="gap-2 bg-forgeo-400 hover:bg-forgeo-500 text-black">
            <Play className="h-4 w-4" />
            Lancer l&apos;Agent
          </Button>
        </div>
      </div>

      {/* Main Content - Two Column Layout */}
      <div className="flex h-[calc(100vh-56px)]">
        {/* Left Column - Overview and Configuration */}
        <div className="w-1/2 bg-white p-8 overflow-y-auto">
          {/* Overview */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Vue d&apos;ensemble</h2>
            <div className="grid grid-cols-1 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">~15 min</div>
                <div className="text-sm text-gray-600">Temps estimé</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">4</div>
                <div className="text-sm text-gray-600">Étapes automatisées</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">0</div>
                <div className="text-sm text-gray-600">Interventions manuelles</div>
              </div>
            </div>
          </div>

          {/* Configuration Preview */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Configuration actuelle</h2>
            <div className="space-y-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Critères de détection</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Email identique (priorité haute)
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    Nom + Prénom similaires (priorité moyenne)
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    Téléphone identique (priorité moyenne)
                  </li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Règles de fusion</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-forgeo-500 rounded-full"></div>
                    Conserver le contact le plus récent
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-forgeo-500 rounded-full"></div>
                    Fusionner les propriétés manquantes
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-forgeo-500 rounded-full"></div>
                    Préserver l&apos;historique des activités
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Pipeline */}
        <div className="w-1/2 bg-gray-50 p-8 overflow-y-auto">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Pipeline d&apos;exécution</h2>
          <p className="text-sm text-gray-600 mb-6">
            Séquence d&apos;agents qui s&apos;exécuteront automatiquement
          </p>
          
          <div className="space-y-4">
            {agents.map((agent, index) => {
              const Icon = agent.icon;
              const isLast = index === agents.length - 1;
              
              return (
                <div key={agent.id} className="relative">
                  {/* Connector Line */}
                  {!isLast && (
                    <div className="absolute left-6 top-16 w-0.5 h-6 bg-gray-300"></div>
                  )}
                  
                  {/* Agent Card */}
                  <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 ${getBackgroundColor(agent.color)} rounded-lg flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`h-6 w-6 ${getIconColor(agent.color)}`} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{agent.name}</h3>
                          {getStatusBadge(agent.status)}
                        </div>
                        <p className="text-gray-600 mb-3 text-sm leading-relaxed">{agent.description}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{agent.estimatedTime}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span>Étape {agent.id}/4</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
} 