import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI } from '../services/api';
import type { AuthResponse, UserRole } from '../types';

interface AuthContextType {
  user: AuthResponse | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, firstName: string, lastName: string, password: string, confirmPassword: string, role: UserRole) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Decoder JWT token og tjekker om den er udløbet
 */
const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp;
    if (!exp) return true;
    
    // Tjek om token er udløbet (med 5 sekunders buffer)
    const currentTime = Math.floor(Date.now() / 1000);
    return exp < (currentTime + 5);
  } catch (error) {
    // Hvis token ikke kan decodes, betragt den som udløbet
    return true;
  }
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    const fullName = localStorage.getItem('fullName');
    const role = localStorage.getItem('role') as UserRole;

    if (token && username && role) {
      // Tjek om token er udløbet
      if (isTokenExpired(token)) {
        // Token er udløbet - clear auth data
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        localStorage.removeItem('fullName');
        localStorage.removeItem('role');
        setUser(null);
      } else {
        setUser({ token, username, fullName: fullName || username, role });
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    const response = await authAPI.login({ username, password });
    localStorage.setItem('token', response.token);
    localStorage.setItem('username', response.username);
    localStorage.setItem('fullName', response.fullName);
    localStorage.setItem('role', response.role);
    setUser(response);
  };

  const register = async (username: string, firstName: string, lastName: string, password: string, confirmPassword: string, role: UserRole) => {
    const response = await authAPI.register({ username, firstName, lastName, password, confirmPassword, role });
    localStorage.setItem('token', response.token);
    localStorage.setItem('username', response.username);
    localStorage.setItem('fullName', response.fullName);
    localStorage.setItem('role', response.role);
    setUser(response);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('fullName');
    localStorage.removeItem('role');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        isAuthenticated: !!user,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};





