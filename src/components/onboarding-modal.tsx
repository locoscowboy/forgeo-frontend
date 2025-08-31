"use client"

import * as React from "react"
import { CheckCircle, Loader2, ArrowRight } from "lucide-react"
import { useAuth } from "@/lib/auth/AuthContext"
import { getHubSpotAuthUrl, syncHubSpotData, getSyncStatus } from "@/lib/api/integrations"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const CRM_OPTIONS = [
  {
    id: 'hubspot',
    name: 'HubSpot',
    description: 'Plateforme CRM complète pour la croissance',
    available: true,
    color: 'bg-orange-500'
  },
  {
    id: 'pipedrive',
    name: 'Pipedrive',
    description: 'CRM simple et efficace',
    available: false,
    color: 'bg-green-500'
  },
  {
    id: 'salesforce',
    name: 'Salesforce',
    description: 'Le leader mondial du CRM',
    available: false,
    color: 'bg-blue-500'
  },
  {
    id: 'zoho',
    name: 'Zoho CRM',
    description: 'Suite CRM complète pour entreprises',
    available: false,
    color: 'bg-red-500'
  }
]

interface OnboardingModalProps {
  open: boolean;
}

export function OnboardingModal({ open }: OnboardingModalProps) {
  const { 
    token, 
    onboardingStep, 
    setOnboardingStep, 
    checkOnboardingStatus
  } = useAuth()
  
  const [isConnecting, setIsConnecting] = React.useState(false)
  const [syncProgress, setSyncProgress] = React.useState<{
    contacts: number;
    companies: number;
    deals: number;
    total: number;
    isComplete: boolean;
  }>({ contacts: 0, companies: 0, deals: 0, total: 0, isComplete: false })

  const handleHubSpotConnection = async () => {
    if (!token) return
    
    setIsConnecting(true)
    setOnboardingStep('connecting')
    
    try {
      // Obtenir l'URL d'autorisation
      const response = await getHubSpotAuthUrl(token)
      
      // Ouvrir la fenêtre popup
      const popup = window.open(
        response.auth_url,
        'hubspot-auth',
        'width=600,height=700,scrollbars=yes,resizable=yes'
      )
      
      // Écouter le message de succès depuis la popup
      const handleMessage = async (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return
        
        if (event.data.type === 'hubspot-auth-success') {
          popup?.close()
          
          // Commencer la synchronisation
          setOnboardingStep('syncing')
          await startSync()
          
          window.removeEventListener('message', handleMessage)
        } else if (event.data.type === 'hubspot-auth-error') {
          popup?.close()
          setOnboardingStep('selection')
          setIsConnecting(false)
          window.removeEventListener('message', handleMessage)
        }
      }
      
      window.addEventListener('message', handleMessage)
      
      // Vérifier si la popup a été fermée manuellement
      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed)
          setOnboardingStep('selection')
          setIsConnecting(false)
          window.removeEventListener('message', handleMessage)
        }
      }, 1000)
      
    } catch (error) {
      console.error('Erreur lors de la connexion HubSpot:', error)
      setOnboardingStep('selection')
      setIsConnecting(false)
    }
  }

  const startSync = async () => {
    if (!token) return
    
    try {
      const syncResponse = await syncHubSpotData(token)
      
      // Surveiller le progrès de la synchronisation
      const interval = setInterval(async () => {
        try {
          const status = await getSyncStatus(syncResponse.sync_id, token)
          
          if (status.status === 'completed') {
            clearInterval(interval)
            
            // Vérifier le statut final et les données
            await checkOnboardingStatus()
            setSyncProgress(prev => ({ ...prev, isComplete: true }))
            
            // Redirection vers audits après 2 secondes
            setTimeout(() => {
              window.location.href = '/audits'
            }, 2000)
          } else if (status.status === 'error') {
            clearInterval(interval)
            setOnboardingStep('selection')
            setIsConnecting(false)
          }
          
          // Mise à jour du progrès (simulation basée sur le statut)
          if (status.progress) {
            const progressPercent = status.progress / 100
            setSyncProgress({
              contacts: Math.floor(progressPercent * 150), // Simulation
              companies: Math.floor(progressPercent * 50),
              deals: Math.floor(progressPercent * 25),
              total: Math.floor(progressPercent * 225),
              isComplete: status.status === 'completed'
            })
          }
        } catch (error) {
          console.error('Erreur lors du suivi de la synchronisation:', error)
          clearInterval(interval)
        }
      }, 2000)
      
    } catch (error) {
      console.error('Erreur lors du démarrage de la synchronisation:', error)
      setOnboardingStep('selection')
      setIsConnecting(false)
    }
  }

  const renderCRMSelection = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">
          Connectez votre CRM
        </h2>
        <p className="text-muted-foreground">
          Choisissez votre plateforme CRM pour commencer l&apos;analyse de vos données
        </p>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        {CRM_OPTIONS.map((crm) => (
          <Card 
            key={crm.id}
            className={`relative cursor-pointer transition-all hover:shadow-md ${
              !crm.available ? 'opacity-60' : 'hover:border-primary'
            }`}
            onClick={crm.available ? handleHubSpotConnection : undefined}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className={`w-3 h-3 rounded-full ${crm.color}`} />
                {!crm.available && (
                  <Badge variant="secondary" className="text-xs">
                    Coming soon
                  </Badge>
                )}
              </div>
              <CardTitle className="text-lg">{crm.name}</CardTitle>
              <CardDescription className="text-sm">
                {crm.description}
              </CardDescription>
            </CardHeader>
            {crm.available && (
              <CardContent className="pt-0">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  disabled={isConnecting}
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Connexion...
                    </>
                  ) : (
                    <>
                      Connecter
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  )

  const renderSyncProgress = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">
          Synchronisation en cours
        </h2>
        <p className="text-muted-foreground">
          Nous importons vos données HubSpot...
        </p>
      </div>
      
      {/* Barre de progression */}
      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span>Progression</span>
          <span>{syncProgress.total > 0 ? `${syncProgress.total} éléments importés` : 'Initialisation...'}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-500"
            style={{ 
              width: syncProgress.isComplete ? '100%' : 
                     syncProgress.total > 0 ? `${Math.min((syncProgress.total / 225) * 100, 95)}%` : '10%'
            }}
          />
        </div>
      </div>
      
      {/* Compteurs par type */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Contacts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{syncProgress.contacts}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Entreprises
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{syncProgress.companies}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Affaires
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{syncProgress.deals}</div>
          </CardContent>
        </Card>
      </div>
      
      {syncProgress.isComplete && (
        <div className="text-center space-y-2">
          <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
          <p className="text-sm text-muted-foreground">
            Synchronisation terminée ! Redirection en cours...
          </p>
        </div>
      )}
    </div>
  )

  const renderContent = () => {
    switch (onboardingStep) {
      case 'selection':
      case 'connecting':
        return renderCRMSelection()
      case 'syncing':
        return renderSyncProgress()
      default:
        return renderCRMSelection()
    }
  }

  return (
    <Dialog open={open} onOpenChange={() => {}} modal>
      <DialogContent 
        className="sm:max-w-2xl p-0 overflow-hidden"
        hideCloseButton={true}
      >
        <DialogTitle className="sr-only">Configuration de votre CRM</DialogTitle>
        <DialogDescription className="sr-only">
          Connectez votre CRM pour commencer à utiliser Forgeo
        </DialogDescription>
        
        <div className="p-8">
          {renderContent()}
        </div>
      </DialogContent>
    </Dialog>
  )
}
