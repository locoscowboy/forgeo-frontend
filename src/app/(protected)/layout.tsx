import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/layout/app-sidebar";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Vérification côté serveur si l'utilisateur est connecté
  const cookiesStore = await cookies();
  const hasToken = cookiesStore.has("token");
  
  if (!hasToken) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen">
      <AppSidebar />
      <main className="flex-1 overflow-y-auto p-6">
        {children}
      </main>
    </div>
  );
}
