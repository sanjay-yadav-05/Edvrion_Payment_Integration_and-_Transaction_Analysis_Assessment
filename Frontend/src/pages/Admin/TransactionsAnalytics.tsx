// // src/pages/TransactionsAnalytics.tsx
// import React, { useEffect, useMemo, useState } from "react";
// import { useQuery } from "@tanstack/react-query";
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { Button } from "@/components/ui/button";
// import api from "@/api/axios";
// import { Input } from "@/components/ui/input";
// import { Building } from "lucide-react";
// import type { Transaction, TransactionsResponse } from "@/types/api";
// import {
//   ResponsiveContainer,
//   PieChart,
//   Pie,
//   Cell,
//   Tooltip as ReTooltip,
//   Legend,
//   LineChart,
//   Line,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   BarChart,
//   Bar,
// } from "recharts";

// /**
//  * Note: backend caps `limit` to 100 in controller. We iterate pages up to a reasonable cap (maxRecords).
//  * If you expect millions of rows, prefer a server-side analytics endpoint.
//  */

// const COLORS = ["#10B981", "#F97316", "#EF4444", "#60A5FA", "#A78BFA", "#F59E0B"];

// async function fetchUpToLimit(filters: {
//   school_id?: string;
//   from?: string;
//   to?: string;
//   status?: string;
//   search?: string;
// }, maxRecords = 1000) {
//   const pageSize = 100; // controller min(100, requested) safe choice
//   let current = 1;
//   let allRows: Transaction[] = [];
//   let total = Infinity;

//   const baseParams = new URLSearchParams({ limit: String(pageSize), sort: "payment_time", order: "desc" });
//   if (filters.school_id) baseParams.append("school_id", filters.school_id);
//   if (filters.status) baseParams.append("status", filters.status);
//   if (filters.search) baseParams.append("search", filters.search);
//   if (filters.from) baseParams.append("from", filters.from);
//   if (filters.to) baseParams.append("to", filters.to);

//   while (allRows.length < Math.min(total, maxRecords)) {
//     const params = new URLSearchParams(baseParams.toString());
//     params.set("page", String(current));
//     const resp = await api.get(`/api/transactions?${params.toString()}`);
//     const body: TransactionsResponse = resp.data;
//     const fetched = body.data || [];
//     if (total === Infinity) total = body.meta?.total ?? Infinity;
//     allRows = allRows.concat(fetched);
//     if (!fetched.length) break;
//     current += 1;
//     if (current > Math.ceil((total || 0) / pageSize) + 2) break;
//     if (allRows.length >= maxRecords) break;
//   }
//   return allRows.slice(0, maxRecords);
// }

// export default function TransactionsAnalytics() {
//   const [school, setSchool] = useState<string>("");
//   const [from, setFrom] = useState<string>("");
//   const [to, setTo] = useState<string>("");

//   useEffect(() => { document.title = "Transactions Analytics - Admin"; }, []);

//   const { data: schools } = useQuery({
//     queryKey: ["unique-schools-analytics"],
//     queryFn: async (): Promise<string[]> => {
//       const resp = await api.get(`/api/transactions?limit=100`);
//       const txs: Transaction[] = resp.data?.data || [];
//       return [...new Set(txs.map((t) => t.school_id).filter(Boolean))];
//     },
//     staleTime: 1000 * 60 * 10,
//   });

//   const { data: rows, isLoading, refetch } = useQuery({
//     queryKey: ["analytics", school, from, to],
//     queryFn: async () => {
//       const fetched = await fetchUpToLimit({ school_id: school || undefined, from: from || undefined, to: to || undefined }, 1000);
//       return fetched;
//     },
//     keepPreviousData: true,
//   });

//   const totalTx = rows?.length ?? 0;
//   const totalAmount = rows?.reduce((s, r) => s + (r.order_amount || 0), 0) ?? 0;
//   const successCount = rows?.filter((r) => r.status === "SUCCESS").length ?? 0;
//   const pendingCount = rows?.filter((r) => r.status === "PENDING").length ?? 0;

//   // pie by status
//   const statusPie = useMemo(() => {
//     if (!rows) return [];
//     const map: Record<string, number> = {};
//     rows.forEach((r) => map[r.status || "UNKNOWN"] = (map[r.status || "UNKNOWN"] || 0) + 1);
//     return Object.keys(map).map((k) => ({ name: k, value: map[k] }));
//   }, [rows]);

