import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/auth/useAuth';
import api from '@/api/axios';
import { ArrowLeft, Search, Filter, Eye, Download, ArrowUpDown } from 'lucide-react';
import type { TransactionsResponse, Transaction } from '@/types/api';

export default function AdminTransactionsOverview() {
  const { logout } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // URL state management
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'));
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState<string[]>(
    searchParams.get('status')?.split(',').filter(Boolean) || []
  );
  const [schoolFilter, setSchoolFilter] = useState<string[]>(
    searchParams.get('school')?.split(',').filter(Boolean) || []
  );
  const [sortField, setSortField] = useState(searchParams.get('sort') || 'payment_time');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(
    (searchParams.get('order') as 'asc' | 'desc') || 'desc'
  );
  const [dateFrom, setDateFrom] = useState(searchParams.get('from') || '');
  const [dateTo, setDateTo] = useState(searchParams.get('to') || '');
  
  const limit = 20;

  useEffect(() => {
    document.title = 'Admin Transactions - EDV Payment System';
  }, []);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    params.set('page', page.toString());
    if (search) params.set('search', search);
    if (statusFilter.length) params.set('status', statusFilter.join(','));
    if (schoolFilter.length) params.set('school', schoolFilter.join(','));
    if (sortField) params.set('sort', sortField);
    if (sortOrder) params.set('order', sortOrder);
    // if (dateFrom) params.set('from', dateFrom);
    // if (dateTo) params.set('to', dateTo);
    
    setSearchParams(params);
  }, [page, search, statusFilter, schoolFilter, sortField, sortOrder, dateFrom, dateTo, setSearchParams]);

  const { data: transactions, isLoading } = useQuery({
    queryKey: ['admin-transactions', page, search, statusFilter, schoolFilter, sortField, sortOrder, dateFrom, dateTo],
    queryFn: async (): Promise<TransactionsResponse> => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sort: sortField,
        order: sortOrder,
      });
      
      if (statusFilter.length) {
        params.append('status', statusFilter.join(','));
      }
      
      if (schoolFilter.length) {
        params.append('school_id', schoolFilter.join(','));
      }
      
      if (search) {
        params.append('search', search);
      }
      
      if (dateFrom) {
        params.append('from', dateFrom);
      }
      
      if (dateTo) {
        params.append('to', dateTo);
      }

      const response = await api.get(`/api/transactions?${params}`);
      return response.data;
    },
  });

  const handleStatusFilterChange = (status: string, checked: boolean) => {
    setStatusFilter(prev => 
      checked 
        ? [...prev, status]
        : prev.filter(s => s !== status)
    );
    setPage(1);
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
    setPage(1);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCESS': return 'bg-success text-success-foreground';
      case 'FAILED': return 'bg-destructive text-destructive-foreground';
      case 'PENDING': return 'bg-pending text-pending-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const exportCSV = () => {
    // This would typically call an API endpoint to generate CSV
    alert('CSV export would be implemented here');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Header */}
      <header className="bg-card border-b">
        <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold">Admin Dashboard</h1>
              <Badge variant="outline">Administrator</Badge>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button asChild variant="outline" size="sm">
                <Link to="/admin/transactions/school">Transactions by School</Link>
              </Button>
              <Button variant="ghost" size="sm" onClick={logout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-2 py-2">
        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center">
                  <Filter className="h-5 w-5 mr-2" />
                  Filters & Search
                </CardTitle>
                <CardDescription>Filter transactions by various criteria</CardDescription>
              </div>
              <Button onClick={exportCSV} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search and Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                placeholder="Search by order ID, school ID..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
              <Input
                type="date"
                placeholder="From date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setPage(1);
                }}
              />
              <Input
                type="date"
                placeholder="To date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            
            {/* Status Filters */}
            <div>
              <p className="text-sm font-medium mb-2">Status Filters:</p>
              <div className="flex flex-wrap gap-4">
                {['SUCCESS', 'PENDING', 'FAILED'].map(status => (
                  <div key={status} className="flex items-center space-x-2">
                    <Checkbox
                      id={status}
                      checked={statusFilter.includes(status)}
                      onCheckedChange={(checked) => 
                        handleStatusFilterChange(status, checked as boolean)
                      }
                    />
                    <label htmlFor={status} className="text-sm font-medium">
                      {status}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transactions Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Transactions</CardTitle>
            <CardDescription>
              {transactions?.meta.total || 0} total transactions found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : transactions?.data.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No transactions found</p>
              </div>
            ) : (
              // <div className="space-y-4">
              //   {/* Table Header */}
              //   <div className="grid grid-cols-7 gap-4 p-3 bg-muted rounded-lg text-sm font-medium">
              //   <span>Sr. No.</span>
              //     <button
              //       onClick={() => handleSort('order_amount')}
              //       className="flex items-center space-x-1 hover:text-primary"
              //     >
              //       <span>Amount</span>
              //       <ArrowUpDown className="h-3 w-3" />
              //     </button>
              //     <span>Status</span>
              //     <button
              //       onClick={() => handleSort('school_id')}
              //       className="flex items-center space-x-1 hover:text-primary"
              //     >
              //       <span>School</span>
              //       <ArrowUpDown className="h-3 w-3" />
              //     </button>
              //     <button
              //       onClick={() => handleSort('gateway')}
              //       className="flex items-center space-x-1 hover:text-primary"
              //     >
              //       <span>Gateway</span>
              //       <ArrowUpDown className="h-3 w-3" />
              //     </button>
              //     <span>Order ID</span>
              //     <button
              //       onClick={() => handleSort('payment_time')}
              //       className="flex items-center space-x-1 hover:text-primary"
              //     >
              //       <span>Date</span>
              //       <ArrowUpDown className="h-3 w-3" />
              //     </button>
              //     <span>Actions</span>
              //   </div>
                
              //   {/* Table Rows */}
              //   {transactions?.data.map((transaction: Transaction, index) => (
              //     <div
              //       key={transaction.collect_request_id}
              //       className="grid grid-cols-7 gap-4 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              //     >
              //           <span>{index + 1}</span> {/* Sr. No */}
              //       <div className="font-semibold">₹{transaction.order_amount}</div>
              //       <Badge className={getStatusColor(transaction.status)} variant="secondary">
              //         {transaction.status}
              //       </Badge>
              //       <div className="font-mono text-xs text-muted-foreground">
              //         {transaction.school_id?.slice(-8)}
              //       </div>
              //       <div className="capitalize">{transaction.gateway_name}</div>
              //       <div className="font-mono text-xs">
              //         {transaction.custom_order_id || transaction.collect_request_id.slice(-8)}
              //       </div>
              //       <div className="text-sm text-muted-foreground">
              //         {formatDate(transaction.payment_time)}
              //       </div>
              //       <Button asChild variant="outline" size="sm">
              //         <Link to={`/transactions/${transaction.collect_request_id}`}>
              //           <Eye className="h-3 w-3 mr-1" />
              //           View
              //         </Link>
              //       </Button>
              //     </div>
              //   ))}
                
              //   {/* Pagination */}
              //   {transactions && transactions.meta.total > limit && (
              //     <div className="flex items-center justify-between pt-4 border-t">
              //       <p className="text-sm text-muted-foreground">
              //         Showing {((page - 1) * limit) + 1} to{' '}
              //         {Math.min(page * limit, transactions.meta.total)} of{' '}
              //         {transactions.meta.total} transactions
              //       </p>
                    
              //       <div className="flex space-x-2">
              //         <Button
              //           variant="outline"
              //           size="sm"
              //           onClick={() => setPage(p => Math.max(1, p - 1))}
              //           disabled={page === 1}
              //         >
              //           Previous
              //         </Button>
              //         <Button
              //           variant="outline"
              //           size="sm"
              //           onClick={() => setPage(p => p + 1)}
              //           disabled={page * limit >= transactions.meta.total}
              //         >
              //           Next
              //         </Button>
              //       </div>
              //     </div>
              //   )}
              // </div>
              <div className="space-y-4">
  {/* Table Header */}
  <div className="grid grid-cols-10 justify-centeru items-center gap-4 p-3 bg-muted rounded-lg text-sm font-medium">
    <span className='flex  justify-center'>Sr. No.</span>

    <button
      onClick={() => handleSort('order_amount')}
      className="flex items-center justify-center space-x-1 hover:text-primary"
    >
      <span>Amount</span>
      <ArrowUpDown className="h-3 w-3" />
    </button>

    <button
      onClick={() => handleSort('transaction_amount')}
      className="flex items-center justify-center space-x-1 hover:text-primary"
    >
      <span>Txn Amount</span>
      <ArrowUpDown className="h-3 w-3" />
    </button>

    <span className='flex justify-center items-center'>Status</span>

    <span className='flex justify-center items-center' >Payment Mode</span>

    <button
      onClick={() => handleSort('school_id')}
      className="flex items-center justify-center space-x-1 hover:text-primary"
    >
      <span className='flex justify-center items-center'>School id</span>
      {/* <ArrowUpDown className="h-3 w-3" /> */}
    </button>

    <button
      onClick={() => handleSort('gateway')}
      className="flex items-center justify-center space-x-1 hover:text-primary"
    >
      <span>Gateway</span>
      {/* <ArrowUpDown className="h-3 w-3" /> */}
    </button>

    <span className='flex justify-center items-center' >Order ID</span>
    <span className='text-nowrap justify-center'>Collect Request ID</span>

    <button
      onClick={() => handleSort('payment_time')}
      className="flex items-center justify-center space-x-1 hover:text-primary"
    >
      <span  >Date</span>
      <ArrowUpDown className="h-3 w-3 " />
    </button>

    <button
      onClick={() => handleSort('last_updated')}
      className="flex items-center justify-cente space-x-1 hover:text-primary"
    >
      {/* <span>Last Updated</span>
      <ArrowUpDown className="h-3 w-3" /> */}
    </button>
  </div>

  {/* Table Rows */}
  {transactions?.data.map((transaction: Transaction, index) => (
    <div
      key={transaction.collect_request_id}
      className="grid grid-cols-10 gap-4 p-3 justify-center items-center border rounded-lg hover:bg-muted/50 hover:shadow-md transform hover:-translate-y-0.5 transition-all duration-150"
    >
      <span className='flex justify-center'>{(page - 1) * limit + index + 1}</span> {/* Sr. No (accounts for pagination) */}

      <div className="font-semibold flex justify-center items-center" >₹{transaction.order_amount}</div>

      <div className="font-semibold flex justify-center items-center">₹{transaction.transaction_amount ?? transaction.order_amount}</div>

      <Badge className={`flex justify-center items-center ${getStatusColor(transaction.status)}` }variant="secondary">
        {transaction.status}
      </Badge>

      <div className="capitalize flex justify-center items-center">{transaction.payment_mode || '-'}</div>

      <div className="font-mono text-xs text-muted-foreground flex justify-center items-center">
        {transaction.school_id ? transaction.school_id.slice(-8) : '-'}
      </div>

      <div className="capitalize flex justify-center items-center">{transaction.gateway_name || '-'}</div>

      <div className="font-mono text-xs flex justify-center items-center">{transaction.collect_request_id ? transaction.collect_request_id.slice(-8) : '-'}</div>

      <div className="font-mono text-xs flex justify-center items-center">{transaction.collect_request_id ? transaction.collect_request_id.slice(-8) : '-'}</div>

      <div className="text-sm text-muted-foreground px-3 flex justify-center items-center">
        {transaction.payment_time ? formatDate(transaction.payment_time) : '-'}
      </div>

      {/* <div className="text-sm text-muted-foreground">
        {transaction.last_updated ? formatDate(transaction.last_updated) : '-'}
      </div> */}
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