// import { useState, useEffect, useCallback } from 'react';
// import { useQuery } from '@tanstack/react-query';
// import api from '@/api/axios';
// import type { TransactionStatusResponse } from '@/types/api';

// interface PollStatusOptions {
//   orderId: string;
//   school_id: string;
//   intervalMs?: number;
//   maxAttempts?: number;
//   enabled?: boolean;
// }

// export const usePollStatus = ({
//   orderId,
//   school_id,
//   intervalMs = 2000,
//   maxAttempts = 30,
//   enabled = true
// }: PollStatusOptions) => {
//   const [attempts, setAttempts] = useState(0);
//   const [isComplete, setIsComplete] = useState(false);

//   const query = useQuery({
//     queryKey: ['transaction-status', orderId],
//     queryFn: async (): Promise<TransactionStatusResponse> => {
//       const response = await api.get(`/api/payments/check-status/${orderId}?school_id=${school_id}`);
//       // const response = await api.get(`/api/transaction-status/${orderId}`);
//       return response.data;
//     },
//     enabled: enabled && !isComplete && attempts < maxAttempts,
//     refetchInterval: (query) => {
//       const data = query.state.data;
//       if (!data || isComplete) return false;
      
//       const status = data.status;
//       if (status === 'SUCCESS' || status === 'FAILED') {
//         setIsComplete(true);
//         return false;
//       }
      
//       // Exponential backoff: start at intervalMs, increase gradually
//       const backoffMs = Math.min(intervalMs * Math.pow(1.2, attempts), 10000);
//       setAttempts(prev => prev + 1);
//       return backoffMs;
//     },
//     refetchIntervalInBackground: false,
//   });

//   const reset = useCallback(() => {
//     setAttempts(0);
//     setIsComplete(false);
//   }, []);

//   const isTimedOut = attempts >= maxAttempts && !isComplete;
//   const canRetry = isTimedOut || query.isError;

//   return {
//     data: query.data,
//     isLoading: query.isLoading,
//     isError: query.isError,
//     error: query.error,
//     isComplete,
//     isTimedOut,
//     attempts,
//     maxAttempts,
//     canRetry,
//     reset,
//     refetch: query.refetch,
//   };
// };

// import { useState, useEffect, useCallback } from 'react';
// import { useQuery } from '@tanstack/react-query';
// import api from '@/api/axios';
// import type { TransactionStatusResponse } from '@/types/api';

// interface PollStatusOptions {
//   orderId: string;
//   school_id: string;
//   intervalMs?: number;
//   maxAttempts?: number;
//   enabled?: boolean;
// }

// export const usePollStatus = ({
//   orderId,
//   school_id,
//   intervalMs = 2000,
//   maxAttempts = 30,
//   enabled = true,
// }: PollStatusOptions) => {
//   const [attempts, setAttempts] = useState(0);
//   const [isComplete, setIsComplete] = useState(false);

//   const query = useQuery({
//     queryKey: ['transaction-status', orderId],
//     queryFn: async (): Promise<TransactionStatusResponse> => {
//       const response = await api.get(`/api/payments/check-status/${orderId}?school_id=${school_id}`);
//       return response.data;
//     },
//     // The query is enabled only if polling is enabled and it's not complete or timed out
//     enabled: enabled && !isComplete && attempts < maxAttempts,
//     refetchInterval: (query) => {
//       const data = query.state.data;
//       if (!data || isComplete) return false;

//       const status = data?.provider.status;
//       if (status === 'SUCCESS' || status === 'FAILED') {
//         return false;
//       }
//       // Calculate exponential backoff without setting state
//       const backoffMs = Math.min(intervalMs * Math.pow(1.2, attempts), 10000);
//       return backoffMs;
//     },
//     refetchIntervalInBackground: false,
//   });

//   // Manage attempts and completion based on query status
//   useEffect(() => {
//     // Increment attempts on each successful fetch (not on error or loading)
//     if (query.isSuccess) {
//       setAttempts((prev) => prev + 1);
//       const status = query.data?.status;
//       if (status === 'SUCCESS' || status === 'FAILED') {
//         setIsComplete(true);
//       }
//     }
//   }, [query.isSuccess, query.data, setIsComplete]);

//   const reset = useCallback(() => {
//     setAttempts(0);
//     setIsComplete(false);
//   }, []);

//   const isTimedOut = attempts >= maxAttempts && !isComplete;
//   const canRetry = isTimedOut || query.isError;

//   return {
//     data: query.data,
//     isLoading: query.isLoading,
//     isError: query.isError,
//     error: query.error,
//     isComplete,
//     isTimedOut,
//     attempts,
//     maxAttempts,
//     canRetry,
//     reset,
//     refetch: query.refetch,
//   };
// };


import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import type { TransactionStatusResponse } from '@/types/api';

interface PollStatusOptions {
  orderId: string;
  school_id: string;
  intervalMs?: number;
  maxAttempts?: number;
  enabled?: boolean;
}

export const usePollStatus = ({
  orderId,
  school_id,
  intervalMs = 2000,
  maxAttempts = 30,
  enabled = true,
}: PollStatusOptions) => {
  const [attempts, setAttempts] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const query = useQuery({
    queryKey: ['transaction-status', orderId],
    queryFn: async (): Promise<TransactionStatusResponse> => {
      const response = await api.get(`/api/payments/check-status/${orderId}?school_id=${school_id}`);
      return response.data;
    },
    enabled: enabled && !isComplete && attempts < maxAttempts,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data || isComplete) return false;

      // Correctly access the status from the nested 'provider' object
      const status = data.provider?.status;
      if (status === 'SUCCESS' || status === 'FAILED') {
        return false;
      }

      const backoffMs = Math.min(intervalMs * Math.pow(1.2, attempts), 10000);
      return backoffMs;
    },
    refetchIntervalInBackground: false,
  });

  useEffect(() => {
    if (query.isSuccess) {
      setAttempts((prev) => prev + 1);
      // Correctly access the status from the nested 'provider' object
      const status = query.data?.provider?.status;
      if (status === 'SUCCESS' || status === 'FAILED') {
        setIsComplete(true);
      }
    }
  }, [query.isSuccess, query.data, setIsComplete]);

  const reset = useCallback(() => {
    setAttempts(0);
    setIsComplete(false);
  }, []);

  const isTimedOut = attempts >= maxAttempts && !isComplete;
  const canRetry = isTimedOut || query.isError;

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    isComplete,
    isTimedOut,
    attempts,
    maxAttempts,
    canRetry,
    reset,
    refetch: query.refetch,
  };
};