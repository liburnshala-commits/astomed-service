import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Wrench,
  Users,
  Monitor,
  FileText,
  Menu,
  LogOut,
  ChevronRight,
  Shield,
  Clock,
  CheckCircle,
  Trash2,
  Info,
  Home,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  Users as UsersIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import NotificationBell from "@/components/notifications/NotificationBell";

const navSections = [
  {
    title: null,
    items: [
      { label: "Dashboard", page: "Dashboard", icon: LayoutDashboard, roles: ["admin", "technician"] },
    ]
  },
  {
    title: "Hantering",
    items: [
      { label: "Serviceärenden", page: "ServiceRecords", icon: Wrench, roles: ["admin", "technician"] },
      { label: "Maskiner", page: "Machines", icon: Monitor, roles: ["admin", "technician"] },
      { label: "Kunder", page: "Customers", icon: Users, roles: ["admin", "technician"] },
      { label: "Rapporter", page: "Reports", icon: FileText, roles: ["admin", "technician"] },
    ]
  },
  {
    title: "Snabbfilter",
    items: [
      { label: "Pågående ärenden", page: "ServiceRecords?status=in_progress", icon: Clock, roles: ["admin", "technician"] },
      { label: "Slutförda ärenden", page: "ServiceRecords?status=completed", icon: CheckCircle, roles: ["admin", "technician"] },
    ]
  },
  {
    title: "GDPR & Dataskydd",
    items: [
      { label: "Användare", page: "Users", icon: Users, roles: ["admin"] },
      { label: "Audit Log", page: "AuditLog", icon: Shield, roles: ["admin"] },
      { label: "Radera kunddata", page: "Customers", icon: Trash2, roles: ["admin"], highlight: "red" },
      { label: "Dataskyddsinformation", page: "AuditLog", icon: Info, roles: ["admin"] },
    ]
  },
];

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [userLoaded, setUserLoaded] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showUserInfo, setShowUserInfo] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {}).finally(() => setUserLoaded(true));
  }, []);

  if (currentPageName === "CustomerPortal") {
    return <>{children}</>;
  }

  const userRole = user?.role || "technician";

  return (
    <div className="min-h-screen flex" style={{ background: "#f4f6f4" }}>
      <style>{`
        :root {
          --astomed-dark: #1b3a3a;
          --astomed-mid: #254f4f;
          --astomed-accent: #3a9e9e;
          --astomed-light: #e8f2f2;
          --astomed-text: #1b3a3a;
        }
        .astomed-sidebar { background: var(--astomed-dark); }
        .astomed-header { background: #ffffff; border-bottom: 1px solid #dce8e8; }
        .astomed-nav-active { background: var(--astomed-accent) !important; color: #fff !important; }
        .astomed-nav-item:hover { background: var(--astomed-mid) !important; color: #fff !important; }
        .astomed-section-title { color: #7aadad; }
        .astomed-logo-icon { background: var(--astomed-accent); }
        body { color: var(--astomed-text); }
      `}</style>

      {/* Sidebar */}
      <aside className={cn(
        "astomed-sidebar fixed inset-y-0 left-0 z-50 w-64 flex flex-col transition-transform duration-300 text-white",
        sidebarOpen ? "translate-x-0" : "-translate-x-full",
        "lg:translate-x-0 lg:static lg:flex"
      )}>
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 astomed-logo-icon rounded-lg flex items-center justify-center">
              <Wrench className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-bold text-white text-sm tracking-wide">Astomed Pro</div>
              <div className="text-xs" style={{ color: "#7aadad" }}>Servicehantering</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-5 overflow-y-auto">
          {userLoaded && navSections.map((section, si) => {
            const visibleItems = section.items.filter(item => item.roles.includes(userRole));
            if (visibleItems.length === 0) return null;
            return (
              <div key={si}>
                {section.title && (
                  <div className="astomed-section-title text-xs font-semibold uppercase tracking-widest px-3 mb-2">{section.title}</div>
                )}
                <div className="space-y-0.5">
                  {visibleItems.map(item => {
                    const Icon = item.icon;
                    const active = currentPageName === item.page.split("?")[0];
                    return (
                      <Link
                        key={item.label}
                        to={createPageUrl(item.page)}
                        onClick={() => setSidebarOpen(false)}
                        className={cn(
                          "astomed-nav-item flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all",
                          active
                            ? "astomed-nav-active"
                            : item.highlight === "red"
                            ? "text-red-400 hover:bg-red-900/30 hover:text-red-300"
                            : "text-white/70"
                        )}
                      >
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        {item.label}
                        {active && <ChevronRight className="w-3 h-3 ml-auto" />}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          {user && (
            <button 
              onClick={() => setShowUserInfo(!showUserInfo)}
              className="w-full text-left mb-3 px-3 py-2 rounded hover:bg-white/10 transition-colors"
            >
              <div className="text-xs" style={{ color: "#7aadad" }}>Inloggad som</div>
              <div className="text-sm text-white font-medium truncate">{user.full_name || user.email}</div>
              <div className="text-xs capitalize" style={{ color: "#7aadad" }}>{user.role || "technician"}</div>
            </button>
          )}
          {showUserInfo && user && (
            <div className="mb-3 px-3 py-2 bg-white/10 rounded text-xs space-y-1">
              <div style={{ color: "#7aadad" }}>E-postadress:</div>
              <div className="text-white break-all">{user.email}</div>
              <div style={{ color: "#7aadad" }} className="mt-2">ID:</div>
              <div className="text-white text-xs break-all">{user.id}</div>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-white/60 hover:text-white hover:bg-white/10"
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
        <header className="astomed-header px-4 py-3 flex items-center gap-3 shadow-sm justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)} className="lg:hidden">
              <Menu className="w-5 h-5" />
            </Button>
            <Link
              to={createPageUrl("Dashboard")}
              className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors"
              style={{ background: "#e8f2f2", color: "#1b3a3a" }}
              title="Gå till Dashboard"
            >
              <Home className="w-4 h-4" />
            </Link>
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} title="Föregående sida" style={{ color: "#1b3a3a" }}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => navigate(1)} title="Nästa sida" style={{ color: "#1b3a3a" }}>
              <ChevronRightIcon className="w-5 h-5" />
            </Button>
            <span className="font-semibold lg:hidden" style={{ color: "#1b3a3a" }}>Astomed Pro</span>
          </div>
          <NotificationBell />
        </header>
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}