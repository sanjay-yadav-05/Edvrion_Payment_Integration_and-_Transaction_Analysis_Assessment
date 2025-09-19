// import React, { createContext, useContext, useEffect, useState } from 'react';
// import { getStoredAuth } from '@/api/axios';
// import type { User } from '@/types/api';

// interface AuthContextType {
//   user: User | null;
//   isAuthenticated: boolean;
//   isLoading: boolean;
// }

// const AuthContext = createContext<AuthContextType>({
//   user: null,
//   isAuthenticated: false,
//   isLoading: true,
// });

// export const useAuthContext = () => {
//   const context = useContext(AuthContext);
//   if (!context) {
//     throw new Error('useAuthContext must be used within AuthProvider');
//   }
//   return context;
// };

// export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
//   const [user, setUser] = useState<User | null>(null);
//   const [isLoading, setIsLoading] = useState(true);

//   useEffect(() => {
//     const auth = getStoredAuth();
//     setUser(auth?.user || null);
//     setIsLoading(false);
//   }, []);

//   // Listen for storage changes to sync auth state across tabs
//   useEffect(() => {
//     const handleStorageChange = (e: StorageEvent) => {
//       if (e.key === 'edv_auth') {
//         const auth = getStoredAuth();
//         setUser(auth?.user || null);
//       }
//     };

//     window.addEventListener('storage', handleStorageChange);
//     return () => window.removeEventListener('storage', handleStorageChange);
//   }, []);

//   const value = {
//     user,
//     isAuthenticated: !!user,
//     isLoading,
//   };

//   return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
// };




import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getStoredAuth, setStoredAuth, clearStoredAuth } from '@/api/axios';
import type { User, AuthResponse } from '@/types/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  // Add a function to update the auth state
  setAuth: (authData: AuthResponse | null) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  setAuth: () => {}, // Provide a no-op default
});

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Function to update state from outside the provider
  const setAuth = useCallback((authData: AuthResponse | null) => {
    if (authData) {
      setUser(authData.user);
    } else {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const auth = getStoredAuth();
    setUser(auth?.user || null);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'edv_auth') {
        const auth = getStoredAuth();
        setUser(auth?.user || null);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    setAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};