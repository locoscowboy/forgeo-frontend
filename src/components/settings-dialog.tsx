"use client"

import * as React from "react"
import {
  Bell,
  User,
  Shield,
  Globe,
  Palette,
  Database,
  Key,
  UserCheck,
  Settings,
  Building,
  Mail,
  HelpCircle,
  LogOut,
} from "lucide-react"
import { useAuth } from "@/lib/auth/AuthContext"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

const forgeoSettingsData = {
  nav: [
    {
      title: "Compte",
      items: [
        { name: "Profil utilisateur", icon: User },
        { name: "Préférences", icon: Settings },
        { name: "Notifications", icon: Bell },
      ]
    },
    {
      title: "Organisation",
      items: [
        { name: "Entreprise", icon: Building },
        { name: "Équipe", icon: UserCheck },
        { name: "Permissions", icon: Shield },
      ]
    },
    {
      title: "Système",
      items: [
        { name: "Intégrations", icon: Database },
        { name: "API & Sécurité", icon: Key },
        { name: "Langue & région", icon: Globe },
        { name: "Apparence", icon: Palette },
      ]
    },
    {
      title: "Support",
      items: [
        { name: "Centre d'aide", icon: HelpCircle },
        { name: "Contact", icon: Mail },
      ]
    }
  ],
}

interface SettingsDialogProps {
  children: React.ReactNode;
}

export function SettingsDialog({ children }: SettingsDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [activeSection, setActiveSection] = React.useState("Profil utilisateur")
  const { user, logout } = useAuth()

  const renderSettingsContent = () => {
    switch (activeSection) {
      case "Profil utilisateur":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium">Informations personnelles</h3>
              <p className="text-sm text-muted-foreground">
                Gérez vos informations de profil
              </p>
            </div>
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nom complet</Label>
                <Input id="name" defaultValue={user?.full_name || ""} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue={user?.email || ""} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role">Rôle</Label>
                <Input id="role" defaultValue={user?.is_admin ? "Administrateur" : "Utilisateur"} disabled />
              </div>
            </div>
            <div className="flex gap-2">
              <Button>Sauvegarder</Button>
              <Button variant="outline">Annuler</Button>
            </div>
          </div>
        )
      case "Notifications":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium">Préférences de notification</h3>
              <p className="text-sm text-muted-foreground">
                Configurez comment vous souhaitez être notifié
              </p>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-sm font-medium">Nouveaux deals</div>
                  <div className="text-sm text-muted-foreground">
                    Recevoir des notifications pour les nouveaux deals
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Activé
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-sm font-medium">Nouveaux contacts</div>
                  <div className="text-sm text-muted-foreground">
                    Recevoir des notifications pour les nouveaux contacts
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Activé
                </Button>
              </div>
            </div>
          </div>
        )
      case "Entreprise":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium">Informations de l&apos;entreprise</h3>
              <p className="text-sm text-muted-foreground">
                Gérez les paramètres de votre organisation
              </p>
            </div>
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="company-name">Nom de l&apos;entreprise</Label>
                <Input id="company-name" defaultValue="Forgeo Enterprise" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="domain">Domaine</Label>
                <Input id="domain" defaultValue="forgeo.com" />
              </div>
            </div>
          </div>
        )
      case "API & Sécurité":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium">API et sécurité</h3>
              <p className="text-sm text-muted-foreground">
                Gérez vos clés API et paramètres de sécurité
              </p>
            </div>
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label>Clé API</Label>
                <div className="flex gap-2">
                  <Input type="password" defaultValue="••••••••••••••••" disabled />
                  <Button variant="outline">Régénérer</Button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-sm font-medium">Authentification à deux facteurs</div>
                  <div className="text-sm text-muted-foreground">
                    Ajoutez une couche de sécurité supplémentaire
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Configurer
                </Button>
              </div>
            </div>
          </div>
        )
      default:
        return (
          <div className="flex h-full items-center justify-center">
            <div className="text-center space-y-2">
              <Settings className="h-8 w-8 text-muted-foreground mx-auto" />
              <h3 className="text-lg font-medium">Section en développement</h3>
              <p className="text-sm text-muted-foreground">
                Cette section sera bientôt disponible
              </p>
            </div>
          </div>
        )
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="overflow-hidden p-0 md:max-h-[600px] md:max-w-[900px] lg:max-w-[1000px]">
        <DialogTitle className="sr-only">Paramètres Forgeo</DialogTitle>
        <DialogDescription className="sr-only">
          Configurez vos paramètres Forgeo ici.
        </DialogDescription>
        <SidebarProvider className="items-start">
          <Sidebar collapsible="none" className="hidden md:flex min-w-[250px]">
            <SidebarContent>
              {forgeoSettingsData.nav.map((section) => (
                <SidebarGroup key={section.title}>
                  <SidebarGroupLabel>{section.title}</SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {section.items.map((item) => (
                        <SidebarMenuItem key={item.name}>
                          <SidebarMenuButton
                            asChild
                            isActive={item.name === activeSection}
                            onClick={() => setActiveSection(item.name)}
                          >
                            <button className="w-full">
                              <item.icon />
                              <span>{item.name}</span>
                            </button>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              ))}
              
              {/* Logout button at the bottom */}
              <SidebarGroup className="mt-auto">
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild>
                        <button 
                          onClick={logout}
                          className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <LogOut />
                          <span>Se déconnecter</span>
                        </button>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>
          <main className="flex h-[550px] flex-1 flex-col overflow-hidden">
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink href="#">Paramètres</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{activeSection}</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </header>
            <div className="flex-1 overflow-y-auto p-6">
              {renderSettingsContent()}
            </div>
          </main>
        </SidebarProvider>
      </DialogContent>
    </Dialog>
  )
}
