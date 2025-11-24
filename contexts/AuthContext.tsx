
import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { useAuthStore } from '../store';
import { User, UserRole } from '../types';
import { ROLE_PERMISSIONS } from '../constants';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
  hasPermission: (permissionKey: keyof typeof ROLE_PERMISSIONS[UserRole]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, login, logout, initializeAuth } = useAuthStore();

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  const hasPermission = (permissionKey: keyof typeof ROLE_PERMISSIONS[UserRole]): boolean => {
    if (!user) return false;
    const permissions = ROLE_PERMISSIONS[user.role];
    return permissions ? permissions[permissionKey] === true : false;
  };

  const memoizedValue = useMemo(() => ({
    user,
    isAuthenticated,
    login,
    logout,
    hasPermission,
  }), [user, isAuthenticated, login, logout, hasPermission]);

  return (
    <AuthContext.Provider value={memoizedValue}>
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