//   // gateway breakdown
//   const gatewayBars = useMemo(() => {
//     if (!rows) return [];
//     const map: Record<string, { count: number; amount: number }> = {};
//     rows.forEach((r) => {
//       const g = r.gateway_name || "unknown";
//       map[g] = map[g] || { count: 0, amount: 0 };
//       map[g].count += 1; map[g].amount += (r.order_amount || 0);
//     });
//     return Object.keys(map).map((k) => ({ gateway: k, count: map[k].count, amount: map[k].amount }));
//   }, [rows]);

//   // timeseries (group by day)
//   const series = useMemo(() => {
//     if (!rows) return [];
//     const map: Record<string, { count: number; amount: number }> = {};
//     rows.forEach((r) => {
//       const d = r.payment_time ? new Date(r.payment_time).toISOString().slice(0, 10) : "unknown";
//       map[d] = map[d] || { count: 0, amount: 0 };
//       map[d].count += 1; map[d].amount += (r.order_amount || 0);
//     });
//     const entries = Object.keys(map).sort().map((k) => ({ date: k, count: map[k].count, amount: map[k].amount }));
//     return entries;
//   }, [rows]);

//   return (
//     <div className="min-h-screen p-6">
//       <header className="mb-6">
//         <h1 className="text-xl font-semibold">Transactions Analytics</h1>
//       </header>

//       <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-4">
//         <div className="lg:col-span-1">
//           <Card>
//             <CardHeader><CardTitle>Filters</CardTitle><CardDescription>Filter analytics by school & range</CardDescription></CardHeader>
//             <CardContent>
//               <div className="space-y-3">
//                 <div className="w-full">
//                   <Select value={school} onValueChange={(v) => setSchool(v)}>
//                     <SelectTrigger><SelectValue placeholder="All schools" /></SelectTrigger>
//                     <SelectContent>
//                       <SelectItem value="all">All Schools</SelectItem>
//                       {schools?.map((s: string) => <SelectItem key={s} value={s}><span className="font-mono text-sm">{s}</span></SelectItem>)}
//                     </SelectContent>
//                   </Select>
//                 </div>

//                 <div className="grid grid-cols-2 gap-2">
//                   <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
//                   <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
//                 </div>

//                 <div className="flex space-x-2">
//                   <Button onClick={() => refetch()}>Refresh</Button>
//                   <Button variant="outline" onClick={() => { setSchool(""); setFrom(""); setTo(""); refetch(); }}>Reset</Button>
//                 </div>
//               </div>
//             </CardContent>
//           </Card>
//         </div>

//         <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
//           <Card>
//             <CardHeader><CardTitle>Total Transactions</CardTitle></CardHeader>
//             <CardContent><div className="text-2xl font-bold">{totalTx}</div><div className="text-sm text-muted-foreground">Total records sampled</div></CardContent>
//           </Card>

//           <Card>
//             <CardHeader><CardTitle>Total Amount</CardTitle></CardHeader>
//             <CardContent><div className="text-2xl font-bold">₹{totalAmount.toLocaleString()}</div><div className="text-sm text-muted-foreground">Sum of order_amount</div></CardContent>
//           </Card>

//           <Card>
//             <CardHeader><CardTitle>Success Rate</CardTitle></CardHeader>
//             <CardContent>
//               <div className="text-2xl font-bold">{totalTx ? Math.round((successCount / totalTx) * 100) : 0}%</div>
//               <div className="text-sm text-muted-foreground">Successful payments</div>
//             </CardContent>
//           </Card>
//         </div>
//       </div>

//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
//         <Card className="col-span-1">
//           <CardHeader><CardTitle>Status Distribution</CardTitle></CardHeader>
//           <CardContent style={{ height: 280 }}>
//             <ResponsiveContainer width="100%" height="100%">
//               <PieChart>
//                 <Pie data={statusPie} dataKey="value" nameKey="name" outerRadius={80} label>
//                   {statusPie.map((entry, idx) => <Cell key={entry.name} fill={COLORS[idx % COLORS.length]} />)}
//                 </Pie>
//                 <ReTooltip />
//                 <Legend />
//               </PieChart>
//             </ResponsiveContainer>
//           </CardContent>
//         </Card>

//         <Card className="col-span-2">
//           <CardHeader><CardTitle>Daily Volume (by date)</CardTitle></CardHeader>
//           <CardContent style={{ height: 300 }}>
//             <ResponsiveContainer width="100%" height="100%">
//               <LineChart data={series}>
//                 <CartesianGrid strokeDasharray="3 3" />
//                 <XAxis dataKey="date" />
//                 <YAxis />
//                 <ReTooltip />
//                 <Legend />
//                 <Line type="monotone" dataKey="count" name="Tx Count" stroke="#8884d8" />
//                 <Line type="monotone" dataKey="amount" name="Amount" stroke="#82ca9d" />
//               </LineChart>
//             </ResponsiveContainer>
//           </CardContent>
//         </Card>
//       </div>

