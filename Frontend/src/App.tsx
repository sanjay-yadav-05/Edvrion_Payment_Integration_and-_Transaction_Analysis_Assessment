import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/auth/AuthProvider";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// Pages
import Login from "./pages/Login";
import Callback from "./pages/Callback";
import StudentDashboard from "./pages/Student/Dashboard";
import CreatePayment from "./pages/Student/CreatePayment";
import StudentTransactions from "./pages/Student/Transactions";
import TransactionDetail from "./pages/Student/TransactionDetail";
import NotFound from "./pages/NotFound";
import AdminLayout from "./pages/Admin/AdminLayout";
import TransactionsAnalytics from "./pages/Admin/TransactionsAnalytics";
import TransactionsPage from "./pages/Admin/TransactionsPage";
import CheckStatus from "./pages/Admin/CheckStatus";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/payments/callback" element={<Callback />} />

            {/* Protected Student Routes */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/payments/new"
              element={
                <ProtectedRoute>
                  <CreatePayment />
                </ProtectedRoute>
              }
            />
            <Route
              path="/transactions"
              element={
                <ProtectedRoute>
                  <StudentTransactions />
                </ProtectedRoute>
              }
            />
            <Route
              path="/transactions/:id"
              element={
                <ProtectedRoute>
                  <TransactionDetail />
                </ProtectedRoute>
              }
            />

            <Route path="/admin" element={<AdminLayout />}>
              {/* default: analytics */}
              <Route index element={<Navigate to="analytics" replace />} />
              <Route path="analytics" element={<TransactionsAnalytics />} />
              <Route
                path="transactions/check-status"
                element={<CheckStatus />}
              />
              <Route path="transactions" element={<TransactionsPage />} />
              {/* optional: deep routes e.g. /admin/transactions/:id can be added later */}
            </Route>

            {/* 404 Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
