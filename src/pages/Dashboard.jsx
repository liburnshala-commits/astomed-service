import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { Monitor, Users, Wrench, CheckCircle, Clock } from "lucide-react";
import DashboardCharts from "@/components/dashboard/DashboardCharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { sv } from "date-fns/locale";

export default function Dashboard() {
  const [machines, setMachines] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.Machine.list("-created_date"),
      base44.entities.Customer.list("-created_date"),
      base44.entities.ServiceRecord.list("-service_date", 50)
    ]).then(([m, c, r]) => {
      setMachines(m);
      setCustomers(c);
      setRecords(r);
      setLoading(false);
    });
  }, []);

  const pending = records.filter(r => r.status === "pending").length;
  const inProgress = records.filter(r => r.status === "in_progress").length;
  const completed = records.filter(r => r.status === "completed").length;
  const recent = records.slice(0, 5);

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
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold astomed-title">Dashboard</h1>
        <p className="astomed-subtitle text-sm">Översikt av serviceverksamheten</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to={createPageUrl("Machines")} className="block">
          <Card className="astomed-card cursor-pointer">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs astomed-muted font-medium uppercase tracking-wide">Maskiner</p>
                  <p className="text-3xl font-bold astomed-title mt-1">{machines.length}</p>
                </div>
                <div className="w-10 h-10 astomed-icon-box" style={{ width: 40, height: 40 }}>
                  <Monitor className="w-5 h-5" style={{ color: "#1b3a3a" }} />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link to={createPageUrl("Customers")} className="block">
          <Card className="astomed-card cursor-pointer">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs astomed-muted font-medium uppercase tracking-wide">Kunder</p>
                  <p className="text-3xl font-bold astomed-title mt-1">{customers.length}</p>
                </div>
                <div className="w-10 h-10 astomed-icon-box" style={{ width: 40, height: 40 }}>
                  <Users className="w-5 h-5" style={{ color: "#1b3a3a" }} />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link to={createPageUrl("ServiceRecords?status=in_progress")} className="block">
          <Card className="astomed-card cursor-pointer">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs astomed-muted font-medium uppercase tracking-wide">Pågående</p>
                  <p className="text-3xl font-bold astomed-title mt-1">{inProgress}</p>
                </div>
                <div className="w-10 h-10 astomed-icon-box" style={{ width: 40, height: 40 }}>
                  <Clock className="w-5 h-5" style={{ color: "#3a9e9e" }} />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link to={createPageUrl("ServiceRecords?status=completed")} className="block">
          <Card className="astomed-card cursor-pointer">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs astomed-muted font-medium uppercase tracking-wide">Slutförda</p>
                  <p className="text-3xl font-bold astomed-title mt-1">{completed}</p>
                </div>
                <div className="w-10 h-10 astomed-icon-box" style={{ width: 40, height: 40 }}>
                  <CheckCircle className="w-5 h-5" style={{ color: "#3a9e9e" }} />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <DashboardCharts records={records} machines={machines} />

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="astomed-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold astomed-title">Senaste serviceärenden</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1,2,3].map(i => <div key={i} className="h-10 rounded animate-pulse" style={{ background: "#e8f2f2" }} />)}
              </div>
            ) : recent.length === 0 ? (
              <p className="astomed-muted text-sm text-center py-6">Inga serviceärenden ännu</p>
            ) : (
              <div className="space-y-2">
                {recent.map(r => {
                  const machine = machines.find(m => m.id === r.machine_id);
                  return (
                    <Link key={r.id} to={createPageUrl(`ServiceRecords?id=${r.id}`)} className="flex items-center justify-between p-3 rounded-lg transition-colors" style={{ background: "#f4f9f9" }} onMouseEnter={e => e.currentTarget.style.background="#e8f2f2"} onMouseLeave={e => e.currentTarget.style.background="#f4f9f9"}>
                      <div>
                        <div className="text-sm font-medium astomed-title">{machine?.model || "Okänd maskin"}</div>
                        <div className="text-xs astomed-muted">{r.technician_name} · {r.service_date ? format(new Date(r.service_date), "d MMM yyyy", { locale: sv }) : ""}</div>
                      </div>
                      <Badge className={statusColor[r.status]}>{statusLabel[r.status]}</Badge>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="astomed-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold astomed-title">Maskiner per modell</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1,2,3].map(i => <div key={i} className="h-8 rounded animate-pulse" style={{ background: "#e8f2f2" }} />)}
              </div>
            ) : (
              <div className="space-y-2">
                {Object.entries(
                  machines.reduce((acc, m) => {
                    acc[m.model] = (acc[m.model] || 0) + 1;
                    return acc;
                  }, {})
                ).sort((a,b) => b[1]-a[1]).map(([model, count]) => (
                  <Link key={model} to={createPageUrl(`Machines?model=${encodeURIComponent(model)}`)} className="flex items-center gap-3 p-2 rounded-lg transition-colors cursor-pointer group" style={{ background: "#f4f9f9" }} onMouseEnter={e => e.currentTarget.style.background="#e8f2f2"} onMouseLeave={e => e.currentTarget.style.background="#f4f9f9"}>
                    <div className="flex-1 text-sm astomed-label">{model}</div>
                    <div className="text-sm font-semibold astomed-title">{count}</div>
                    <div className="w-24 rounded-full h-2" style={{ background: "#dce8e8" }}>
                      <div className="h-2 rounded-full" style={{ width: `${(count / machines.length) * 100}%`, background: "#3a9e9e" }} />
                    </div>
                  </Link>
                ))}
                {machines.length === 0 && <p className="astomed-muted text-sm text-center py-6">Inga maskiner registrerade</p>}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}