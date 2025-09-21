// import React, { useEffect, useState, useMemo, useCallback } from "react";
// import { useQuery } from "@tanstack/react-query";
// import {
//   Card,
//   CardContent,
//   CardHeader,
//   CardTitle,
//   CardDescription,
// } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import { Checkbox } from "@/components/ui/checkbox";
// import { useAuth } from "@/auth/useAuth";
// import api from "@/api/axios";
// import { ArrowUpDown, Download, Filter, Search as SearchIcon, Copy, Check } from "lucide-react";
// import { toCSV } from "@/components/ui/csv";
// import type { TransactionsResponse, Transaction } from "@/types/api";
// import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";

// /** small debounce */
// function useDebounce<T>(value: T, wait = 350) {
//   const [debounced, setDebounced] = useState(value);
//   useEffect(() => {
//     const id = setTimeout(() => setDebounced(value), wait);
//     return () => clearTimeout(id);
//   }, [value, wait]);
//   return debounced;
// }

// export default function TransactionsPage() {
//   const { logout } = useAuth();

//   // separate search fields
//   const [searchOrder, setSearchOrder] = useState("");
//   const [searchSchool, setSearchSchool] = useState("");

//   const [schoolFilter, setSchoolFilter] = useState("");
//   const [statusFilter, setStatusFilter] = useState<string[]>([]);
//   const [dateFrom, setDateFrom] = useState("");
//   const [dateTo, setDateTo] = useState("");
//   const [page, setPage] = useState(1);
//   const limit = 20;

//   const [exporting, setExporting] = useState(false);
//   const [exportAll, setExportAll] = useState(false);

//   const debouncedSearchOrder = useDebounce(searchOrder, 350);
//   const debouncedSearchSchool = useDebounce(searchSchool, 350);

//   // copy feedback state
//   const [copiedId, setCopiedId] = useState<string | null>(null);

//   const { data: schools } = useQuery({
//     queryKey: ["unique-schools"],
//     queryFn: async (): Promise<string[]> => {
//       const resp = await api.get("/api/transactions?limit=100");
//       const txs: Transaction[] = resp.data?.data || [];
//       return [...new Set(txs.map((t) => t.school_id).filter(Boolean))];
//     },
//     staleTime: 1000 * 60 * 5,
//   });

//   const transactionsQuery = useMemo(() => {
//     const params = new URLSearchParams({
//       page: String(page),
//       limit: String(limit),
//       sort: "payment_time",
//       order: "desc",
//     });
//     if (statusFilter.length) params.append("status", statusFilter.join(","));
//     if (schoolFilter) params.append("school_id", schoolFilter);
//     if (debouncedSearchOrder) params.append("search", debouncedSearchOrder);
//     if (debouncedSearchSchool) params.append("search", debouncedSearchSchool);
//     if (dateFrom) params.append("from", dateFrom);
//     if (dateTo) params.append("to", dateTo);
//     return params.toString();
//   }, [page, limit, statusFilter, schoolFilter, debouncedSearchOrder, debouncedSearchSchool, dateFrom, dateTo]);

//   const { data: transactions, isLoading } = useQuery<TransactionsResponse>({
//     queryKey: ["transactions", transactionsQuery],
//     queryFn: async (): Promise<TransactionsResponse> => {
//       const resp = await api.get(`/api/transactions?${transactionsQuery}`);
//       return resp.data;
//     },
//     keepPreviousData: true,
//   });

//   const getStatusColor = (status?: string) => {
//     switch (status) {
//       case "SUCCESS":
//         return "bg-success text-success-foreground";
//       case "FAILED":
//         return "bg-destructive text-destructive-foreground";
//       case "PENDING":
//         return "bg-pending text-pending-foreground";
//       default:
//         return "bg-muted text-muted-foreground";
//     }
//   };