//       <div className="mt-4">
//         <Card>
//           <CardHeader><CardTitle>Gateway Breakdown</CardTitle></CardHeader>
//           <CardContent style={{ height: 250 }}>
//             <ResponsiveContainer width="100%" height="100%">
//               <BarChart data={gatewayBars}>
//                 <CartesianGrid strokeDasharray="3 3" />
//                 <XAxis dataKey="gateway" />
//                 <YAxis />
//                 <ReTooltip />
//                 <Legend />
//                 <Bar dataKey="count" name="Count" fill="#60A5FA" />
//                 <Bar dataKey="amount" name="Amount" fill="#A78BFA" />
//               </BarChart>
//             </ResponsiveContainer>
//           </CardContent>
//         </Card>
//       </div>
//     </div>
//   );
// }



// import React, { useEffect, useMemo, useState } from "react";
// import { useQuery } from "@tanstack/react-query";
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import api from "@/api/axios";
// import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip as ReTooltip, Legend, LineChart, Line, XAxis, YAxis, CartesianGrid, BarChart, Bar } from "recharts";

// const COLORS = ["#10B981", "#F97316", "#EF4444", "#60A5FA", "#A78BFA", "#F59E0B"];

// async function fetchUpToLimit(filters: any, maxRecords = 1000) {
//   const pageSize = 100;
//   let current = 1;
//   let allRows: any[] = [];
//   let total = Infinity;
//   const baseParams = new URLSearchParams({ limit: String(pageSize), sort: "payment_time", order: "desc" });
//   if (filters.school_id) baseParams.append("school_id", filters.school_id);
//   if (filters.status) baseParams.append("status", filters.status);
//   if (filters.search) baseParams.append("search", filters.search);
//   if (filters.from) baseParams.append("from", filters.from);
//   if (filters.to) baseParams.append("to", filters.to);

//   while (allRows.length < Math.min(total, maxRecords)) {
//     const params = new URLSearchParams(baseParams.toString());
//     params.set("page", String(current));
//     const resp = await api.get(`/api/transactions?${params.toString()}`);
//     const body = resp.data;
//     const fetched = body.data || [];
//     if (total === Infinity) total = body.meta?.total ?? Infinity;
//     allRows = allRows.concat(fetched);
//     if (!fetched.length) break;
//     current += 1;
//     if (current > Math.ceil((total || 0) / pageSize) + 2) break;
//     if (allRows.length >= maxRecords) break;
//   }
//   return allRows.slice(0, maxRecords);
// }

// export default function TransactionsAnalytics() {
//   const [school, setSchool] = useState<string>("");
//   const [from, setFrom] = useState<string>("");
//   const [to, setTo] = useState<string>("");

//   useEffect(() => { document.title = "Transactions Analytics - Admin"; }, []);

//   const { data: schools } = useQuery({
//     queryKey: ["unique-schools-analytics"],
//     queryFn: async (): Promise<string[]> => {
//       const resp = await api.get(`/api/transactions?limit=100`);
//       const txs = resp.data?.data || [];
//       return [...new Set(txs.map((t) => t.school_id).filter(Boolean))];
//     },
//     staleTime: 1000 * 60 * 10,
//   });

//   const { data: rows, isLoading, refetch } = useQuery({
//     queryKey: ["analytics", school, from, to],
//     queryFn: async () => await fetchUpToLimit({ school_id: school || undefined, from: from || undefined, to: to || undefined }, 1000),
//     keepPreviousData: true,
//   });

//   const totalTx = rows?.length ?? 0;
//   const totalAmount = rows?.reduce((s, r) => s + (r.order_amount || 0), 0) ?? 0;
//   const successCount = rows?.filter((r) => r.status === "SUCCESS").length ?? 0;

//   const statusPie = useMemo(() => {
//     if (!rows) return [];
//     const map: Record<string, number> = {};
//     rows.forEach((r) => map[r.status || "UNKNOWN"] = (map[r.status || "UNKNOWN"] || 0) + 1);
//     return Object.keys(map).map((k) => ({ name: k, value: map[k] }));
//   }, [rows]);

