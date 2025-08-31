"use client"

import React, { useEffect } from 'react';
import { useLoginSync, useSmartSync } from '@/hooks/useSmartSync';
import { useAuth } from '@/lib/auth/AuthContext';

/**
 * Composant pour gérer la vérification et sync automatique au login
 * Ce composant doit être placé dans le layout principal pour s'exécuter après chaque login
 */
export function LoginSyncHandler() {
  const { token, user } = useAuth();
  const { performLoginCheck } = useLoginSync();

  useEffect(() => {
    // Déclencher la vérification de login sync seulement si on a un utilisateur connecté
    if (token && user) {
      console.log('🔄 Login detected - checking sync requirements...');
      performLoginCheck();
    }
  }, [token, user, performLoginCheck]);

  // Ce composant ne rend rien visuellement
  return null;
}

/**
 * Hook pour gérer la sync automatique au login avec plus de contrôle
 */
export function useAutoSyncOnLogin() {
  const { token } = useAuth();
  const { checkSyncStatus, startSync } = useSmartSync();
  const [hasPerformedLoginSync, setHasPerformedLoginSync] = React.useState(false);

  const performLoginSync = React.useCallback(async () => {
    if (!token || hasPerformedLoginSync) return;

    try {
      console.log('🔄 Performing login sync check...');
      
      // Vérifier d'abord le statut
      await checkSyncStatus(token, true);
      
      // TODO: Implémenter la logique basée sur loginSyncCheck
      // En attendant, on marque comme vérifié
      setHasPerformedLoginSync(true);
      
      console.log('✅ Login sync check completed');
    } catch (error) {
      console.error('❌ Error during login sync check:', error);
      setHasPerformedLoginSync(true); // Marquer comme fait même en cas d'erreur
    }
  }, [token, hasPerformedLoginSync, checkSyncStatus]);

  // Reset quand l'utilisateur se déconnecte
  useEffect(() => {
    if (!token) {
      setHasPerformedLoginSync(false);
    }
  }, [token]);

  return {
    performLoginSync,
    hasPerformedLoginSync
  };
}
