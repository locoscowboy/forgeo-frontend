'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { login } from '@/lib/api/auth';

// Schéma de validation
const loginSchema = z.object({
  username: z.string().email('Veuillez entrer une adresse email valide'),
  password: z.string().min(1, 'Le mot de passe est requis'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const { login: setAuth } = useAuth();
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

  async function onSubmit(data: LoginFormValues) {
    setIsLoading(true);
    setError(null);
    
    try {
      // Appeler l'API de login
      console.log('Tentative de connexion avec:', data.username);
      const response = await login(data);
      
      console.log('Réponse de l\'API:', response);
      
      // Vérifier que la réponse contient bien un token
      if (response && response.access_token) {
        // Stocker le token dans le contexte d'authentification
        setAuth(response.access_token);
        
        console.log('Authentification réussie, redirection vers le dashboard...');
        
        // Rediriger vers le dashboard
        router.push('/dashboard');
      } else {
        setError('Réponse invalide du serveur');
        console.error('Réponse invalide:', response);
      }
    } catch (err) {
      setError('Authentification échouée. Vérifiez vos identifiants.');
      console.error('Erreur de connexion:', err);
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