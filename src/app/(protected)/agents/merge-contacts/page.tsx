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
      name: "Duplicate Detector",
      description: "Finds duplicates using exact (email, phone) and fuzzy (name) matching.",
      icon: Search,
      status: "ready",
      estimatedTime: "1–3 min",
      color: "blue"
    },
    {
      id: 2,
      name: "Primary Record Selector",
      description: "Chooses the best record to keep based on owner, activity, and completeness.",
      icon: Users,
      status: "pending",
      estimatedTime: "1–2 min",
      color: "orange"
    },
    {
      id: 3,
      name: "Record Merger",
      description: "Merges records using field-specific rules like concat, priority, or fill.",
      icon: GitMerge,
      status: "pending",
      estimatedTime: "3–5 min",
      color: "green"
    },
    {
      id: 4,
      name: "Merge Audit Logger",
      description: "Logs merges and checks data integrity after consolidation.",
      icon: CheckCircle,
      status: "pending",
      estimatedTime: "1–2 min",
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
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Overview</h2>
            <div className="grid grid-cols-1 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">~15 min</div>
                <div className="text-sm text-gray-600">Temps estimé</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
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
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Automatically executed agents</h2>
          
          <div className="space-y-3">
            {agents.map((agent) => {
              const Icon = agent.icon;
              
              return (
                <div key={agent.id}>
                  {/* Agent Card */}
                  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 ${getBackgroundColor(agent.color)} rounded-lg flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`h-5 w-5 ${getIconColor(agent.color)}`} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="text-base font-semibold text-gray-900">{agent.name}</h3>
                          {getStatusBadge(agent.status)}
                        </div>
                        <p className="text-gray-600 mb-2 text-sm leading-relaxed">{agent.description}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
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