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



import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import api from "@/api/axios";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export default function CheckStatus() {
  const [orderId, setOrderId] = useState("");
  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrder = async () => {
    if (!orderId) return setError("Enter order id");
    setError(null);
    setLoading(true);
    try {
      const resp = await api.get(`/api/transactions/${encodeURIComponent(orderId)}`);
      setOrder(resp.data || null);
    } catch (err: any) {
      console.error(err);
      setOrder(null);
      setError(err?.response?.data?.error || "Failed to fetch order");
    } finally {
      setLoading(false);
    }
  };

  const fmt = (d?: string) => (d ? format(new Date(d), "dd MMM yyyy, hh:mm a") : "-");

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
                  <p className="font-mono">{order.order.collect_request_id || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Order Amount</p>
                  <p className="font-semibold">₹{order.order.order_amount}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge
                    className={
                      order.order.status === "SUCCESS"
                        ? "bg-success text-success-foreground"
                        : order.order.status === "PENDING"
                        ? "bg-pending text-pending-foreground"
                        : "bg-destructive text-destructive-foreground"
                    }
                  >
                    {order.order.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Gateway</p>
                  <p className="capitalize">{order.gateway_name || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Payment Time</p>
                  <p>{fmt(order.payment_time)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Last Updated</p>
                  <p>{fmt(order.order.last_updated || order.order.updatedAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        {order && order.user._id && (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>User</CardTitle>
              <CardDescription>User linked to order</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">User ID</p>
                  <p className="font-mono">{order.user._id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p>
                    {order.student_info?.name ||
                      order.user?.student_info.name ||
                      "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p>
                    {order.student_info?.email ||
                      order.user?.student_info.email ||
                      "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">School</p>
                  <p className="font-mono">{order.user.school_id}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
