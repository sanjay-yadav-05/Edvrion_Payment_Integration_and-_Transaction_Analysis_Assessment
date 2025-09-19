// // src/pages/CheckStatus.tsx
// import React, { useState } from "react";
// import {
//   Card,
//   CardContent,
//   CardHeader,
//   CardTitle,
//   CardDescription,
// } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { Button } from "@/components/ui/button";
// import api from "@/api/axios";
// import type { Transaction } from "@/types/api";
// import { format } from "date-fns";
// import { Badge } from "@/components/ui/badge";

// export default function CheckStatus() {
//   const [orderId, setOrderId] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [order, setOrder] = useState<any | null>(null);
//   const [statusHistory, setStatusHistory] = useState<any[]>([]);
//   const [error, setError] = useState<string | null>(null);

//   const fetchOrder = async () => {
//     if (!orderId) return setError("Enter order id");
//     setError(null);
//     setLoading(true);
//     try {
//       const resp = await api.get(
//         `/api/transactions/${encodeURIComponent(orderId)}`
//       );
//       // controller returns { order, statusHistory }
//       setOrder(resp.data || null);
//       setStatusHistory(resp.data.statusHistory || []);
//     } catch (err: any) {
//       console.error(err);
//       setOrder(null);
//       setStatusHistory([]);
//       setError(err?.response?.data?.error || "Failed to fetch order");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fmt = (d?: string) =>
//     d ? format(new Date(d), "dd MMM yyyy, hh:mm a") : "-";

//   return (
//     <div className="min-h-screen p-6">
//       <header className="mb-6">
//         <h1 className="text-xl font-semibold">Check Transaction Status</h1>
//       </header>

//       <div className="max-w-3xl">
//         <Card>
//           <CardHeader>
//             <CardTitle>Enter Order ID</CardTitle>
//             <CardDescription>
//               Provide the order _id or order id to check transaction details
//             </CardDescription>
//           </CardHeader>
//           <CardContent>
//             <div className="flex gap-2">
//               <Input
//                 placeholder="Enter order id"
//                 value={orderId}
//                 onChange={(e) => setOrderId(e.target.value)}
//               />
//               <Button onClick={fetchOrder} disabled={loading}>
//                 {loading ? "Searching..." : "Search"}
//               </Button>
//             </div>
//             {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
//           </CardContent>
//         </Card>

//         {order && (
//           <Card className="mt-4">
//             <CardHeader>
//               <CardTitle>Transaction Info</CardTitle>
//               <CardDescription>Order and payment details</CardDescription>
//             </CardHeader>
//             <CardContent>
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
//                 <div>
//                   <p className="text-sm text-muted-foreground">
//                     Collect Request ID
//                   </p>
//                   <p className="font-mono">
//                     {order.order.collect_request_id || "-"}
//                   </p>
//                 </div>
//                 <div>
//                   <p className="text-sm text-muted-foreground">Order Amount</p>
//                   <p className="font-semibold">₹{order.order.order_amount}</p>
//                 </div>

//                 <div>
//                   <p className="text-sm text-muted-foreground">Status</p>
//                   <Badge
//                     className={
//                       order.order.status === "SUCCESS"
//                         ? "bg-success text-success-foreground"
//                         : order.status === "PENDING"
//                         ? "bg-pending text-pending-foreground"
//                         : "bg-destructive text-destructive-foreground"
//                     }
//                   >
//                     {order.order.status}
//                   </Badge>
//                 </div>

//                 <div>
//                   <p className="text-sm text-muted-foreground">Gateway</p>
//                   <p className="capitalize">{order.gateway_name || "-"}</p>
//                 </div>

//                 <div>
//                   <p className="text-sm text-muted-foreground">Payment Time</p>
//                   <p>{fmt(order.payment_time)}</p>
//                 </div>

//                 <div>
//                   <p className="text-sm text-muted-foreground">Last Updated</p>
//                   <p>
//                     {fmt(order.order.last_updated || order.order.updatedAt)}
//                   </p>
//                 </div>
//               </div>
//             </CardContent>
//           </Card>
//         )}

//         {order && order.user._id && (
//           <Card className="mt-4">
//             <CardHeader>
//               <CardTitle>User</CardTitle>
//               <CardDescription>User linked to order</CardDescription>
//             </CardHeader>
//             <CardContent>
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
//                 <div>
//                   <p className="text-sm text-muted-foreground">User ID</p>
//                   <p className="font-mono">{order.user._id}</p>
//                 </div>
//                 <div>
//                   <p className="text-sm text-muted-foreground">Name</p>
//                   <p>
//                     {order.student_info?.name ||
//                       order.user?.student_info.name ||
//                       "-"}
//                   </p>
//                 </div>
//                 <div>
//                   <p className="text-sm text-muted-foreground">Email</p>
//                   <p>
//                     {order.student_info?.email ||
//                       order.user?.student_info.email ||
//                       "-"}
//                   </p>
//                 </div>
//                 <div>
//                   <p className="text-sm text-muted-foreground">School</p>
//                   <p className="font-mono">{order.user.school_id}</p>
//                 </div>
//               </div>
//             </CardContent>
//           </Card>
//         )}

