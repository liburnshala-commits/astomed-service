import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Link, useNavigate } from "react-router-dom";
import { Building2, Phone, Mail, Monitor, ArrowLeft, ExternalLink, Shield, Trash2, Download, FileCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import CustomerInteractions from "@/components/customers/CustomerInteractions";
import ServiceContractModal from "@/components/machines/ServiceContractModal";
import { useAuth } from "@/lib/AuthContext";

export default function CustomerDetails() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isTechnician = user?.role === "technician";

  const urlParams = new URLSearchParams(window.location.search);
  const customerId = urlParams.get("id");

  const { data, isLoading: loading } = useQuery({
    queryKey: ["customerDetails", customerId],
    queryFn: async () => {
      if (!customerId) return null;
      const [c, m, sr] = await Promise.all([
        base44.entities.Customer.get(customerId),
        base44.entities.Machine.filter({ customer_id: customerId }),
        base44.entities.ServiceRecord.filter({ customer_id: customerId })
      ]);
      return { customer: c, machines: m, serviceRecords: sr };
    },
    enabled: !!customerId,
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
    staleTime: 30 * 1000,
  });

  const customer = data?.customer;
  const machines = data?.machines || [];
  const serviceRecords = data?.serviceRecords || [];
  
  const [contractMachine, setContractMachine] = useState(null);
  
  const handleContractSave = async (form) => {
    await base44.entities.Machine.update(contractMachine.id, form);
    queryClient.invalidateQueries({ queryKey: ["customerDetails", customerId] });
    setContractMachine(null);
  };

  const handleExportMachines = () => {
    const rows = [
      ["Modell", "Serienummer", "Status", "Installationsdatum", "Senaste servicedatum", "Nästa servicedatum", "Serviceavtal", "Garantiutgång"],
      ...machines.map(m => [
        m.model || "",
        m.serial_number || "",
        m.status === "active" ? "Aktiv" : m.status === "service" ? "På service" : "Inaktiv",
        m.installation_date || "",
        m.service_date || "",
        m.next_service_date || "",
        m.service_contract && m.service_contract !== "none" ? (m.service_contract === "basic" ? "BAS" : m.service_contract) : "Inget",
        m.warranty_expiry || ""
      ])
    ];
    const csvContent = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(";")).join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `maskiner_${customer.company_name.replace(/\s+/g, "_")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDeleteMachine = async (machine) => {
    if (window.confirm(`Är du säker på att du vill ta bort maskinen ${machine.model} (SN: ${machine.serial_number})?`)) {
      await base44.entities.Machine.delete(machine.id);
      queryClient.invalidateQueries({ queryKey: ["customerDetails", customerId] });
      queryClient.invalidateQueries({ queryKey: ["machinesPage"] });
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Laddar kundbild...</div>;
  if (!customer) return <div className="p-8 text-center text-red-500">Kunden hittades inte.</div>;

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="shrink-0">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold astomed-title flex items-center gap-2">
            {customer.company_name}
            {customer.is_deleted && <Badge variant="destructive" className="ml-2">Markerad för radering</Badge>}
          </h1>
          <div className="text-sm astomed-muted flex flex-wrap items-center gap-2 mt-1">
            <span>Kundprofil och historik</span>
            {customer.org_number && <span>• Org.nr: {customer.org_number}</span>}
            {(customer.address || customer.city) && (
              <span>
                • {customer.address}{customer.address && customer.city ? ", " : ""}{customer.postal_code} {customer.city}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Vänster kolumn: Kontaktinfo & Maskiner */}
        <div className="space-y-6 lg:col-span-1">
          <Card className="astomed-card border-0 shadow-sm">
            <CardContent className="p-5 space-y-4">
              <h3 className="font-semibold text-slate-800 border-b pb-2">Kontaktinformation</h3>
              
              <div className="space-y-3">
                {customer.contact_person && (
                  <div>
                    <div className="text-xs font-medium text-slate-400 mb-0.5">Kontaktperson</div>
                    <div className="text-sm font-medium text-slate-700">{customer.contact_person}</div>
                  </div>
                )}
                {customer.phone && (
                  <div>
                    <div className="text-xs font-medium text-slate-400 mb-0.5">Telefon</div>
                    <div className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" /> {customer.phone}
                    </div>
                  </div>
                )}
                {customer.email && (
                  <div>
                    <div className="text-xs font-medium text-slate-400 mb-0.5">E-post</div>
                    <div className="text-sm font-medium text-slate-700 flex items-center gap-1.5 break-all">
                      <Mail className="w-3.5 h-3.5 text-slate-400" /> {customer.email}
                    </div>
                  </div>
                )}
                {(customer.address || customer.city) && (
                  <div>
                    <div className="text-xs font-medium text-slate-400 mb-0.5">Adress</div>
                    <div className="text-sm font-medium text-slate-700">
                      {customer.address}<br />
                      {customer.postal_code} {customer.city}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="astomed-card border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between border-b pb-2 mb-4">
                <h3 className="font-semibold text-slate-800">Kundens maskiner</h3>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-[#e8f2f2] text-[#1b3a3a]">{machines.length}</Badge>
                  {machines.length > 0 && (
                    <Button variant="outline" size="sm" className="h-6 px-2 text-xs" onClick={handleExportMachines} title="Exportera till Excel">
                      <Download className="w-3 h-3 mr-1" /> Excel
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                {machines.length === 0 ? (
                  <p className="text-sm text-slate-400">Inga maskiner registrerade.</p>
                ) : (
                  machines.map(m => {
                    const hasCompletedService = serviceRecords.some(r => r.machine_id === m.id && (r.status === 'completed' || r.status === 'invoiced'));
                    return (
                    <div key={m.id} className="p-3 border rounded-lg bg-slate-50/50 flex flex-col gap-1">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1">
                          <div className="font-medium text-sm text-slate-800">{m.model}</div>
                        </div>
                        <Badge className={`text-[10px] px-1.5 py-0 border-0 shrink-0 ${m.status === 'service' ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'}`}>
                          {m.status === 'service' ? 'På service' : 'Aktiv'}
                        </Badge>
                        <div className="flex items-center gap-1 shrink-0">
                          {!isTechnician && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                              onClick={() => setContractMachine(m)}
                              title="Hantera serviceavtal"
                            >
                              <FileCheck className="w-3.5 h-3.5" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-red-400 hover:text-red-600 hover:bg-red-50"
                            onClick={() => handleDeleteMachine(m)}
                            title="Ta bort maskin"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                      <div className="text-xs text-slate-500 font-mono">SN: {m.serial_number}</div>
                      {hasCompletedService && (
                        <div className="text-[10px] text-emerald-700 font-medium mt-0.5 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          Service slutförd
                        </div>
                      )}
                      {m.service_contract && m.service_contract !== 'none' && (
                         <div className="text-[10px] text-teal-700 font-medium mt-1">
                           Serviceavtal: {m.service_contract === 'basic' ? 'BAS' : m.service_contract}
                         </div>
                      )}
                    </div>
                  )})
                )}
                
                <Link to={createPageUrl(`Machines?customer=${customer.id}`)} className="block mt-4">
                  <Button variant="outline" size="sm" className="w-full text-xs">
                    Hantera maskiner <ExternalLink className="w-3 h-3 ml-1.5" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Höger kolumn: Interaktioner (CRM) */}
        <div className="lg:col-span-2">
          <CustomerInteractions customerId={customer.id} />
        </div>

      </div>

      {contractMachine && (
        <ServiceContractModal
          machine={contractMachine}
          onSave={handleContractSave}
          onClose={() => setContractMachine(null)}
        />
      )}
    </div>
  );
}