//   const exportCSV = useCallback(async () => {
//     try {
//       setExporting(true);
//       const rows = transactions?.data || [];
//       if (!rows.length) {
//         alert("No rows to export");
//         return;
//       }
//       const csvRows = rows.map((r) => ({
//         collect_request_id: r.collect_request_id,
//         order_id: r.order_id ?? "",
//         custom_order_id: r.custom_order_id ?? "",
//         school_id: r.school_id ?? "",
//         gateway_name: r.gateway_name ?? "",
//         payment_mode: r.payment_mode ?? "",
//         order_amount: r.order_amount ?? "",
//         transaction_amount: r.transaction_amount ?? "",
//         status: r.status ?? "",
//         payment_time: r.payment_time ?? "",
//         last_updated: r.last_updated ?? "",
//       }));
//       const csv = toCSV(csvRows, Object.keys(csvRows[0]));
//       const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
//       const url = URL.createObjectURL(blob);
//       const a = document.createElement("a");
//       a.href = url;
//       a.download = `transactions_page_${page}.csv`;
//       document.body.appendChild(a);
//       a.click();
//       a.remove();
//       URL.revokeObjectURL(url);
//     } catch (err) {
//       console.error(err);
//       alert("Export failed");
//     } finally {
//       setExporting(false);
//     }
//   }, [transactions, page]);

//   const handleCopy = async (text: string) => {
//     try {
//       await navigator.clipboard.writeText(text);
//       setCopiedId(text);
//       setTimeout(() => setCopiedId(null), 1800);
//     } catch (err) {
//       console.error("Copy failed", err);
//     }
//   };

//   return (
//     <div className="w-full max-w-full min-h-full p-6 space-y-6">
//       <header className="flex items-center justify-between mb-4">
//         <h1 className="text-xl font-semibold">Transactions</h1>
//         <div className="flex items-center space-x-2">
//           <Button variant="ghost" size="sm" onClick={() => { setSearchOrder(""); setSearchSchool(""); setStatusFilter([]); setSchoolFilter(""); setDateFrom(""); setDateTo(""); setPage(1); }}>
//             Reset Filters
//           </Button>
//           <Button variant="outline" size="sm" onClick={logout}>
//             Logout
//           </Button>
//         </div>
//       </header>

//       {/* Filters Card */}
//       <Card>
//         <CardHeader>
//           <div className="flex items-center justify-between w-full">
//             <div className="flex items-center space-x-2">
//               <Filter className="h-5 w-5" />
//               <CardTitle>Filters & Search</CardTitle>
//             </div>
//             <CardDescription>Filter by school, status, date, order id</CardDescription>
//           </div>
//         </CardHeader>

//         <CardContent className="space-y-4">
//           <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
//             <div className="col-span-1 relative">
//               <Input
//                 placeholder="Search by order id..."
//                 value={searchOrder}
//                 onChange={(e) => { setSearchOrder(e.target.value); setPage(1); }}
//               />
//               <SearchIcon className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none h-4 w-4 text-muted-foreground" />
//             </div>

//             <div className="col-span-1 relative">
//               <Input
//                 placeholder="Search by order id..."
//                 value={searchOrder}
//                 onChange={(e) => { setSearchOrder(e.target.value); setPage(1); }}
//               />
//               <SearchIcon className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none h-4 w-4 text-muted-foreground" />
//             </div>

//             <div className="col-span-1 relative">
//               <Input
//                 placeholder="Search by school id..."
//                 value={searchSchool}
//                 onChange={(e) => { setSearchSchool(e.target.value); setPage(1); }}
//               />
//               <SearchIcon className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none h-4 w-4 text-muted-foreground" />
//             </div>

//             <div>
//               <Input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} />
//             </div>

//             <div>
//               <Input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} />
//             </div>
//           </div>

//           <div className="flex flex-col md:flex-row items-center justify-between gap-4">
//             <div className="flex items-center gap-3 flex-wrap">
//               <div className="flex items-center gap-2">
//                 {["SUCCESS", "PENDING", "FAILED"].map((s) => (
//                   <label key={s} className="flex items-center gap-1">
//                     <Checkbox
//                       checked={statusFilter.includes(s)}
//                       onCheckedChange={(v) => {
//                         setStatusFilter((prev) => (v ? [...prev, s] : prev.filter((x) => x !== s)));
//                         setPage(1);
//                       }}
//                     />
//                     <span className="text-sm">{s}</span>
//                   </label>
//                 ))}
//               </div>

