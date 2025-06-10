"use client"

import React from 'react'
import { useAuth } from '@/lib/auth/AuthContext'
import { getHubSpotAuthUrl, getHubSpotStatus } from '@/lib/api/integrations'
import { Button } from '@/components/ui/button'

export function DebugHubSpot() {
  const { token } = useAuth()
  const [debugInfo, setDebugInfo] = React.useState<string>('')

  const testAuthUrl = async () => {
    if (!token) {
      setDebugInfo('❌ Pas de token d\'authentification')
      return
    }

    try {
      const result = await getHubSpotAuthUrl(token)
      setDebugInfo(`✅ Auth URL: ${result.auth_url}`)
    } catch (error) {
      setDebugInfo(`❌ Erreur Auth URL: ${error}`)
    }
  }

  const testStatus = async () => {
    if (!token) {
      setDebugInfo('❌ Pas de token d\'authentification')
      return
    }

    try {
      const result = await getHubSpotStatus(token)
      setDebugInfo(`✅ Statut: ${JSON.stringify(result, null, 2)}`)
    } catch (error) {
      setDebugInfo(`❌ Erreur Statut: ${error}`)
    }
  }

  return (
    <div className="p-4 border rounded-lg bg-gray-50">
      <h3 className="font-semibold mb-3">Debug HubSpot Integration</h3>
      <div className="flex gap-2 mb-3">
        <Button onClick={testAuthUrl} size="sm">
          Test Auth URL
        </Button>
        <Button onClick={testStatus} size="sm">
          Test Status
        </Button>
      </div>
      {debugInfo && (
        <pre className="text-xs bg-white p-2 rounded border overflow-auto max-h-40">
          {debugInfo}
        </pre>
      )}
    </div>
  )
} 