import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/auth/useAuth";
import api from "@/api/axios";
import { ArrowLeft, Search, Filter, Eye } from "lucide-react";
import type { TransactionsResponse, Transaction } from "@/types/api";
import { useAuthContext } from "@/auth/AuthProvider";

/** Debounce hook */
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

export default function StudentTransactions() {
  const { logout } = useAuth();
  const { user } = useAuthContext();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const limit = 100; // page size (matches your API usage)
  const debouncedSearch = useDebounce(search, 500);

  useEffect(() => {
    document.title = "Transactions - EDV Payment System";
  }, []);

  // Fetch page from server (does NOT include status filter)
  const { data: transactions, isLoading, isError } = useQuery({
    queryKey: ["transactions", page, debouncedSearch, user?.id],
    queryFn: async (): Promise<TransactionsResponse> => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sort: "payment_time",
        order: "desc",
      });

      if (debouncedSearch) params.append("search", debouncedSearch);

      const response = await api.get(
        `/api/transactions/user/${encodeURIComponent(user?.id || "")}?${params}`
      );
      return response.data;
    },
    enabled: !!user?.id,
    keepPreviousData: true,
  });

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case "SUCCESS":
        return "bg-success text-success-foreground";
      case "FAILED":
        return "bg-destructive text-destructive-foreground";
      case "PENDING":
        return "bg-pending text-pending-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  }, []);

  const formatDate = useCallback((dateString?: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, []);

  // Apply status filter on the client-side to the currently fetched page
  const pageRows: Transaction[] = transactions?.data ?? [];
  const filteredRows: Transaction[] =
    statusFilter === "all"
      ? pageRows
      : pageRows.filter((r) => (r.status ?? "").toUpperCase() === statusFilter);

  // Display counts: showFiltered = rows after client filter on current page,
  // serverTotal = total reported by server for this query (may be for all statuses)
  const showFiltered = filteredRows.length;
  const serverTotal = transactions?.meta?.total ?? 0;

  if (isError) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <Card className="max-w-md w-full text-center">
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

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
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
                <Link to="/dashboard">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
              <h1 className="text-xl font-semibold">Transaction History</h1>
            </div>

            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" onClick={logout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <Card className="mb-6">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5" />
              <CardTitle>Filter</CardTitle>
            </div>
            <CardDescription className="text-sm text-muted-foreground">Filter your transactions</CardDescription>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* <div className="col-span-1 md:col-span-2">
                <label className="sr-only">Search</label>
                <div className="relative">
                  <Input
                    placeholder="Search by order ID"
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  />
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
              </div> */}

              <div className="flex items-center space-x-2">
                <select
                  className="w-full px-3 py-2 border rounded-md bg-card text-sm"
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); }}
                >
                  <option value="all">All statuses</option>
                  <option value="SUCCESS">Success</option>
                  <option value="PENDING">Pending</option>
                  <option value="FAILED">Failed</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table Card */}
        <Card>
          <CardHeader className="flex items-center justify-between gap-2">
            <CardTitle>Your Transactions</CardTitle>
            <CardDescription>
              Showing {showFiltered} on this page • Total Transactions: {serverTotal}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {filteredRows.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No transactions found</p>
                <Button asChild>
                  <Link to="/payments/new">Create Your First Payment</Link>
                </Button>
              </div>
            ) : (
              <div className="w-full overflow-auto rounded-md border">
                <table className="w-full min-w-[980px] table-auto divide-y">
                  <thead className="bg-muted sticky top-0 z-10">
                    <tr className="text-sm font-medium text-left">
                      <th className="px-4 py-3 w-[72px] text-center">Sr. No.</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Order ID</th>
                      <th className="px-4 py-3">Gateway</th>
                      <th className="px-4 py-3 text-nowrap">Payment Mode</th>
                      {/* <th className="px-4 py-3">School ID</th> */}
                      <th className="px-4 py-3">Collect ID</th>
                      <th className="px-4 py-3">Date</th>
                      {/* <th className="px-4 py-3 text-center">Actions</th> */}
                    </tr>
                  </thead>

                  <tbody className="bg-card divide-y">
                    {filteredRows.map((transaction: Transaction, index: number) => {
                      // Sr. No relative to server page + index within page
                      const srNo = (page - 1) * limit + index + 1;
                      return (
                        <tr
                          key={transaction.collect_request_id || index}
                          className="hover:bg-muted/40 transition-colors"
                        >
                          <td className="px-4 py-3 text-center align-middle w-[72px]">
                            <div className="text-sm font-medium">{srNo}</div>
                          </td>


                          <td className="px-4 py-3 align-middle">
                            <div className="font-semibold">₹{transaction.order_amount}</div>
                            {/* <div className="text-xs text-muted-foreground">Txn: ₹{transaction.transaction_amount ?? transaction.order_amount}</div> */}
                          </td>

                          <td className="px-4 py-3 align-middle">
                            <Badge className={getStatusColor(transaction.status)}>{transaction.status}</Badge>
                          </td>

                          <td className="px-4 py-3 align-middle max-w-[220px]">
                            <div className="font-mono text-sm truncate" title={transaction.custom_order_id || transaction.order_id || transaction.collect_request_id}>
                              { transaction._id || transaction.custom_order_id}
                            </div>
                          </td>

                          <td className="px-4 py-3 align-middle">
                            <div className="capitalize">{transaction.gateway_name || "-"}</div>
                          </td>

                          <td className="px-4 py-3 align-middle">
                            <div className="capitalize ">{transaction.payment_mode || "NA"}</div>
                          </td>

                          {/* <td className="px-4 py-3 align-middle">
                            <div className="font-mono text-xs truncate max-w-[140px]" title={transaction.school_id || ""}>
                              {transaction.school_id || "-"}
                            </div>
                          </td> */}

                          <td className="px-4 py-3 align-middle">
                            <div className="font-mono text-xs truncate max-w-[180px]" title={transaction.collect_request_id || ""}>
                              {transaction.collect_request_id || "-"}
                            </div>
                          </td>

                          <td className="px-4 py-3 align-middle">
                            <div className="text-sm text-muted-foreground">{formatDate(transaction.payment_time)}</div>
                          </td>

                          {/* <td className="px-4 py-3 text-center align-middle">
                            <Button asChild variant="outline" size="sm">
                              <Link to={`/transactions/${transaction.collect_request_id}`}>
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </Link>
                            </Button>
                          </td> */}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination (server-driven) */}
            {transactions && serverTotal > limit && (
              <div className="flex items-center justify-between pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Showing {(page - 1) * limit + 1} to {(page - 1) * limit + showFiltered} of {serverTotal} transactions (server total)
                </p>

                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page * limit >= serverTotal}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
