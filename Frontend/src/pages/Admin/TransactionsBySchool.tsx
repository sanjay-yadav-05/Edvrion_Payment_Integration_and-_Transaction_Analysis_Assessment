import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/auth/useAuth';
import api from '@/api/axios';
import { ArrowLeft, Search, Building, Eye, TrendingUp } from 'lucide-react';
import type { TransactionsResponse, Transaction } from '@/types/api';

export default function AdminTransactionsBySchool() {
  const { logout } = useAuth();
  const [selectedSchool, setSelectedSchool] = useState<string>('');
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');
  
  const limit = 20;

  useEffect(() => {
    document.title = 'Transactions by School - EDV Payment System';
  }, []);

  // Get unique schools for the dropdown
  const { data: allTransactions } = useQuery({
    queryKey: ['all-schools'],
    queryFn: async (): Promise<string[]> => {
      const response = await api.get('/api/transactions?limit=1000'); // Get many to extract schools
      const transactions: Transaction[] = response.data.data;
      const schools = [...new Set(transactions.map(t => t.school_id))];
      return schools;
    },
  });

  // Get transactions for selected school
  const { data: schoolTransactions, isLoading } = useQuery({
    queryKey: ['school-transactions', selectedSchool, page, statusFilter],
    queryFn: async (): Promise<TransactionsResponse> => {
      if (!selectedSchool) return { data: [], meta: { page: 1, limit, total: 0 } };
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sort: 'payment_time',
        order: 'desc',
        school_id: selectedSchool,
      });
      
      if (statusFilter) {
        params.append('status', statusFilter);
      }

      const response = await api.get(`/api/transactions/school/${selectedSchool}?${params}`);
      return response.data;
    },
    enabled: !!selectedSchool,
  });

  // Calculate summary stats for selected school
  const schoolStats = schoolTransactions?.data.reduce((acc, transaction) => {
    acc.total += transaction.order_amount;
    acc.count += 1;
    if (transaction.status === 'SUCCESS') {
      acc.successful += transaction.order_amount;
      acc.successCount += 1;
    }
    return acc;
  }, { total: 0, successful: 0, count: 0, successCount: 0 });

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Header */}
      <header className="bg-card border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/admin/transactions">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Overview
                </Link>
              </Button>
              <h1 className="text-xl font-semibold">Transactions by School</h1>
            </div>
            
            <Button variant="ghost" size="sm" onClick={logout}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* School Selection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building className="h-5 w-5 mr-2" />
              Select School
            </CardTitle>
            <CardDescription>
              Choose a school to view its transaction history
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Select value={selectedSchool} onValueChange={(value) => {
                  setSelectedSchool(value);
                  setPage(1);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a school..." />
                  </SelectTrigger>
                  <SelectContent>
                    {allTransactions?.map(schoolId => (
                      <SelectItem key={schoolId} value={schoolId}>
                        <div className="flex items-center space-x-2">
                          <Building className="h-4 w-4" />
                          <span className="font-mono text-sm">{schoolId}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {selectedSchool && (
                <div className="w-full sm:w-48">
                  <Select value={statusFilter} onValueChange={(value) => {
                    setStatusFilter(value);
                    setPage(1);
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="SUCCESS">Success</SelectItem>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="FAILED">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {selectedSchool && schoolStats && (
          <>
            {/* School Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{schoolStats.count}</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">₹{schoolStats.total.toLocaleString()}</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Successful Payments</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-success">{schoolStats.successCount}</p>
                  <p className="text-xs text-muted-foreground">
                    ₹{schoolStats.successful.toLocaleString()}
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold flex items-center">
                    {Math.round((schoolStats.successCount / schoolStats.count) * 100)}%
                    <TrendingUp className="h-4 w-4 ml-1 text-success" />
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Transactions List */}
            <Card>
              <CardHeader>
                <CardTitle>School Transactions</CardTitle>
                <CardDescription>
                  Transactions for school: <code className="font-mono text-sm">{selectedSchool}</code>
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : schoolTransactions?.data.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No transactions found for this school</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {schoolTransactions?.data.map((transaction: Transaction) => (
                      <div
                        key={transaction.collect_request_id}
                        className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="font-semibold text-lg">
                                ₹{transaction.order_amount}
                              </h3>
                              <Badge className={getStatusColor(transaction.status)}>
                                {transaction.status}
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                              <div>
                                <span className="font-medium">Order ID:</span>{' '}
                                {transaction.custom_order_id || transaction.collect_request_id.slice(-8)}
                              </div>
                              <div>
                                <span className="font-medium">Gateway:</span>{' '}
                                <span className="capitalize">{transaction.gateway_name}</span>
                              </div>
                              <div>
                                <span className="font-medium">Date:</span>{' '}
                                {formatDate(transaction.payment_time)}
                              </div>
                            </div>
                          </div>
                          
                          <Button asChild variant="outline" size="sm">
                            <Link to={`/transactions/${transaction.collect_request_id}`}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                    
                    {/* Pagination */}
                    {schoolTransactions && schoolTransactions.meta.total > limit && (
                      <div className="flex items-center justify-between pt-4 border-t">
                        <p className="text-sm text-muted-foreground">
                          Showing {((page - 1) * limit) + 1} to{' '}
                          {Math.min(page * limit, schoolTransactions.meta.total)} of{' '}
                          {schoolTransactions.meta.total} transactions
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
                            disabled={page * limit >= schoolTransactions.meta.total}
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
          </>
        )}

        {!selectedSchool && (
          <Card>
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Building className="h-8 w-8 text-muted-foreground" />
              </div>
              <CardTitle>Select a School</CardTitle>
              <CardDescription>
                Choose a school from the dropdown above to view its transaction history and statistics
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </main>
    </div>
  );
}