"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { 
  Sparkles,
  MessageCircle,
  Zap
} from "lucide-react";

export default function AgentsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">Agents</h1>
          <Badge variant="secondary" className="bg-forgeo-100 text-forgeo-700 border-forgeo-200">
            Beta
          </Badge>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12">
        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="w-16 h-16 bg-forgeo-100 rounded-xl flex items-center justify-center mx-auto mb-6">
              <Sparkles className="h-8 w-8 text-forgeo-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3 text-center">Merge Contacts Duplicates</h3>
            <p className="text-gray-600 text-center leading-relaxed">Remove duplicates from contact records</p>
          </div>
          
          <div className="bg-white p-8 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-6">
              <MessageCircle className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3 text-center">Merge Companies Duplicate</h3>
            <p className="text-gray-600 text-center leading-relaxed">Remove duplicates from company records</p>
          </div>
          
          <div className="bg-white p-8 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="w-16 h-16 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-6">
              <Zap className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3 text-center">Associate Parent/Child Companies</h3>
            <p className="text-gray-600 text-center leading-relaxed">Link parent and subsidiary companies</p>
          </div>
        </div>
      </div>
    </div>
  );
}
