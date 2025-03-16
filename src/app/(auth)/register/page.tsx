"use client";

import Link from "next/link";

export default function RegisterPage() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-8 p-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Créer un compte</h1>
          <p className="mt-2 text-muted-foreground">
            Inscrivez-vous pour accéder à Forgeo
          </p>
        </div>
        
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <p className="mb-4 text-center">Fonctionnalité à venir...</p>
          <div className="mt-6 text-center">
            <Link 
              href="/login" 
              className="text-sm text-primary hover:underline"
            >
              Déjà un compte? Connectez-vous
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