//         {/* {statusHistory && statusHistory.length > 0 && (
//           <Card className="mt-4">
//             <CardHeader>
//               <CardTitle>Status History</CardTitle>
//               <CardDescription>Recent status updates</CardDescription>
//             </CardHeader>
//             <CardContent>
//               <div className="space-y-3">
//                 {statusHistory.map((s, i) => (
//                   <div key={i} className="border rounded-md p-3">
//                     <div className="flex items-center justify-between">
//                       <div>
//                         <p className="font-medium">{s.status}</p>
//                         <p className="text-xs text-muted-foreground">
//                           {fmt(s.processed_at)}
//                         </p>
//                       </div>
//                       <div className="text-xs text-muted-foreground">
//                         {s.note || ""}
//                       </div>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </CardContent>
//           </Card>
//         )} */}
//       </div>
//     </div>
//   );
// }



// import React, { useState } from "react";
// import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { Button } from "@/components/ui/button";
// import api from "@/api/axios";
// import { format } from "date-fns";
// import { Badge } from "@/components/ui/badge";

// export default function CheckStatus() {
//   const [orderId, setOrderId] = useState("");
//   const [order, setOrder] = useState<any | null>(null);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   const fetchOrder = async () => {
//     if (!orderId) return setError("Enter order id");
//     setError(null);
//     setLoading(true);
//     try {
//       const resp = await api.get(`/api/transactions/${encodeURIComponent(orderId)}`);
//       setOrder(resp.data || null);
//     } catch (err: any) {
//       console.error(err);
//       setOrder(null);
//       setError(err?.response?.data?.error || "Failed to fetch order");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fmt = (d?: string) => (d ? format(new Date(d), "dd MMM yyyy, hh:mm a") : "-");

//   return (
//     <div className=" max-h-full min-h-full p-6">
//       <header className="mb-6">
//         <h1 className="text-xl font-semibold">Check Transaction Status</h1>
//       </header>

//       <div className="max-w-3xl space-y-4">
//         <Card>
//           <CardHeader>
//             <CardTitle>Enter Order ID</CardTitle>
//             <CardDescription>Provide the order _id or order id to check transaction details</CardDescription>
//           </CardHeader>
//           <CardContent>
//             <div className="flex gap-2">
//               <Input
//                 placeholder="Enter order id"
//                 value={orderId}
//                 onChange={(e) => setOrderId(e.target.value)}
//               />
//               <Button onClick={fetchOrder} disabled={loading}>
//                 {loading ? "Searching..." : "Search"}
//               </Button>
//             </div>
//             {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
//           </CardContent>
//         </Card>

//         {order && (
//           <Card>
//             <CardHeader>
//               <CardTitle>Transaction Info</CardTitle>
//               <CardDescription>Order and payment details</CardDescription>
//             </CardHeader>
//             <CardContent>
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
//                 <div>
//                   <p className="text-sm text-muted-foreground">Collect Request ID</p>
//                   <p className="font-mono">{order.order.collect_request_id || "-"}</p>
//                 </div>
//                 <div>
//                   <p className="text-sm text-muted-foreground">Order Amount</p>
//                   <p className="font-semibold">₹{order.order.order_amount}</p>
//                 </div>
//                 <div>
//                   <p className="text-sm text-muted-foreground">Status</p>
//                   <Badge
//                     className={
//                       order.order.status === "SUCCESS"
//                         ? "bg-success text-success-foreground"
//                         : order.order.status === "PENDING"
//                         ? "bg-pending text-pending-foreground"
//                         : "bg-destructive text-destructive-foreground"
//                     }
//                   >
//                     {order.order.status}
//                   </Badge>
//                 </div>
//                 <div>
//                   <p className="text-sm text-muted-foreground">Gateway</p>
//                   <p className="capitalize">{order.gateway_name || "-"}</p>
//                 </div>
//                 <div>
//                   <p className="text-sm text-muted-foreground">Payment Time</p>
//                   <p>{fmt(order.payment_time)}</p>
//                 </div>
//                 <div>
//                   <p className="text-sm text-muted-foreground">Last Updated</p>
//                   <p>{fmt(order.order.last_updated || order.order.updatedAt)}</p>
//                 </div>
//               </div>
//             </CardContent>
//           </Card>
//         )}
//         {order && order.user._id && (
//           <Card className="mt-4">
//             <CardHeader>
//               <CardTitle>User</CardTitle>
//               <CardDescription>User linked to order</CardDescription>
//             </CardHeader>
//             <CardContent>
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
//                 <div>
//                   <p className="text-sm text-muted-foreground">User ID</p>
//                   <p className="font-mono">{order.user._id}</p>
//                 </div>
//                 <div>
//                   <p className="text-sm text-muted-foreground">Name</p>
//                   <p>
//                     {order.student_info?.name ||
//                       order.user?.student_info.name ||
//                       "-"}
//                   </p>
//                 </div>
//                 <div>
//                   <p className="text-sm text-muted-foreground">Email</p>
//                   <p>
//                     {order.student_info?.email ||
//                       order.user?.student_info.email ||
//                       "-"}
//                   </p>
//                 </div>
//                 <div>
//                   <p className="text-sm text-muted-foreground">School</p>
//                   <p className="font-mono">{order.user.school_id}</p>
//                 </div>
//               </div>
//             </CardContent>
//           </Card>
//         )}
//       </div>
//     </div>
//   );
// }


