'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { 
  BarChart3, 
  Bot, 
  LogOut, 
  Settings, 
  Users, 
  Building, 
  DollarSign,
  GalleryVerticalEnd,
} from 'lucide-react';

// Simplified sidebar components
const SidebarProvider = ({ children }: { children: React.ReactNode }) => (
  <div className="flex h-full w-64">{children}</div>
);

const Sidebar = ({ children }: { children: React.ReactNode }) => (
  <div className="flex h-full w-64 flex-col border-r bg-background">{children}</div>
);

const SidebarHeader = ({ children }: { children: React.ReactNode }) => (
  <div className="flex h-14 items-center border-b px-4">{children}</div>
);

const SidebarContent = ({ children }: { children: React.ReactNode }) => (
  <div className="flex-1 overflow-auto py-4">{children}</div>
);

const SidebarFooter = ({ children }: { children: React.ReactNode }) => (
  <div className="border-t p-4">{children}</div>
);

const SidebarMenu = ({ children }: { children: React.ReactNode }) => (
  <nav className="space-y-1 px-2">{children}</nav>
);

const SidebarMenuButton = ({ 
  href, 
  isActive, 
  icon: Icon, 
  children 
}: { 
  href: string; 
  isActive: boolean; 
  icon: React.ElementType; 
  children: React.ReactNode; 
}) => (
  <Link 
    href={href} 
    className={`flex items-center rounded-md px-3 py-2 text-sm font-medium ${
      isActive
        ? 'bg-primary/10 text-primary'
        : 'text-foreground hover:bg-accent hover:text-accent-foreground'
    }`}
  >
    <Icon className="mr-2 h-4 w-4" />
    {children}
  </Link>
);

const SidebarGroupLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="px-2 py-1 text-xs font-semibold text-muted-foreground">{children}</p>
);

// Team switcher component
const TeamSwitcher = () => (
  <div className="flex items-center gap-2 font-semibold">
    <GalleryVerticalEnd className="h-5 w-5" />
    <span>Forgeo</span>
  </div>
);

// Navigation data adapted to Forgeo
const forgeoNavigation = {
  main: [
    {
      title: "Overview",
      items: [
        { title: "Agents", href: "/agents", icon: Bot },
        { title: "Audits", href: "/audits", icon: BarChart3 },
        { title: "Paramètres", href: "/settings", icon: Settings },
      ]
    },
    {
      title: "Records",
      items: [
        { title: "Contacts", href: "/contacts", icon: Users },
        { title: "Companies", href: "/companies", icon: Building },
        { title: "Deals", href: "/deals", icon: DollarSign },
      ]
    }
  ]
};

export function AppSidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  
  const isActive = (path: string) => pathname === path;
  
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <TeamSwitcher />
        </SidebarHeader>
        
        <SidebarContent>
          <SidebarMenu>
            {forgeoNavigation.main.map((section) => (
              <div key={section.title}>
                <SidebarGroupLabel>{section.title}</SidebarGroupLabel>
                
                {section.items.map((item) => (
                  <SidebarMenuButton
                    key={item.href}
                    href={item.href}
                    isActive={isActive(item.href)}
                    icon={item.icon}
                  >
                    {item.title}
                  </SidebarMenuButton>
                ))}
                
                {section.title !== "Records" && <div className="py-2" />}
              </div>
            ))}
          </SidebarMenu>
        </SidebarContent>
        
        <SidebarFooter>
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
        </SidebarFooter>
      </Sidebar>
    </SidebarProvider>
  );
} 

