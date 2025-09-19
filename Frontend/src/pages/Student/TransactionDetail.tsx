import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import api from '@/api/axios';
import { ArrowLeft, CreditCard, Calendar, Building, Hash } from 'lucide-react';
import type { TransactionStatusResponse } from '@/types/api';

export default function TransactionDetail() {
  const { id } = useParams<{ id: string }>();

  const [orderId, setOrderId] = useState("");
  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  // const [error, setError] = useState<string | null>(null);

  // const fetchOrder = async () => {
  //   if (!orderId) return setError("Enter order id");
  //   setError(null);
  //   setLoading(true);
  //   try {
  //     const resp = await api.get(`/api/transactions/${encodeURIComponent(orderId)}`);
  //     setOrder(resp.data || null);
  //   } catch (err: any) {
  //     console.error(err);
  //     setOrder(null);
  //     setError(err?.response?.data?.error || "Failed to fetch order");
  //   } finally {
  //     setLoading(false);
  //   }
  // };
  const { data: transaction, isLoading, error } = useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      if (!orderId) {
        // You can throw an error here to stop the query from running
        // or handle it upstream. Returning null/undefined works too.
        return null;
      }
      const resp = await api.get(`/api/transactions/${encodeURIComponent(orderId)}`);
      return resp.data;
    },
    // This option ensures the query only runs when orderId is available
    enabled: !!orderId, 
  });

  useEffect(() => {
    document.title = 'Transaction Details - EDV Payment System';
  }, []);

  // const { data: transaction, isLoading, isError } = useQuery({
  //   queryKey: ['transaction-detail', id],
  //   queryFn: async (): Promise<TransactionStatusResponse & { collect_id: string }> => {
  //     const response = await api.get(`/api/transactions/${id}`);
  //     return { ...response.data, collect_id: id };
  //   },
  //   enabled: !!id,
  // });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCESS': return 'bg-success text-success-foreground';
      case 'FAILED': return 'bg-destructive text-destructive-foreground';
      case 'PENDING': return 'bg-pending text-pending-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if ( error || !order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted">
        <header className="bg-card border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center h-16">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/transactions">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Transactions
                </Link>
              </Button>
              <h1 className="text-xl font-semibold ml-4">Transaction Not Found</h1>
            </div>
          </div>
        </header>
        
        <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardHeader className="text-center">
              <CardTitle>Transaction Not Found</CardTitle>
              <CardDescription>
                The transaction you're looking for doesn't exist or you don't have permission to view it.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button asChild>
                <Link to="/transactions">View All Transactions</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Header */}
      <header className="bg-card border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/transactions">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Transactions
                </Link>
              </Button>
              <h1 className="text-xl font-semibold">Transaction Details</h1>
            </div>
            
            <Badge className={getStatusColor(transaction.provider)}>
              {transaction.status}
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Details */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Payment Information</CardTitle>
                    <CardDescription>Transaction details and status</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Amount</p>
                    <p className="text-2xl font-bold">₹{transaction.amount}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Status</p>
                    <Badge className={getStatusColor(transaction.status)}>
                      {transaction.status}
                    </Badge>
                  </div>
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground flex items-center">
                      <Hash className="h-4 w-4 mr-1" />
                      Transaction ID
                    </p>
                    <p className="font-mono text-sm break-all">{transaction.collect_id}</p>
                  </div>
                  
                  {transaction.details?.payment_mode && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground flex items-center">
                        <Building className="h-4 w-4 mr-1" />
                        Payment Mode
                      </p>
                      <p className="capitalize">{transaction.details.payment_mode}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Additional Details */}
            {Object.keys(transaction.details || {}).length > 1 && (
              <Card>
                <CardHeader>
                  <CardTitle>Additional Details</CardTitle>
                  <CardDescription>Extended payment information</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(transaction.details || {}).map(([key, value]) => {
                      if (key === 'payment_mode' || !value) return null;
                      
                      return (
                        <div key={key} className="flex justify-between items-center">
                          <span className="text-sm font-medium text-muted-foreground capitalize">
                            {key.replace(/_/g, ' ')}
                          </span>
                          <span className="text-sm font-medium">
                            {typeof value === 'string' ? value : JSON.stringify(value)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Transaction Created</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(new Date().toISOString())}
                  </p>
                </div>
                
                {transaction.status !== 'PENDING' && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">
                      {transaction.status === 'SUCCESS' ? 'Payment Completed' : 'Payment Failed'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(new Date().toISOString())}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button asChild variant="outline" className="w-full">
                  <Link to="/transactions">View All Transactions</Link>
                </Button>
                
                <Button asChild className="w-full">
                  <Link to="/payments/new">Create New Payment</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}