//               <div className="w-48">
//                 <select
//                   value={schoolFilter}
//                   onChange={(e) => { setSchoolFilter(e.target.value); setPage(1); }}
//                   className="w-full px-3 py-2 border rounded-md bg-transparent text-sm"
//                 >
//                   <option value="">All schools</option>
//                   {schools?.map((s) => (
//                     <option key={s} value={s}>
//                       {s}
//                     </option>
//                   ))}
//                 </select>
//               </div>
//             </div>

//             <div className="flex items-center gap-2">
//               <label className="flex items-center gap-2 text-sm">
//                 <Checkbox checked={exportAll} onCheckedChange={(v) => setExportAll(!!v)} />
//                 <span>Export all (careful)</span>
//               </label>

//               <Button onClick={exportCSV} variant="outline" size="sm" disabled={exporting}>
//                 {exporting ? "Exporting..." : <><Download className="h-4 w-4 mr-1" />Export CSV</>}
//               </Button>
//             </div>
//           </div>
//         </CardContent>
//       </Card>

//       {/* Transactions table */}
//       <Card>
//         <CardHeader>
//           <div className="flex items-center justify-between w-full">
//             <CardTitle>Transactions Table</CardTitle>
//             <CardDescription>{transactions?.meta?.total ?? 0} transactions found</CardDescription>
//           </div>
//         </CardHeader>

//         <CardContent className="space-y-2">
//           {/* Responsive scroll container: this prevents page overflow while allowing horizontal scroll only when necessary */}
//           <div className="w-full overflow-auto">
//             {/* Use an explicit grid-template so columns can shrink while maintaining readable min widths */}
//             <div className="grid grid-cols-[56px_minmax(110px,1fr)_minmax(110px,1fr)_120px_100px_120px_120px_220px_160px_180px] gap-3 px-4 py-2 bg-muted rounded-lg font-medium text-sm whitespace-nowrap">
//               <div className="flex items-center justify-center">Sr. No.</div>
//               <div className="flex items-center justify-center cursor-pointer">Amount <ArrowUpDown className="h-3 w-3 inline-block ml-1" /></div>
//               <div className="flex items-center justify-center cursor-pointer">Txn Amount <ArrowUpDown className="h-3 w-3 inline-block ml-1" /></div>
//               <div className="flex items-center justify-center">Status</div>
//               <div className="flex items-center justify-center">Mode</div>
//               <div className="flex items-center justify-center cursor-pointer">School <ArrowUpDown className="h-3 w-3 inline-block ml-1" /></div>
//               <div className="flex items-center justify-center cursor-pointer">Gateway</div>
//               <div className="flex items-center justify-center">Order ID</div>
//               <div className="flex items-center justify-center">Collect ID</div>
//               <div className="flex items-center justify-center cursor-pointer">Date <ArrowUpDown className="h-3 w-3 inline-block ml-1" /></div>
//             </div>

//             <div className="divide-y">
//               {isLoading ? (
//                 <div className="flex justify-center py-10">
//                   <div className="animate-spin h-8 w-8 border-b-2 border-primary rounded-full" />
//                 </div>
//               ) : transactions?.data.length === 0 ? (
//                 <p className="text-center py-8 text-muted-foreground">No transactions found</p>
//               ) : (
//                 transactions.data.map((tx: Transaction, idx: number) => (
//                   <div
//                     key={tx.collect_request_id || `${idx}`}
//                     className="grid grid-cols-[56px_minmax(110px,1fr)_minmax(110px,1fr)_120px_100px_120px_120px_220px_160px_180px] gap-3 px-4 py-3 border-b hover:bg-muted/50 transition-colors"
//                   >
//                     <div className="flex items-center justify-center">{(page - 1) * limit + idx + 1}</div>

//                     <div className="flex items-center justify-center font-semibold">₹{tx.order_amount}</div>

//                     <div className="flex items-center justify-center font-semibold">₹{tx.transaction_amount ?? tx.order_amount}</div>

