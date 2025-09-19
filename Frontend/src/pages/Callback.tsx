import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { usePollStatus } from '@/hooks/usePollStatus';
import { CheckCircle, XCircle, Clock, RefreshCcw } from 'lucide-react';
import  { getStoredAuth } from '@/api/axios';

export default function Callback() {
  const [searchParams] = useSearchParams();
  const [orderId, setOrderId] = useState<string>('');

  const auth = getStoredAuth();
  useEffect(() => {
    document.title = 'Payment Status - EDV Payment System';
    
    // Extract order ID from URL params - could be collect_request_id or custom_order_id
    const collectId = searchParams.get('EdvironCollectRequestId');
    // const status = searchParams.get('status');
    const orderIdParam =  collectId || '';
    setOrderId(orderIdParam);
  }, [searchParams]);

  const {
    data,
    isLoading,
    isError,
    isComplete,
    isTimedOut,
    attempts,
    maxAttempts,
    canRetry,
    reset,
    refetch
  } = usePollStatus({
    orderId,
    school_id :auth.user.school_id,
    enabled: !!orderId
  });

  const getStatusIcon = () => {
    if (isLoading) return <Clock className="h-8 w-8 text-pending animate-spin" />;
    if (!data) return <Clock className="h-8 w-8 text-muted-foreground" />;
    
    switch (data?.provider?.status) {
      case 'SUCCESS':
        return <CheckCircle className="h-8 w-8 text-success" />;
      case 'FAILED':
        return <XCircle className="h-8 w-8 text-destructive" />;
      default:
        return <Clock className="h-8 w-8 text-pending animate-pulse" />;
    }
  };

  const getStatusMessage = () => {
    if (isLoading && attempts === 0) return 'Processing your payment...';
    if (isTimedOut) return 'Payment verification is taking longer than expected';
    if (isError) return 'Unable to verify payment status';
    if (!data) return 'Checking payment status...';
    
    switch (data?.provider?.status) {
      case 'SUCCESS':
        return 'Payment completed successfully!';
      case 'FAILED':
        return 'Payment was not completed';
      case 'PENDING':
        return 'Payment is being processed...';
      default:
        return 'Checking payment status...';
    }
  };

  const getStatusColor = () => {
    if (isError || data?.provider?.status === 'FAILED') return 'destructive';
    if (data?.provider?.status === 'SUCCESS') return 'default';
    return 'default';
  };

  if (!orderId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <XCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
            <CardTitle>Invalid Payment Callback</CardTitle>
            <CardDescription>No order information found in the URL</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild>
              <Link to="/dashboard">Return to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {getStatusIcon()}
          <CardTitle className="mt-4">Payment Status</CardTitle>
          <CardDescription>Order ID: {orderId}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant={getStatusColor()}>
            <AlertDescription className="text-center font-medium">
              {getStatusMessage()}
            </AlertDescription>
          </Alert>

          {data && (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount:</span>
                <span className="font-medium">₹{data?.provider?.amount}</span>
              </div>
              {data?.provider?.details?.payment_mode && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment Mode:</span>
                  <span className="font-medium">{data?.provider?.details.payment_mode}</span>
                </div>
              )}
            </div>
          )}

          {isLoading && (
            <div className="text-center text-sm text-muted-foreground">
              <p>Attempt {attempts + 1} of {maxAttempts}</p>
              <div className="w-full bg-muted rounded-full h-2 mt-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((attempts + 1) / maxAttempts) * 100}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex gap-2">
            {canRetry && (
              <Button 
                variant="outline" 
                onClick={() => {
                  reset();
                  refetch();
                }}
                className="flex-1"
              >
                <RefreshCcw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            )}
            
            <Button asChild className="flex-1">
              <Link to="/dashboard">Dashboard</Link>
            </Button>
            
            {isComplete && (
              <Button asChild variant="outline" className="flex-1">
                <Link to="/transactions">View Transactions</Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}