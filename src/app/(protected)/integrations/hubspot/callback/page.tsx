"use client"

import React, { useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/AuthContext'
import { RefreshCw, CheckCircle, XCircle } from 'lucide-react'

function HubSpotCallbackContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { token } = useAuth()
  const [status, setStatus] = React.useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = React.useState('')

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams?.get('code')
      const error = searchParams?.get('error')
      const connected = searchParams?.get('connected')

      // Si on arrive ici avec connected=true, c'est que le backend a réussi
      if (connected === 'true') {
        setStatus('success')
        setMessage('Connexion HubSpot réussie!')
        
        // Notifier la fenêtre parent du succès si c'est une popup
        if (window.opener) {
          window.opener.postMessage({ 
            type: 'hubspot-auth-success' 
          }, window.location.origin)
          
          // Fermer automatiquement la fenêtre après 2 secondes
          setTimeout(() => {
            window.close()
          }, 2000)
        } else {
          // Si ce n'est pas une popup, rediriger vers les audits
          setTimeout(() => {
            router.push('/audits')
          }, 2000)
        }
        return
      }

      if (error) {
        setStatus('error')
        setMessage(`Erreur d'autorisation: ${error}`)
        // Notifier la fenêtre parent de l'erreur
        if (window.opener) {
          window.opener.postMessage({ 
            type: 'hubspot-auth-error', 
            error 
          }, window.location.origin)
        }
        return
      }

      if (!code) {
        setStatus('error')
        setMessage('Code d\'autorisation manquant')
        if (window.opener) {
          window.opener.postMessage({ 
            type: 'hubspot-auth-error', 
            error: 'missing_code' 
          }, window.location.origin)
        }
        return
      }

      if (!token) {
        setStatus('error')
        setMessage('Token d\'authentification manquant')
        if (window.opener) {
          window.opener.postMessage({ 
            type: 'hubspot-auth-error', 
            error: 'missing_token' 
          }, window.location.origin)
        }
        return
      }

      try {
        // Le backend fait automatiquement la redirection après traitement
        // On fait juste un appel direct à l'endpoint callback avec le code
        const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
        const response = await fetch(`${API_BASE}/api/v1/hubspot/callback?code=${code}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          // Ne pas suivre les redirections automatiquement
          redirect: 'manual'
        });

        // Le backend redirige vers /audits?connected=true
        if (response.status === 302 || response.status === 0) {
          setStatus('success')
          setMessage('Connexion HubSpot réussie!')
          
          // Notifier la fenêtre parent du succès
          if (window.opener) {
            window.opener.postMessage({ 
              type: 'hubspot-auth-success' 
            }, window.location.origin)
            
            // Fermer automatiquement la fenêtre après 2 secondes
            setTimeout(() => {
              window.close()
            }, 2000)
          } else {
            // Si ce n'est pas une popup, rediriger vers les audits
            setTimeout(() => {
              router.push('/audits')
            }, 2000)
          }
        } else if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
      } catch (error: unknown) {
        setStatus('error')
        const errorMessage = error instanceof Error ? error.message : String(error)
        setMessage(`Erreur lors de l'échange du code: ${errorMessage}`)
        if (window.opener) {
          window.opener.postMessage({ 
            type: 'hubspot-auth-error', 
            error: errorMessage || 'exchange_failed' 
          }, window.location.origin)
        }
      }
    }

    handleCallback()
  }, [searchParams, token, router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        <div className="mb-6">
          {status === 'loading' && (
            <>
              <RefreshCw className="w-12 h-12 mx-auto mb-4 text-blue-600 animate-spin" />
              <h1 className="text-xl font-semibold text-gray-900 mb-2">
                Connexion en cours...
              </h1>
              <p className="text-gray-600">
                Traitement de votre autorisation HubSpot
              </p>
            </>
          )}
          
          {status === 'success' && (
            <>
              <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-600" />
              <h1 className="text-xl font-semibold text-gray-900 mb-2">
                Connexion réussie!
              </h1>
              <p className="text-gray-600">
                Votre compte HubSpot a été connecté avec succès.
              </p>
              <p className="text-sm text-gray-500 mt-2">
                {window.opener ? 'Cette fenêtre va se fermer automatiquement...' : 'Redirection vers les audits...'}
              </p>
            </>
          )}
          
          {status === 'error' && (
            <>
              <XCircle className="w-12 h-12 mx-auto mb-4 text-red-600" />
              <h1 className="text-xl font-semibold text-gray-900 mb-2">
                Erreur de connexion
              </h1>
              <p className="text-gray-600 mb-4">
                {message}
              </p>
              <button
                onClick={() => window.opener ? window.close() : router.push('/audits')}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                {window.opener ? 'Fermer' : 'Retour aux audits'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        <RefreshCw className="w-12 h-12 mx-auto mb-4 text-blue-600 animate-spin" />
        <h1 className="text-xl font-semibold text-gray-900 mb-2">
          Chargement...
        </h1>
        <p className="text-gray-600">
          Initialisation de la page de callback
        </p>
      </div>
    </div>
  )
}

export default function HubSpotCallbackPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <HubSpotCallbackContent />
    </Suspense>
  )
} 