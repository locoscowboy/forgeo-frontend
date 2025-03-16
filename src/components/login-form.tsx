'use client';

import { useState } from 'react';
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
  const { login: setAuth } = useAuth();
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
    try {
      console.log("Envoi des données de connexion:", values);
      
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
      
      console.log("Statut de la réponse:", response.status);
      
      // Convertir la réponse en JSON
      const data = await response.json();
      console.log("Données reçues:", data);
      
      if (response.ok) {
        // Vérifier que nous avons un token d'accès
        if (data.access_token) {
          console.log("Token reçu avec succès");
          
          // Stocker le token dans localStorage
          localStorage.setItem('token', data.access_token);
          
          // Mettre à jour le contexte d'authentification
          if (setAuth) {
            console.log("Appel de auth.login avec le token");
            setAuth(data.access_token);
            
            // Ajout d'un délai court avant la redirection pour s'assurer que le contexte est mis à jour
            setTimeout(() => {
              console.log("Redirection vers le dashboard");
              // Force la navigation complète au lieu d'une simple mise à jour de l'URL
              window.location.href = '/dashboard';
            }, 100);
          } else {
            console.error("Erreur: auth ou auth.login est undefined");
          }
        } else {
          console.error("Erreur: Pas de token dans la réponse", data);
          setError("Erreur: Le serveur n'a pas fourni de token");
        }
      } else {
        console.error("Erreur de l'API:", data);
        setError(data.detail || "Échec de l'authentification");
      }
    } catch (error) {
      console.error("Erreur lors de la connexion:", error);
      setError("Une erreur s'est produite. Veuillez réessayer.");
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
        <div className="rounded-md bg-destructive/15 p-4 text-sm text-destructive">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">Email</label>
          <input
            id="email"
            type="email"
            {...register('username')}
            className="w-full rounded-md border border-input bg-background px-3 py-2"
            disabled={isLoading}
          />
          {errors.username && (
            <p className="text-sm text-destructive">{errors.username.message}</p>
          )}
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-medium">Password</label>
            <a href="#" className="text-sm text-muted-foreground hover:text-primary">
              Forgot password?
            </a>
          </div>
          <input
            id="password"
            type="password"
            {...register('password')}
            className="w-full rounded-md border border-input bg-background px-3 py-2"
            disabled={isLoading}
          />
          {errors.password && (
            <p className="text-sm text-destructive">{errors.password.message}</p>
          )}
        </div>
        
        <button
          type="submit"
          className="w-full rounded-md bg-primary py-2 text-primary-foreground font-medium"
          disabled={isLoading}
        >
          {isLoading ? 'Connexion en cours...' : 'Sign In'}
        </button>
      </form>
    </div>
  );
} 