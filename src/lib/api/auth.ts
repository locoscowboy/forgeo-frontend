export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface User {
  id: number;
  email: string;
  is_active: boolean;
  is_admin: boolean;
  full_name: string;
}

export interface RegisterData {
  email: string;
  password: string;
  full_name: string;
}

export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  const response = await fetch('https://forgeo.store/api/v1/auth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      username: credentials.username,
      password: credentials.password,
    }),
  });

  if (!response.ok) {
    throw new Error('Authentication failed');
  }

  return response.json();
}

export async function getCurrentUser(token: string): Promise<User> {
  const response = await fetch('https://forgeo.store/api/v1/users/me', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch user');
  }

  return response.json();
}

export async function register(userData: RegisterData): Promise<AuthResponse> {
  const response = await fetch('https://forgeo.store/api/v1/auth/signup', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: userData.email,
      password: userData.password,
      full_name: userData.full_name,
    }),
  });

  if (!response.ok) {
    throw new Error('Registration failed');
  }

  return response.json();
} 
