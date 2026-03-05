import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Wrench, Monitor, Calendar, FileText, AlertCircle, ChevronDown, ChevronUp, LogOut, PlusCircle } from "lucide-react";
import RequestServiceModal from "@/components/portal/RequestServiceModal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { sv } from "date-fns/locale";

const statusColor = {
  pending: "bg-yellow-100 text-yellow-800",
  in_progress: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  invoiced: "bg-purple-100 text-purple-800"
};
const statusLabel = { pending: "Väntar", in_progress: "Pågående", completed: "Slutförd", invoiced: "Fakturerad" };
const typeLabel = { standard: "Standardservice", advanced: "Avancerad service" };

export default function CustomerPortal() {
  const [user, setUser] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [machines, setMachines] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedRecord, setExpandedRecord] = useState(null);
  const [showServiceModal, setShowServiceModal] = useState(false);

  useEffect(() => {
    base44.auth.me().then(async (u) => {
      if (!u) {
        base44.auth.redirectToLogin(window.location.href);
        return;
      }
      setUser(u);
      if (u.role !== "customer") {
        setError("Denna sida är endast tillgänglig för kunder.");
        setLoading(false);
        return;
      }
      // Match customer record by email
      const customers = await base44.entities.Customer.filter({ email: u.email });
      if (!customers || customers.length === 0) {
        setError("Inget kundkonto är kopplat till din e-postadress. Kontakta Astomed.");
        setLoading(false);
        return;
      }
      const c = customers[0];
      setCustomer(c);
      const [m, r] = await Promise.all([
        base44.entities.Machine.filter({ customer_id: c.id }),
        base44.entities.ServiceRecord.filter({ customer_id: c.id }, "-service_date")
      ]);
      setMachines(m);
      setRecords(r);
      setLoading(false);
    }).catch(() => {
      base44.auth.redirectToLogin(window.location.href);
    });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-500">Laddar din servicehistorik...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
            <h2 className="font-bold text-lg text-slate-800 mb-2">Åtkomst nekad</h2>
            <p className="text-slate-500">{error}</p>
            <Button variant="outline" className="mt-4" onClick={() => base44.auth.logout()}>
              <LogOut className="w-4 h-4 mr-2" /> Logga ut
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getMachine = (id) => machines.find(m => m.id === id);
  const totalCost = records.reduce((sum, r) => sum + (r.total_cost || 0), 0);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-slate-900 text-white py-6 px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-400">Kundportal</div>
              <h1 className="text-xl font-bold">{customer?.company_name}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {machines.length > 0 && (
              <Button size="sm" className="bg-blue-500 hover:bg-blue-400 text-white" onClick={() => setShowServiceModal(true)}>
                <PlusCircle className="w-4 h-4 mr-1" /> Beställ service
              </Button>
            )}
            <Button variant="ghost" size="sm" className="text-white/70 hover:text-white hover:bg-white/10" onClick={() => base44.auth.logout()}>
              <LogOut className="w-4 h-4 mr-1" /> Logga ut
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-slate-900">{machines.length}</div>
              <div className="text-xs text-slate-500 mt-1">Maskiner</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-slate-900">{records.length}</div>
              <div className="text-xs text-slate-500 mt-1">Servicetillfällen</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-slate-900">{totalCost > 0 ? totalCost.toLocaleString("sv-SE") + " kr" : "–"}</div>
              <div className="text-xs text-slate-500 mt-1">Total kostnad</div>
            </CardContent>
          </Card>
        </div>

        {/* Machines */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Monitor className="w-4 h-4" /> Dina maskiner
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {machines.map(m => {
                const machineRecords = records.filter(r => r.machine_id === m.id);
                return (
                  <div key={m.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="font-medium text-slate-800">{m.model}</div>
                      <div className="text-xs text-slate-400 font-mono">SN: {m.serial_number}</div>
                    </div>
                    <div className="text-sm text-slate-500">{machineRecords.length} service</div>
                  </div>
                );
              })}
              {machines.length === 0 && <p className="text-slate-400 text-sm py-4 text-center">Inga maskiner registrerade</p>}
            </div>
          </CardContent>
        </Card>

        {/* Service history */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <FileText className="w-4 h-4" /> Servicehistorik
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {records.map(record => {
                const machine = getMachine(record.machine_id);
                const isExpanded = expandedRecord === record.id;
                return (
                  <div key={record.id} className="border rounded-lg overflow-hidden">
                    <button
                      className="w-full text-left p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                      onClick={() => setExpandedRecord(isExpanded ? null : record.id)}
                    >
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="font-medium text-slate-800">{machine?.model}</span>
                        <Badge className={statusColor[record.status]}>{statusLabel[record.status]}</Badge>
                        <span className="text-sm text-slate-500">{typeLabel[record.service_type]}</span>
                        <span className="text-sm text-slate-400">
                          {record.service_date ? format(new Date(record.service_date), "d MMM yyyy", { locale: sv }) : ""}
                        </span>
                        {record.total_cost > 0 && (
                          <span className="text-sm font-semibold text-slate-700">{record.total_cost.toLocaleString("sv-SE")} kr</span>
                        )}
                      </div>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />}
                    </button>
                    {isExpanded && (
                      <div className="border-t bg-slate-50 p-4 space-y-3">
                        {record.description && (
                          <div>
                            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Utfört arbete</div>
                            <p className="text-sm text-slate-700">{record.description}</p>
                          </div>
                        )}
                        {record.parts_used?.length > 0 && (
                          <div>
                            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Använda delar</div>
                            <div className="space-y-1">
                              {record.parts_used.map((p, i) => (
                                <div key={i} className="flex justify-between text-sm">
                                  <span className="text-slate-700">{p.part_name} {p.part_number ? `(${p.part_number})` : ""} × {p.quantity}</span>
                                  <span className="text-slate-600 font-medium">{((p.unit_price || 0) * (p.quantity || 1)).toLocaleString("sv-SE")} kr</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="flex flex-wrap gap-6 text-sm">
                          {record.labor_hours && <div><span className="text-slate-500">Arbetstid:</span> <span className="font-medium">{record.labor_hours} tim</span></div>}
                          {record.labor_cost && <div><span className="text-slate-500">Arbetskostnad:</span> <span className="font-medium">{record.labor_cost.toLocaleString("sv-SE")} kr</span></div>}
                          {record.total_cost && <div><span className="text-slate-500">Totalt:</span> <span className="font-bold text-slate-900">{record.total_cost.toLocaleString("sv-SE")} kr</span></div>}
                        </div>
                        {record.technician_name && <div className="text-sm text-slate-500">Tekniker: <span className="text-slate-700">{record.technician_name}</span></div>}
                        {record.images?.length > 0 && (
                          <div>
                            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Bilder</div>
                            <div className="flex flex-wrap gap-2">
                              {record.images.map((img, i) => (
                                <a key={i} href={img} target="_blank" rel="noopener noreferrer">
                                  <img src={img} alt={`Bild ${i+1}`} className="w-20 h-20 object-cover rounded-lg border hover:opacity-80 transition-opacity" />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                        {record.next_service_date && (
                          <div className="flex items-center gap-2 text-sm bg-blue-50 text-blue-700 rounded-lg px-3 py-2">
                            <Calendar className="w-4 h-4" />
                            Nästa service: {format(new Date(record.next_service_date), "d MMMM yyyy", { locale: sv })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              {records.length === 0 && <p className="text-slate-400 text-sm text-center py-6">Ingen servicehistorik ännu</p>}
            </div>
          </CardContent>
        </Card>
      </main>

      {showServiceModal && (
        <RequestServiceModal
          machines={machines}
          customer={customer}
          user={user}
          onClose={() => setShowServiceModal(false)}
        />
      )}

      <footer className="text-center py-6 text-xs text-slate-400 border-t mt-8">
        Astomed Klinikutrustning Sverige AB · Kundportal
      </footer>
    </div>
  );
}