import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
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
  Trash2,
  Info,
  Home,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  Users as UsersIcon,
  CalendarDays,
  ClipboardList,
  FileCheck,
  MessageSquare,
  Archive,
  CheckSquare,
  MapPin
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import NotificationBell from "@/components/notifications/NotificationBell";
import PrivacyPolicyModal from "@/components/PrivacyPolicyModal";
import GlobalSearch from "@/components/GlobalSearch";

import { TrendingUp } from "lucide-react";

const navSections = [
  {
    title: null,
    items: [
      { label: "Dashboard", page: "Dashboard", icon: LayoutDashboard, roles: ["admin", "technician"] },
      { label: "Min översikt", page: "CustomerDashboard", icon: LayoutDashboard, roles: ["customer"] },
      { label: "Klinikutveckling", page: "ClinicDevelopment", icon: TrendingUp, roles: ["customer", "admin"] },
    ]
  },
  {
    title: "Service",
    items: [
      { label: "Serviceförfrågningar", page: "PublicServiceLeads", icon: ClipboardList, roles: ["admin"] },
      { label: "Uppföljningar (To-Do)", page: "Tasks", icon: CheckSquare, roles: ["admin"] },
      { label: "Chattsupport", page: "ChatSupport", icon: MessageSquare, roles: ["admin"] },
      { label: "Serviceärenden", page: "ServiceRecords", icon: Wrench, roles: ["admin", "technician", "customer"] },
      { label: "Servicekalender", page: "Calendar", icon: CalendarDays, roles: ["admin", "technician"] },
      { label: "Serviceavtal", page: "ServiceContracts", icon: FileCheck, roles: ["admin", "technician"] },
      { label: "Avtal per stad", page: "ContractsByCity", icon: MapPin, roles: ["admin", "technician"] },
      { label: "Avtalsprospekt", page: "ServiceContractLeads", icon: UsersIcon, roles: ["admin"] },
      { label: "Avslutade prospekt", page: "ClosedLeads", icon: Archive, roles: ["admin"] },
      { label: "Serviceavtalsmallar", page: "ServiceAgreementTemplates", icon: FileCheck, roles: ["admin"] },
    ]
  },
  {
    title: "Hantering",
    items: [
      { label: "Kunder", page: "Customers", icon: Users, roles: ["admin", "technician"] },
      { label: "Maskiner", page: "Machines", icon: Monitor, roles: ["admin", "technician", "customer"] },
      { label: "Rapporter", page: "Reports", icon: FileText, roles: ["admin", "technician"] },
      { label: "Teknikervy (mobil)", page: "TechnicianMobile", icon: Wrench, roles: ["admin", "technician"] },
    ]
  },
  {
    title: "Snabbfilter",
    items: [
      { label: "Alla ärenden", page: "ServiceRecords", icon: Clock, roles: ["admin", "technician"] },
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
  {
    title: "Automering",
    items: [
      { label: "Påminnelseinställningar", page: "ReminderSettings", icon: Clock, roles: ["admin"] },
    ]
  },
];

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [userLoaded, setUserLoaded] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showUserInfo, setShowUserInfo] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [newServiceLeadsCount, setNewServiceLeadsCount] = useState(0);
  const [newServiceRecordsCount, setNewServiceRecordsCount] = useState(0);
  const [logoError, setLogoError] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let unsubscribe;
    let unsubscribeRecords;
    base44.auth.me().then(u => {
      setUser(u);
      if (u && !u.privacy_policy_accepted) {
        setShowPrivacyModal(true);
      }
      if (u && (u.role === 'admin' || u.role === 'technician')) {
        const loadLeads = () => base44.entities.PublicServiceLead.filter({ status: 'new' }).then(res => setNewServiceLeadsCount(res.length));
        loadLeads();
        unsubscribe = base44.entities.PublicServiceLead.subscribe(() => loadLeads());

        const loadRecords = () => base44.entities.ServiceRecord.filter({ status: 'pending' }).then(res => setNewServiceRecordsCount(res.length));
        loadRecords();
        unsubscribeRecords = base44.entities.ServiceRecord.subscribe(() => loadRecords());
      }
    }).catch(() => {
      base44.auth.redirectToLogin(window.location.href);
    }).finally(() => setUserLoaded(true));

    return () => {
      if (unsubscribe) unsubscribe();
      if (unsubscribeRecords) unsubscribeRecords();
    };
  }, []);

  if (currentPageName === "CustomerPortal") {
    return <>{children}</>;
  }

  if (showPrivacyModal) {
    return <PrivacyPolicyModal onAccepted={() => { setShowPrivacyModal(false); setUser(u => u ? { ...u, privacy_policy_accepted: true } : u); }} />;
  }

  const userRole = user?.role || "technician";
  const isRootScreen = ["Dashboard", "ServiceRecords", "Customers", "MobileMenu"].includes(currentPageName);

  const handleDeleteAccount = async () => {
    if (window.confirm("Är du säker på att du vill radera ditt konto? Denna åtgärd kan inte ångras.")) {
      try {
        await base44.entities.User.delete(user.id);
        base44.auth.logout();
      } catch (err) {
        alert("Kunde inte radera kontot. Du kanske saknar behörighet.");
      }
    }
  };

  return (
    <div className="min-h-screen flex bg-background pb-[calc(4rem+env(safe-area-inset-bottom))] lg:pb-0">
      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 flex flex-col transition-transform duration-300 bg-sidebar text-sidebar-foreground border-r border-border",
        sidebarOpen ? "translate-x-0" : "-translate-x-full",
        "lg:translate-x-0 lg:static lg:flex"
      )}>
        <div className="p-6 border-b border-border pt-[calc(1.5rem+env(safe-area-inset-top))]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg overflow-hidden flex items-center justify-center bg-primary">
              {!logoError ? (
                <img 
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69a9446fcb1cd4ab529479ba/bc2852de1_channels4_profile-2.jpg" 
                  alt="Astomed" 
                  className="w-full h-full object-cover" 
                  onError={() => setLogoError(true)}
                />
              ) : (
                <span className="text-primary-foreground font-bold text-[10px]">AST</span>
              )}
            </div>
            <div>
              <div className="font-bold text-sidebar-foreground text-sm tracking-wide">Astomed Pro</div>
              <div className="text-xs text-muted-foreground">Servicehantering</div>
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
                  <div className="text-muted-foreground text-xs font-semibold uppercase tracking-widest px-3 mb-2">{section.title}</div>
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
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all",
                          active
                            ? "bg-primary text-primary-foreground"
                            : item.highlight === "red"
                            ? "text-red-500 hover:bg-red-500/10 hover:text-red-600"
                            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        )}
                      >
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        <span className="flex-1">{item.label}</span>
                        {item.page === "PublicServiceLeads" && newServiceLeadsCount > 0 && (
                          <span className="bg-destructive text-destructive-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center shadow-sm">
                            {newServiceLeadsCount}
                          </span>
                        )}
                        {item.page === "ServiceRecords" && newServiceRecordsCount > 0 && (
                          <span className="bg-destructive text-destructive-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center shadow-sm">
                            {newServiceRecordsCount}
                          </span>
                        )}
                        {active && <ChevronRight className="w-3 h-3 ml-auto" />}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border pb-[calc(1rem+env(safe-area-inset-bottom))]">
          {user && (
            <button 
              onClick={() => setShowUserInfo(!showUserInfo)}
              className="w-full text-left mb-3 px-3 py-2 rounded hover:bg-sidebar-accent transition-colors"
            >
              <div className="text-xs text-muted-foreground">Inloggad som</div>
              <div className="text-sm text-sidebar-foreground font-medium truncate">{user.full_name || user.email}</div>
              <div className="text-xs capitalize text-muted-foreground">{user.role || "technician"}</div>
            </button>
          )}
          {showUserInfo && user && (
            <div className="mb-3 px-3 py-2 bg-sidebar-accent rounded text-xs space-y-1">
              <div className="text-muted-foreground">E-postadress:</div>
              <div className="text-sidebar-foreground break-all">{user.email}</div>
              <div className="text-muted-foreground mt-2">ID:</div>
              <div className="text-sidebar-foreground text-xs break-all">{user.id}</div>
              
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-500/10 mt-2"
                onClick={handleDeleteAccount}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Radera mitt konto
              </Button>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
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
      <div className="flex-1 flex flex-col min-w-0 bg-background relative">
        <header className="bg-card px-4 pb-3 pt-[calc(0.75rem+env(safe-area-inset-top))] flex items-center gap-3 shadow-sm justify-between border-b border-border sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)} className="lg:hidden text-foreground">
              <Menu className="w-5 h-5" />
            </Button>
            
            {isRootScreen ? (
              <div className="flex items-center gap-2 lg:hidden">
                <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center bg-primary">
                  <span className="text-primary-foreground font-bold text-[10px]">AST</span>
                </div>
                <span className="font-semibold text-foreground">Astomed Pro</span>
              </div>
            ) : (
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)} title="Föregående sida" className="text-foreground lg:hidden">
                <ChevronLeft className="w-5 h-5" />
              </Button>
            )}

            <div className="hidden lg:flex items-center gap-2">
              <Link
                to={createPageUrl("Dashboard")}
                className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors bg-accent text-accent-foreground hover:bg-accent/80"
                title="Gå till Dashboard"
              >
                <Home className="w-4 h-4" />
              </Link>
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)} title="Föregående sida" className="text-foreground">
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => navigate(1)} title="Nästa sida" className="text-foreground">
                <ChevronRightIcon className="w-5 h-5" />
              </Button>
            </div>
            
            <span className="font-semibold hidden" style={{ color: "#1b3a3a" }}>Astomed Pro</span>
          </div>
          <div className="flex-1 flex justify-end px-2 sm:px-4 max-w-md">
            {user && user.role !== "customer" && <GlobalSearch />}
          </div>
          <NotificationBell />
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-40 flex items-center justify-around pb-[env(safe-area-inset-bottom)] h-[calc(4rem+env(safe-area-inset-bottom))] shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        <Link 
          to={createPageUrl(user?.role === "customer" ? "CustomerDashboard" : "Dashboard")} 
          onClick={(e) => { 
            const target = user?.role === "customer" ? "CustomerDashboard" : "Dashboard";
            if (currentPageName === target) { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); navigate(`/${target}`, { replace: true }); } 
          }}
          className={`flex flex-col items-center justify-center w-full h-full ${["Dashboard", "CustomerDashboard"].includes(currentPageName) ? 'text-primary' : 'text-muted-foreground'}`}
        >
          <LayoutDashboard className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-medium">Översikt</span>
        </Link>
        <Link 
          to={createPageUrl("ServiceRecords")} 
          onClick={(e) => { if (currentPageName === 'ServiceRecords') { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); navigate('/ServiceRecords', { replace: true }); } }}
          className={`flex flex-col items-center justify-center w-full h-full ${currentPageName === 'ServiceRecords' ? 'text-primary' : 'text-muted-foreground'}`}
        >
          <Wrench className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-medium">Service</span>
        </Link>
        {user?.role === "customer" ? (
          <Link 
            to={createPageUrl("Machines")} 
            onClick={(e) => { if (currentPageName === 'Machines') { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); navigate('/Machines', { replace: true }); } }}
            className={`flex flex-col items-center justify-center w-full h-full ${currentPageName === 'Machines' ? 'text-primary' : 'text-muted-foreground'}`}
          >
            <Monitor className="w-5 h-5 mb-1" />
            <span className="text-[10px] font-medium">Maskiner</span>
          </Link>
        ) : (
          <Link 
            to={createPageUrl("Customers")} 
            onClick={(e) => { if (currentPageName === 'Customers') { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); navigate('/Customers', { replace: true }); } }}
            className={`flex flex-col items-center justify-center w-full h-full ${currentPageName === 'Customers' ? 'text-primary' : 'text-muted-foreground'}`}
          >
            <Users className="w-5 h-5 mb-1" />
            <span className="text-[10px] font-medium">Kunder</span>
          </Link>
        )}
      </div>
    </div>
  );
}