//   const gatewayBars = useMemo(() => {
//     if (!rows) return [];
//     const map: Record<string, { count: number; amount: number }> = {};
//     rows.forEach((r) => {
//       const g = r.gateway_name || "unknown";
//       map[g] = map[g] || { count: 0, amount: 0 };
//       map[g].count += 1; map[g].amount += (r.order_amount || 0);
//     });
//     return Object.keys(map).map((k) => ({ gateway: k, count: map[k].count, amount: map[k].amount }));
//   }, [rows]);

//   const series = useMemo(() => {
//     if (!rows) return [];
//     const map: Record<string, { count: number; amount: number }> = {};
//     rows.forEach((r) => {
//       const d = r.payment_time ? new Date(r.payment_time).toISOString().slice(0, 10) : "unknown";
//       map[d] = map[d] || { count: 0, amount: 0 };
//       map[d].count += 1; map[d].amount += (r.order_amount || 0);
//     });
//     return Object.keys(map).sort().map((k) => ({ date: k, count: map[k].count, amount: map[k].amount }));
//   }, [rows]);

//   return (
//     <div className="max-h-full min-h-full p-6 space-y-6">
//       <header><h1 className="text-xl font-semibold">Transactions Analytics</h1></header>

//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
//         <Card>
//           <CardHeader>
//             <CardTitle>Filters</CardTitle>
//             <CardDescription>Filter analytics by school & range</CardDescription>
//           </CardHeader>
//           <CardContent className="space-y-3">
//             <Select value={school} onValueChange={setSchool}>
//               <SelectTrigger><SelectValue placeholder="All schools" /></SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="all">All Schools</SelectItem>
//                 {schools?.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
//               </SelectContent>
//             </Select>
//             <div className="grid grid-cols-2 gap-2">
//               <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
//               <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
//             </div>
//             <div className="flex space-x-2">
//               <Button onClick={() => refetch()}>Refresh</Button>
//               <Button variant="outline" onClick={() => { setSchool(""); setFrom(""); setTo(""); refetch(); }}>Reset</Button>
//             </div>
//           </CardContent>
//         </Card>

//         <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
//           <Card>
//             <CardHeader><CardTitle>Total Transactions</CardTitle></CardHeader>
//             <CardContent>{totalTx}</CardContent>
//           </Card>
//           <Card>
//             <CardHeader><CardTitle>Total Amount</CardTitle></CardHeader>
//             <CardContent>₹{totalAmount.toLocaleString()}</CardContent>
//           </Card>
//           <Card>
//             <CardHeader><CardTitle>Success Rate</CardTitle></CardHeader>
//             <CardContent>{totalTx ? Math.round((successCount / totalTx) * 100) : 0}%</CardContent>
//           </Card>
//         </div>
//       </div>

//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
//         <Card>
//           <CardHeader><CardTitle>Status Distribution</CardTitle></CardHeader>
//           <CardContent style={{ height: 280 }}>
//             <ResponsiveContainer width="100%" height="100%">
//               <PieChart>
//                 <Pie data={statusPie} dataKey="value" nameKey="name" outerRadius={80} label>
//                   {statusPie.map((entry, idx) => <Cell key={entry.name} fill={COLORS[idx % COLORS.length]} />)}
//                 </Pie>
//                 <ReTooltip />
//                 <Legend />
//               </PieChart>
//             </ResponsiveContainer>
//           </CardContent>
//         </Card>
//         <Card className="col-span-2">
//           <CardHeader><CardTitle>Daily Volume</CardTitle></CardHeader>
//           <CardContent style={{ height: 300 }}>
//             <ResponsiveContainer width="100%" height="100%">
//               <LineChart data={series}>
//                 <CartesianGrid strokeDasharray="3 3" />
//                 <XAxis dataKey="date" />
//                 <YAxis />
//                 <ReTooltip />
//                 <Legend />
//                 <Line type="monotone" dataKey="count" name="Tx Count" stroke="#8884d8" />
//                 <Line type="monotone" dataKey="amount" name="Amount" stroke="#82ca9d" />
//               </LineChart>
//             </ResponsiveContainer>
//           </CardContent>
//         </Card>
//       </div>

//       <Card>
//         <CardHeader><CardTitle>Gateway Breakdown</CardTitle></CardHeader>
//         <CardContent style={{ height: 250 }}>
//           <ResponsiveContainer width="100%" height="100%">
//             <BarChart data={gatewayBars}>
//               <CartesianGrid strokeDasharray="3 3" />
//               <XAxis dataKey="gateway" />
//               <YAxis />
//               <ReTooltip />
//               <Legend />
//               <Bar dataKey="count" name="Count" fill="#60A5FA" />
//               <Bar dataKey="amount" name="Amount" fill="#A78BFA" />
//             </BarChart>
//           </ResponsiveContainer>
//         </CardContent>
//       </Card>
//     </div>
//   );
// }


