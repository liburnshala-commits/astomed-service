import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { Monitor, Users, Wrench, CheckCircle, Clock } from "lucide-react";
import DashboardCharts from "@/components/dashboard/DashboardCharts";
import BillingChart from "@/components/dashboard/BillingChart";
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
    const loadData = async () => {
      const currentUser = await base44.auth.me();
      if (currentUser?.role === "customer") {
        const ownCustomers = await base44.entities.Customer.filter({ email: currentUser.email });
        const cust = ownCustomers[0];
        setCustomers(cust ? [cust] : []);
        if (cust) {
          const [m, r] = await Promise.all([
            base44.entities.Machine.filter({ customer_id: cust.id }),
            base44.entities.ServiceRecord.filter({ customer_id: cust.id }, "-service_date", 50)
          ]);
          setMachines(m);
          setRecords(r);
        }
      } else {
        const [m, c, r] = await Promise.all([
          base44.entities.Machine.list("-created_date"),
          base44.entities.Customer.list("-created_date"),
          base44.entities.ServiceRecord.list("-service_date", 50)
        ]);
        setMachines(m);
        setCustomers(c);
        setRecords(r);
      }
      setLoading(false);
    };
    loadData();
  }, []);

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

  const activeContractsCount = machines.filter(m => m.service_contract && m.service_contract !== 'none' && (!m.contract_status || m.contract_status === 'active')).length;
  const pendingContractsCount = machines.filter(m => m.service_contract && m.service_contract !== 'none' && m.contract_status === 'pending_signature').length;
  const inactiveContractsCount = machines.filter(m => m.service_contract && m.service_contract !== 'none' && m.contract_status === 'inactive').length;
  const rejectedContractsCount = machines.filter(m => m.service_contract && m.service_contract !== 'none' && m.contract_status === 'rejected').length;

  const estimatedActiveRevenue = activeContractsCount * 600;
  const estimatedPendingRevenue = pendingContractsCount * 600;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold astomed-title">Dashboard</h1>
        <p className="astomed-subtitle text-sm">Översikt av serviceverksamheten</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to={createPageUrl("Machines")} className="block">
          <Card className="astomed-card cursor-pointer" style={{ background: "#f4f9f9" }}>
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
          <Card className="astomed-card cursor-pointer" style={{ background: "#f4f9f9" }}>
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
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to={createPageUrl("ServiceContracts")} className="block">
          <Card className="astomed-card cursor-pointer" style={{ background: "#f4f9f9" }}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs astomed-muted font-medium uppercase tracking-wide">Aktiva avtal</p>
                  <p className="text-3xl font-bold astomed-title mt-1">{activeContractsCount}</p>
                </div>
                <div className="w-10 h-10 astomed-icon-box" style={{ width: 40, height: 40 }}>
                  <Monitor className="w-5 h-5" style={{ color: "#1b3a3a" }} />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link to={createPageUrl("ServiceContracts")} className="block">
          <Card className="astomed-card cursor-pointer" style={{ background: "#fffaf0" }}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs astomed-muted font-medium uppercase tracking-wide">Under signering</p>
                  <p className="text-3xl font-bold astomed-title mt-1">{pendingContractsCount}</p>
                </div>
                <div className="w-10 h-10 astomed-icon-box" style={{ width: 40, height: 40 }}>
                  <Clock className="w-5 h-5" style={{ color: "#e6a817" }} />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link to={createPageUrl("ServiceContracts")} className="block">
          <Card className="astomed-card cursor-pointer" style={{ background: "#f1f5f9" }}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs astomed-muted font-medium uppercase tracking-wide">Inaktiva avtal</p>
                  <p className="text-3xl font-bold astomed-title mt-1">{inactiveContractsCount}</p>
                </div>
                <div className="w-10 h-10 astomed-icon-box" style={{ width: 40, height: 40, background: "#e2e8f0" }}>
                  <Monitor className="w-5 h-5" style={{ color: "#64748b" }} />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link to={createPageUrl("ServiceContracts")} className="block">
          <Card className="astomed-card cursor-pointer" style={{ background: "#fef2f2" }}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs astomed-muted font-medium uppercase tracking-wide">Avvisade avtal</p>
                  <p className="text-3xl font-bold astomed-title mt-1">{rejectedContractsCount}</p>
                </div>
                <div className="w-10 h-10 astomed-icon-box" style={{ width: 40, height: 40, background: "#fee2e2" }}>
                  <Monitor className="w-5 h-5" style={{ color: "#ef4444" }} />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link to={createPageUrl("ServiceContracts")} className="block">
          <Card className="astomed-card cursor-pointer" style={{ background: "#f4f9f9" }}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs astomed-muted font-medium uppercase tracking-wide">Avtalsintäkt (Aktiva)</p>
                  <p className="text-3xl font-bold astomed-title mt-1">{estimatedActiveRevenue.toLocaleString("sv-SE")} kr</p>
                </div>
                <div className="w-10 h-10 astomed-icon-box" style={{ width: 40, height: 40 }}>
                  <CheckCircle className="w-5 h-5" style={{ color: "#1b3a3a" }} />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link to={createPageUrl("ServiceContracts")} className="block">
          <Card className="astomed-card cursor-pointer" style={{ background: "#fffaf0" }}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs astomed-muted font-medium uppercase tracking-wide">Förväntad intäkt (Signering)</p>
                  <p className="text-3xl font-bold astomed-title mt-1">{estimatedPendingRevenue.toLocaleString("sv-SE")} kr</p>
                </div>
                <div className="w-10 h-10 astomed-icon-box" style={{ width: 40, height: 40, background: "#fef3c7" }}>
                  <Clock className="w-5 h-5" style={{ color: "#e6a817" }} />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <DashboardCharts records={records} machines={machines} />

      <BillingChart records={records} />

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="astomed-card" style={{ background: "#f4f9f9" }}>
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

          <Card className="astomed-card" style={{ background: "#f4f9f9" }}>
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
                {(() => {
                  const billingByModel = records.reduce((acc, r) => {
                    const machine = machines.find(m => m.id === r.machine_id);
                    if (!machine) return acc;
                    if (!acc[machine.model]) acc[machine.model] = { invoiced: 0, planned: 0 };
                    if (r.status === "invoiced") {
                      acc[machine.model].invoiced += r.total_cost || 0;
                    } else if (r.status === "completed" || r.status === "in_progress") {
                      acc[machine.model].planned += r.total_cost || 0;
                    }
                    return acc;
                  }, {});

                  return Object.entries(
                    machines.reduce((acc, m) => {
                      acc[m.model] = (acc[m.model] || 0) + 1;
                      return acc;
                    }, {})
                  ).sort((a,b) => b[1]-a[1]).map(([model, count]) => {
                    const billing = billingByModel[model] || { invoiced: 0, planned: 0 };
                    return (
                      <Link key={model} to={createPageUrl(`ServiceRecords?model=${encodeURIComponent(model)}`)} className="flex items-center gap-3 p-2 rounded-lg transition-colors cursor-pointer" style={{ background: "#f4f9f9" }} onMouseEnter={e => e.currentTarget.style.background="#e8f2f2"} onMouseLeave={e => e.currentTarget.style.background="#f4f9f9"}>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm astomed-label truncate">{model}</div>
                          <div className="flex gap-3 mt-0.5">
                            {billing.invoiced > 0 && (
                              <span className="text-xs" style={{ color: "#3a9e9e" }}>
                                Fakturerat: {billing.invoiced.toLocaleString("sv-SE")} kr
                              </span>
                            )}
                            {billing.planned > 0 && (
                              <span className="text-xs text-amber-600">
                                Planerat: {billing.planned.toLocaleString("sv-SE")} kr
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-sm font-semibold astomed-title flex-shrink-0">{count}</div>
                        <div className="w-16 rounded-full h-2 flex-shrink-0" style={{ background: "#dce8e8" }}>
                          <div className="h-2 rounded-full" style={{ width: `${(count / machines.length) * 100}%`, background: "#3a9e9e" }} />
                        </div>
                      </Link>
                    );
                  });
                })()}
                {machines.length === 0 && <p className="astomed-muted text-sm text-center py-6">Inga maskiner registrerade</p>}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}