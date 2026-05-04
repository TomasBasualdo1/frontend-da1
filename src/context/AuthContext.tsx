import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getItemAsync, setItemAsync, deleteItemAsync } from '../utils/storage';
import { authService } from '../services';
import { userService } from '../services';
import { LoginRequest, Usuario, TokenResponse } from '../types';

interface AuthState {
  isLoading: boolean;
  isAuthenticated: boolean;
  token: string | null;
  user: Usuario | null;
}

interface AuthContextType extends AuthState {
  login: (data: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isLoading: true,
    isAuthenticated: false,
    token: null,
    user: null,
  });

  // Al montar, verificar si hay token guardado
  useEffect(() => {
    const loadToken = async () => {
      try {
        const storedToken = await getItemAsync('access_token');
        if (storedToken) {
          const user = await userService.getProfile();
          setState({
            isLoading: false,
            isAuthenticated: true,
            token: storedToken,
            user,
          });
        } else {
          setState((prev) => ({ ...prev, isLoading: false }));
        }
      } catch {
        await deleteItemAsync('access_token');
        setState({ isLoading: false, isAuthenticated: false, token: null, user: null });
      }
    };
    loadToken();
  }, []);

  const login = useCallback(async (data: LoginRequest) => {
    const tokenResponse: TokenResponse = await authService.login(data);
    await setItemAsync('access_token', tokenResponse.access_token);

    const user = await userService.getProfile();
    setState({
      isLoading: false,
      isAuthenticated: true,
      token: tokenResponse.access_token,
      user,
    });
  }, []);

  const logout = useCallback(async () => {
    await deleteItemAsync('access_token');
    setState({
      isLoading: false,
      isAuthenticated: false,
      token: null,
      user: null,
    });
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const user = await userService.getProfile();
      setState((prev) => ({ ...prev, user }));
    } catch {
      // Si falla, no hacer nada
    }
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
}