//                     <div className="flex items-center justify-center">
//                       <Badge className={getStatusColor(tx.status)}>{tx.status}</Badge>
//                     </div>

//                     <div className="flex items-center justify-center capitalize">{tx.payment_mode || "-"}</div>

//                     <div className="flex items-center justify-center font-mono text-xs truncate">{tx.school_id ?? "-"}</div>

//                     <div className="flex items-center justify-center capitalize">{tx.gateway_name || "-"}</div>

//                     <div className="flex items-center justify-center font-mono text-xs truncate max-w-[220px]">{tx.custom_order_id || tx.order_id?.slice(-12) || tx.collect_request_id?.slice(-12)}</div>

//                     <div className="flex items-center justify-center font-mono text-xs truncate max-w-[160px]">
//                       <TooltipProvider>
//                         <Tooltip>
//                           <TooltipTrigger asChild>
//                             <button
//                               onClick={() => tx.collect_request_id && handleCopy(tx.collect_request_id)}
//                               className="flex items-center gap-2 px-2 py-1 rounded hover:bg-muted/30"
//                               aria-label="Copy collect id"
//                             >
//                               <span className="truncate">{tx.collect_request_id ? tx.collect_request_id.slice(-12) : "-"}</span>
//                               {copiedId === tx.collect_request_id ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
//                             </button>
//                           </TooltipTrigger>
//                           <TooltipContent>
//                             <span>{copiedId === tx.collect_request_id ? "Copied!" : "Click to copy full id"}</span>
//                           </TooltipContent>
//                         </Tooltip>
//                       </TooltipProvider>
//                     </div>

//                     <div className="flex items-center justify-center text-sm text-muted-foreground">{tx.payment_time ? new Date(tx.payment_time).toLocaleString() : "-"}</div>
//                   </div>
//                 ))
//               )}
//             </div>
//           </div>

//           {/* pagination */}
//           <div className="flex items-center justify-between pt-4 border-t">
//             <p className="text-sm text-muted-foreground">
//               Showing {(page - 1) * limit + 1} to {Math.min(page * limit, transactions?.meta?.total ?? 0)} of {transactions?.meta?.total ?? 0} transactions
//             </p>

//             <div className="flex space-x-2">
//               <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
//                 Previous
//               </Button>
//               <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page * limit >= (transactions?.meta?.total ?? 0)}>
//                 Next
//               </Button>
//             </div>
//           </div>
//         </CardContent>
//       </Card>
//     </div>
//   );
// }

import React, { useEffect, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/auth/useAuth";
import api from "@/api/axios";
import {
  ArrowUpDown,
  Download,
  Filter,
  Search as SearchIcon,
  Copy,
  Check,
} from "lucide-react";
import { toCSV } from "@/components/ui/csv";
import type { TransactionsResponse, Transaction } from "@/types/api";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";

/** small debounce */
function useDebounce<T>(value: T, wait = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), wait);
    return () => clearTimeout(id);
  }, [value, wait]);
  return debounced;
}

