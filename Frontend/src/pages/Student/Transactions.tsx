// import { useState, useEffect } from 'react';
// import { useQuery } from '@tanstack/react-query';
// import { Link } from 'react-router-dom';
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Badge } from '@/components/ui/badge';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// import { useAuth } from '@/auth/useAuth';
// import api from '@/api/axios';
// import { ArrowLeft, Search, Filter, Eye } from 'lucide-react';
// import type { TransactionsResponse, Transaction } from '@/types/api';

// export default function StudentTransactions() {
//   const { logout } = useAuth();
//   const [page, setPage] = useState(1);
//   const [search, setSearch] = useState('');
//   const [statusFilter, setStatusFilter] = useState<string>('');
  
//   const limit = 10;

//   useEffect(() => {
//     document.title = 'Transactions - EDV Payment System';
//   }, []);

//   const { data: transactions, isLoading } = useQuery({
//     queryKey: ['transactions', page, search, statusFilter],
//     queryFn: async (): Promise<TransactionsResponse> => {
//       const params = new URLSearchParams({
//         page: page.toString(),
//         limit: limit.toString(),
//         sort: 'payment_time',
//         order: 'desc',
//       });
      
//       if (statusFilter) {
//         params.append('status', statusFilter);
//       }
      
//       if (search) {
//         params.append('search', search);
//       }

//       const response = await api.get(`/api/transactions?${params}`);
//       return response.data;
//     },
//   });

//   const getStatusColor = (status: string) => {
//     switch (status) {
//       case 'SUCCESS': return 'bg-success text-success-foreground';
//       case 'FAILED': return 'bg-destructive text-destructive-foreground';
//       case 'PENDING': return 'bg-pending text-pending-foreground';
//       default: return 'bg-muted text-muted-foreground';
//     }
//   };

//   const formatDate = (dateString: string) => {
//     return new Date(dateString).toLocaleDateString('en-IN', {
//       day: 'numeric',
//       month: 'short',
//       year: 'numeric',
//       hour: '2-digit',
//       minute: '2-digit'
//     });
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-background to-muted">
//       {/* Header */}
//       <header className="bg-card border-b">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="flex items-center justify-between h-16">
//             <div className="flex items-center space-x-4">
//               <Button variant="ghost" size="sm" asChild>
//                 <Link to="/dashboard">
//                   <ArrowLeft className="h-4 w-4 mr-2" />
//                   Back to Dashboard
//                 </Link>
//               </Button>
//               <h1 className="text-xl font-semibold">Transaction History</h1>
//             </div>
            
//             <Button variant="ghost" size="sm" onClick={logout}>
//               Logout
//             </Button>
//           </div>
//         </div>
//       </header>

//       {/* Main Content */}
//       <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//         {/* Filters */}
//         <Card className="mb-6">
//           <CardHeader>
//             <CardTitle className="flex items-center">
//               <Filter className="h-5 w-5 mr-2" />
//               Filters
//             </CardTitle>
//           </CardHeader>
//           <CardContent>
//             <div className="flex flex-col sm:flex-row gap-4">
//               <div className="flex-1">
//                 <Input
//                   placeholder="Search by order ID..."
//                   value={search}
//                   onChange={(e) => setSearch(e.target.value)}
//                   className="w-full"
//                 />
//               </div>
//               <div className="w-full sm:w-48">
//                 <Select value={statusFilter} onValueChange={setStatusFilter}>
//                   <SelectTrigger>
//                     <SelectValue placeholder="Filter by status" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     <SelectItem value="">All Statuses</SelectItem>
//                     <SelectItem value="SUCCESS">Success</SelectItem>
//                     <SelectItem value="PENDING">Pending</SelectItem>
//                     <SelectItem value="FAILED">Failed</SelectItem>
//                   </SelectContent>
//                 </Select>
//               </div>
//             </div>
//           </CardContent>
//         </Card>

//         {/* Transactions List */}
//         <Card>
//           <CardHeader>
//             <CardTitle>Your Transactions</CardTitle>
//             <CardDescription>
//               {transactions?.meta.total || 0} total transactions
//             </CardDescription>
//           </CardHeader>
//           <CardContent>
//             {isLoading ? (
//               <div className="flex items-center justify-center py-8">
//                 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
//               </div>
//             ) : transactions?.data.length === 0 ? (
//               <div className="text-center py-8">
//                 <p className="text-muted-foreground mb-4">No transactions found</p>
//                 <Button asChild>
//                   <Link to="/payments/new">Create Your First Payment</Link>
//                 </Button>
//               </div>
//             ) : (
//               <div className="space-y-4">
//                 {transactions?.data.map((transaction: Transaction) => (
//                   <div
//                     key={transaction.collect_id}
//                     className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
//                   >
//                     <div className="flex items-center justify-between">
//                       <div className="flex-1">
//                         <div className="flex items-center space-x-3 mb-2">
//                           <h3 className="font-semibold">
//                             ₹{transaction.order_amount}
//                           </h3>
//                           <Badge className={getStatusColor(transaction.status)}>
//                             {transaction.status}
//                           </Badge>
//                         </div>
                        
//                         <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
//                           <div>
//                             <span className="font-medium">Order ID:</span>{' '}
//                             {transaction.custom_order_id || transaction.collect_id}
//                           </div>
//                           <div>
//                             <span className="font-medium">Gateway:</span>{' '}
//                             <span className="capitalize">{transaction.gateway}</span>
//                           </div>
//                           <div>
//                             <span className="font-medium">Date:</span>{' '}
//                             {formatDate(transaction.payment_time)}
//                           </div>
//                         </div>
//                       </div>
                      
