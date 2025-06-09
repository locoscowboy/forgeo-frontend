"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Plus,
  Send,
  Bot,
  Sparkles,
  MessageCircle,
  TrendingUp,
  Settings,
  Zap
} from "lucide-react";

export default function AgentsPage() {
  const [message, setMessage] = useState("");

  const handleSendMessage = () => {
    if (message.trim()) {
      // TODO: Implement AI Agent interaction
      console.log("Message envoyé:", message);
      setMessage("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };



  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 h-14 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agents</h1>
        </div>
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="outline"
            className="gap-2"
          >
            <Settings className="h-4 w-4" />
            Configuration
          </Button>
          <Button 
            size="sm" 
            className="gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Nouvel Agent
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        
        {/* AI Agent Interface */}
        <div className="mb-12">
          {/* Welcome Section */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <Bot className="h-8 w-8 text-white" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              CRM Manager AI Agent
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Votre assistant intelligent pour optimiser votre CRM HubSpot. 
              Posez vos questions, demandez des analyses ou obtenez des recommandations personnalisées.
            </p>
          </div>

          {/* Search Bar - ChatGPT Style */}
          <div className="max-w-3xl mx-auto mb-8">
            <div className="relative">
              <div className="flex items-center bg-white border border-gray-300 rounded-xl shadow-sm hover:shadow-md transition-shadow focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
                <div className="flex-1 px-4 py-3">
                  <Input
                    placeholder="Demandez à votre CRM Manager AI... (ex: Analyse mes données de contacts)"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="border-0 focus:ring-0 text-base placeholder:text-gray-500 bg-transparent"
                  />
                </div>
                <Button
                  onClick={handleSendMessage}
                  disabled={!message.trim()}
                  size="sm"
                  className="mr-2 h-8 w-8 p-0 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Features Preview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Sparkles className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Analyse Intelligente</h3>
              <p className="text-sm text-gray-600">Détection automatique des problèmes de données</p>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <MessageCircle className="h-5 w-5 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Chat Conversationnel</h3>
              <p className="text-sm text-gray-600">Posez vos questions en langage naturel</p>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Zap className="h-5 w-5 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Actions Automatiques</h3>
              <p className="text-sm text-gray-600">Exécution automatique de tâches de nettoyage</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