export default function TransactionsPage() {
  const { logout } = useAuth();

  // search states
  const [searchOrderId, setSearchOrderId] = useState("");
  const [searchCollectId, setSearchCollectId] = useState("");
  const [searchSchoolId, setSearchSchoolId] = useState("");

  // filters
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const limit = 20;

  // export
  const [exporting, setExporting] = useState(false);
  const [exportAll, setExportAll] = useState(false);

  const debouncedOrderId = useDebounce(searchOrderId, 350);
  const debouncedCollectId = useDebounce(searchCollectId, 350);
  const debouncedSchoolId = useDebounce(searchSchoolId, 350);

  // copy feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);

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

  // --- fetch transactions ---
  const { data: transactions, isLoading } = useQuery<TransactionsResponse>({
    queryKey: [
      "transactions",
      debouncedOrderId,
      debouncedCollectId,
      debouncedSchoolId,
      page,
      statusFilter,
      dateFrom,
      dateTo,
    ],
    queryFn: async (): Promise<TransactionsResponse> => {
      if (debouncedOrderId) {
        const resp = await api.get(`/api/transactions/${debouncedOrderId}`);
        return {
          data: [resp.data.order],
          meta: { total: 1, page: 1, limit: 1 },
        };
      }
      if (debouncedCollectId) {
        const resp = await api.get(
          `/api/transactions/by-collect/${debouncedCollectId}`
        );
        return {
          data: [resp.data.transaction],
          meta: { total: 1, page: 1, limit: 1 },
        };
      }
      if (debouncedSchoolId) {
        const resp = await api.get(
          `/api/transactions/school/${debouncedSchoolId}?page=${page}&limit=${limit}`
        );
        return resp.data;
      }

      // fallback default
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        sort: "payment_time",
        order: "desc",
      });
      if (statusFilter.length) params.append("status", statusFilter.join(","));
      if (dateFrom) params.append("from", dateFrom);
      if (dateTo) params.append("to", dateTo);

      const resp = await api.get(`/api/transactions?${params.toString()}`);
      return resp.data;
    },
    keepPreviousData: true,
  });

  const exportCSV = useCallback(async () => {
    try {
      setExporting(true);
      const rows = transactions?.data || [];
      if (!rows.length) {
        alert("No rows to export");
        return;
      }
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
      const csv = toCSV(csvRows, Object.keys(csvRows[0]));
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `transactions_page_${page}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Export failed");
    } finally {
      setExporting(false);
    }
  }, [transactions, page]);

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(text);
      setTimeout(() => setCopiedId(null), 1800);
    } catch (err) {
      console.error("Copy failed", err);
    }
  };

  return (
    <div className="w-full max-w-full min-h-full p-6 space-y-6">
      <header className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Transactions</h1>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchOrderId("");
              setSearchCollectId("");
              setSearchSchoolId("");
              setStatusFilter([]);
              setDateFrom("");
              setDateTo("");
              setPage(1);
            }}
          >
            Reset Filters
          </Button>
          <Button variant="outline" size="sm" onClick={logout}>
            Logout
          </Button>
        </div>
      </header>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5" />
              <CardTitle>Filters & Search</CardTitle>
            </div>
            <CardDescription>
              Filter by order, collect, school, status, date
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="col-span-1 relative">
              <Input
                placeholder="Search by order id..."
                value={searchOrderId}
                onChange={(e) => {
                  setSearchOrderId(e.target.value);
                  setPage(1);
                }}
              />
              <SearchIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>

            <div className="col-span-1 relative">
              <Input
                placeholder="Search by collect id..."
                value={searchCollectId}
                onChange={(e) => {
                  setSearchCollectId(e.target.value);
                  setPage(1);
                }}
              />
              <SearchIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>

            <div className="col-span-1 relative">
              <Input
                placeholder="Search by school id..."
                value={searchSchoolId}
                onChange={(e) => {
                  setSearchSchoolId(e.target.value);
                  setPage(1);
                }}
              />
              <SearchIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>

            <div>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            <div>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Status filters */}
            <div className="flex items-center gap-3 flex-wrap">
              {["SUCCESS", "PENDING", "FAILED"].map((s) => (
                <label key={s} className="flex items-center gap-1">
                  <Checkbox
                    checked={statusFilter.includes(s)}
                    onCheckedChange={(v) => {
                      setStatusFilter((prev) =>
                        v ? [...prev, s] : prev.filter((x) => x !== s)
                      );
                      setPage(1);
                    }}
                  />
                  <span className="text-sm">{s}</span>
                </label>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={exportAll}
                  onCheckedChange={(v) => setExportAll(!!v)}
                />
                <span>Export all (careful)</span>
              </label>

              <Button
                onClick={exportCSV}
                variant="outline"
                size="sm"
                disabled={exporting}
              >
                {exporting ? (
                  "Exporting..."
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-1" /> Export CSV
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <CardTitle>Transactions Table</CardTitle>
            <CardDescription>
              {transactions?.meta?.total ?? 0} transactions found
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-2">
          <div className="w-full overflow-auto">
            <div className="grid grid-cols-[56px_minmax(110px,1fr)_minmax(110px,1fr)_120px_100px_120px_120px_220px_160px_180px] gap-3 px-4 py-2 bg-muted rounded-lg font-medium text-sm">
              <div className="text-center">Sr. No.</div>
              <div className="text-center">Amount</div>
              <div className="text-center">Txn Amount</div>
              <div className="text-center">Status</div>
              <div className="text-center">Mode</div>
              <div className="text-center">School</div>
              <div className="text-center">Gateway</div>
              <div className="text-center">Order ID</div>
              <div className="text-center">Collect ID</div>
              <div className="text-center">Date</div>
            </div>

            <div className="divide-y">
              {isLoading ? (
                <div className="flex justify-center py-10">
                  <div className="animate-spin h-8 w-8 border-b-2 border-primary rounded-full" />
                </div>
              ) : transactions?.data.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  No transactions found
                </p>
              ) : (
                transactions.data.map((tx: Transaction, idx: number) => (
                  <div
                    key={tx.collect_request_id || `${idx}`}
                    className="grid grid-cols-[56px_minmax(110px,1fr)_minmax(110px,1fr)_120px_100px_120px_120px_220px_160px_180px] gap-3 px-4 py-3 border-b hover:bg-muted/50"
                  >
                    <div className="text-center">
                      {(page - 1) * limit + idx + 1}
                    </div>
                    <div className="text-center font-semibold">
                      ₹{tx.order_amount}
                    </div>
                    <div className="text-center font-semibold">
                      ₹{tx.transaction_amount ?? tx.order_amount}
                    </div>
                    <div className="flex justify-center">
                      <Badge className={getStatusColor(tx.status)}>
                        {tx.status}
                      </Badge>
                    </div>
                    <div className="text-center capitalize">
                      {tx.payment_mode || "-"}
                    </div>
                    <div className="text-center font-mono text-xs truncate">
                      {tx.school_id ?? "-"}
                    </div>
                    <div className="text-center capitalize">
                      {tx.gateway_name || "-"}
                    </div>
                    <div className="text-center font-mono text-xs truncate max-w-[200px]">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() =>
                                tx.order_id && handleCopy(tx.order_id)
                              }
                              className="flex items-center gap-2 px-2 py-1 rounded hover:bg-muted/30 w-full justify-center"
                            >
                              <span className="truncate">
                                {tx.order_id ? tx.order_id.slice(-16) : "-"}
                              </span>
                              {copiedId === tx.order_id ? (
                                <Check className="h-4 w-4 text-success" />
                              ) : (
                                <Copy className="h-4 w-4 text-muted-foreground" />
                              )}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <span>
                              {copiedId === tx.order_id
                                ? "Copied!"
                                : "Click to copy full id"}
                            </span>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>

                    {/* Collect ID */}
                    <div className="text-center font-mono text-xs truncate max-w-[200px]">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() =>
                                tx.collect_request_id &&
                                handleCopy(tx.collect_request_id)
                              }
                              className="flex items-center gap-2 px-2 py-1 rounded hover:bg-muted/30 w-full justify-center"
                            >
                              <span className="truncate">
                                {tx.collect_request_id
                                  ? tx.collect_request_id.slice(-16)
                                  : "-"}
                              </span>
                              {copiedId === tx.collect_request_id ? (
                                <Check className="h-4 w-4 text-success" />
                              ) : (
                                <Copy className="h-4 w-4 text-muted-foreground" />
                              )}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <span>
                              {copiedId === tx.collect_request_id
                                ? "Copied!"
                                : "Click to copy full id"}
                            </span>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>

                    <div className="text-center text-sm text-muted-foreground">
                      {tx.payment_time
                        ? new Date(tx.payment_time).toLocaleString()
                        : "-"}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              Showing {(page - 1) * limit + 1} to{" "}
              {Math.min(page * limit, transactions?.meta?.total ?? 0)} of{" "}
              {transactions?.meta?.total ?? 0} transactions
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
                disabled={page * limit >= (transactions?.meta?.total ?? 0)}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
