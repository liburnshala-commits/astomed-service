import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { Monitor, Wrench, CheckCircle, Clock, Building2, Mail, Phone, MapPin, User, AlertTriangle } from "lucide-react";
import QuoteApprovalCard from "@/components/portal/QuoteApprovalCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { sv } from "date-fns/locale";

const statusColor = {
  pending: "bg-yellow-100 text-yellow-800",
  in_progress: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  invoiced: "bg-purple-100 text-purple-800"
};
const statusLabel = { pending: "Väntar", in_progress: "Pågående", completed: "Slutförd", invoiced: "Fakturerad" };

export default function CustomerDashboard() {
  const [customer, setCustomer] = useState(null);
  const [machines, setMachines] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const currentUser = await base44.auth.me();
      const ownCustomers = await base44.entities.Customer.filter({ email: currentUser.email });
      const cust = ownCustomers[0] || null;
      setCustomer(cust);

      if (cust) {
        const [m, r] = await Promise.all([
          base44.entities.Machine.filter({ customer_id: cust.id }),
          base44.entities.ServiceRecord.filter({ customer_id: cust.id }, "-service_date", 50)
        ]);
        setMachines(m);
        setRecords(r);
      }
      setLoading(false);
    };
    load();
  }, []);

  const awaitingQuoteApproval = records.filter(r => r.quote_sent && r.quote_approved === "pending");
  const pending = records.filter(r => r.status === "pending").length;
  const inProgress = records.filter(r => r.status === "in_progress").length;
  const completed = records.filter(r => r.status === "completed" || r.status === "invoiced").length;
  const recent = records.slice(0, 5);

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        {[1,2,3].map(i => <div key={i} className="h-24 rounded-xl animate-pulse" style={{ background: "#e8f2f2" }} />)}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold astomed-title">Välkommen tillbaka</h1>
        <p className="astomed-subtitle text-sm">Din serviceöversikt</p>
      </div>

      {/* Customer info card */}
      {customer ? (
        <Card className="astomed-card border-l-4" style={{ borderLeftColor: "#3a9e9e", background: "#f4f9f9" }}>
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#e8f2f2" }}>
                <Building2 className="w-6 h-6" style={{ color: "#1b3a3a" }} />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold astomed-title">{customer.company_name}</h2>
                {customer.org_number && <p className="text-xs astomed-muted mb-2">Org.nr: {customer.org_number}</p>}
                <div className="grid sm:grid-cols-2 gap-1.5 mt-2">
                  {customer.contact_person && (
                    <div className="flex items-center gap-1.5 text-sm astomed-subtitle">
                      <User className="w-3.5 h-3.5 astomed-muted flex-shrink-0" />
                      {customer.contact_person}
                    </div>
                  )}
                  {customer.email && (
                    <div className="flex items-center gap-1.5 text-sm astomed-subtitle">
                      <Mail className="w-3.5 h-3.5 astomed-muted flex-shrink-0" />
                      {customer.email}
                    </div>
                  )}
                  {customer.phone && (
                    <div className="flex items-center gap-1.5 text-sm astomed-subtitle">
                      <Phone className="w-3.5 h-3.5 astomed-muted flex-shrink-0" />
                      {customer.phone}
                    </div>
                  )}
                  {(customer.address || customer.city) && (
                    <div className="flex items-center gap-1.5 text-sm astomed-subtitle">
                      <MapPin className="w-3.5 h-3.5 astomed-muted flex-shrink-0" />
                      {[customer.address, customer.city].filter(Boolean).join(", ")}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="astomed-card">
          <CardContent className="p-5 text-center text-slate-400">
            <p className="text-sm">Din kundprofil är inte kopplad till det här kontot ännu. Kontakta Astomed.</p>
          </CardContent>
        </Card>
      )}

      {/* Quote approval cards */}
      {awaitingQuoteApproval.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" style={{ color: "#d97706" }} />
            <h2 className="text-sm font-semibold astomed-label">Kräver ditt godkännande</h2>
            <span className="text-xs px-2 py-0.5 rounded-full font-bold text-white" style={{ background: "#d97706" }}>{awaitingQuoteApproval.length}</span>
          </div>
          {awaitingQuoteApproval.map(r => (
            <QuoteApprovalCard
              key={r.id}
              record={r}
              machine={machines.find(m => m.id === r.machine_id)}
              onUpdated={async () => {
                const updated = await base44.entities.ServiceRecord.filter({ customer_id: customer.id }, "-service_date", 50);
                setRecords(updated);
              }}
            />
          ))}
        </div>
      )}

      {/* Machines section */}
      {machines.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold astomed-label mb-4 flex items-center gap-2">
            <Monitor className="w-4 h-4" />
            Mina maskiner
          </h2>
          <div className="space-y-3">
            {machines.map((machine, idx) => (
              <div key={machine.id}>
                <Card className="astomed-card" style={{ background: "#f4f9f9" }}>
                    <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 astomed-icon-box flex-shrink-0">
                        <Monitor className="w-5 h-5" style={{ color: "#1b3a3a" }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold astomed-title">{machine.model}</h3>
                        <p className="text-xs astomed-muted">SN: {machine.serial_number}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                {idx < machines.length - 1 && <div className="h-px" style={{ background: "#dce8e8" }} />}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Link to={createPageUrl("Machines")} className="block">
          <Card className="astomed-card cursor-pointer" style={{ background: "#f4f9f9" }}>
            <CardContent className="p-5 text-center">
              <div className="w-10 h-10 astomed-icon-box mx-auto mb-3" style={{ width: 40, height: 40 }}>
                <Monitor className="w-5 h-5" style={{ color: "#1b3a3a" }} />
              </div>
              <p className="text-3xl font-bold astomed-title">{machines.length}</p>
              <p className="text-xs astomed-muted mt-1 font-medium uppercase tracking-wide">Maskiner</p>
            </CardContent>
          </Card>
        </Link>
        <Link to={createPageUrl("ServiceRecords?status=pending")} className="block">
          <Card className="astomed-card cursor-pointer" style={{ background: "#fffaf0" }}>
            <CardContent className="p-5 text-center">
              <div className="w-10 h-10 mx-auto mb-3 rounded-xl flex items-center justify-center" style={{ width: 40, height: 40, background: "#fef9e7" }}>
                <Wrench className="w-5 h-5" style={{ color: "#d4a017" }} />
              </div>
              <p className="text-3xl font-bold astomed-title">{pending}</p>
              <p className="text-xs astomed-muted mt-1 font-medium uppercase tracking-wide">Väntande ärenden</p>
            </CardContent>
          </Card>
        </Link>
        <Link to={createPageUrl("ServiceRecords?status=in_progress")} className="block">
          <Card className="astomed-card cursor-pointer" style={{ background: "#f0fafa" }}>
            <CardContent className="p-5 text-center">
              <div className="w-10 h-10 astomed-icon-box mx-auto mb-3" style={{ width: 40, height: 40 }}>
                <Clock className="w-5 h-5" style={{ color: "#3a9e9e" }} />
              </div>
              <p className="text-3xl font-bold astomed-title">{inProgress}</p>
              <p className="text-xs astomed-muted mt-1 font-medium uppercase tracking-wide">Pågående ärenden</p>
            </CardContent>
          </Card>
        </Link>
        <Link to={createPageUrl("ServiceRecords?status=completed")} className="block">
          <Card className="astomed-card cursor-pointer" style={{ background: "#f0faf9" }}>
            <CardContent className="p-5 text-center">
              <div className="w-10 h-10 astomed-icon-box mx-auto mb-3" style={{ width: 40, height: 40 }}>
                <CheckCircle className="w-5 h-5" style={{ color: "#3a9e9e" }} />
              </div>
              <p className="text-3xl font-bold astomed-title">{completed}</p>
              <p className="text-xs astomed-muted mt-1 font-medium uppercase tracking-wide">Slutförda ärenden</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Service records section */}
      <div>
        <h2 className="text-sm font-semibold astomed-label mb-4 flex items-center gap-2">
          <Wrench className="w-4 h-4" />
          Mina ärenden
        </h2>
        <Card className="astomed-card">
          <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold astomed-title flex items-center gap-2">
            <Wrench className="w-4 h-4" />
            Senaste serviceärenden
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <p className="astomed-muted text-sm text-center py-6">Inga serviceärenden ännu</p>
          ) : (
            <div className="space-y-2">
              {recent.map(r => {
                const machine = machines.find(m => m.id === r.machine_id);
                return (
                  <div key={r.id} className="flex items-center justify-between p-3 rounded-lg" style={{ background: "#f4f9f9" }}>
                    <div>
                      <div className="text-sm font-medium astomed-title">{machine?.model || "Okänd maskin"}</div>
                      <div className="text-xs astomed-muted">
                        SN: {machine?.serial_number} · {r.service_date ? format(new Date(r.service_date), "d MMM yyyy", { locale: sv }) : ""}
                      </div>
                    </div>
                    <Badge className={statusColor[r.status]}>{statusLabel[r.status]}</Badge>
                  </div>
                );
              })}
            </div>
          )}
          </CardContent>
          </Card>
          </div>
    </div>
  );
}