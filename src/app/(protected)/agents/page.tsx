"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { 
  Users,
  Building2,
  Handshake,
  GitBranch
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
      <div className="px-4 sm:px-6 lg:px-8 py-12">
        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-forgeo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Users className="h-5 w-5 text-forgeo-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Merge Contacts Duplicates</h3>
            </div>
            <p className="text-sm text-gray-600 ml-13">Remove duplicates from contact records</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Building2 className="h-5 w-5 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Merge Companies Duplicate</h3>
            </div>
            <p className="text-sm text-gray-600 ml-13">Remove duplicates from company records</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Handshake className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Merge Deals Duplicate</h3>
            </div>
            <p className="text-sm text-gray-600 ml-13">Remove duplicates from deal records</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <GitBranch className="h-5 w-5 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Associate Parent/Child Companies</h3>
            </div>
            <p className="text-sm text-gray-600 ml-13">Link parent and subsidiary companies</p>
          </div>
        </div>
      </div>
    </div>
  );
}