// src/pages/TransactionsAnalytics.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import api from "@/api/axios";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as ReTooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

const COLORS = ["#10B981", "#F97316", "#EF4444", "#60A5FA", "#A78BFA", "#F59E0B"];

/** Fetch up to maxRecords using existing /api/transactions endpoint (respects controller limit) */
async function fetchUpToLimit(filters: any, maxRecords = 1000) {
  const pageSize = 100;
  let current = 1;
  let allRows: any[] = [];
  let total = Infinity;
  const baseParams = new URLSearchParams({
    limit: String(pageSize),
    sort: "payment_time",
    order: "desc",
  });
  if (filters.school_id) baseParams.append("school_id", filters.school_id);
  if (filters.status) baseParams.append("status", filters.status);
  if (filters.search) baseParams.append("search", filters.search);
  if (filters.from) baseParams.append("from", filters.from);
  if (filters.to) baseParams.append("to", filters.to);

  while (allRows.length < Math.min(total, maxRecords)) {
    const params = new URLSearchParams(baseParams.toString());
    params.set("page", String(current));
    const resp = await api.get(`/api/transactions?${params.toString()}`);
    const body = resp.data;
    const fetched = body.data || [];
    if (total === Infinity) total = body.meta?.total ?? Infinity;
    allRows = allRows.concat(fetched);
    if (!fetched.length) break;
    current += 1;
    if (current > Math.ceil((total || 0) / pageSize) + 2) break;
    if (allRows.length >= maxRecords) break;
  }
  return allRows.slice(0, maxRecords);
}