//                       <Button asChild variant="outline" size="sm">
//                         <Link to={`/transactions/${transaction.collect_id}`}>
//                           <Eye className="h-4 w-4 mr-2" />
//                           View Details
//                         </Link>
//                       </Button>
//                     </div>
//                   </div>
//                 ))}
                
//                 {/* Pagination */}
//                 {transactions && transactions.meta.total > limit && (
//                   <div className="flex items-center justify-between pt-4 border-t">
//                     <p className="text-sm text-muted-foreground">
//                       Showing {((page - 1) * limit) + 1} to{' '}
//                       {Math.min(page * limit, transactions.meta.total)} of{' '}
//                       {transactions.meta.total} transactions
//                     </p>
                    
//                     <div className="flex space-x-2">
//                       <Button
//                         variant="outline"
//                         size="sm"
//                         onClick={() => setPage(p => Math.max(1, p - 1))}
//                         disabled={page === 1}
//                       >
//                         Previous
//                       </Button>
//                       <Button
//                         variant="outline"
//                         size="sm"
//                         onClick={() => setPage(p => p + 1)}
//                         disabled={page * limit >= transactions.meta.total}
//                       >
//                         Next
//                       </Button>
//                     </div>
//                   </div>
//                 )}
//               </div>
//             )}
//           </CardContent>
//         </Card>
//       </main>
//     </div>
//   );
// }




import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/auth/useAuth';
import api from '@/api/axios';
import { ArrowLeft, Search, Filter, Eye } from 'lucide-react';
import type { TransactionsResponse, Transaction } from '@/types/api';
import { useAuthContext } from '@/auth/AuthProvider';

// Custom hook for debouncing a value
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
};


export default function StudentTransactions() {
  const { logout } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const {user} = useAuthContext();
  
  const limit = 100;
  // Debounce the search term to prevent excessive API calls
  const debouncedSearch = useDebounce(search, 500);

  useEffect(() => {
    document.title = 'Transactions - EDV Payment System';
  }, []);

  const { data: transactions, isLoading, isError } = useQuery({
    queryKey: ['transactions', page, debouncedSearch, statusFilter],
    queryFn: async (): Promise<TransactionsResponse> => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sort: 'payment_time',
        order: 'desc',
      });
      
      // Only append status filter if it's not "all"
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      
      // Only append search filter if it's not empty
      if (debouncedSearch) {
        params.append('search', debouncedSearch);
      }

      const response = await api.get(`/api/transactions/user/${user?.id}?${params}`);
      return response.data;
    },
  });

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'SUCCESS': return 'bg-success text-success-foreground';
      case 'FAILED': return 'bg-destructive text-destructive-foreground';
      case 'PENDING': return 'bg-pending text-pending-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  }, []);

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  // Handle API error state
  if (isError) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="max-w-md w-full text-center p-6">
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive">Failed to load transactions. Please try again later.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Handle loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className=" m-2 min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Header */}
      <header className="bg-card border-b">
        <div className="max-w-9xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/dashboard">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
              <h1 className="text-xl font-semibold">Transaction History</h1>
            </div>
            
            <Button variant="ghost" size="sm" onClick={logout}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search by order ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full"
                />
              </div>
              {/* <div className="w-full sm:w-48">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent> */}
                    {/* Updated value to "all" to fix Radix UI error */}
                    {/* <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="SUCCESS">Success</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="FAILED">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div> */}
            </div>
          </CardContent>
        </Card>

        {/* Transactions List */}
        <Card>
          <CardHeader>
            <CardTitle>Your Transactions</CardTitle>
            <CardDescription>
              {transactions?.meta.total || 0} total transactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {transactions?.data.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No transactions found</p>
                <Button asChild>
                  <Link to="/payments/new">Create Your First Payment</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {transactions?.data.map((transaction: Transaction) => (
                  <div
                    key={transaction.collect_request_id}
                    className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <Badge className={getStatusColor(transaction.status)}>
                            {transaction.status}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-6 gap-2 text-sm text-muted-foreground">
                          <div className='text-nowrap col-span-2'>
                            <span className="font-medium">Order ID:</span>{' '}
                            {transaction.custom_order_id || transaction.collect_request_id}
                          </div>
                          
                          <div >
                            <span className="font-medium "> Transaction Amount:</span>{' '}
                            ₹{transaction.order_amount}
                          </div>
                          <div>
                            <span className="font-medium">Gateway:</span>{' '}
                            <span className="capitalize">{transaction.gateway_name}</span>
                          </div>
                          <div>
                            <span className="font-medium">Payment:</span>{' '}
                            <span className="capitalize">{transaction?.payment_mode || "NA"}</span>
                          </div>
                          <div>
                            <span className="font-medium col-span-2">Date:</span>{' '}
                            {formatDate(transaction.payment_time)}
                          </div>
                        </div>
                      </div>
                      
                      {/* <Button asChild variant="outline" size="sm">
                        <Link to={`/transactions/${transaction.collect_request_id}`}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Link>
                      </Button> */}
                    </div>
                  </div>
                ))}
                
                {/* Pagination */}
                {transactions && transactions.meta.total > limit && (
                  <div className="flex items-center justify-between pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      Showing {((page - 1) * limit) + 1} to{' '}
                      {Math.min(page * limit, transactions.meta.total)} of{' '}
                      {transactions.meta.total} transactions
                    </p>
                    
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => p + 1)}
                        disabled={page * limit >= transactions.meta.total}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}