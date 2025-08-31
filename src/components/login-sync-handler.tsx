"use client"

import { useEffect } from 'react';
import { useLoginSync } from '@/hooks/useSmartSync';
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
