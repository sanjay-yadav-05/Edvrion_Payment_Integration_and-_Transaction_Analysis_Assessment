// // src/pages/TransactionsPage.tsx
// import React, { useEffect, useMemo, useCallback, useState } from "react";
// import { useQuery } from "@tanstack/react-query";
// import { Link, useSearchParams } from "react-router-dom";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Badge } from "@/components/ui/badge";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { Checkbox } from "@/components/ui/checkbox";
// import { useAuth } from "@/auth/useAuth";
// import api from "@/api/axios";
// import {
//   ArrowUpDown,
//   Download,
//   Filter,
//   Search as SearchIcon,
//   Building,
//   TrendingUp,
// } from "lucide-react";
// import type { TransactionsResponse, Transaction } from "@/types/api";
// import { toCSV } from "@/components/ui/csv";

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
//   const [searchParams, setSearchParams] = useSearchParams();

//   const [page, setPage] = useState(() =>
//     parseInt(searchParams.get("page") || "1")
//   );
//   const [search, setSearch] = useState(() => searchParams.get("search") || "");
//   const [statusFilter, setStatusFilter] = useState<string[]>(
//     () => searchParams.get("status")?.split(",").filter(Boolean) || []
//   );
//   const [schoolFilter, setSchoolFilter] = useState<string[]>(
//     () => searchParams.get("school")?.split(",").filter(Boolean) || []
//   );
//   const [sortField, setSortField] = useState(
//     () => searchParams.get("sort") || "payment_time"
//   );
//   const [sortOrder, setSortOrder] = useState<"asc" | "desc">(
//     () => (searchParams.get("order") as "asc" | "desc") || "desc"
//   );
//   const [dateFrom, setDateFrom] = useState(
//     () => searchParams.get("from") || ""
//   );
//   const [dateTo, setDateTo] = useState(() => searchParams.get("to") || "");
//   const limit = 20;

//   const [exporting, setExporting] = useState(false);
//   const [exportAll, setExportAll] = useState(false);

//   const debouncedSearch = useDebounce(search, 350);

//   useEffect(() => {
//     document.title = "Transactions - Admin";
//   }, []);

