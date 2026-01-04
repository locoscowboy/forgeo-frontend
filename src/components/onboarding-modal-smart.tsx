"use client"

import * as React from "react"
import { CheckCircle, Loader2, ArrowRight } from "lucide-react"
import { useAuth } from "@/lib/auth/AuthContext"
import { getHubSpotAuthUrl } from "@/lib/api/integrations"
import { useSmartSync, useSyncActions } from "@/hooks/useSmartSync"
import { useRouter } from "next/navigation"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

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
  
  const { syncProgress } = useSmartSync()
  const { handleSync } = useSyncActions()
  const router = useRouter()
  
  const [isConnecting, setIsConnecting] = React.useState(false)

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
          
          // Commencer la synchronisation Smart Sync
          setOnboardingStep('syncing')
          await startSmartSync()
          
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
      console.error('❌ Erreur lors de la connexion HubSpot:', error)
      setOnboardingStep('selection')
      setIsConnecting(false)
    }
  }

  const startSmartSync = async () => {
    if (!token) return
    
    try {
      console.log('🚀 Démarrage de la synchronisation Smart Sync...')
      
      const syncId = await handleSync({ trigger: 'onboarding' })
      
      if (syncId) {
        console.log('✅ Synchronisation Smart Sync démarrée:', syncId)
      } else {
        throw new Error('Impossible de démarrer la synchronisation')
      }
      
    } catch (error) {
      console.error('❌ Erreur lors du démarrage de la sync:', error)
      setOnboardingStep('selection')
      setIsConnecting(false)
    }
  }
  
  // Écouter les changements de progrès et terminer l'onboarding
  React.useEffect(() => {
    if (syncProgress?.isComplete && onboardingStep === 'syncing') {
      const completeOnboarding = async () => {
        // Attendre un peu pour montrer les résultats
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        // Terminer l'onboarding
        setOnboardingStep('completed')
        await checkOnboardingStatus()
        
        // Rediriger vers les audits
        setTimeout(() => {
          router.push('/audits')
        }, 1000)
        
        console.log('✅ Onboarding terminé avec succès')
      }
      
      completeOnboarding()
    }
  }, [syncProgress, onboardingStep, setOnboardingStep, checkOnboardingStatus, router])

  // Calculer le pourcentage de progression
  const progressPercentage = React.useMemo(() => {
    if (!syncProgress) return 0
    if (syncProgress.isComplete) return 100
    return syncProgress.percentage || 0
  }, [syncProgress])

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent 
        className="max-w-2xl max-h-[90vh] overflow-y-auto" 
        hideCloseButton
      >
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <DialogTitle className="text-2xl font-bold">
              Connectez votre CRM
            </DialogTitle>
            <DialogDescription className="text-lg">
              Pour commencer, connectons votre système CRM à Forgeo
            </DialogDescription>
          </div>

          {/* Étape 1: Sélection du CRM */}
          {onboardingStep === 'selection' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {CRM_OPTIONS.map((crm) => (
                  <Card 
                    key={crm.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      crm.available 
                        ? 'hover:ring-2 hover:ring-primary' 
                        : 'opacity-50 cursor-not-allowed'
                    }`}
                    onClick={crm.available ? handleHubSpotConnection : undefined}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded-full ${crm.color}`} />
                          <CardTitle className="text-lg">{crm.name}</CardTitle>
                        </div>
                        {!crm.available && (
                          <Badge variant="secondary" className="text-xs">
                            Bientôt
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription>{crm.description}</CardDescription>
                      {crm.available && (
                        <Button 
                          className="w-full mt-3" 
                          variant="outline"
                          disabled={isConnecting}
                        >
                          {isConnecting ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Connexion...
                            </>
                          ) : (
                            <>
                              Connecter {crm.name}
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </>
                          )}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Étape 2: Connexion en cours */}
          {onboardingStep === 'connecting' && (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-orange-600 animate-spin" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold">Connexion à HubSpot</h3>
                <p className="text-muted-foreground">
                  Autorisez Forgeo à accéder à vos données HubSpot...
                </p>
              </div>
            </div>
          )}

          {/* Étape 3: Synchronisation en cours */}
          {onboardingStep === 'syncing' && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <div className="flex justify-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                    {syncProgress?.isComplete ? (
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    ) : (
                      <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                    )}
                  </div>
                </div>
                <h3 className="text-lg font-semibold">
                  {syncProgress?.isComplete ? 'Synchronisation terminée !' : 'Synchronisation des données'}
                </h3>
                <p className="text-muted-foreground">
                  {syncProgress?.isComplete 
                    ? 'Vos données HubSpot ont été synchronisées avec succès'
                    : 'Nous importons vos données HubSpot...'
                  }
                </p>
              </div>

              {/* Barre de progression */}
              <div className="space-y-3">
                <Progress value={progressPercentage} className="h-2" />
                <div className="text-sm text-center text-muted-foreground">
                  {progressPercentage}% terminé
                </div>
              </div>

              {/* Statistiques de synchronisation */}
              {syncProgress && (
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center space-y-1">
                    <div className="text-2xl font-bold text-blue-600">
                      {syncProgress.contacts.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">Contacts</div>
                  </div>
                  <div className="text-center space-y-1">
                    <div className="text-2xl font-bold text-green-600">
                      {syncProgress.companies.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">Entreprises</div>
                  </div>
                  <div className="text-center space-y-1">
                    <div className="text-2xl font-bold text-purple-600">
                      {syncProgress.deals.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">Deals</div>
                  </div>
                </div>
              )}

              {syncProgress?.isComplete && (
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    Redirection vers vos audits en cours...
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Étape 4: Terminé */}
          {onboardingStep === 'completed' && (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold">Configuration terminée !</h3>
                <p className="text-muted-foreground">
                  Bienvenue dans Forgeo. Découvrez vos premiers audits.
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
