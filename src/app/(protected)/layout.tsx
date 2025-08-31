"use client"

import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { OnboardingModal } from "@/components/onboarding-modal-smart";
import { LoginSyncHandler } from "@/components/login-sync-handler";
import { useAuth } from "@/lib/auth/AuthContext";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { needsOnboarding } = useAuth();
  
  // Le middleware s'occupe déjà de vérifier l'authentification, 
  // donc nous n'avons plus besoin de le faire ici

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-screen w-screen overflow-hidden">
        <AppSidebar />
        <SidebarInset className="flex-1 overflow-hidden">
          <main className="flex flex-col h-full w-full overflow-hidden">
            {children}
          </main>
        </SidebarInset>
      </div>
      
      {/* Modal d'onboarding */}
      <OnboardingModal open={needsOnboarding} />
      
      {/* Gestionnaire de sync au login */}
      <LoginSyncHandler />
    </SidebarProvider>
  );
}