//   useEffect(() => {
//     const params = new URLSearchParams();
//     params.set("page", String(page));
//     if (search) params.set("search", search);
//     if (statusFilter.length) params.set("status", statusFilter.join(","));
//     if (schoolFilter.length) params.set("school", schoolFilter.join(","));
//     if (sortField) params.set("sort", sortField);
//     if (sortOrder) params.set("order", sortOrder);
//     if (dateFrom) params.set("from", dateFrom);
//     if (dateTo) params.set("to", dateTo);
//     setSearchParams(params, { replace: true });
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [
//     page,
//     search,
//     statusFilter,
//     schoolFilter,
//     sortField,
//     sortOrder,
//     dateFrom,
//     dateTo,
//   ]);

//   // Fetch schools (scan up to 1000 records from /api/transactions)
//   const { data: schools, isLoading: isLoadingSchools } = useQuery({
//     queryKey: ["unique-schools"],
//     queryFn: async (): Promise<string[]> => {
//       const resp = await api.get(`/api/transactions?limit=100`);
//       const txs: Transaction[] = resp.data?.data || [];
//       return [...new Set(txs.map((t) => t.school_id).filter(Boolean))];
//     },
//     staleTime: 1000 * 60 * 5,
//   });

//   const transactionsQueryParams = useMemo(() => {
//     const params = new URLSearchParams({
//       page: String(page),
//       limit: String(limit),
//       sort: sortField,
//       order: sortOrder,
//     });
//     if (statusFilter.length) params.append("status", statusFilter.join(","));
//     if (schoolFilter.length) params.append("school_id", schoolFilter.join(","));
//     if (debouncedSearch) params.append("search", debouncedSearch);
//     if (dateFrom) params.append("from", dateFrom);
//     if (dateTo) params.append("to", dateTo);
//     return params.toString();
//   }, [
//     page,
//     limit,
//     sortField,
//     sortOrder,
//     statusFilter,
//     schoolFilter,
//     debouncedSearch,
//     dateFrom,
//     dateTo,
//   ]);

//   const {
//     data: transactions,
//     isLoading: isLoadingTransactions,
//     isFetching: isFetchingTransactions,
//   } = useQuery({
//     queryKey: ["transactions", transactionsQueryParams],
//     queryFn: async (): Promise<TransactionsResponse> => {
//       const resp = await api.get(
//         `/api/transactions?${transactionsQueryParams}`
//       );
//       return resp.data;
//     },
//     keepPreviousData: true,
//     staleTime: 1000 * 20,
//   });

//   const selectedSchool = schoolFilter.length === 1 ? schoolFilter[0] : "";
//   const { data: schoolTransactions } = useQuery({
//     queryKey: [
//       "school-transactions",
//       selectedSchool,
//       page,
//       statusFilter.join(","),
//     ],
//     queryFn: async (): Promise<TransactionsResponse> => {
//       if (!selectedSchool)
//         return { data: [], meta: { page: 1, limit, total: 0 } };
//       const params = new URLSearchParams({
//         page: String(page),
//         limit: String(limit),
//         sort: sortField,
//         order: sortOrder,
//       });
//       if (statusFilter.length) params.append("status", statusFilter.join(","));
//       if (debouncedSearch) params.append("search", debouncedSearch);
//       if (dateFrom) params.append("from", dateFrom);
//       if (dateTo) params.append("to", dateTo);
//       const resp = await api.get(
//         `/api/transactions/school/${selectedSchool}?${params.toString()}`
//       );
//       return resp.data;
//     },
//     enabled: !!selectedSchool,
//     keepPreviousData: true,
//   });

//   const statsSource =
//     (schoolTransactions?.data && schoolTransactions.data.length
//       ? schoolTransactions.data
//       : transactions?.data) || [];
//   const schoolStats = useMemo(() => {
//     if (!selectedSchool || statsSource.length === 0) return null;
//     return statsSource.reduce(
//       (acc, tx) => {
//         acc.total += tx.order_amount || 0;
//         acc.count += 1;
//         if (tx.status === "SUCCESS") {
//           acc.successful += tx.order_amount || 0;
//           acc.successCount += 1;
//         }
//         return acc;
//       },
//       { total: 0, successful: 0, count: 0, successCount: 0 }
//     );
//   }, [selectedSchool, statsSource]);

//   const handleStatusFilterChange = useCallback(
//     (status: string, checked: boolean) => {
//       setStatusFilter((prev) =>
//         checked ? [...prev, status] : prev.filter((s) => s !== status)
//       );
//       setPage(1);
//     },
//     []
//   );

//   const handleSort = useCallback((field: string) => {
//     setPage(1);
//     setSortField((prev) => {
//       if (prev === field) {
//         setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
//         return prev;
//       }
//       setSortOrder("desc");
//       return field;
//     });
//   }, []);

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

//   const formatDate = (dateString?: string) => {
//     if (!dateString) return "-";
//     return new Date(dateString).toLocaleString("en-IN", {
//       day: "numeric",
//       month: "short",
//       year: "numeric",
//       hour: "2-digit",
//       minute: "2-digit",
//     });
//   };

//   // Export CSV implementation: uses only /api/transactions; iterates pages if exportAll true
//   const exportCSV = useCallback(async () => {
//     try {
//       setExporting(true);
//       if (!exportAll) {
//         const rows = transactions?.data || [];
//         if (!rows.length) {
//           alert("No rows to export on this page.");
//           return;
//         }
//         const csvRows = rows.map((r) => ({
//           collect_request_id: r.collect_request_id,
//           order_id: r.order_id ?? "",
//           custom_order_id: r.custom_order_id ?? "",
//           school_id: r.school_id ?? "",
//           gateway_name: r.gateway_name ?? "",
//           payment_mode: r.payment_mode ?? "",
//           order_amount: r.order_amount ?? "",
//           transaction_amount: r.transaction_amount ?? "",
//           status: r.status ?? "",
//           payment_time: r.payment_time ?? "",
//           last_updated: r.last_updated ?? "",
//         }));
//         const csv = toCSV(csvRows, Object.keys(csvRows[0]));
//         const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
//         const url = URL.createObjectURL(blob);
//         const a = document.createElement("a");
//         a.href = url;
//         a.download = `transactions_page_${page}.csv`;
//         document.body.appendChild(a);
//         a.click();
//         a.remove();
//         URL.revokeObjectURL(url);
//         return;
//       }

//       // export all: iterate pages with backend limit <=100
//       const pageSize = 100;
//       let current = 1;
//       let allRows: Transaction[] = [];
//       let total = Infinity;

//       const baseParams = new URLSearchParams({
//         limit: String(pageSize),
//         sort: sortField,
//         order: sortOrder,
//       });
//       if (statusFilter.length)
//         baseParams.append("status", statusFilter.join(","));
//       if (schoolFilter.length)
//         baseParams.append("school_id", schoolFilter.join(","));
//       if (debouncedSearch) baseParams.append("search", debouncedSearch);
//       if (dateFrom) baseParams.append("from", dateFrom);
//       if (dateTo) baseParams.append("to", dateTo);

//       while (allRows.length < total) {
//         const params = new URLSearchParams(baseParams.toString());
//         params.set("page", String(current));
//         const resp = await api.get(`/api/transactions?${params.toString()}`);
//         const body: TransactionsResponse = resp.data;
//         const fetched = body.data || [];
//         if (total === Infinity) total = body.meta?.total ?? Infinity;
//         allRows = allRows.concat(fetched);
//         if (!fetched.length) break;
//         current += 1;
//         if (current > Math.ceil((total || 0) / pageSize) + 2) break; // safety
//       }

//       if (!allRows.length) {
//         alert("No rows found.");
//         return;
//       }
//       const csvRows = allRows.map((r) => ({
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
//       a.download = `transactions_all_${new Date()
//         .toISOString()
//         .slice(0, 19)
//         .replace(/[:T]/g, "-")}.csv`;
//       document.body.appendChild(a);
//       a.click();
//       a.remove();
//       URL.revokeObjectURL(url);
//     } catch (err) {
//       console.error("Export failed", err);
//       alert("Export failed. See console.");
//     } finally {
//       setExporting(false);
//     }
//   }, [
//     exportAll,
//     transactions,
//     page,
//     sortField,
//     sortOrder,
//     statusFilter,
//     schoolFilter,
//     debouncedSearch,
//     dateFrom,
//     dateTo,
//   ]);

//   const totalTransactions = transactions?.meta?.total ?? 0;

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-background to-muted">
//       <header className="bg-card border-b">
//         <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
//           <div className="flex items-center justify-between h-16">
//             <div>
//               <h1 className="text-xl font-semibold">Admin Transactions</h1>
//             </div>
//             <div className="flex items-center space-x-2">
//               <Button variant="ghost" size="sm" onClick={logout}>
//                 Logout
//               </Button>
//             </div>
//           </div>
//         </div>
//       </header>

//       <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-2 py-6 space-y-6">
//         <Card>
//           <CardHeader>
//             <div className="flex items-center justify-between">
//               <div>
//                 <CardTitle className="flex items-center">
//                   <Filter className="h-5 w-5 mr-2" /> Filters & Search
//                 </CardTitle>
//                 <CardDescription>
//                   Filter transactions by school, status, date or order id
//                 </CardDescription>
//               </div>
//               <div className="flex items-center space-x-3">
//                 <label className="flex items-center space-x-2 text-sm">
//                   <Checkbox
//                     id="exportAll"
//                     checked={exportAll}
//                     onCheckedChange={(v) => setExportAll(Boolean(v))}
//                   />
//                   <span>Export all results</span>
//                 </label>
//                 <Button
//                   onClick={exportCSV}
//                   variant="outline"
//                   size="sm"
//                   disabled={exporting}
//                 >
//                   {exporting ? (
//                     "Exporting..."
//                   ) : (
//                     <>
//                       <Download className="h-4 w-4 mr-2" />
//                       Export CSV
//                     </>
//                   )}
//                 </Button>
//               </div>
//             </div>
//           </CardHeader>

//           <CardContent className="space-y-4">
//             <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
//               <div className="col-span-1 md:col-span-2 relative">
//                 <Input
//                   placeholder="Search by order ID, school ID..."
//                   value={search}
//                   onChange={(e) => {
//                     setSearch(e.target.value);
//                     setPage(1);
//                   }}
//                 />
//                 <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
//                   <SearchIcon className="h-4 w-4 text-muted-foreground" />
//                 </div>
//               </div>

//               <Input
//                 type="date"
//                 value={dateFrom}
//                 onChange={(e) => {
//                   setDateFrom(e.target.value);
//                   setPage(1);
//                 }}
//               />
//               <Input
//                 type="date"
//                 value={dateTo}
//                 onChange={(e) => {
//                   setDateTo(e.target.value);
//                   setPage(1);
//                 }}
//               />
//             </div>

//             <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
//               <div className="flex items-center space-x-3">
//                 <div className="w-64">
//                   <Select
//                     value={schoolFilter.length === 1 ? schoolFilter[0] : ""}
//                     onValueChange={(value) => {
//                       if (!value) setSchoolFilter([]);
//                       else
//                         setSchoolFilter((prev) =>
//                           prev.length === 1 && prev[0] === value ? [] : [value]
//                         );
//                       setPage(1);
//                     }}
//                   >
//                     <SelectTrigger>
//                       <SelectValue placeholder="Select a school (or clear)" />
//                     </SelectTrigger>
//                     <SelectContent>
//                       <SelectItem value="all">Clear</SelectItem>
//                       {isLoadingSchools ? (
//                         <SelectItem value="all">Loading...</SelectItem>
//                       ) : (
//                         schools?.map((s: string) => (
//                           <SelectItem key={s} value={s}>
//                             <span className="font-mono text-sm">{s}</span>
//                           </SelectItem>
//                         ))
//                       )}
//                     </SelectContent>
//                   </Select>
//                 </div>

//                 <div className="flex items-center space-x-3">
//                   {["SUCCESS", "PENDING", "FAILED"].map((s) => (
//                     <label key={s} className="flex items-center space-x-2">
//                       <Checkbox
//                         id={`filter-${s}`}
//                         checked={statusFilter.includes(s)}
//                         onCheckedChange={(checked) =>
//                           handleStatusFilterChange(s, checked as boolean)
//                         }
//                       />
//                       <span className="text-sm font-medium">{s}</span>
//                     </label>
//                   ))}
//                 </div>
//               </div>

//               {selectedSchool && schoolStats && (
//                 <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 w-full max-w-lg">
//                   <Card>
//                     <CardHeader className="pb-2">
//                       <CardTitle className="text-sm">Total Txns</CardTitle>
//                     </CardHeader>
//                     <CardContent>
//                       <p className="text-2xl font-bold">{schoolStats.count}</p>
//                     </CardContent>
//                   </Card>
//                   <Card>
//                     <CardHeader className="pb-2">
//                       <CardTitle className="text-sm">Total Amount</CardTitle>
//                     </CardHeader>
//                     <CardContent>
//                       <p className="text-2xl font-bold">
//                         ₹{schoolStats.total.toLocaleString()}
//                       </p>
//                     </CardContent>
//                   </Card>
//                   <Card>
//                     <CardHeader className="pb-2">
//                       <CardTitle className="text-sm">Successful</CardTitle>
//                     </CardHeader>
//                     <CardContent>
//                       <p className="text-2xl font-bold text-success">
//                         {schoolStats.successCount}
//                       </p>
//                       <p className="text-xs text-muted-foreground">
//                         ₹{schoolStats.successful.toLocaleString()}
//                       </p>
//                     </CardContent>
//                   </Card>
//                   <Card>
//                     <CardHeader className="pb-2">
//                       <CardTitle className="text-sm">Success Rate</CardTitle>
//                     </CardHeader>
//                     <CardContent>
//                       <p className="text-2xl font-bold">
//                         {Math.round(
//                           (schoolStats.successCount / schoolStats.count) * 100
//                         )}
//                         % <TrendingUp className="h-4 w-4 ml-1 text-success" />
//                       </p>
//                     </CardContent>
//                   </Card>
//                 </div>
//               )}
//             </div>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardHeader>
//             <CardTitle>Transactions</CardTitle>
//             <CardDescription>
//               {isLoadingTransactions
//                 ? "Loading..."
//                 : `${totalTransactions} transactions found`}{" "}
//               {isFetchingTransactions && !isLoadingTransactions
//                 ? " · updating…"
//                 : ""}
//             </CardDescription>
//           </CardHeader>
//           <CardContent>
//             {isLoadingTransactions ? (
//               <div className="flex items-center justify-center py-8">
//                 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
//               </div>
//             ) : transactions?.data.length === 0 ? (
//               <div className="text-center py-8">
//                 <p className="text-muted-foreground">No transactions found</p>
//               </div>
//             ) : (
//               <div className="space-y-4 overflow-x-auto">
//                 <div className="min-w-[1200px] grid grid-cols-10 gap-6 px-4 py-3 bg-muted rounded-lg text-sm font-medium">
//                   <span className="flex justify-center">Sr. No.</span>
//                   <button
//                     onClick={() => handleSort("order_amount")}
//                     className="flex items-center justify-center space-x-1 hover:text-primary"
//                   >
//                     <span>Amount</span>
//                     <ArrowUpDown className="h-3 w-3" />
//                   </button>
//                   <button
//                     onClick={() => handleSort("transaction_amount")}
//                     className="flex items-center justify-center space-x-1 hover:text-primary"
//                   >
//                     <span>Txn Amount</span>
//                     <ArrowUpDown className="h-3 w-3" />
//                   </button>
//                   <span className="flex justify-center items-center">
//                     Status
//                   </span>
//                   <span className="flex justify-center items-center">
//                     Payment Mode
//                   </span>
//                   <button
//                     onClick={() => handleSort("school_id")}
//                     className="flex items-center justify-center space-x-1 hover:text-primary"
//                   >
//                     <span>School</span>
//                   </button>
//                   <button
//                     onClick={() => handleSort("gateway")}
//                     className="flex items-center justify-center space-x-1 hover:text-primary"
//                   >
//                     <span>Gateway</span>
//                   </button>
//                   <span className="flex justify-center items-center">
//                     Order ID
//                   </span>
//                   <span className="flex justify-center items-center">
//                     Collect Request ID
//                   </span>
//                   <button
//                     onClick={() => handleSort("payment_time")}
//                     className="flex items-center justify-center space-x-1 hover:text-primary"
//                   >
//                     <span>Date</span>
//                     <ArrowUpDown className="h-3 w-3" />
//                   </button>
//                 </div>

//                 {transactions.data.map((tx: Transaction, idx: number) => (
//                   <div
//                     key={tx.collect_request_id}
//                     className="min-w-[1200px] grid grid-cols-10 gap-6 px-4 py-3 border rounded-lg hover:bg-muted/50 hover:shadow-md transform hover:-translate-y-0.5 transition-all duration-150"
//                   >
//                     <span className="flex justify-center">
//                       {(page - 1) * limit + idx + 1}
//                     </span>
//                     <div className="font-semibold flex justify-center items-center">
//                       ₹{tx.order_amount}
//                     </div>
//                     <div className="font-semibold flex justify-center items-center">
//                       ₹{tx.transaction_amount ?? tx.order_amount}
//                     </div>
//                     <Badge
//                       className={`flex justify-center items-center ${getStatusColor(
//                         tx.status ?? ""
//                       )}`}
//                       variant="secondary"
//                     >
//                       {tx.status}
//                     </Badge>
//                     <div className="capitalize flex justify-center items-center">
//                       {tx.payment_mode || "-"}
//                     </div>
//                     <div className="font-mono text-xs text-muted-foreground flex justify-center items-center">
//                       {tx.school_id ? tx.school_id.slice(-8) : "-"}
//                     </div>
//                     <div className="capitalize flex justify-center items-center">
//                       {tx.gateway_name || "-"}
//                     </div>
//                     <div className="font-mono text-xs flex justify-center items-center">
//                       {tx.custom_order_id ||
//                         tx.order_id?.slice(-8) ||
//                         tx.collect_request_id.slice(-8)}
//                     </div>
//                     <div className="font-mono text-xs flex justify-center items-center">
//                       {tx.collect_request_id
//                         ? tx.collect_request_id.slice(-8)
//                         : "-"}
//                     </div>
//                     <div className="text-sm text-muted-foreground px-3 flex justify-center items-center">
//                       {formatDate(tx.payment_time)}
//                     </div>
//                   </div>
//                 ))}

//                 {transactions && transactions.meta.total > limit && (
//                   <div className="flex items-center justify-between pt-4 border-t">
//                     <p className="text-sm text-muted-foreground">
//                       Showing {(page - 1) * limit + 1} to{" "}
//                       {Math.min(page * limit, transactions.meta.total)} of{" "}
//                       {transactions.meta.total} transactions
//                     </p>
//                     <div className="flex space-x-2">
//                       <Button
//                         variant="outline"
//                         size="sm"
//                         onClick={() => setPage((p) => Math.max(1, p - 1))}
//                         disabled={page === 1}
//                       >
//                         Previous
//                       </Button>
//                       <Button
//                         variant="outline"
//                         size="sm"
//                         onClick={() => setPage((p) => p + 1)}
//                         disabled={page * limit >= transactions.meta.total}
//                       >
//                         Next
//                       </Button>
//                     </div>
//                   </div>
//                 )}
//               </div>
//             )}
//           </CardContent>
//         </Card>
//       </main>
//     </div>
//   );
// }



import { Copy, Check } from 'lucide-react';

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/auth/useAuth";
import api from "@/api/axios";
import { ArrowUpDown, Download, Filter, Search as SearchIcon } from "lucide-react";
import { toCSV } from "@/components/ui/csv";
import type { TransactionsResponse, Transaction } from "@/types/api";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'; 


// ... inside your component

/** small debounce */
function useDebounce<T>(value: T, wait = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => { const id = setTimeout(() => setDebounced(value), wait); return () => clearTimeout(id); }, [value, wait]);
  return debounced;
}

