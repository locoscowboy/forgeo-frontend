'use client';

import { AuthProvider } from '@/lib/auth/AuthContext';
import { SyncProvider } from '@/lib/sync/SyncContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <SyncProvider>
        {children}
      </SyncProvider>
    </AuthProvider>
  );
} 