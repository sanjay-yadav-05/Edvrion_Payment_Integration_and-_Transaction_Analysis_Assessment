// // src/pages/admin/AdminLayout.tsx
// import React from "react";
// import { NavLink, Outlet, useNavigate } from "react-router-dom";
// import {
//   Home,
//   BarChart2,
//   List,
//   Search as SearchIcon,
//   LogOut,
// } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import { useAuth } from "@/auth/useAuth";
// import { useAuthContext } from "@/auth/AuthProvider";
// /**
//  * AdminLayout: left nav + header + content (Outlet)
//  *
//  * Left: navigation links (Analytics, Transactions, Check Status)
//  * Right: page content (Outlet)
//  *
//  * Default route will render Analytics page (configured in AdminRoutes).
//  */

// function NavItem({
//   to,
//   icon: Icon,
//   label,
// }: {
//   to: string;
//   icon: any;
//   label: string;
// }) {
//   return (
//     <NavLink
//       to={to}
//       end
//       className={({ isActive }) =>
//         `flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors
//          ${
//            isActive
//              ? "bg-muted/60 text-foreground"
//              : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
//          }`
//       }
//     >
//       <Icon className="h-4 w-4" />
//       <span>{label}</span>
//     </NavLink>
//   );
// }

// export default function AdminLayout() {
//   const { logout } = useAuth();
//   const navigate = useNavigate();
//   const {user} = useAuthContext();

//   return (
//     <div className="min-h-screen flex bg-background text-foreground">
//       {/* Left sidebar */}
//       <aside className="w-72 border-r bg-card px-4 py-6 hidden md:flex flex-col gap-6">
//         <div>
//           <div className="flex items-center justify-between mb-6">
//             <div>
//               <h2 className="text-lg font-semibold">Admin Dashboard</h2>
//               <Badge variant="outline">Administrator</Badge>
//             </div>
//           </div>

//           <nav className="mt-4 flex flex-col space-y-2">
//             <NavItem to="/admin/analytics" icon={BarChart2} label="Analytics" />
//             <NavItem
//               to="/admin/transactions"
//               icon={List}
//               label="Transactions"
//             />
//             <NavItem
//               to="/admin/transactions/check-status"
//               icon={SearchIcon}
//               label="Check Status"
//             />
//           </nav>
//         </div>

//         <div className="mt-auto">
//           <div className="mb-3">
//             <p className="text-xs text-muted-foreground">Signed in as</p>
//             <p className="text-sm font-medium">
//               {user?.name ?? user?.email ?? "Admin"}
//             </p>
//           </div>

//           <div className="flex space-x-2">
//             <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
//               <Home className="h-4 w-4 mr-2" />
//               Home
//             </Button>
//             <Button variant="outline" size="sm" onClick={logout}>
//               <LogOut className="h-4 w-4 mr-2" />
//               Logout
//             </Button>
//           </div>
//         </div>
//       </aside>

//       {/* Mobile top nav */}
//       <div className="md:hidden w-full border-b bg-card">
//         <div className="flex items-center justify-between px-4 py-3">
//           <div className="flex items-center space-x-3">
//             <h3 className="text-lg font-semibold">Admin</h3>
//             <Badge variant="outline">Admin</Badge>
//           </div>
//           <div className="flex items-center space-x-2">
//             <Button
//               variant="ghost"
//               size="sm"
//               onClick={() => navigate("/admin/analytics")}
//             >
//               Analytics
//             </Button>
//             <Button
//               variant="ghost"
//               size="sm"
//               onClick={() => navigate("/admin/transactions")}
//             >
//               Transactions
//             </Button>
//             <Button
//               variant="ghost"
//               size="sm"
//               onClick={() => navigate("/admin/transactions/check-status")}
//             >
//               Check
//             </Button>
//           </div>
//         </div>
//       </div>

//       {/* Content area */}
//       <main className="flex-1 p-6">
//         <Outlet />
//       </main>
//     </div>
//   );
// }



import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Home, BarChart2, List, Search as SearchIcon, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/auth/useAuth";
import { useAuthContext } from "@/auth/AuthProvider";

function NavItem({ to, icon: Icon, label }: { to: string; icon: any; label: string }) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        `flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors
         ${isActive ? "bg-muted/60 text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/40"}`
      }
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </NavLink>
  );
}

export default function AdminLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { user } = useAuthContext();

  return (
    <div className=" max-h-screen min-h-screen flex bg-background text-foreground">
      {/* Left sidebar */}
      <aside className="max-h-full  w-72 border-r bg-card px-4 py-6 hidden md:flex flex-col gap-6">
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold">Admin Dashboard</h2>
              <Badge variant="outline">Administrator</Badge>
            </div>
          </div>
          <nav className="mt-4 flex flex-col space-y-2">
            <NavItem to="/admin/analytics" icon={BarChart2} label="Analytics" />
            <NavItem to="/admin/transactions" icon={List} label="Transactions" />
            <NavItem to="/admin/transactions/check-status" icon={SearchIcon} label="Check Status" />
          </nav>
        </div>

        <div className="mt-auto">
          <div className="mb-3">
            <p className="text-xs text-muted-foreground">Signed in as</p>
            <p className="text-sm font-medium">{user?.name ?? user?.email ?? "Admin"}</p>
          </div>
          <div className="flex space-x-2">
            {/* <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
              <Home className="h-4 w-4 mr-2" />
              Home
            </Button> */}
            <Button variant="outline" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile top nav */}
      <div className="md:hidden w-full border-b bg-card">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-3">
            <h3 className="text-lg font-semibold">Admin</h3>
            <Badge variant="outline">Admin</Badge>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" onClick={() => navigate("/admin/analytics")}>
              Analytics
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate("/admin/transactions")}>
              Transactions
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate("/admin/transactions/check-status")}>
              Check
            </Button>
          </div>
        </div>
      </div>

      {/* Content area */}
      <main className="max-h-full flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}

