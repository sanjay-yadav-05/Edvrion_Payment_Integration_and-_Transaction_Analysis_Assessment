import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { CreditCard, ExternalLink, Clock } from 'lucide-react';
import type { Transaction } from '@/types/api';

interface PaymentCardProps {
  transaction?: Transaction;
  showCreatePayment?: boolean;
}

export const PaymentCard: React.FC<PaymentCardProps> = ({ 
  transaction, 
  showCreatePayment = false 
}) => {
  if (showCreatePayment) {
    return (
      <Card className="border-dashed border-2 border-muted-foreground/25 hover:border-primary/50 transition-colors">
        <CardHeader className="text-center pb-2">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
            <CreditCard className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-lg">Create New Payment</CardTitle>
          <CardDescription>
            Start a new payment request for your school
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center pt-2">
          <Button asChild className="w-full">
            <Link to="/payments/new">
              <ExternalLink className="h-4 w-4 mr-2" />
              Create Payment
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!transaction) {
    return (
      <Card className="border-muted">
        <CardHeader className="text-center pb-2">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-2">
            <Clock className="h-6 w-6 text-muted-foreground" />
          </div>
          <CardTitle className="text-lg">No Recent Payments</CardTitle>
          <CardDescription>
            You haven't made any payments yet
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center pt-2">
          <Button asChild variant="outline" className="w-full">
            <Link to="/payments/new">Create Your First Payment</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCESS': return 'bg-success text-success-foreground';
      case 'FAILED': return 'bg-destructive text-destructive-foreground';
      case 'PENDING': return 'bg-pending text-pending-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">Latest Payment</CardTitle>
            <CardDescription>
              {new Date(transaction.payment_time).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </CardDescription>
          </div>
          <Badge className={getStatusColor(transaction.status)}>
            {transaction.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Amount</span>
          <span className="font-semibold text-lg">₹{transaction.order_amount}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Gateway</span>
          <span className="font-medium capitalize">{transaction.gateway_name}</span>
        </div>
        
        {transaction.custom_order_id && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Order ID</span>
            <span className="font-mono text-sm">{transaction.custom_order_id}</span>
          </div>
        )}
        
        <Button asChild variant="outline" size="sm" className="w-full mt-4">
          <Link to={`/transactions/${transaction.collect_request_id}`}>
            View Details
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
};