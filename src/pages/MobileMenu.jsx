import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  ClipboardList, 
  CheckSquare, 
  Wrench, 
  CalendarDays, 
  FileCheck, 
  Users as UsersIcon, 
  Archive,
  ChevronRight
} from "lucide-react";

export default function MobileMenu() {
  const menuItems = [
    { label: "Serviceförfrågningar", page: "PublicServiceLeads", icon: ClipboardList, color: "text-blue-500", bg: "bg-blue-100" },
    { label: "Uppföljningar (To-Do)", page: "Tasks", icon: CheckSquare, color: "text-orange-500", bg: "bg-orange-100" },
    { label: "Serviceärenden", page: "ServiceRecords", icon: Wrench, color: "text-teal-600", bg: "bg-teal-100" },
    { label: "Servicekalender", page: "Calendar", icon: CalendarDays, color: "text-purple-500", bg: "bg-purple-100" },
    { label: "Serviceavtal", page: "ServiceContracts", icon: FileCheck, color: "text-emerald-500", bg: "bg-emerald-100" },
    { label: "Avtalsprospekt", page: "ServiceContractLeads", icon: UsersIcon, color: "text-indigo-500", bg: "bg-indigo-100" },
    { label: "Avslutade prospekt", page: "ClosedLeads", icon: Archive, color: "text-slate-500", bg: "bg-slate-100" },
    { label: "Serviceavtalsmallar", page: "ServiceAgreementTemplates", icon: FileCheck, color: "text-cyan-600", bg: "bg-cyan-100" },
  ];

  useEffect(() => {
    // Om användaren är på desktop, skicka tillbaka till dashboard
    if (window.innerWidth >= 1024) {
      window.location.replace(createPageUrl("Dashboard"));
    }
  }, []);

  return (
    <div className="p-4 max-w-md mx-auto pb-20">
      <div className="mb-6 mt-2">
        <h1 className="text-2xl font-bold astomed-title">Servicemeny</h1>
        <p className="text-sm astomed-muted mt-1">Hantera service och avtal</p>
      </div>

      <div className="grid gap-3">
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <Link 
              key={index} 
              to={createPageUrl(item.page)}
              className="flex items-center p-4 bg-white rounded-xl shadow-sm border border-slate-100 active:bg-slate-50 active:scale-[0.98] transition-all"
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${item.bg}`}>
                <Icon className={`w-5 h-5 ${item.color}`} />
              </div>
              <div className="ml-4 flex-1">
                <div className="font-semibold text-slate-800 text-sm">{item.label}</div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300 flex-shrink-0" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}