import { AppSidebar } from "@/components/layout/app-sidebar";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Le middleware s'occupe déjà de vérifier l'authentification, 
  // donc nous n'avons plus besoin de le faire ici

  return (
    <div className="flex h-screen">
      <AppSidebar />
      <main className="flex-1 overflow-y-auto p-6">
        {children}
      </main>
    </div>
  );
}
