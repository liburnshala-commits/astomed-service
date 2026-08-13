import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { LayoutDashboard, Wrench, Users, Monitor } from "lucide-react";

export default function MobileBottomNav({ user, currentPageName }) {
  const navigate = useNavigate();
  
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-40 flex items-center justify-around pb-[env(safe-area-inset-bottom)] h-[calc(4rem+env(safe-area-inset-bottom))] shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
      {[
        { target: user?.role === "customer" ? "CustomerDashboard" : "Dashboard", icon: LayoutDashboard, label: "Översikt", active: ["Dashboard", "CustomerDashboard"].includes(currentPageName) },
        { target: "ServiceRecords", icon: Wrench, label: "Service", active: currentPageName === 'ServiceRecords' },
        user?.role === "customer" 
          ? { target: "Machines", icon: Monitor, label: "Maskiner", active: currentPageName === 'Machines' }
          : { target: "Customers", icon: Users, label: "Kunder", active: currentPageName === 'Customers' }
      ].map(({ target, icon: Icon, label, active }) => (
        <Link 
          key={target}
          to={createPageUrl(target)} 
          onClick={(e) => { 
            if (currentPageName === target) { 
              e.preventDefault(); 
              window.scrollTo({ top: 0, behavior: 'smooth' }); 
              navigate(`/${target}`, { replace: true }); 
            } 
          }}
          className={`flex flex-col items-center justify-center w-full h-full ${active ? 'text-primary' : 'text-muted-foreground'}`}
        >
          <Icon className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-medium">{label}</span>
        </Link>
      ))}
    </div>
  );
}