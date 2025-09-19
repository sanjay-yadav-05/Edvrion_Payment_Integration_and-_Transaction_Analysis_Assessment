import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuthContext } from '@/auth/AuthProvider';
import { toast } from '@/hooks/use-toast';
import api from '@/api/axios';
import { ArrowLeft, ExternalLink, CreditCard } from 'lucide-react';
import type { CreatePaymentRequest, CreatePaymentResponse } from '@/types/api';

export default function CreatePayment() {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  
  const [formData, setFormData] = useState({
    amount: '',
    customOrderId: '',
    studentName: user.student_info?.name || '',
    studentId: user.student_info?.id || '',
    studentEmail: user.student_info?.email || '',
  });

  useEffect(() => {
    document.title = 'Create Payment - EDV Payment System';
  }, []);

  const createPaymentMutation = useMutation({
    mutationFn: async (paymentData: CreatePaymentRequest): Promise<CreatePaymentResponse> => {
      const response = await api.post('/api/payments/create-payment', paymentData);
      return response.data;
    },
    onSuccess: (data) => {
      toast({
        title: 'Payment request created',
        description: 'Redirecting to payment gateway...',
      });
      
      // Open payment URL in new tab
      window.open(data.collect_request_url, '_blank');
      
      // Navigate to callback page to wait for result
      navigate(`/payments/callback?custom_order_id=${formData.customOrderId || data.collect_request_id}`);
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to create payment',
        description: error.response?.data?.message || 'Something went wrong',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.school_id) {
      toast({
        title: 'Error',
        description: 'School ID not found',
        variant: 'destructive',
      });
      return;
    }

    const paymentRequest: CreatePaymentRequest = {
      user_id: user.id,
      school_id: user.school_id,
      amount: formData.amount,
      callback_url: `${window.location.origin}/payments/callback`,
      custom_order_id: formData.customOrderId || undefined,
      student_info: {
        name: formData.studentName || undefined,
        id: formData.studentId || undefined,
        email: formData.studentEmail || undefined,
      },
    };

    createPaymentMutation.mutate(paymentRequest);
  };

  const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  const isFormValid = formData.amount && parseFloat(formData.amount) > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Header */}
      <header className="bg-card border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Button variant="ghost" size="sm" asChild className="mr-4">
              <Link to="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            <h1 className="text-xl font-semibold">Create Payment</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>New Payment Request</CardTitle>
                <CardDescription>
                  Create a payment request for your school fees
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Amount Field */}
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (INR) *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="1"
                  value={formData.amount}
                  onChange={handleInputChange('amount')}
                  placeholder="Enter amount in rupees"
                  required
                />
                <p className="text-sm text-muted-foreground">
                  Minimum amount: ₹1.00
                </p>
              </div>

              {/* Custom Order ID */}
              <div className="space-y-2">
                <Label htmlFor="customOrderId">Custom Order ID (Optional)</Label>
                <Input
                  id="customOrderId"
                  type="text"
                  value={formData.customOrderId}
                  onChange={handleInputChange('customOrderId')}
                  placeholder="e.g., TEST-ORD-123"
                />
                <p className="text-sm text-muted-foreground">
                  Leave empty to auto-generate
                </p>
              </div>

              {/* Student Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Student Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="studentName">Student Name</Label>
                    <Input
                      id="studentName"
                      type="text"
                      readOnly
                      value={formData.studentName}
                      onChange={handleInputChange('studentName')}
                      placeholder="Enter student name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="studentId">Student ID</Label>
                    <Input
                      id="studentId"
                      type="text"
                      readOnly
                      value={formData.studentId}
                      onChange={handleInputChange('studentId')}
                      placeholder="Enter student ID"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="studentEmail">Student Email</Label>
                  <Input
                    id="studentEmail"
                    type="email"
                    readOnly
                    value={formData.studentEmail}
                    onChange={handleInputChange('studentEmail')}
                    placeholder="Enter student email"
                  />
                </div>
              </div>

              <Alert>
                <ExternalLink className="h-4 w-4" />
                <AlertDescription>
                  After creating the payment request, you'll be redirected to the payment gateway 
                  in a new tab to complete the transaction.
                </AlertDescription>
              </Alert>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  asChild
                >
                  <Link to="/dashboard">Cancel</Link>
                </Button>
                
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={!isFormValid || createPaymentMutation.isPending}
                >
                  {createPaymentMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Create Payment Request
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}