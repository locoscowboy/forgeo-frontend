'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { useRouter } from 'next/navigation';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      console.log('User not authenticated, redirecting to login...');
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-semibold">Chargement...</h2>
          <p className="text-sm text-muted-foreground">Veuillez patienter</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Ne rien afficher pendant la redirection
  }

  return (
    <div className="flex h-screen w-full">
      <AppSidebar />
      <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
} 