export default function TransactionsPage() {
  const [copiedText, setCopiedText] = useState(null);
  const { logout } = useAuth();
  const [search, setSearch] = useState("");
  const [schoolFilter, setSchoolFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const limit = 20;

  const [exporting, setExporting] = useState(false);
  const [exportAll, setExportAll] = useState(false);

  const debouncedSearch = useDebounce(search, 350);

  const { data: schools } = useQuery({
    queryKey: ["unique-schools"],
    queryFn: async (): Promise<string[]> => {
      const resp = await api.get("/api/transactions?limit=100");
      const txs: Transaction[] = resp.data?.data || [];
      return [...new Set(txs.map((t) => t.school_id).filter(Boolean))];
    },
    staleTime: 1000 * 60 * 5,
  });

  const transactionsQuery = useMemo(() => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit), sort: "payment_time", order: "desc" });
    if (statusFilter.length) params.append("status", statusFilter.join(","));
    if (schoolFilter) params.append("school_id", schoolFilter);
    if (debouncedSearch) params.append("search", debouncedSearch);
    if (dateFrom) params.append("from", dateFrom);
    if (dateTo) params.append("to", dateTo);
    return params.toString();
  }, [page, limit, statusFilter, schoolFilter, debouncedSearch, dateFrom, dateTo]);

  const { data: transactions, isLoading } = useQuery({
    queryKey: ["transactions", transactionsQuery],
    queryFn: async (): Promise<TransactionsResponse> => {
      const resp = await api.get(`/api/transactions?${transactionsQuery}`);
      return resp.data;
    },
    keepPreviousData: true,
  });


  const handleCopy = (textToCopy) => {
    navigator.clipboard.writeText(textToCopy)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
      })
      .catch((err) => {
        console.error('Failed to copy text: ', err);
      });
  };
  
  const getStatusColor = (status?: string) => {
    switch (status) {
      case "SUCCESS": return "bg-success text-success-foreground";
      case "FAILED": return "bg-destructive text-destructive-foreground";
      case "PENDING": return "bg-pending text-pending-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const exportCSV = useCallback(async () => {
    try {
      setExporting(true);
      const rows = transactions?.data || [];
      if (!rows.length) { alert("No rows to export"); return; }
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
      document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    } catch (err) { console.error(err); alert("Export failed"); } finally { setExporting(false); }
  }, [transactions, page]);

  return (
    <div className=" max-h-screen min-h-full p-6 space-y-6">
      <header className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Transactions</h1>
        {/* <Button variant="outline" size="sm" onClick={logout}>Logout</Button> */}
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" /> Filters & Search
          </CardTitle>
          <CardDescription>Filter by school, status, date or order id</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="col-span-2 relative">
              <Input placeholder="Search by order id..." value={search} onChange={(e) => setSearch(e.target.value)} />
              <SearchIcon className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none h-4 w-4 text-muted-foreground" />
            </div>
            <div className="col-span-2 relative">
              <Input placeholder="Search by school id..." value={search} onChange={(e) => setSearch(e.target.value)} />
              <SearchIcon className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none h-4 w-4 text-muted-foreground" />
            </div>
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {/* <div className="w-64">
                <Select value={schoolFilter} onValueChange={setSchoolFilter}>
                  <SelectTrigger><SelectValue placeholder="Select school" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Schools</SelectItem>
                    {schools?.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div> */}

              <div className="flex items-center gap-2">
                {["SUCCESS", "PENDING", "FAILED"].map((s) => (
                  <label key={s} className="flex items-center gap-1">
                    <Checkbox checked={statusFilter.includes(s)} onCheckedChange={(v) => {
                      setStatusFilter((prev) => v ? [...prev, s] : prev.filter((x) => x !== s));
                    }} />
                    <span className="text-sm">{s}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1">
                <Checkbox checked={exportAll} onCheckedChange={(v) => setExportAll(!!v)} /> Export all
              </label>
              <Button onClick={exportCSV} variant="outline" size="sm" disabled={exporting}>
                {exporting ? "Exporting..." : <><Download className="h-4 w-4 mr-1" />Export CSV</>}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Transactions Table</CardTitle>
          <CardDescription>{transactions?.meta.total ?? 0} transactions found</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 overflow-x-auto">
          <div className="min-w-[1100px] grid grid-cols-10 gap-2 px-4 py-2 bg-muted rounded-lg font-medium text-sm">
            <span className="flex justify-center">Sr. No.</span>
            <span className="flex justify-center cursor-pointer">Amount <ArrowUpDown className="h-3 w-3" /></span>
            <span className="flex justify-center cursor-pointer">Txn Amount <ArrowUpDown className="h-3 w-3" /></span>
            <span className="flex justify-center">Status</span>
            <span className="flex justify-center">Mode</span>
            <span className="flex justify-center cursor-pointer">School <ArrowUpDown className="h-3 w-3" /></span>
            <span className="flex justify-center cursor-pointer">Gateway <ArrowUpDown className="h-3 w-3" /></span>
            <span className="flex justify-center">Order ID</span>
            <span className="flex justify-center">Collect ID</span>
            <span className="flex justify-center cursor-pointer">Date <ArrowUpDown className="h-3 w-3" /></span>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-10"><div className="animate-spin h-8 w-8 border-b-2 border-primary rounded-full"></div></div>
          ) : transactions?.data.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No transactions found</p>
          ) : (
            transactions.data.map((tx, idx) => (
              <div key={tx.collect_request_id} className="min-w-[1100px] grid grid-cols-10 min-h-16 gap-2 px-4 py-2 border rounded-lg hover:bg-muted/50 transition-transform duration-150 hover:-translate-y-0.5">
                <span className="flex justify-center">{(page-1)*limit + idx + 1}</span>
                <span className="flex justify-center font-semibold">₹{tx.order_amount}</span>
                <span className="flex justify-center font-semibold">₹{tx.transaction_amount ?? tx.order_amount}</span>
                <Badge className={`flex justify-center ${getStatusColor(tx.status)}`}>{tx.status}</Badge>
                <span className="flex justify-center capitalize">{tx.payment_mode || "-"}</span>
                <span className="flex justify-center font-mono text-xs">{tx.school_id?.slice(-8) ?? "-"}</span>
                <span className="flex justify-center capitalize">{tx.gateway_name || "-"}</span>
                <span className="flex justify-center font-mono text-xs">{tx.custom_order_id || tx.order_id?.slice(-8) || tx.collect_request_id.slice(-8)}</span>
                <span className="flex justify-center font-mono text-xs">{tx.collect_request_id?.slice(-8)}</span>
                <span className="flex justify-center text-sm text-muted-foreground">{tx.payment_time ? new Date(tx.payment_time).toLocaleString() : "-"}</span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
