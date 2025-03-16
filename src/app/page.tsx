"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";

export default function Home() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  
  useEffect(() => {
    // Attendre que l'état d'authentification soit chargé
    if (!isLoading) {
      if (user) {
        // Rediriger vers le dashboard si l'utilisateur est connecté
        router.replace("/dashboard");
      } else {
        // Rediriger vers la page de login si l'utilisateur n'est pas connecté
        router.replace("/login");
      }
    }
  }, [user, isLoading, router]);

  // Afficher un état de chargement pendant la vérification
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <div className="text-center">
        <h2 className="text-lg font-semibold">Chargement...</h2>
        <p className="text-sm text-muted-foreground">Veuillez patienter</p>
      </div>
    </div>
  );
}