/** helper: get monday start of week for a date */
function startOfWeekMonday(d: Date) {
  const date = new Date(d);
  const day = date.getDay(); // 0 Sun .. 6 Sat
  // compute distance to Monday: if Sun(0) => -6, Mon(1) => 0, Tue(2)=> -1 ...
  const diff = (day + 6) % 7; // 0 -> 0 (Mon), 6 -> 6 (Sun)
  date.setDate(date.getDate() - diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

/** helper: format week label "01 Sep - 07 Sep" */
function formatWeekLabel(start: Date) {
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
  return `${start.toLocaleDateString("en-IN", opts)} - ${end.toLocaleDateString("en-IN", opts)}`;
}

export default function TransactionsAnalytics() {
  const [school, setSchool] = useState<string>("");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");

  useEffect(() => {
    document.title = "Transactions Analytics - Admin";
  }, []);

  // small sample of schools (for filter)
  const { data: schools } = useQuery({
    queryKey: ["unique-schools-analytics"],
    queryFn: async (): Promise<string[]> => {
      const resp = await api.get(`/api/transactions?limit=150`);
      const txs = resp.data?.data || [];
      return [...new Set(txs.map((t: any) => t.school_id).filter(Boolean))];
    },
    staleTime: 1000 * 60 * 10,
  });

  const { data: rows, isLoading, refetch } = useQuery({
    queryKey: ["analytics", school, from, to],
    queryFn: async () =>
      await fetchUpToLimit(
        { school_id: school || undefined, from: from || undefined, to: to || undefined },
        1000
      ),
    keepPreviousData: true,
  });

  const totalTx = rows?.length ?? 0;
  const totalAmount = (rows ?? []).reduce((s: number, r: any) => s + (r.order_amount || 0), 0);
  const successCount = (rows ?? []).filter((r: any) => r.status === "SUCCESS").length;

  // status pie
  const statusPie = useMemo(() => {
    if (!rows) return [];
    const map: Record<string, number> = {};
    rows.forEach((r: any) => (map[r.status || "UNKNOWN"] = (map[r.status || "UNKNOWN"] || 0) + 1));
    return Object.keys(map).map((k) => ({ name: k, value: map[k] }));
  }, [rows]);

  // gateway breakdown
  const gatewayBars = useMemo(() => {
    if (!rows) return [];
    const map: Record<string, { count: number; amount: number }> = {};
    rows.forEach((r: any) => {
      const g = r.gateway_name || "unknown";
      map[g] = map[g] || { count: 0, amount: 0 };
      map[g].count += 1;
      map[g].amount += (r.order_amount || 0);
    });
    return Object.keys(map).map((k) => ({ gateway: k, count: map[k].count, amount: map[k].amount }));
  }, [rows]);

  /**
   * NEW: weekly histogram for last 4 weeks (including current week)
   * We create 4 week buckets: oldest -> newest (left -> right)
   */
  const weeklySeries = useMemo(() => {
    // create 4 week start dates
    const now = new Date();
    const currentWeekStart = startOfWeekMonday(now); // Monday of current week
    const weeks: { start: Date; end: Date; label: string }[] = [];

    // oldest first: 3 weeks ago .. current week
    for (let i = 3; i >= 0; i--) {
      const start = new Date(currentWeekStart);
      start.setDate(currentWeekStart.getDate() - i * 7);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      weeks.push({ start, end, label: formatWeekLabel(start) });
    }

    // init buckets
    const buckets = weeks.map((w) => ({ week: w.label, amount: 0, count: 0 }));

    if (!rows || rows.length === 0) return buckets;

    // assign rows to buckets
    rows.forEach((r: any) => {
      if (!r.payment_time) return;
      const t = new Date(r.payment_time);
      for (let idx = 0; idx < weeks.length; idx++) {
        const { start, end } = weeks[idx];
        if (t >= start && t <= end) {
          buckets[idx].amount += Number(r.order_amount || 0);
          buckets[idx].count += 1;
          break;
        }
      }
    });

    return buckets;
  }, [rows]);

  return (
    <div className="w-full max-w-full overflow-hidden">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold">Transactions Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Overview and trends. Histogram shows the last 4 weeks total amounts (week buckets).
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Filters */}
        <div className="lg:col-span-1">
          
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm">Filters</CardTitle>
              <CardDescription className="text-xs">Filter analytics by school & date range</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">School</label>
                <Select value={school} onValueChange={(v) => setSchool(v)} >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All schools" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Schools</SelectItem>
                    {schools?.map((s: string) => (
                      <SelectItem key={s} value={s}>
                        <span className="font-mono text-sm truncate max-w-full">{s}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">From / To</label>
                <div className="grid grid-cols-2 gap-2">
                  <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
                  <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={() => refetch()} className="flex-1">Apply</Button>
                <Button variant="outline" onClick={() => { setSchool(""); setFrom(""); setTo(""); refetch(); }}>Reset</Button>
              </div>

              <div className="pt-2 text-xs text-muted-foreground">
                Sampled rows: <strong>{Math.min(totalTx, 1000)}</strong> (backend sampling limit).
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main area */}
        <div className="lg:col-span-3 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm">Total Transactions</CardTitle>
                {/* <CardDescription className="text-xs"></CardDescription> */}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalTx}</div>
                <div className="text-sm text-muted-foreground mt-1">Records</div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm">Total Amount</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{Number(totalAmount).toLocaleString()}</div>
                <div className="text-sm text-muted-foreground mt-1">Sum of order_amount</div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm">Success Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalTx ? Math.round((successCount / totalTx) * 100) : 0}%</div>
                <div className="text-sm text-muted-foreground mt-1">{successCount} successful</div>
              </CardContent>
            </Card>
          </div>

          {/* Charts: status pie + weekly histogram */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm">Status Distribution</CardTitle>
              </CardHeader>
              <CardContent className="h-64 p-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusPie} dataKey="value" nameKey="name" outerRadius={70} label>
                      {statusPie.map((entry, idx) => (
                        <Cell key={entry.name} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                    <ReTooltip />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Weekly histogram (last 4 weeks) */}
            <Card className="col-span-2 shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm">Last 4 Weeks — Amount Histogram</CardTitle>
                <CardDescription className="text-xs">Each bar is the total order_amount in that week</CardDescription>
              </CardHeader>
              <CardContent className="h-64 p-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklySeries} margin={{ left: 8, right: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <ReTooltip formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, "Amount"]} />
                    <Legend verticalAlign="top" />
                    <Bar dataKey="amount" name="Amount (₹)" fill="#2563EB" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Gateway breakdown */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm">Gateway Breakdown</CardTitle>
              <CardDescription className="text-xs">Count & amount per gateway</CardDescription>
            </CardHeader>
            <CardContent className="h-56 p-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={gatewayBars} margin={{ left: 0, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="gateway" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <ReTooltip />
                  <Legend verticalAlign="top" />
                  <Bar dataKey="count" name="Count" fill="#60A5FA" />
                  <Bar dataKey="amount" name="Amount" fill="#A78BFA" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
