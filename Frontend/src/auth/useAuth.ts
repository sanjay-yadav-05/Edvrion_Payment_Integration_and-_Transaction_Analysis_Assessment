// import { useMutation, useQueryClient } from '@tanstack/react-query';
// import { toast } from '@/hooks/use-toast';
// import api, { getStoredAuth, setStoredAuth, clearStoredAuth } from '@/api/axios';
// import type { LoginRequest, AuthResponse } from '@/types/api';

// export const useAuth = () => {
//   const queryClient = useQueryClient();
  
  
//   const login = useMutation({
//     mutationFn: async (credentials: LoginRequest): Promise<AuthResponse> => {
//       const response = await api.post('/api/auth/login', credentials);
//       return response.data;
//     },
//     onSuccess: (data) => {
//       setStoredAuth(data);
//       toast({
//         title: 'Login successful',
//         description: 'Welcome back!',
//       });
//     },
//     onError: (error: any) => {
//       toast({
//         title: 'Login failed',
//         description: error.response?.data?.message || 'Invalid credentials',
//         variant: 'destructive',
//       });
//     },
//   });

//   const logout = () => {
//     clearStoredAuth();
//     queryClient.clear();
//     window.location.href = '/login';
//   };

//   const getUser = () => {
//     const auth = getStoredAuth();
//     return auth?.user || null;
//   };

//   const isAuthenticated = () => {
//     const auth = getStoredAuth();
//     return !!auth?.accessToken;
//   };

//   const isAdmin = () => {
//     const user = getUser();
//     return user?.role === 'admin';
//   };

//   return {
//     login: login.mutate,
//     loginAsync: login.mutateAsync,
//     isLoggingIn: login.isPending,
//     logout,
//     getUser,
//     isAuthenticated,
//     isAdmin,
//   };
// };

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import api, { getStoredAuth, setStoredAuth, clearStoredAuth } from '@/api/axios';
import type { LoginRequest, AuthResponse } from '@/types/api';
// Import useAuthContext to access the new setAuth function
import { useAuthContext } from '@/auth/AuthProvider';

export const useAuth = () => {
  const queryClient = useQueryClient();
  const { setAuth } = useAuthContext(); // Get the new function from context

  const login = useMutation({
    mutationFn: async (credentials: LoginRequest): Promise<AuthResponse> => {
      const response = await api.post('/api/auth/login', credentials);
      return response.data;
    },
    onSuccess: (data) => {
      setStoredAuth(data);
      setAuth(data); // Call the new setAuth function to update the context state
      toast({
        title: 'Login successful',
        description: 'Welcome back!',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Login failed',
        description: error.response?.data?.message || 'Invalid credentials',
        variant: 'destructive',
      });
    },
  });

  const logout = () => {
    clearStoredAuth();
    setAuth(null); // Clear the context state on logout
    queryClient.clear();
    window.location.href = '/login';
  };

  // The rest of the useAuth hook logic remains the same
  const getUser = () => {
    const auth = getStoredAuth();
    return auth?.user || null;
  };

  const isAuthenticated = () => {
    const auth = getStoredAuth();
    return !!auth?.accessToken;
  };

  const isAdmin = () => {
    const user = getUser();
    return user?.role === 'admin';
  };

  return {
    login: login.mutate,
    loginAsync: login.mutateAsync,
    isLoggingIn: login.isPending,
    logout,
    getUser,
    isAuthenticated,
    isAdmin,
  };
};