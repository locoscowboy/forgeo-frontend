'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { BarChart3, LayoutDashboard, LogOut, Settings, Users, Building, DollarSign } from 'lucide-react';

// Sidebar interface minimale en attendant les composants shadcn/ui
export function AppSidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  
  const isActive = (path: string) => {
    return pathname === path;
  };
  
  return (
    <div className="flex h-full w-64 flex-col border-r bg-background">
      {/* Header */}
      <div className="flex h-14 items-center border-b px-4">
        <span className="flex items-center gap-2 font-semibold">
          <BarChart3 className="h-5 w-5" />
          <span>Forgeo</span>
        </span>
      </div>
      
      {/* Navigation */}
      <div className="flex-1 overflow-auto py-4">
        <nav className="space-y-1 px-2">
          {/* Section Overview */}
          <p className="px-2 py-1 text-xs font-semibold text-muted-foreground">
            Overview
          </p>
          
          <Link 
            href="/dashboard" 
            className={`flex items-center rounded-md px-3 py-2 text-sm font-medium ${
              isActive('/dashboard')
                ? 'bg-primary/10 text-primary'
                : 'text-foreground hover:bg-accent hover:text-accent-foreground'
            }`}
          >
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Dashboard
          </Link>
          
          <Link 
            href="/audits" 
            className={`flex items-center rounded-md px-3 py-2 text-sm font-medium ${
              isActive('/audits')
                ? 'bg-primary/10 text-primary'
                : 'text-foreground hover:bg-accent hover:text-accent-foreground'
            }`}
          >
            <BarChart3 className="mr-2 h-4 w-4" />
            Audits
          </Link>

          <Link 
            href="/settings" 
            className={`flex items-center rounded-md px-3 py-2 text-sm font-medium ${
              isActive('/settings')
                ? 'bg-primary/10 text-primary'
                : 'text-foreground hover:bg-accent hover:text-accent-foreground'
            }`}
          >
            <Settings className="mr-2 h-4 w-4" />
            Paramètres
          </Link>

          {/* Espaceur */}
          <div className="py-2" />

          {/* Section Records */}
          <p className="px-2 py-1 text-xs font-semibold text-muted-foreground">
            Records
          </p>

          <Link 
            href="/contacts" 
            className={`flex items-center rounded-md px-3 py-2 text-sm font-medium ${
              isActive('/contacts')
                ? 'bg-primary/10 text-primary'
                : 'text-foreground hover:bg-accent hover:text-accent-foreground'
            }`}
          >
            <Users className="mr-2 h-4 w-4" />
            Contacts
          </Link>

          <Link 
            href="/companies" 
            className={`flex items-center rounded-md px-3 py-2 text-sm font-medium ${
              isActive('/companies')
                ? 'bg-primary/10 text-primary'
                : 'text-foreground hover:bg-accent hover:text-accent-foreground'
            }`}
          >
            <Building className="mr-2 h-4 w-4" />
            Companies
          </Link>

          <Link 
            href="/deals" 
            className={`flex items-center rounded-md px-3 py-2 text-sm font-medium ${
              isActive('/deals')
                ? 'bg-primary/10 text-primary'
                : 'text-foreground hover:bg-accent hover:text-accent-foreground'
            }`}
          >
            <DollarSign className="mr-2 h-4 w-4" />
            Deals
          </Link>
        </nav>
      </div>
      
      {/* User section */}
      <div className="border-t p-4">
        {user && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                {user.full_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden text-sm">
                <p className="truncate font-medium">{user.full_name || user.email}</p>
                {user.full_name && <p className="truncate text-xs text-muted-foreground">{user.email}</p>}
              </div>
            </div>
            
            <button 
              onClick={logout}
              className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              title="Log out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 

