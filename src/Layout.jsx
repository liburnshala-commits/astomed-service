import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import {
  LayoutDashboard,
  Wrench,
  Users,
  Monitor,
  FileText,
  Menu,
  X,
  LogOut,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", page: "Dashboard", icon: LayoutDashboard, roles: ["admin", "technician"] },
  { label: "Serviceärenden", page: "ServiceRecords", icon: Wrench, roles: ["admin", "technician"] },
  { label: "Maskiner", page: "Machines", icon: Monitor, roles: ["admin", "technician"] },
  { label: "Kunder", page: "Customers", icon: Users, roles: ["admin", "technician"] },
  { label: "Rapporter", page: "Reports", icon: FileText, roles: ["admin", "technician"] },
];

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  // Customer portal pages don't need layout
  if (currentPageName === "CustomerPortal") {
    return <>{children}</>;
  }

  const userRole = user?.role || "technician";
  const visibleNav = navItems.filter(item => item.roles.includes(userRole));

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white flex flex-col transition-transform duration-300",
        sidebarOpen ? "translate-x-0" : "-translate-x-full",
        "lg:translate-x-0 lg:static lg:flex"
      )}>
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-500 rounded-lg flex items-center justify-center">
              <Wrench className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-bold text-white text-sm">ServiceLog Pro</div>
              <div className="text-xs text-slate-400">Servicehantering</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {visibleNav.map(item => {
            const Icon = item.icon;
            const active = currentPageName === item.page;
            return (
              <Link
                key={item.page}
                to={createPageUrl(item.page)}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all",
                  active
                    ? "bg-blue-600 text-white"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {item.label}
                {active && <ChevronRight className="w-3 h-3 ml-auto" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-700">
          {user && (
            <div className="mb-3 px-3">
              <div className="text-xs text-slate-400">Inloggad som</div>
              <div className="text-sm text-white font-medium truncate">{user.full_name || user.email}</div>
              <div className="text-xs text-blue-400 capitalize">{user.role || "technician"}</div>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800"
            onClick={() => base44.auth.logout()}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logga ut
          </Button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b px-4 py-3 flex items-center gap-3 lg:hidden">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5" />
          </Button>
          <span className="font-semibold text-slate-800">ServiceLog Pro</span>
        </header>
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}