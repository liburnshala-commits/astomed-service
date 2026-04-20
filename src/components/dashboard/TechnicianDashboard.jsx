import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Wrench, Clock, CheckCircle, Monitor, MapPin, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { sv } from "date-fns/locale";

export default function TechnicianDashboard({ machines, customers, records }) {
  const pendingRecords = records.filter(r => r.status === "pending");
  const inProgressRecords = records.filter(r => r.status === "in_progress");
  const completedRecords = records.filter(r => r.status === "completed" || r.status === "invoiced");

  const recentRecords = records.slice(0, 5);

  const statusColor = {
    pending: "bg-yellow-100 text-yellow-800",
    in_progress: "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800",
    invoiced: "bg-purple-100 text-purple-800"
  };

  const statusLabel = {
    pending: "Väntar",
    in_progress: "Pågående",
    completed: "Slutförd",
    invoiced: "Fakturerad"
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link to={createPageUrl("ServiceRecords?status=pending")} className="block">
          <Card className="astomed-card cursor-pointer" style={{ background: "#fffaf0" }}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs astomed-muted font-medium uppercase tracking-wide">Väntande</p>
                  <p className="text-3xl font-bold astomed-title mt-1">{pendingRecords.length}</p>
                </div>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#fef9e7" }}>
                  <Clock className="w-5 h-5" style={{ color: "#d4a017" }} />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link to={createPageUrl("ServiceRecords?status=in_progress")} className="block">
          <Card className="astomed-card cursor-pointer" style={{ background: "#f0fafa" }}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs astomed-muted font-medium uppercase tracking-wide">Pågående</p>
                  <p className="text-3xl font-bold astomed-title mt-1">{inProgressRecords.length}</p>
                </div>
                <div className="w-10 h-10 astomed-icon-box" style={{ width: 40, height: 40 }}>
                  <Wrench className="w-5 h-5" style={{ color: "#3a9e9e" }} />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link to={createPageUrl("ServiceRecords?status=completed")} className="block">
          <Card className="astomed-card cursor-pointer" style={{ background: "#f0faf9" }}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs astomed-muted font-medium uppercase tracking-wide">Slutförda</p>
                  <p className="text-3xl font-bold astomed-title mt-1">{completedRecords.length}</p>
                </div>
                <div className="w-10 h-10 astomed-icon-box" style={{ width: 40, height: 40 }}>
                  <CheckCircle className="w-5 h-5" style={{ color: "#3a9e9e" }} />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="astomed-card">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-base font-semibold astomed-title flex items-center gap-2">
              <Wrench className="w-4 h-4 text-slate-500" />
              Senaste ärenden
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {recentRecords.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-sm">Inga ärenden hittades</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentRecords.map(r => {
                  const machine = machines.find(m => m.id === r.machine_id);
                  const customer = customers.find(c => c.id === r.customer_id);
                  return (
                    <Link key={r.id} to={createPageUrl(`ServiceRecords?id=${r.id}`)} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold astomed-title truncate">{machine?.model || "Okänd maskin"}</span>
                          <Badge className={statusColor[r.status] + " border-0"}>{statusLabel[r.status]}</Badge>
                        </div>
                        <div className="text-xs astomed-muted flex items-center gap-3">
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {customer?.company_name || "Okänd kund"}</span>
                          {r.service_date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {format(new Date(r.service_date), "d MMM", { locale: sv })}</span>}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
            <div className="p-3 bg-slate-50 border-t border-slate-100 rounded-b-xl text-center">
              <Link to={createPageUrl("ServiceRecords")} className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                Visa alla ärenden →
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <h3 className="text-sm font-semibold astomed-label px-1">Snabblänkar</h3>
          <Link to={createPageUrl("TechnicianMobile")} className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm transition-all group">
            <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center group-hover:bg-slate-200 transition-colors">
              <Monitor className="w-6 h-6 text-slate-600" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-800">Teknikervy (Mobil)</h4>
              <p className="text-xs text-slate-500 mt-0.5">Mobiloptimerad vy för fältarbete</p>
            </div>
          </Link>
          <Link to={createPageUrl("Calendar")} className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm transition-all group">
            <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-800">Servicekalender</h4>
              <p className="text-xs text-slate-500 mt-0.5">Översikt över inbokade servicebesök</p>
            </div>
          </Link>
          <Link to={createPageUrl("Machines")} className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm transition-all group">
            <div className="w-12 h-12 rounded-lg bg-teal-50 flex items-center justify-center group-hover:bg-teal-100 transition-colors">
              <Wrench className="w-6 h-6 text-teal-600" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-800">Maskinregister</h4>
              <p className="text-xs text-slate-500 mt-0.5">Sök och hantera alla registrerade maskiner</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}