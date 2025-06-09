"use client"

import * as React from "react"
import {
  BarChart3,
  Bot,
  Building,
  DollarSign,
  GalleryVerticalEnd,
  Settings,
  Users,
} from "lucide-react"

import { NavMain } from '@/components/nav-main'
import { NavUser } from '@/components/nav-user'
import { TeamSwitcher } from '@/components/team-switcher'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from '@/components/ui/sidebar'

// Forgeo CRM data structure
const forgeoData = {
  user: {
    name: "John Doe",
    email: "john@forgeo.com",
    avatar: "/avatars/user.jpg",
  },
  teams: [
    {
      name: "Forgeo",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
  ],
  navMain: [
    {
      title: "Agents",
      url: "/agents",
      icon: Bot,
      isActive: false,
    },
    {
      title: "Audits",
      url: "/audits", 
      icon: BarChart3,
      isActive: false,
    },
    {
      title: "Contacts",
      url: "/contacts",
      icon: Users,
      isActive: false,
    },
    {
      title: "Companies",
      url: "/companies",
      icon: Building,
      isActive: false,
    },
    {
      title: "Deals",
      url: "/deals",
      icon: DollarSign,
      isActive: false,
    },
    {
      title: "Settings",
      url: "/settings",
      icon: Settings,
      isActive: false,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="none" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={forgeoData.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={forgeoData.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={forgeoData.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