import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import api from "@/api/axios";
import { format, set } from "date-fns";
import { Badge } from "@/components/ui/badge";

export default function CheckStatus() {
  const [orderId, setOrderId] = useState("");
  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentTime, setPaymentTime] = useState<string | null>(null);
  const [user, setUser] = useState<any | null>(null);

  const fetchOrder = async () => {
    if (!orderId) return setError("Enter order id");
    setError(null);
    setLoading(true);
    try {
      const resp = await api.get(`/api/transactions/${encodeURIComponent(orderId)}`);
      // Handle inconsistent response shapes: sometimes API returns { order: {...} } or {...}
      const payload = resp?.data || null;
      const normalized = payload?.order ? payload.order : payload;
      setPaymentTime(payload.payment_time);
      setUser(payload.user || normalized?.user || null);
      setOrder(normalized || null);
    } catch (err: any) {
      console.error(err);
      setOrder(null);
      setError(err?.response?.data?.error || "Failed to fetch order");
    } finally {
      setLoading(false);
    }
  };

  // Robust formatter: returns "-" if invalid / missing date
  const fmt = (d?: string | number | null) => {
    if (!d) return "-";
    const date = new Date(d);
    if (isNaN(date.getTime())) return "-";
    return format(date, "dd MMM yyyy, hh:mm a");
  };

  // Payment time might be at multiple paths depending on API shape
  const getPaymentTime = (o: any) => {
    if (!o) return undefined;
    return (
      o.payment_time ??
      o.paymentTime ??
      o.order?.payment_time ??
      o.order?.paymentTime ??
      o.transaction_time ??
      undefined
    );
  };

  return (
    <div className=" max-h-full min-h-full p-6">
      <header className="mb-6">
        <h1 className="text-xl font-semibold">Check Transaction Status</h1>
      </header>

      <div className="max-w-3xl space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Enter Order ID</CardTitle>
            <CardDescription>Provide the order _id or order id to check transaction details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="Enter order id"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
              />
              <Button onClick={fetchOrder} disabled={loading}>
                {loading ? "Searching..." : "Search"}
              </Button>
            </div>
            {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
          </CardContent>
        </Card>

        {order && (
          <Card>
            <CardHeader>
              <CardTitle>Transaction Info</CardTitle>
              <CardDescription>Order and payment details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">Collect Request ID</p>
                  <p className="font-mono">{order.collect_request_id ?? order.order?.collect_request_id ?? "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Order Amount</p>
                  <p className="font-semibold">₹{order.order_amount ?? order.order?.order_amount ?? "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge
                    className={
                      (order.status ?? order.order?.status) === "SUCCESS"
                        ? "bg-success text-success-foreground"
                        : (order.status ?? order.order?.status) === "PENDING"
                        ? "bg-pending text-pending-foreground"
                        : "bg-destructive text-destructive-foreground"
                    }
                  >
                    {order.status ?? order.order?.status ?? "-"}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Gateway</p>
                  <p className="capitalize">{order.gateway_name ?? order.order?.gateway_name ?? "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Payment Time</p>
                  <p>{paymentTime}</p>
                  {/* <p>{fmt(getPaymentTime(order))}</p> */}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Last Updated</p>
                  <p>{fmt(order.last_updated ?? order.order?.last_updated ?? order.order?.updatedAt ?? order.updatedAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        {user && (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>User</CardTitle>
              <CardDescription>User linked to order</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">User ID</p>
                  <p className="font-mono">{user?._id ?? order.userId ?? "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p>
                    {user.student_info?.name ||
                      "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p>
                    {user.student_info?.email ||
                      user?.student_info?.email ||
                      "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">School</p>
                  <p className="font-mono">{user?.school_id ?? user.school_id ?? "-"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
