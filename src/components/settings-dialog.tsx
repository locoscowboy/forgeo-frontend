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
  XCircle,
  RefreshCw,
  Link,
  Unlink,
  Users,
  DollarSign
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
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  getHubSpotAuthUrl, 
  getHubSpotStatus, 
  disconnectHubSpot,
  HubSpotConnectionStatus 
} from "@/lib/api/integrations"
import { useSyncActions, useSyncStats } from "@/hooks/useSmartSync"
import { SyncStatusIndicator } from "@/components/sync-status-indicator"

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
  const { user, logout, token } = useAuth()

  // États pour HubSpot
  const [hubspotConnection, setHubspotConnection] = React.useState<HubSpotConnectionStatus & { isLoading: boolean }>({
    isConnected: false,
    isLoading: false,
    accountInfo: undefined,
    lastSync: undefined,
    syncStatus: 'idle',
    dataStats: undefined
  })
  const [connectionError, setConnectionError] = React.useState<string | null>(null)

  const loadHubSpotStatus = React.useCallback(async () => {
    if (!token) return
    
    setHubspotConnection(prev => ({ ...prev, isLoading: true }))
    setConnectionError(null)
    
    try {
      const status = await getHubSpotStatus(token)
      setHubspotConnection({
        ...status,
        isLoading: false
      })
    } catch (error) {
      console.error('Erreur lors du chargement du statut HubSpot:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
      setConnectionError(`Erreur de connexion: ${errorMessage}`)
      setHubspotConnection(prev => ({ 
        ...prev, 
        isLoading: false,
        isConnected: false,
        syncStatus: 'error'
      }))
    }
  }, [token])

  // Charger le statut HubSpot au montage et quand les settings s'ouvrent
  React.useEffect(() => {
    if (open && activeSection === "Intégrations" && token) {
      // Reset l'état avant de charger pour éviter les faux positifs
      setHubspotConnection(prev => ({ 
        ...prev, 
        isConnected: false, 
        isLoading: true,
        dataStats: undefined,
        syncStatus: 'idle' 
      }))
      loadHubSpotStatus()
    }
  }, [open, activeSection, token, loadHubSpotStatus])

  const handleConnectHubSpot = async () => {
    if (!token) return
    
    setHubspotConnection(prev => ({ ...prev, isLoading: true }))
    setConnectionError(null)
    
    try {
      const { auth_url } = await getHubSpotAuthUrl(token)
      
      // Ouvrir la popup d'autorisation HubSpot
      const popup = window.open(
        auth_url,
        'hubspot-auth',
        'width=600,height=700,scrollbars=yes,resizable=yes'
      )

      if (!popup) {
        throw new Error('Impossible d\'ouvrir la fenêtre d\'autorisation. Vérifiez que les popups ne sont pas bloquées.')
      }

      // Écouter les messages de la popup
      const handleMessage = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return
        
        if (event.data.type === 'hubspot-auth-success') {
          popup?.close()
          // Attendre un peu avant de recharger le statut pour laisser le temps au backend
          setTimeout(() => {
            loadHubSpotStatus()
          }, 1000)
          window.removeEventListener('message', handleMessage)
        } else if (event.data.type === 'hubspot-auth-error') {
          popup?.close()
          setConnectionError(`Erreur d'authentification: ${event.data.error || 'Échec de l\'autorisation'}`)
          setHubspotConnection(prev => ({ 
            ...prev, 
            isLoading: false,
            syncStatus: 'error'
          }))
          window.removeEventListener('message', handleMessage)
        }
      }

      window.addEventListener('message', handleMessage)
      
      // Fallback si la popup est fermée manuellement
      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed)
          setHubspotConnection(prev => ({ ...prev, isLoading: false }))
          window.removeEventListener('message', handleMessage)
        }
      }, 1000)

    } catch (error) {
      console.error('Erreur lors de la connexion HubSpot:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
      setConnectionError(`Erreur de connexion: ${errorMessage}`)
      setHubspotConnection(prev => ({ 
        ...prev, 
        isLoading: false,
        syncStatus: 'error'
      }))
    }
  }

  const handleDisconnectHubSpot = async () => {
    if (!token) return
    
    setHubspotConnection(prev => ({ ...prev, isLoading: true }))
    setConnectionError(null)
    
    try {
      await disconnectHubSpot(token)
      setHubspotConnection({
        isConnected: false,
        isLoading: false,
        accountInfo: undefined,
        lastSync: undefined,
        syncStatus: 'idle',
        dataStats: undefined
      })
    } catch (error) {
      console.error('Erreur lors de la déconnexion HubSpot:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
      setConnectionError(`Erreur de déconnexion: ${errorMessage}`)
      setHubspotConnection(prev => ({ ...prev, isLoading: false }))
    }
  }

  // Hooks Smart Sync
  const { stats } = useSyncStats()

  const renderSettingsContent = () => {
    switch (activeSection) {
      case "Intégrations":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium">Intégrations CRM</h3>
              <p className="text-sm text-muted-foreground">
                Connectez vos outils CRM pour synchroniser vos données
              </p>
            </div>

            {/* HubSpot Integration Card */}
            <Card>
              <CardHeader className="flex flex-row items-center space-y-0 pb-4">
                <div className="flex items-center space-x-4 flex-1">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="w-6 h-6 text-orange-600" fill="currentColor">
                      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.568 8.16c-.169-.044-.337-.081-.506-.114-.013-.003-.025-.007-.038-.01l-.144-.033c-.231-.053-.465-.1-.701-.14-.028-.005-.056-.009-.084-.014-.201-.033-.404-.062-.608-.086-.059-.007-.118-.013-.178-.019-.165-.017-.331-.031-.498-.041-.083-.005-.167-.009-.251-.012-.151-.005-.302-.007-.454-.007s-.303.002-.454.007c-.084.003-.168.007-.251.012-.167.01-.333.024-.498.041-.06.006-.119.012-.178.019-.204.024-.407.053-.608.086-.028.005-.056.009-.084.014-.236.04-.47.087-.701.14l-.144.033c-.013.003-.025.007-.038.01-.169.033-.337.07-.506.114-.844.22-1.513.765-1.812 1.473-.15.357-.226.748-.226 1.161 0 .695.212 1.342.612 1.873.4.531.968.907 1.645 1.088.169.045.344.068.522.068.178 0 .353-.023.522-.068.677-.181 1.245-.557 1.645-1.088.4-.531.612-1.178.612-1.873 0-.413-.076-.804-.226-1.161-.299-.708-.968-1.253-1.812-1.473z"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg">HubSpot CRM</CardTitle>
                    <CardDescription>
                      Synchronisez vos données CRM automatiquement
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Affichage des erreurs */}
                {connectionError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start">
                        <XCircle className="w-4 h-4 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-red-700">{connectionError}</p>
                      </div>
                      <Button
                        onClick={() => {
                          setConnectionError(null)
                          loadHubSpotStatus()
                        }}
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-100 ml-2"
                      >
                        Réessayer
                      </Button>
                    </div>
                  </div>
                )}

                {!hubspotConnection.isConnected ? (
                  <div className="space-y-4">
                    <div className="text-center p-6 border-2 border-dashed border-gray-200 rounded-lg">
                      <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg viewBox="0 0 24 24" className="w-8 h-8 text-orange-600" fill="currentColor">
                          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.568 8.16c-.169-.044-.337-.081-.506-.114-.013-.003-.025-.007-.038-.01l-.144-.033c-.231-.053-.465-.1-.701-.14-.028-.005-.056-.009-.084-.014-.201-.033-.404-.062-.608-.086-.059-.007-.118-.013-.178-.019-.165-.017-.331-.031-.498-.041-.083-.005-.167-.009-.251-.012-.151-.005-.302-.007-.454-.007s-.303.002-.454.007c-.084.003-.168.007-.251.012-.167.01-.333.024-.498.041-.06.006-.119.012-.178.019-.204.024-.407.053-.608.086-.028.005-.056.009-.084.014-.236.04-.47.087-.701.14l-.144.033c-.013.003-.025.007-.038.01-.169.033-.337.07-.506.114-.844.22-1.513.765-1.812 1.473-.15.357-.226.748-.226 1.161 0 .695.212 1.342.612 1.873.4.531.968.907 1.645 1.088.169.045.344.068.522.068.178 0 .353-.023.522-.068.677-.181 1.245-.557 1.645-1.088.4-.531.612-1.178.612-1.873 0-.413-.076-.804-.226-1.161-.299-.708-.968-1.253-1.812-1.473z"/>
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Connectez votre HubSpot</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Synchronisez automatiquement vos contacts, entreprises et deals pour effectuer des audits de qualité.
                      </p>
                      <Button 
                        onClick={handleConnectHubSpot}
                        disabled={hubspotConnection.isLoading}
                        className="bg-orange-600 hover:bg-orange-700 text-white"
                        size="lg"
                      >
                        {hubspotConnection.isLoading ? (
                          <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Connexion en cours...</>
                        ) : (
                          <><Link className="w-4 h-4 mr-2" /> Connecter HubSpot</>
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Smart Sync Status */}
                    <SyncStatusIndicator 
                      variant="full" 
                      className="border-0 bg-gray-50" 
                    />

                    {/* Smart Sync Data Overview */}
                    {(stats.totalRecords > 0 || hubspotConnection.dataStats) && (
                      <div className="grid grid-cols-3 gap-3">
                        <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-100">
                          <Users className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                          <p className="text-xs text-blue-600 font-medium">Contacts</p>
                          <p className="text-xl font-bold text-blue-700">
                            {(stats.totalContacts || hubspotConnection.dataStats?.contacts || 0).toLocaleString()}
                          </p>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg border border-green-100">
                          <Building className="w-6 h-6 mx-auto mb-2 text-green-600" />
                          <p className="text-xs text-green-600 font-medium">Entreprises</p>
                          <p className="text-xl font-bold text-green-700">
                            {(stats.totalCompanies || hubspotConnection.dataStats?.companies || 0).toLocaleString()}
                          </p>
                        </div>
                        <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-100">
                          <DollarSign className="w-6 h-6 mx-auto mb-2 text-purple-600" />
                          <p className="text-xs text-purple-600 font-medium">Deals</p>
                          <p className="text-xl font-bold text-purple-700">
                            {(stats.totalDeals || hubspotConnection.dataStats?.deals || 0).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Actions simplifiées */}
                    <div className="flex justify-end pt-2">
                      <Button 
                        onClick={handleDisconnectHubSpot}
                        disabled={hubspotConnection.isLoading || hubspotConnection.syncStatus === 'syncing'}
                        variant="ghost"
                        size="sm"
                        className="text-gray-600 hover:text-red-600 hover:bg-red-50"
                      >
                        <Unlink className="w-4 h-4 mr-2" />
                        Déconnecter
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Future Integrations Preview */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">Intégrations à venir</h4>
              <div className="grid grid-cols-1 gap-3">
                {[
                  { name: "Salesforce", color: "bg-blue-100 text-blue-600", icon: "☁️" },
                  { name: "Pipedrive", color: "bg-green-100 text-green-600", icon: "📊" },
                  { name: "Zoho CRM", color: "bg-red-100 text-red-600", icon: "🔥" }
                ].map((integration) => (
                  <Card key={integration.name} className="opacity-50">
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${integration.color}`}>
                          <span className="text-sm">{integration.icon}</span>
                        </div>
                        <div>
                          <p className="font-medium">{integration.name}</p>
                          <p className="text-xs text-muted-foreground">Bientôt disponible</p>
                        </div>
                      </div>
                      <Badge variant="outline">Prochainement</Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )
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
