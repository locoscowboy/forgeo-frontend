'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/lib/auth/AuthContext';

// Schéma de validation
const loginSchema = z.object({
  username: z.string().email('Veuillez entrer une adresse email valide'),
  password: z.string().min(1, 'Le mot de passe est requis'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  async function onSubmit(values: LoginFormValues) {
    setIsLoading(true);
    setError(null); // Réinitialiser l'erreur
    
    try {
      console.log("🔐 Envoi des données de connexion:", { username: values.username });
      
      const response = await fetch('https://forgeo.store/api/v1/auth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          'username': values.username,
          'password': values.password,
        }).toString(),
        credentials: 'include',
      });
      
      console.log("📡 Statut de la réponse:", response.status);
      
      // Convertir la réponse en JSON
      const data = await response.json();
      console.log("📦 Données reçues:", data);
      
      if (response.ok && data.access_token) {
        console.log("✅ Token reçu avec succès");
        
        // Mettre à jour le contexte d'authentification
        login(data.access_token);
        
        // La redirection sera gérée par le AuthContext après fetchUser
        console.log("🔄 Authentification en cours...");
        
        // Petit délai pour permettre à l'AuthContext de se mettre à jour
        setTimeout(() => {
          router.push('/dashboard');
        }, 100);
        
      } else {
        // Gestion des erreurs de l'API
        const errorMessage = data.detail || data.message || "Échec de l'authentification";
        console.error("❌ Erreur de l'API:", errorMessage);
        setError(errorMessage);
      }
    } catch (error) {
      console.error("💥 Erreur lors de la connexion:", error);
      setError("Une erreur s'est produite. Veuillez vérifier votre connexion et réessayer.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Sign In</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Enter your credentials to access your account
        </p>
      </div>
      
      {error && (
        <div className="rounded-md bg-destructive/15 p-4 text-sm text-destructive border border-destructive/20">
          <p className="font-medium">Erreur de connexion</p>
          <p className="mt-1">{error}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">Email</label>
          <input
            id="email"
            type="email"
            {...register('username')}
            className="w-full rounded-md border border-input bg-background px-3 py-2 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
            disabled={isLoading}
            placeholder="votre@email.com"
          />
          {errors.username && (
            <p className="text-sm text-destructive">{errors.username.message}</p>
          )}
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-medium">Password</label>
            <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Forgot password?
            </a>
          </div>
          <input
            id="password"
            type="password"
            {...register('password')}
            className="w-full rounded-md border border-input bg-background px-3 py-2 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
            disabled={isLoading}
            placeholder="••••••••"
          />
          {errors.password && (
            <p className="text-sm text-destructive">{errors.password.message}</p>
          )}
        </div>
        
        <button
          type="submit"
          className="w-full rounded-md bg-primary py-2 text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Connexion en cours...
            </span>
          ) : (
            'Sign In'
          )}
        </button>
      </form>
    </div>
  );
} 
