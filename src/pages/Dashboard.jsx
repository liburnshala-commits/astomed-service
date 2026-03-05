import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { Monitor, Users, Wrench, AlertCircle, CheckCircle, Clock, TrendingUp } from "lucide-react";
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
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 text-sm">Översikt av serviceverksamheten</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to={createPageUrl("Machines")} className="block">
          <Card className="hover:shadow-md transition-shadow cursor-pointer hover:border-blue-300">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Maskiner</p>
                  <p className="text-3xl font-bold text-slate-900 mt-1">{machines.length}</p>
                </div>
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Monitor className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link to={createPageUrl("Customers")} className="block">
          <Card className="hover:shadow-md transition-shadow cursor-pointer hover:border-green-300">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Kunder</p>
                  <p className="text-3xl font-bold text-slate-900 mt-1">{customers.length}</p>
                </div>
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <Users className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link to={createPageUrl("ServiceRecords?status=in_progress")} className="block">
          <Card className="hover:shadow-md transition-shadow cursor-pointer hover:border-orange-300">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Pågående</p>
                  <p className="text-3xl font-bold text-slate-900 mt-1">{inProgress}</p>
                </div>
                <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                  <Clock className="w-5 h-5 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link to={createPageUrl("ServiceRecords?status=completed")} className="block">
          <Card className="hover:shadow-md transition-shadow cursor-pointer hover:border-purple-300">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Slutförda</p>
                  <p className="text-3xl font-bold text-slate-900 mt-1">{completed}</p>
                </div>
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Senaste serviceärenden</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1,2,3].map(i => <div key={i} className="h-10 bg-slate-100 rounded animate-pulse" />)}
              </div>
            ) : recent.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-6">Inga serviceärenden ännu</p>
            ) : (
              <div className="space-y-2">
                {recent.map(r => {
                  const machine = machines.find(m => m.id === r.machine_id);
                  return (
                    <Link key={r.id} to={createPageUrl(`ServiceRecords?id=${r.id}`)} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors">
                      <div>
                        <div className="text-sm font-medium text-slate-800">{machine?.model || "Okänd maskin"}</div>
                        <div className="text-xs text-slate-400">{r.technician_name} · {r.service_date ? format(new Date(r.service_date), "d MMM yyyy", { locale: sv }) : ""}</div>
                      </div>
                      <Badge className={statusColor[r.status]}>{statusLabel[r.status]}</Badge>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Maskiner per modell</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1,2,3].map(i => <div key={i} className="h-8 bg-slate-100 rounded animate-pulse" />)}
              </div>
            ) : (
              <div className="space-y-2">
                {Object.entries(
                  machines.reduce((acc, m) => {
                    acc[m.model] = (acc[m.model] || 0) + 1;
                    return acc;
                  }, {})
                ).sort((a,b) => b[1]-a[1]).map(([model, count]) => (
                  <Link key={model} to={createPageUrl(`Machines?model=${encodeURIComponent(model)}`)} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer group">
                    <div className="flex-1 text-sm text-slate-700 group-hover:text-blue-600">{model}</div>
                    <div className="text-sm font-semibold text-slate-900">{count}</div>
                    <div className="w-24 bg-slate-100 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${(count / machines.length) * 100}%` }} />
                    </div>
                  </Link>
                ))}
                {machines.length === 0 && <p className="text-slate-400 text-sm text-center py-6">Inga maskiner registrerade</p>}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}