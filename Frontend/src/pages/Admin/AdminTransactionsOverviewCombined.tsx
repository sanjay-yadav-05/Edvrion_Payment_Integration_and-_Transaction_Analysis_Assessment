// src/pages/AdminTransactionsOverviewCombined.tsx
import React, { useEffect, useMemo, useCallback, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/auth/useAuth";
import api from "@/api/axios";
import {
  ArrowLeft,
  Filter,
  Download,
  ArrowUpDown,
  Building,
  TrendingUp,
  Search as SearchIcon,
} from "lucide-react";
import type { TransactionsResponse, Transaction } from "@/types/api";
import { toCSV } from "@/components/ui/csv";

/** small debounce hook */
function useDebounce<T>(value: T, wait = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), wait);
    return () => clearTimeout(id);
  }, [value, wait]);
  return debounced;
}

export default function AdminTransactionsOverviewCombined() {
  const { logout } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // URL / UI state
  const [page, setPage] = useState(() => parseInt(searchParams.get("page") || "1"));
  const [search, setSearch] = useState(() => searchParams.get("search") || "");
  const [statusFilter, setStatusFilter] = useState<string[]>(
    () => searchParams.get("status")?.split(",").filter(Boolean) || []
  );
  const [schoolFilter, setSchoolFilter] = useState<string[]>(
    () => searchParams.get("school")?.split(",").filter(Boolean) || []
  );
  const [sortField, setSortField] = useState(() => searchParams.get("sort") || "payment_time");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">(
    () => (searchParams.get("order") as "asc" | "desc") || "desc"
  );
  const [dateFrom, setDateFrom] = useState(() => searchParams.get("from") || "");
  const [dateTo, setDateTo] = useState(() => searchParams.get("to") || "");
  const limit = 20;

  // export state
  const [exporting, setExporting] = useState(false);
  const [exportAll, setExportAll] = useState(false);

  const debouncedSearch = useDebounce(search, 350);

  useEffect(() => {
    document.title = "Transactions - EDV Payment System";
  }, []);

  // sync URL (replace, not pushing)
  useEffect(() => {
    const params = new URLSearchParams();
    params.set("page", page.toString());
    if (search) params.set("search", search);
    if (statusFilter.length) params.set("status", statusFilter.join(","));
    if (schoolFilter.length) params.set("school", schoolFilter.join(","));
    if (sortField) params.set("sort", sortField);
    if (sortOrder) params.set("order", sortOrder);
    if (dateFrom) params.set("from", dateFrom);
    if (dateTo) params.set("to", dateTo);

    setSearchParams(params, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, statusFilter, schoolFilter, sortField, sortOrder, dateFrom, dateTo]);

  // Fetch unique schools — fallback to transactions scan if no dedicated endpoint
  const { data: schools, isLoading: isLoadingSchools } = useQuery({
    queryKey: ["unique-schools"],
    queryFn: async (): Promise<string[]> => {
      // We only use /api/transactions for list, so fallback to scanning a chunk
      const resp = await api.get(`/api/transactions?limit=1000`);
      const txs: Transaction[] = resp.data?.data || [];
      return [...new Set(txs.map((t) => t.school_id).filter(Boolean))];
    },
    staleTime: 1000 * 60 * 5,
  });

  // build query params string (memoized)
  const transactionsQueryParams = useMemo(() => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      sort: sortField,
      order: sortOrder,
    });

    if (statusFilter.length) params.append("status", statusFilter.join(","));
    if (schoolFilter.length) params.append("school_id", schoolFilter.join(","));
    if (debouncedSearch) params.append("search", debouncedSearch);
    if (dateFrom) params.append("from", dateFrom);
    if (dateTo) params.append("to", dateTo);

    return params.toString();
  }, [page, limit, sortField, sortOrder, statusFilter, schoolFilter, debouncedSearch, dateFrom, dateTo]);

  // transactions query (global)
  // const { data: transactions, isLoading: isLoadingTransactions, isFetching: isFetchingTransactions } = useQuery<TransactionsResponse>({
  //   queryKey: ["transactions", transactionsQueryParams],
  //   queryFn: async (): Promise<TransactionsResponse> => {
  //     const resp = await api.get(`/api/transactions?${transactionsQueryParams}`);
  //     return resp.data;
  //   },
  //   keepPreviousData: true,
  //   staleTime: 1000 * 20,
  // });
  const { data: transactions, isLoading: isLoadingTransactions, isFetching: isFetchingTransactions } = useQuery<TransactionsResponse>({
    queryKey: ["transactions", transactionsQueryParams],
    queryFn: async (): Promise<TransactionsResponse> => {
      const resp = await api.get(`/api/transactions?${transactionsQueryParams}`);
      return resp.data;
    },
    keepPreviousData: true,
    staleTime: 1000 * 20,
  });

  // if exactly one school selected, optionally fetch school-specific endpoint
  const selectedSchool = schoolFilter.length === 1 ? schoolFilter[0] : "";
  const { data: schoolTransactions, isLoading: isLoadingSchoolTx } = useQuery({
    queryKey: ["school-transactions", selectedSchool, page, statusFilter.join(","), dateFrom, dateTo],
    queryFn: async (): Promise<TransactionsResponse> => {
      if (!selectedSchool) return { data: [], meta: { page: 1, limit, total: 0 } };
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sort: sortField,
        order: sortOrder,
      });
      if (statusFilter.length) params.append("status", statusFilter.join(","));
      if (debouncedSearch) params.append("search", debouncedSearch);
      if (dateFrom) params.append("from", dateFrom);
      if (dateTo) params.append("to", dateTo);

      const resp = await api.get(`/api/transactions/school/${selectedSchool}?${params.toString()}`);
      return resp.data;
    },
    enabled: !!selectedSchool,
    keepPreviousData: true,
    staleTime: 1000 * 20,
  });

  // compute stats (from schoolTransactions if present, otherwise derive from transactions when single school filter)
  const statsSource = (schoolTransactions?.data && schoolTransactions.data.length ? schoolTransactions.data : transactions?.data) || [];
  const schoolStats = useMemo(() => {
    if (!selectedSchool || statsSource.length === 0) return null;
    return statsSource.reduce(
      (acc, tx) => {
        acc.total += tx.order_amount || 0;
        acc.count += 1;
        if (tx.status === "SUCCESS") {
          acc.successful += tx.order_amount || 0;
          acc.successCount += 1;
        }
        return acc;
      },
      { total: 0, successful: 0, count: 0, successCount: 0 }
    );
  }, [selectedSchool, statsSource]);

  // helpers
  const handleStatusFilterChange = useCallback((status: string, checked: boolean) => {
    setStatusFilter((prev) => (checked ? [...prev, status] : prev.filter((s) => s !== status)));
    setPage(1);
  }, []);

  const handleSort = useCallback((field: string) => {
    setPage(1);
    setSortField((prev) => {
      if (prev === field) {
        setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
        return prev;
      }
      setSortOrder("desc");
      return field;
    });
  }, []);

  const getStatusColor = (status?: string) => {
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
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Export CSV: Uses ONLY /api/transactions endpoint (no new endpoint).
  // If exportAll is true we fetch pages repeatedly until we've fetched all rows matching current filters.
  const exportCSV = useCallback(async () => {
    try {
      setExporting(true);

      // If exporting only current page, use the transactions we already have
      if (!exportAll) {
        const rows = transactions?.data || [];
        // const rows = transactions?.data || [];
        if (rows.length === 0) {
          alert("No rows to export on current page.");
          return;
        }

        // map/format rows for CSV
        const csvRows = rows.map((r) => ({
          collect_request_id: r.collect_request_id,
          order_id: r.order_id ?? "",
          custom_order_id: r.custom_order_id ?? "",
          school_id: r.school_id ?? "",
          gateway_name: r.gateway_name ?? "",
          payment_mode: r.payment_mode ?? "",
          order_amount: r.order_amount ?? "",
          transaction_amount: r.transaction_amount ?? "",
          status: r.status ?? "",
          payment_time: r.payment_time ?? "",
          last_updated: r.last_updated ?? "",
        }));

        const csv = toCSV(csvRows, [
          "collect_request_id",
          "order_id",
          "custom_order_id",
          "school_id",
          "gateway_name",
          "payment_mode",
          "order_amount",
          "transaction_amount",
          "status",
          "payment_time",
          "last_updated",
        ]);

        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `transactions_page_${page}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        return;
      }

      // exportAll === true: fetch all pages using GET /api/transactions with same filters
      // We iterate pages until we collected total rows, using a large chunk size to reduce requests.
      const pageSize = 1000; // adjust if your backend supports large limits
      let currentPage = 1;
      let allRows: Transaction[] = [];
      let total = Infinity;

      // Build base params from current filters but override limit + page
      const baseParams = new URLSearchParams({
        limit: String(pageSize),
        sort: sortField,
        order: sortOrder,
      });
      if (statusFilter.length) baseParams.append("status", statusFilter.join(","));
      if (schoolFilter.length) baseParams.append("school_id", schoolFilter.join(","));
      if (debouncedSearch) baseParams.append("search", debouncedSearch);
      if (dateFrom) baseParams.append("from", dateFrom);
      if (dateTo) baseParams.append("to", dateTo);

      // iterate
      while (allRows.length < total) {
        const params = new URLSearchParams(baseParams.toString());
        params.set("page", String(currentPage));

        const resp = await api.get(`/api/transactions?${params.toString()}`);
        const body: TransactionsResponse = resp.data;
        const fetched = body.data || [];
        if (total === Infinity) total = body.meta?.total ?? Infinity;

        allRows = allRows.concat(fetched);

        // break if no more rows returned (safety)
        if (!fetched.length) break;

        currentPage += 1;

        // safety guard to avoid infinite loops (break if too many pages)
        if (currentPage > Math.ceil((total || 0) / pageSize) + 2) break;
      }

      if (!allRows.length) {
        alert("No rows found for the current filters.");
        return;
      }

      // map fields for CSV
      const csvRows = allRows.map((r) => ({
        collect_request_id: r.collect_request_id,
        order_id: r.collect_request_id ?? "",
        custom_order_id: r.custom_order_id ?? "",
        school_id: r.school_id ?? "",
        gateway_name: r.gateway_name ?? "",
        payment_mode: r.payment_mode ?? "",
        order_amount: r.order_amount ?? "",
        transaction_amount: r.transaction_amount ?? "",
        status: r.status ?? "",
        payment_time: r.payment_time ?? "",
        last_updated: r.last_updated ?? "",
      }));

      const csv = toCSV(csvRows, [
        "collect_request_id",
        "order_id",
        "custom_order_id",
        "school_id",
        "gateway_name",
        "payment_mode",
        "order_amount",
        "transaction_amount",
        "status",
        "payment_time",
        "last_updated",
      ]);

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const now = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
      a.download = `transactions_all_${now}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed", err);
      alert("Failed to export CSV. See console for details.");
    } finally {
      setExporting(false);
    }
  }, [
    exportAll,
    transactions,
    page,
    sortField,
    sortOrder,
    statusFilter,
    schoolFilter,
    debouncedSearch,
    dateFrom,
    dateTo,
  ]);

  const totalTransactions = transactions?.meta?.total ?? 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Header */}
      <header className="bg-card border-b">
        <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold">Admin Transactions</h1>
            </div>

            <div className="flex items-center space-x-2">
              <Button asChild variant="outline" size="sm">
                <Link to="/admin/transactions/school">Old: By School</Link>
              </Button>
              <Button variant="ghost" size="sm" onClick={logout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-2 py-6 space-y-6">
        <Card className="mb-0">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center">
                  <Filter className="h-5 w-5 mr-2" />
                  Filters & Search
                </CardTitle>
                <CardDescription>Filter transactions by various criteria</CardDescription>
              </div>

              <div className="flex items-center space-x-3">
                <label className="flex items-center space-x-2 text-sm">
                  <Checkbox
                    id="exportAll"
                    checked={exportAll}
                    onCheckedChange={(v) => setExportAll(Boolean(v))}
                  />
                  <span>Export all results</span>
                </label>

                <Button onClick={exportCSV} variant="outline" size="sm" disabled={exporting}>
                  {exporting ? (
                    <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"></path>
                    </svg>
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Export CSV
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
              <div className="col-span-1 md:col-span-2 relative">
                <Input
                  placeholder="Search by order ID, school ID..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <SearchIcon className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>

              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setPage(1);
                }}
              />
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className="w-64">
                  <Select value={schoolFilter.length === 1 ? schoolFilter[0] : "all"} onValueChange={(value) => {
                    if (!value) setSchoolFilter([]);
                    else setSchoolFilter((prev) => (prev.length === 1 && prev[0] === value ? [] : [value]));
                    setPage(1);
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a school (or clear)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        <span className="text-sm text-muted-foreground">Clear</span>
                      </SelectItem>
                      {isLoadingSchools ? (
                        <SelectItem value="all" disabled>Loading...</SelectItem>
                      ) : (
                        schools?.map((s: string) => (
                          <SelectItem key={s} value={s}>
                            <div className="flex items-center space-x-2">
                              <Building className="h-4 w-4" />
                              <span className="font-mono text-sm">{s}</span>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-3">
                  {["SUCCESS", "PENDING", "FAILED"].map((s) => (
                    <label key={s} className="flex items-center space-x-2">
                      <Checkbox
                        id={`filter-${s}`}
                        checked={statusFilter.includes(s)}
                        onCheckedChange={(checked) => handleStatusFilterChange(s, checked as boolean)}
                      />
                      <span className="text-sm font-medium">{s}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* quick stats - shown when single school selected */}
              {selectedSchool && schoolStats && (
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 w-full max-w-lg">
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm">Total Txns</CardTitle></CardHeader>
                    <CardContent><p className="text-2xl font-bold">{schoolStats.count}</p></CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm">Total Amount</CardTitle></CardHeader>
                    <CardContent><p className="text-2xl font-bold">₹{schoolStats.total.toLocaleString()}</p></CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm">Successful</CardTitle></CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-success">{schoolStats.successCount}</p>
                      <p className="text-xs text-muted-foreground">₹{schoolStats.successful.toLocaleString()}</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm">Success Rate</CardTitle></CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold flex items-center">
                        {Math.round((schoolStats.successCount / schoolStats.count) * 100)}%
                        <TrendingUp className="h-4 w-4 ml-1 text-success" />
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Transactions Table */}
        <Card>
          <CardHeader>
            <CardTitle>Transactions</CardTitle>
            <CardDescription>
              {isLoadingTransactions ? "Loading..." : `${totalTransactions} transactions found`}
              {isFetchingTransactions && !isLoadingTransactions ? " · updating…" : ""}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {isLoadingTransactions ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : transactions?.data.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No transactions found</p>
              </div>
            ) : (
              <div className="space-y-4 overflow-x-auto">
                <div className="min-w-[1200px] grid grid-cols-10 gap-6 px-4 py-3 bg-muted rounded-lg text-sm font-medium">
                  <span className="flex justify-center">Sr. No.</span>

                  <button onClick={() => handleSort("order_amount")} className="flex items-center justify-center space-x-1 hover:text-primary">
                    <span>Amount</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </button>

                  <button onClick={() => handleSort("transaction_amount")} className="flex items-center justify-center space-x-1 hover:text-primary">
                    <span>Txn Amount</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </button>

                  <span className="flex justify-center items-center">Status</span>
                  <span className="flex justify-center items-center">Payment Mode</span>

                  <button onClick={() => handleSort("school_id")} className="flex items-center justify-center space-x-1 hover:text-primary">
                    <span>School</span>
                  </button>

                  <button onClick={() => handleSort("gateway")} className="flex items-center justify-center space-x-1 hover:text-primary">
                    <span>Gateway</span>
                  </button>

                  <span className="flex justify-center items-center">Order ID</span>
                  <span className="flex justify-center items-center">Collect Request ID</span>

                  <button onClick={() => handleSort("payment_time")} className="flex items-center justify-center space-x-1 hover:text-primary">
                    <span>Date</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </div>

                {transactions.data.map((tx: Transaction, idx: number) => (
                  <div
                    key={tx.collect_request_id}
                    className="min-w-[1200px] grid grid-cols-10 gap-6 px-4 py-3 border rounded-lg hover:bg-muted/50 hover:shadow-md transform hover:-translate-y-0.5 transition-all duration-150"
                  >
                    <span className="flex justify-center">{(page - 1) * limit + idx + 1}</span>

                    <div className="font-semibold flex justify-center items-center">₹{tx.order_amount}</div>
                    <div className="font-semibold flex justify-center items-center">₹{tx.transaction_amount ?? tx.order_amount}</div>

                    <Badge className={`flex justify-center items-center ${getStatusColor(tx.status ?? "")}`} variant="secondary">
                      {tx.status}
                    </Badge>

                    <div className="capitalize flex justify-center items-center">{tx.payment_mode || "-"}</div>

                    <div className="font-mono text-xs text-muted-foreground flex justify-center items-center">
                      {tx.school_id ? tx.school_id.slice(-8) : "-"}
                    </div>

                    <div className="capitalize flex justify-center items-center">{tx.gateway_name || "-"}</div>

                    <div className="font-mono text-xs flex justify-center items-center">
                      {tx.custom_order_id || tx.order_id?.slice(-8) || tx.collect_request_id.slice(-8)}
                    </div>

                    <div className="font-mono text-xs flex justify-center items-center">
                      {tx.collect_request_id ? tx.collect_request_id.slice(-8) : "-"}
                    </div>

                    <div className="text-sm text-muted-foreground px-3 flex justify-center items-center">
                      {formatDate(tx.payment_time)}
                    </div>
                  </div>
                ))}

                {transactions && transactions.meta.total > limit && (
                  <div className="flex items-center justify-between pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, transactions.meta.total)} of {transactions.meta.total} transactions
                    </p>

                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                        Previous
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page * limit >= transactions.meta.total}>
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
