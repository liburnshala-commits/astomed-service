import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Wrench,
  Users,
  Monitor,
  FileText,
  LogOut,
  ChevronRight,
  Shield,
  Clock,
  Trash2,
  Info,
  Users as UsersIcon,
  CalendarDays,
  ClipboardList,
  FileCheck,
  MessageSquare,
  Archive,
  CheckSquare,
  Calculator,
  TrendingUp,
  AlertTriangle
} from "lucide-react";

const navSections = [
  {
    title: null,
    items: [
      { label: "Dashboard", page: "Dashboard", icon: LayoutDashboard, roles: ["admin", "technician"] },
      { label: "Intern KPI", page: "InternalDashboard", icon: TrendingUp, roles: ["admin", "technician"] },
      { label: "Dubletter", page: "Duplicates", icon: AlertTriangle, roles: ["admin"] },
      { label: "Saknade Serienummer", page: "InvalidSerialMachines", icon: AlertTriangle, roles: ["admin", "technician"] },
      { label: "Min översikt", page: "CustomerDashboard", icon: LayoutDashboard, roles: ["customer"] },
      { label: "Klinikutveckling", page: "ClinicDevelopment", icon: TrendingUp, roles: ["admin"] },
      { label: "Strålsäkerhet (SSM)", page: "RadiationSafety", icon: Shield, roles: ["admin", "customer", "technician"] },
    ]
  },
  {
    title: "Service",
    items: [
      { label: "Nya Registreringar", page: "NewCustomers", icon: UsersIcon, roles: ["admin"] },
      { label: "Serviceförfrågningar", page: "PublicServiceLeads", icon: ClipboardList, roles: ["admin"] },
      { label: "Klinikberäkningar", page: "ClinicCalculations", icon: Calculator, roles: ["admin", "technician"] },
      { label: "Chattsupport", page: "ChatSupport", icon: MessageSquare, roles: ["admin"] },
      { label: "Serviceärenden", page: "ServiceRecords", icon: Wrench, roles: ["admin", "technician", "customer"] },
      { label: "Leveranskontroller", page: "DeliveryControls", icon: FileCheck, roles: ["admin"] },
      { label: "Funktionskontroller", page: "FunctionControls", icon: CheckSquare, roles: ["admin"] },
      { label: "Servicekalender", page: "Calendar", icon: CalendarDays, roles: ["admin", "technician"] },
      { label: "Serviceavtal", page: "ServiceContracts", icon: FileCheck, roles: ["admin", "technician"] },
      { label: "Avslutade prospekt", page: "ClosedLeads", icon: Archive, roles: ["admin"] },
      { label: "Serviceavtalsmallar", page: "ServiceAgreementTemplates", icon: FileCheck, roles: ["admin"] },
    ]
  },
  {
    title: "Hantering",
    items: [
      { label: "Kunder", page: "Customers", icon: Users, roles: ["admin", "technician"] },
      { label: "Maskiner", page: "Machines", icon: Monitor, roles: ["admin", "technician", "customer"] },
      { label: "Produkter & Manualer", page: "Products", icon: FileText, roles: ["admin", "technician"] },
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

export default function Sidebar({
  user,
  userLoaded,
  userRole,
  currentPageName,
  sidebarOpen,
  setSidebarOpen,
  newServiceLeadsCount,
  newServiceRecordsCount,
  handleDeleteAccount,
  logoError,
  setLogoError
}) {
  const [showUserInfo, setShowUserInfo] = useState(false);

  return (
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
  );
}