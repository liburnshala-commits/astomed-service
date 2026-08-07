import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { Monitor, Wrench, CheckCircle, Clock, Building2, Mail, Phone, MapPin, User, AlertTriangle, Plus, FileCheck, FileText, Download, Box } from "lucide-react";
import OtherMachineServiceForm from "@/components/portal/OtherMachineServiceForm";
import RequestContractModal from "@/components/portal/RequestContractModal";
import ServiceRecordDetail from "@/components/service/ServiceRecordDetail";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showOtherMachineForm, setShowOtherMachineForm] = useState(false);
  const [requestingContractFor, setRequestingContractFor] = useState(null);
  const [viewingRecord, setViewingRecord] = useState(null);
  const [editingSnFor, setEditingSnFor] = useState(null);

  const handleUpdateSn = async (machineId, newSn) => {
    if (!newSn || newSn.trim() === "") return;
    try {
      await base44.entities.Machine.update(machineId, { serial_number: newSn });
      setMachines(prev => prev.map(m => m.id === machineId ? { ...m, serial_number: newSn } : m));
      setEditingSnFor(null);
    } catch (err) {
      console.error("Kunde inte uppdatera serienummer", err);
      alert("Kunde inte uppdatera serienumret. Försök igen senare.");
    }
  };

  useEffect(() => {
    const load = async () => {
      const currentUser = await base44.auth.me();
      const ownCustomers = await base44.entities.Customer.filter({ email: currentUser.email });
      const cust = ownCustomers[0] || null;
      setCustomer(cust);

      if (cust) {
        const [m, r, p] = await Promise.all([
          base44.entities.Machine.filter({ customer_id: cust.id }),
          base44.entities.ServiceRecord.filter({ customer_id: cust.id }, "-created_date", 50),
          base44.entities.Product.list()
        ]);
        setMachines(m);
        setRecords(r);
        setProducts(p);
      }
      setLoading(false);
    };
    load();
  }, []);

  const getLastService = (machineId) =>
    records.filter(r => r.machine_id === machineId).sort((a, b) => new Date(b.service_date) - new Date(a.service_date))[0];

  const getContractExpiry = (machine) => {
    if (!machine.service_contract || machine.service_contract === 'none') return null;
    if (!machine.contract_start_date || !machine.contract_binding_months) return null;
    const d = new Date(machine.contract_start_date);
    d.setMonth(d.getMonth() + Number(machine.contract_binding_months));
    return d;
  };

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
              <p className="text-xs astomed-muted mt-1 font-medium uppercase tracking-wide">Väntande</p>
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
              <p className="text-xs astomed-muted mt-1 font-medium uppercase tracking-wide">Pågående</p>
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
              <p className="text-xs astomed-muted mt-1 font-medium uppercase tracking-wide">Slutförda</p>
            </CardContent>
          </Card>
        </Link>
      </div>



      {/* Machines section */}
      <div>
        {machines.filter(m => !m.serial_number || m.serial_number.toLowerCase() === "okänd" || m.serial_number.toLowerCase() === "saknas" || m.serial_number.trim() === "").length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3 mb-6">
            <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-amber-800">Viktig information saknas</h3>
              <p className="text-sm text-amber-700 mt-1">En eller flera av dina maskiner saknar ett registrerat serienummer. Vänligen klicka på "Ändra" bredvid serienumret på maskinen för att fylla i det. Detta är viktigt för att service och avtal ska kopplas rätt.</p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold astomed-label flex items-center gap-2">
            <Monitor className="w-4 h-4" />
            Mina maskiner
          </h2>
          <Button className="astomed-btn-primary" size="sm" onClick={() => setShowOtherMachineForm(true)}>
            <Plus className="w-3 h-3 mr-1" /> Annan maskin
          </Button>
        </div>
        {machines.length > 0 ? (
          <div className="space-y-3">
            {machines.map((machine, idx) => {
              const isMissingSn = !machine.serial_number || machine.serial_number.toLowerCase() === "okänd" || machine.serial_number.toLowerCase() === "saknas" || machine.serial_number.trim() === "";
              return (
              <div key={machine.id}>
                <Card className="astomed-card" style={{ background: "#f4f9f9" }}>
                    <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 astomed-icon-box flex-shrink-0">
                        <Monitor className="w-5 h-5" style={{ color: "#1b3a3a" }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold astomed-title">{machine.model}</h3>
                        
                        {editingSnFor?.id === machine.id ? (
                          <div className="mt-2 mb-3 flex items-center gap-2">
                            <Input 
                              value={editingSnFor.serial_number} 
                              onChange={e => setEditingSnFor({...editingSnFor, serial_number: e.target.value})}
                              placeholder="Ange serienummer"
                              className="h-8 text-xs w-40 bg-white"
                            />
                            <Button 
                              size="sm" 
                              className="h-8 px-2 astomed-btn-primary"
                              onClick={() => handleUpdateSn(machine.id, editingSnFor.serial_number)}
                            >
                              Spara
                            </Button>
                            <Button size="sm" variant="ghost" className="h-8 px-2 text-slate-500" onClick={() => setEditingSnFor(null)}>
                              Avbryt
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 mb-2 mt-1">
                            <p className={`text-xs ${isMissingSn ? 'text-amber-600 font-semibold' : 'astomed-muted'}`}>
                              SN: {isMissingSn ? "Saknas" : machine.serial_number}
                            </p>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-5 px-1.5 text-[10px] text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                              onClick={() => setEditingSnFor({ id: machine.id, serial_number: isMissingSn ? '' : machine.serial_number })}
                            >
                              ✏️ Ändra
                            </Button>
                          </div>
                        )}

                        <div className="text-xs space-y-1">
                          {(() => {
                            if (machine.service_contract_status === "pending") {
                              return (
                                <p className="text-amber-600 font-medium flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  Avtalsförfrågan väntar på godkännande
                                </p>
                              );
                            }
                            const expiry = getContractExpiry(machine);
                            if (!expiry) return (
                              <div className="flex items-center gap-2">
                                <p className="text-slate-400">Inget serviceavtal</p>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setRequestingContractFor(machine)}
                                  className="text-xs h-6 px-2"
                                >
                                  <FileCheck className="w-3 h-3 mr-1" />
                                  Begär avtal
                                </Button>
                              </div>
                            );
                            const expired = expiry < new Date();
                            return (
                              <p>
                                Avtal: <span className={`font-semibold px-1.5 py-0.5 rounded ${expired ? "bg-red-100 text-red-700" : "bg-teal-100 text-teal-800"}`}>
                                  {machine.service_contract === 'basic' ? 'Basic' : machine.service_contract}
                                </span>
                                {" "}<span className={expired ? "text-red-600 font-medium" : "astomed-muted"}>
                                  {expired ? "– Utgånget " : "– Giltigt t.o.m. "}{expiry.toLocaleDateString("sv-SE")}
                                </span>
                              </p>
                            );
                          })()}
                          {(() => {
                            const last = getLastService(machine.id);
                            if (!last) return <p className="text-slate-400">Inga servicetillfällen</p>;
                            return (
                              <p className="astomed-muted">
                                Senaste service: <span className="font-medium">{format(new Date(last.service_date), "d MMM yyyy", { locale: sv })}</span>
                              </p>
                            );
                          })()}
                        </div>
                        
                        {(() => {
                          const matchingProduct = products.find(p => 
                            p.name === machine.model || 
                            (p.related_machine_models && p.related_machine_models.includes(machine.model))
                          );
                          const combinedDocs = [
                            ...(machine.documents || []),
                            ...(matchingProduct?.documents || [])
                          ];
                          if (combinedDocs.length === 0) return null;
                          return (
                            <div className="mt-3 pt-3 border-t border-slate-200/60 space-y-2">
                              <p className="text-xs font-semibold text-slate-700">Manualer & Dokument</p>
                              {combinedDocs.map((doc, i) => (
                                <a key={i} href={doc.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs p-2 rounded border border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm transition-all text-blue-600 group">
                                  <FileText className="w-3.5 h-3.5 text-blue-500 group-hover:text-blue-700" />
                                  <span className="truncate flex-1 group-hover:underline">{doc.name}</span>
                                  <Download className="w-3 h-3 text-slate-400" />
                                </a>
                              ))}
                            </div>
                          );
                        })()}
                        
                        <div className="mt-3 pt-3 border-t border-slate-200/60">
                           <Button size="sm" variant="outline" className="w-full sm:w-auto text-xs h-8" asChild>
                             <Link to={createPageUrl(`ServiceRecords?machine=${machine.id}&new=true`)}>
                               <Wrench className="w-3 h-3 mr-1.5" /> Boka service
                             </Link>
                           </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                {idx < machines.length - 1 && <div className="h-px" style={{ background: "#dce8e8" }} />}
              </div>
            )})}
          </div>
        ) : (
          <Card className="astomed-card" style={{ background: "#f4f9f9" }}>
            <CardContent className="p-4 text-center">
              <p className="astomed-muted text-sm">Inga Astomed-maskiner registrerade</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Service records section */}
      <div>
        <h2 className="text-sm font-semibold astomed-label mb-4 flex items-center gap-2">
          <Wrench className="w-4 h-4" />
          Mina ärenden
        </h2>
        <Card className="astomed-card" style={{ background: "#f4f9f9" }}>
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
                  <div 
                    key={r.id} 
                    className="flex items-center justify-between p-3 rounded-lg flex-wrap gap-2 cursor-pointer hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200" 
                    style={{ background: "#f4f9f9" }}
                    onClick={() => setViewingRecord(r)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium astomed-title">{machine?.model || "Okänd maskin"}</div>
                      <div className="text-xs astomed-muted">
                        SN: {machine?.serial_number} · {r.service_date ? format(new Date(r.service_date), "d MMM yyyy", { locale: sv }) : ""}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={statusColor[r.status]}>{statusLabel[r.status]}</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          </CardContent>
          </Card>
          </div>



      {showOtherMachineForm && (
        <OtherMachineServiceForm
          customerId={customer.id}
          onClose={() => setShowOtherMachineForm(false)}
          onSubmitted={async () => {
            const updated = await base44.entities.ServiceRecord.filter({ customer_id: customer.id }, "-created_date", 50);
            setRecords(updated);
          }}
        />
      )}

      {requestingContractFor && (
        <RequestContractModal
          machine={requestingContractFor}
          onClose={() => setRequestingContractFor(null)}
          onSubmit={async (contractData) => {
            await base44.entities.Machine.update(requestingContractFor.id, contractData);
            const updated = await base44.entities.Machine.filter({ customer_id: customer.id });
            setMachines(updated);
          }}
        />
      )}

      {viewingRecord && (
        <ServiceRecordDetail
          record={viewingRecord}
          machine={machines.find(m => m.id === viewingRecord.machine_id)}
          customer={customer}
          userRole="customer"
          onClose={() => setViewingRecord(null)}
          onUpdated={async () => {
            const updated = await base44.entities.ServiceRecord.filter({ customer_id: customer.id }, "-created_date", 50);
            setRecords(updated);
            setViewingRecord(null);
          }}
        />
      )}
    </div>
  );
}