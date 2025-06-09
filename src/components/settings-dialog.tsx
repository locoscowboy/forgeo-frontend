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
  CheckCircle,
  XCircle,
  RefreshCw,
  Link,
  Unlink,
  Calendar,
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
  syncHubSpotData, 
  disconnectHubSpot,
  HubSpotConnectionStatus 
} from "@/lib/api/integrations"

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

  // Charger le statut HubSpot au montage et quand les settings s'ouvrent
  React.useEffect(() => {
    if (open && activeSection === "Intégrations" && token) {
      loadHubSpotStatus()
    }
  }, [open, activeSection, token])

  const loadHubSpotStatus = async () => {
    if (!token) return
    
    setHubspotConnection(prev => ({ ...prev, isLoading: true }))
    
    try {
      const status = await getHubSpotStatus(token)
      setHubspotConnection({
        ...status,
        isLoading: false
      })
    } catch (error) {
      console.error('Erreur lors du chargement du statut HubSpot:', error)
      setHubspotConnection(prev => ({ 
        ...prev, 
        isLoading: false,
        isConnected: false,
        syncStatus: 'error'
      }))
    }
  }

  const handleConnectHubSpot = async () => {
    if (!token) return
    
    setHubspotConnection(prev => ({ ...prev, isLoading: true }))
    
    try {
      const { auth_url } = await getHubSpotAuthUrl(token)
      
      // Ouvrir la popup d'autorisation HubSpot
      const popup = window.open(
        auth_url,
        'hubspot-auth',
        'width=600,height=700,scrollbars=yes,resizable=yes'
      )

      // Écouter les messages de la popup
      const handleMessage = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return
        
        if (event.data.type === 'hubspot-auth-success') {
          popup?.close()
          loadHubSpotStatus() // Recharger le statut après connexion
          window.removeEventListener('message', handleMessage)
        } else if (event.data.type === 'hubspot-auth-error') {
          popup?.close()
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
      setHubspotConnection(prev => ({ ...prev, isLoading: false }))
    }
  }

  const handleSyncHubSpot = async () => {
    if (!token) return
    
    setHubspotConnection(prev => ({ ...prev, syncStatus: 'syncing' }))
    
    try {
      await syncHubSpotData(token)
      // Recharger le statut après synchronisation
      setTimeout(() => loadHubSpotStatus(), 1000)
    } catch (error) {
      console.error('Erreur lors de la synchronisation HubSpot:', error)
      setHubspotConnection(prev => ({ ...prev, syncStatus: 'error' }))
    }
  }

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
                      Synchronisez vos contacts, entreprises et deals HubSpot
                    </CardDescription>
                  </div>
                </div>
                <Badge variant={hubspotConnection.isConnected ? "default" : "secondary"} className="ml-4">
                  {hubspotConnection.isConnected ? (
                    <><CheckCircle className="w-3 h-3 mr-1" /> Connecté</>
                  ) : (
                    <><XCircle className="w-3 h-3 mr-1" /> Non connecté</>
                  )}
                </Badge>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {!hubspotConnection.isConnected ? (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Connectez votre compte HubSpot pour synchroniser automatiquement vos données et effectuer des audits de qualité.
                    </p>
                    <Button 
                      onClick={handleConnectHubSpot}
                      disabled={hubspotConnection.isLoading}
                      className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                    >
                      {hubspotConnection.isLoading ? (
                        <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Connexion en cours...</>
                      ) : (
                        <><Link className="w-4 h-4 mr-2" /> Connecter HubSpot</>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Account Info */}
                    <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                      <div>
                        <Label className="text-xs text-muted-foreground">Portal ID</Label>
                        <p className="text-sm font-medium">{hubspotConnection.accountInfo?.portalId}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Domaine</Label>
                        <p className="text-sm font-medium">{hubspotConnection.accountInfo?.domain}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Fuseau horaire</Label>
                        <p className="text-sm font-medium">{hubspotConnection.accountInfo?.timeZone}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Devise</Label>
                        <p className="text-sm font-medium">{hubspotConnection.accountInfo?.currency}</p>
                      </div>
                    </div>

                    {/* Sync Status */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">État de synchronisation</Label>
                        <Badge variant={
                          hubspotConnection.syncStatus === 'success' ? 'default' :
                          hubspotConnection.syncStatus === 'syncing' ? 'secondary' :
                          hubspotConnection.syncStatus === 'error' ? 'destructive' :
                          'outline'
                        }>
                          {hubspotConnection.syncStatus === 'success' && <CheckCircle className="w-3 h-3 mr-1" />}
                          {hubspotConnection.syncStatus === 'syncing' && <RefreshCw className="w-3 h-3 mr-1 animate-spin" />}
                          {hubspotConnection.syncStatus === 'error' && <XCircle className="w-3 h-3 mr-1" />}
                          {hubspotConnection.syncStatus === 'success' ? 'Synchronisé' :
                           hubspotConnection.syncStatus === 'syncing' ? 'En cours...' :
                           hubspotConnection.syncStatus === 'error' ? 'Erreur' :
                           'Prêt'}
                        </Badge>
                      </div>
                      
                      {hubspotConnection.lastSync && (
                        <p className="text-xs text-muted-foreground">
                          Dernière synchronisation : {new Date(hubspotConnection.lastSync).toLocaleString('fr-FR')}
                        </p>
                      )}
                    </div>

                    {/* Data Overview */}
                    {hubspotConnection.dataStats && (
                      <div className="grid grid-cols-3 gap-3">
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                          <Users className="w-5 h-5 mx-auto mb-1 text-blue-600" />
                          <p className="text-xs text-muted-foreground">Contacts</p>
                          <p className="text-lg font-semibold text-blue-600">
                            {hubspotConnection.dataStats.contacts.toLocaleString()}
                          </p>
                        </div>
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                          <Building className="w-5 h-5 mx-auto mb-1 text-green-600" />
                          <p className="text-xs text-muted-foreground">Entreprises</p>
                          <p className="text-lg font-semibold text-green-600">
                            {hubspotConnection.dataStats.companies.toLocaleString()}
                          </p>
                        </div>
                        <div className="text-center p-3 bg-purple-50 rounded-lg">
                          <DollarSign className="w-5 h-5 mx-auto mb-1 text-purple-600" />
                          <p className="text-xs text-muted-foreground">Deals</p>
                          <p className="text-lg font-semibold text-purple-600">
                            {hubspotConnection.dataStats.deals.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button 
                        onClick={handleSyncHubSpot}
                        disabled={hubspotConnection.syncStatus === 'syncing'}
                        variant="outline"
                        className="flex-1"
                      >
                        {hubspotConnection.syncStatus === 'syncing' ? (
                          <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Synchronisation...</>
                        ) : (
                          <><RefreshCw className="w-4 h-4 mr-2" /> Synchroniser</>
                        )}
                      </Button>
                      <Button 
                        onClick={handleDisconnectHubSpot}
                        disabled={hubspotConnection.isLoading}
                        variant="outline"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
