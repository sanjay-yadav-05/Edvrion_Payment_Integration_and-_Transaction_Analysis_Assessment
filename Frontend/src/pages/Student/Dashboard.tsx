import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PaymentCard } from '@/components/PaymentCard';
import { useAuthContext } from '@/auth/AuthProvider';
import { useAuth } from '@/auth/useAuth';
import api from '@/api/axios';
import { PlusCircle, History, LogOut, User } from 'lucide-react';
import type { TransactionsResponse } from '@/types/api';

export default function StudentDashboard() {
  const { user } = useAuthContext();
  const { logout } = useAuth();

  useEffect(() => {
    document.title = 'Dashboard - EDV Payment System';
  }, []);

  // Fetch latest transactions
  const { data: transactions } = useQuery({
    queryKey: ['transactions', 'recent'],
    queryFn: async (): Promise<TransactionsResponse> => {
      const response = await api.get('/api/transactions?page=1&limit=3&sort=payment_time&order=desc');
      return response.data;
    },
  });

  const latestTransaction = transactions?.data?.slice(0,3);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Header */}
      <header className="bg-card border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gradient-to-r from-primary to-primary-hover rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-primary-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h1 className="text-xl font-semibold">EDV Payment System</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                {/* <span>{user?.id}</span> */}
                <span className="px-2 py-1 bg-muted rounded-full text-xs">Student : {user.id}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={logout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Welcome back!
          </h2>
          <p className="text-muted-foreground">
            Manage your payments and view transaction history
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg">
                <PlusCircle className="h-5 w-5 mr-2 text-primary" />
                Create Payment
              </CardTitle>
              <CardDescription>
                Start a new payment request
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link to="/payments/new">
                  Create New Payment
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-accent/20 bg-gradient-to-br from-accent/5 to-accent/10">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg">
                <History className="h-5 w-5 mr-2 text-accent" />
                Transaction History
              </CardTitle>
              <CardDescription>
                View all your transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full border-accent/30">
                <Link to="/transactions">
                  View Transactions
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* <PaymentCard 
            transaction={latestTransaction ? latestTransaction[0] : undefined}
            showCreatePayment={!latestTransaction}
          /> */}
        </div>

        {/* Recent Activity */}
        {/* {latestTransaction && (
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Your latest payment transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium">₹</span>
                    </div>
                    <div>
                      <p className="font-medium">
                        Payment of ₹{latestTransaction.order_amount}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(latestTransaction.payment_time).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                      latestTransaction.status === 'SUCCESS' 
                        ? 'bg-success/10 text-success' 
                        : latestTransaction.status === 'FAILED'
                        ? 'bg-destructive/10 text-destructive'
                        : 'bg-pending/10 text-pending'
                    }`}>
                      {latestTransaction.status}
                    </div>
                  </div>
                </div>
                
                <div className="text-center">
                  <Button asChild variant="link">
                    <Link to="/transactions">View All Transactions</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )} */}
        {latestTransaction && latestTransaction.length > 0 && (
  <Card>
    <CardHeader>
      <CardTitle>Recent Activity</CardTitle>
      <CardDescription>
        Your latest payment transactions
      </CardDescription>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        {latestTransaction.map((transaction) => (
          <div key={transaction.collect_request_id} className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium">₹</span>
              </div>
              <div>
                <p className="font-medium">
                  Payment of ₹{transaction.order_amount}
                </p>
                <p className="text-sm text-muted-foreground">
                  {new Date(transaction.payment_time).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                transaction.status === 'SUCCESS'
                  ? 'bg-success/10 text-success'
                  : transaction.status === 'FAILED'
                  ? 'bg-destructive/10 text-destructive'
                  : 'bg-pending/10 text-pending'
              }`}>
                {transaction.status}
              </div>
            </div>
          </div>
        ))}

        <div className="text-center">
          <Button asChild variant="link">
            <Link to="/transactions">View All Transactions</Link>
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
)}
      </main>
    </div>
  );
}