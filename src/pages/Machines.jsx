import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Link, useLocation } from "react-router-dom";
import { Plus, Search, Monitor, Wrench, Building2, FileCheck, Download, Trash2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import MachineForm from "@/components/machines/MachineForm.jsx";
import ServiceContractModal from "@/components/machines/ServiceContractModal.jsx";
import ServiceReportModal from "@/components/service/ServiceReportModal.jsx";
import { useAuth } from "@/lib/AuthContext";

const MODELS = [
  "Soprano Platinum", "Soprano Titanium", "Alma Harmony", "Aldix (Triodus)",
  "PrimeLase", "Elysion", "PicoLo", "Helius", "Splendor X", "Pento", "Clearlight IPL"
];

const statusColor = { active: "bg-green-100 text-green-700", inactive: "bg-slate-100 text-slate-600", service: "bg-orange-100 text-orange-700" };
const statusLabel = { active: "Aktiv", inactive: "Inaktiv", service: "På service" };

export default function Machines() {
  const location = useLocation();
  const queryClient = useQueryClient();
  
  const urlParams = new URLSearchParams(location.search);
  const preselectedCustomer = urlParams.get("customer");
  const preselectedSearch = urlParams.get("search") || "";
  const preselectedContract = urlParams.get("contract") || "all";

  const [search, setSearch] = useState(preselectedSearch);
  const [filterModel, setFilterModel] = useState("all");
  const [filterCustomer, setFilterCustomer] = useState("all");
  const [filterContract, setFilterContract] = useState(preselectedContract);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [contractMachine, setContractMachine] = useState(null);
  const [reportData, setReportData] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const searchParam = params.get("search");
    const contractParam = params.get("contract");
    if (searchParam !== null) {
      setSearch(searchParam);
    }
    if (contractParam !== null) {
      setFilterContract(contractParam);
    }
  }, [location.search]);

  const { user } = useAuth();
  const userRole = user?.role;

  const { data: pageData } = useQuery({
    queryKey: ["machinesPage", userRole, user?.email],
    queryFn: async () => {
      if (userRole === "customer") {
        const ownCustomers = await base44.entities.Customer.filter({ email: user.email });
        const cust = ownCustomers[0];
        if (cust) {
          const [m, r, p] = await Promise.all([
            base44.entities.Machine.filter({ customer_id: cust.id }, "-created_date"),
            base44.entities.ServiceRecord.filter({ customer_id: cust.id }, "-created_date"),
            base44.entities.Product.list()
          ]);
          return { machines: m.filter(x => !x.is_deleted), records: r, customers: [cust], products: p };
        }
        return { machines: [], records: [], customers: [], products: [] };
      } else {
        const [m, c, r, p] = await Promise.all([
          base44.entities.Machine.list("-created_date"),
          base44.entities.Customer.list(),
          base44.entities.ServiceRecord.list("-created_date"),
          base44.entities.Product.list()
        ]);
        return { machines: m.filter(x => !x.is_deleted), customers: c, records: r, products: p };
      }
    },
    enabled: !!user,
    staleTime: 30 * 1000,
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
    keepPreviousData: true,
  });

  const machines = pageData?.machines || [];
  const customers = pageData?.customers || [];
  const records = pageData?.records || [];
  const products = pageData?.products || [];

  const load = () => queryClient.invalidateQueries({ queryKey: ["machinesPage"] });

  useEffect(() => {
    if (preselectedCustomer) setFilterCustomer(preselectedCustomer);
  }, []);

  const getCustomer = (id) => customers.find(c => c.id === id);
  const getServiceCount = (id) => records.filter(r => r.machine_id === id).length;
  const getLastService = (id) => records.filter(r => r.machine_id === id).sort((a,b) => new Date(b.service_date) - new Date(a.service_date))[0];

  const getContractExpiry = (machine) => {
    if (!machine.service_contract || machine.service_contract === 'none') return null;
    if (!machine.contract_start_date || !machine.contract_binding_months) return null;
    const d = new Date(machine.contract_start_date);
    d.setMonth(d.getMonth() + Number(machine.contract_binding_months));
    return d;
  };

  const contractLabel = { basic: "Basic" };
  const contractBadgeColor = { basic: "bg-teal-100 text-teal-800" };

  const filtered = machines.filter(m => {
    const customer = getCustomer(m.customer_id);
    const searchLower = search.toLowerCase();
    const matchSearch = 
      m.serial_number?.toLowerCase().includes(searchLower) || 
      m.model?.toLowerCase().includes(searchLower) ||
      customer?.company_name?.toLowerCase().includes(searchLower) || 
      customer?.org_number?.toLowerCase().includes(searchLower) ||
      customer?.contact_person?.toLowerCase().includes(searchLower) || 
      customer?.email?.toLowerCase().includes(searchLower) ||
      customer?.phone?.toLowerCase().includes(searchLower);
    const matchModel = filterModel === "all" || m.model === filterModel;
    const matchCustomer = filterCustomer === "all" || m.customer_id === filterCustomer;
    
    let matchContract = true;
    if (filterContract === "active") {
      matchContract = m.service_contract && m.service_contract !== 'none' && (!m.contract_status || m.contract_status === 'active');
    } else if (filterContract === "none") {
      matchContract = !m.service_contract || m.service_contract === 'none';
    }
    
    return matchSearch && matchModel && matchCustomer && matchContract;
  });

  const handleDownloadContract = async (machine) => {
    try {
      const response = await fetch(`${window.location.origin}/api/functions/generateContractPDF`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ machineId: machine.id })
      });
      
      if (!response.ok) throw new Error('Failed to generate PDF');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'serviceavtal.pdf';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading contract:', error);
      alert('Det gick inte att ladda ner avtalet. Försök igen.');
    }
  };

  const handleContractSave = async (data) => {
    const currentUser = await base44.auth.me();
    await base44.entities.Machine.update(contractMachine.id, data);
    base44.functions.invoke('logAuditEntry', {
      action: 'update',
      entity_type: 'Machine',
      entity_id: contractMachine.id,
      entity_label: `${contractMachine.model} – SN: ${contractMachine.serial_number}`,
      user_email: currentUser?.email || 'unknown',
      user_name: currentUser?.full_name || currentUser?.email,
      details: `Serviceavtal uppdaterat: ${data.service_contract}`
    });
    setContractMachine(null);
    load();
  };

  const handleSave = async (data) => {
    const currentUser = await base44.auth.me();
    const customer = customers.find(c => c.id === data.customer_id);
    if (editing) {
      await base44.entities.Machine.update(editing.id, data);
      base44.functions.invoke('logAuditEntry', {
        action: 'update',
        entity_type: 'Machine',
        entity_id: editing.id,
        entity_label: `${data.model} – SN: ${data.serial_number}`,
        user_email: currentUser?.email || 'unknown',
        user_name: currentUser?.full_name || currentUser?.email,
        details: `Maskin uppdaterad${customer ? ` (${customer.company_name})` : ''}`
      });
    } else {
      const created = await base44.entities.Machine.create(data);
      base44.functions.invoke('logAuditEntry', {
        action: 'create',
        entity_type: 'Machine',
        entity_id: created.id,
        entity_label: `${data.model} – SN: ${data.serial_number}`,
        user_email: currentUser?.email || 'unknown',
        user_name: currentUser?.full_name || currentUser?.email,
        details: `Ny maskin registrerad${customer ? ` för ${customer.company_name}` : ''}`
      });
    }
    setShowForm(false);
    setEditing(null);
    load();
  };

  const handleDelete = async (machine) => {
    if (window.confirm(`Är du säker på att du vill ta bort maskinen ${machine.model} (SN: ${machine.serial_number})? Den kommer att flyttas till papperskorgen.`)) {
      const currentUser = await base44.auth.me();
      const customer = customers.find(c => c.id === machine.customer_id);
      
      await base44.entities.Machine.update(machine.id, {
        is_deleted: true,
        deleted_date: new Date().toISOString()
      });
      
      base44.functions.invoke('logAuditEntry', {
        action: 'delete', // We keep action 'delete' for audit logs but it's a soft delete
        entity_type: 'Machine',
        entity_id: machine.id,
        entity_label: `${machine.model} – SN: ${machine.serial_number}`,
        user_email: currentUser?.email || 'unknown',
        user_name: currentUser?.full_name || currentUser?.email,
        details: `Maskin flyttad till papperskorgen${customer ? ` (tillhörde ${customer.company_name})` : ''}`
      });
      
      load();
    }
  };

  const renderCard = (machine, isMobile = false) => {
    const customer = getCustomer(machine.customer_id);
    const serviceCount = getServiceCount(machine.id);
    const lastService = getLastService(machine.id);
    const displayServiceDate = lastService ? lastService.service_date : machine.service_date;
    return (
      <Card key={machine.id} className={`astomed-card h-full flex flex-col ${isMobile ? 'mx-1' : ''}`}>
        <CardContent className="p-5 flex-1 flex flex-col">
          <div className="flex items-start justify-between mb-3">
            <Link to={createPageUrl(`ServiceRecords?machine=${machine.id}`)} className="astomed-icon-box flex-shrink-0 hover:opacity-80 transition-opacity" style={{ width: 40, height: 40 }} title="Visa serviceärenden för denna maskin">
              <Monitor className="w-5 h-5" style={{ color: "#1b3a3a" }} />
            </Link>
            {machine.status === "service" ? (
              <Link to={createPageUrl(`ServiceRecords?machine=${machine.id}`)}>
                <Badge className={`${statusColor["service"]} cursor-pointer hover:opacity-80 underline-offset-2`}>
                  {statusLabel["service"]}
                </Badge>
              </Link>
            ) : (
              <Badge className={statusColor[machine.status || "active"]}>{statusLabel[machine.status || "active"]}</Badge>
            )}
          </div>
          <Link to={createPageUrl(`ServiceRecords?machine=${machine.id}`)} className="block w-fit group" title="Visa serviceärenden för denna maskin">
            <h3 className="font-bold astomed-title mb-0.5 group-hover:underline group-hover:text-[#3a9e9e] transition-colors">{machine.model}</h3>
            <p className="text-xs astomed-muted mb-3 font-mono group-hover:text-slate-600 transition-colors">SN: {machine.serial_number}</p>
          </Link>
          {customer && (
            <Link to={createPageUrl(`CustomerDetails?id=${customer.id}`)} className="flex items-center gap-1.5 text-sm astomed-subtitle mb-3 hover:opacity-80 transition-opacity w-fit">
              <Building2 className="w-3.5 h-3.5 astomed-muted" />
              <span className="hover:underline">{customer.company_name}</span>
            </Link>
          )}
          <div className="text-xs astomed-muted mb-4 pt-3 border-t space-y-1 flex-1" style={{ borderColor: "#dce8e8" }}>
            <div className="flex items-center justify-between">
              <Link to={createPageUrl(`ServiceRecords?machine=${machine.id}`)} className="hover:underline hover:text-[#3a9e9e] transition-colors" title="Visa serviceärenden">
                {serviceCount} servicetillfällen
              </Link>
              {displayServiceDate && (
                <div className="flex items-center gap-1.5">
                  <span>Senast:</span>
                  <span className="px-2 py-0.5 rounded border border-blue-200 bg-blue-50 text-blue-700 font-medium">
                    {displayServiceDate}
                  </span>
                </div>
              )}
            </div>
            {(() => {
              const expiry = getContractExpiry(machine);
              if (!expiry) return (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Inget serviceavtal</span>
                </div>
              );
              const expired = expiry < new Date();
              return (
                <div className="flex items-center justify-between mt-2">
                  <span>
                    Avtal: <span className={`font-semibold px-1.5 py-0.5 rounded ${expired ? "bg-red-100 text-red-700" : contractBadgeColor[machine.service_contract]}`}>{contractLabel[machine.service_contract] || machine.service_contract}</span>
                  </span>
                  <span className={expired ? "text-red-600 font-medium" : ""}>
                    {expired ? "Utgånget " : "Giltigt t.o.m. "}{expiry.toLocaleDateString("sv-SE")}
                  </span>
                </div>
              );
            })()}
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
                <div className="mt-3 space-y-1.5">
                  <p className="text-xs font-semibold text-slate-700">Manualer & Dokument</p>
                  {combinedDocs.map((doc, i) => (
                    <a key={i} href={doc.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs p-1.5 rounded bg-slate-50 border border-slate-100 hover:border-slate-300 text-blue-600 group">
                      <FileText className="w-3 h-3 text-blue-500" />
                      <span className="truncate flex-1 group-hover:underline">{doc.name}</span>
                    </a>
                  ))}
                </div>
              );
            })()}
          </div>
          <div className="mt-auto pt-4 border-t border-slate-100 flex flex-col items-start sm:items-end gap-2 flex-shrink-0">
            <div className="flex gap-2 flex-wrap justify-start w-full">
              <Link to={createPageUrl(`ServiceRecords?machine=${machine.id}&new=true`)}>
                <Button size="sm" variant="outline" className="w-full">
                  <Wrench className="w-3 h-3 mr-1" /> Starta service
                </Button>
              </Link>
              {lastService && (lastService.status === "completed" || lastService.status === "invoiced") && (
                <Button size="sm" variant="outline" onClick={() => setReportData({ record: lastService, machine, customer })} title="Ladda ner senaste rapport">
                  <FileText className="w-3 h-3 mr-1" /> Rapport
                </Button>
              )}
              {userRole !== "customer" && userRole !== "technician" && (
                <Button size="sm" variant="outline" onClick={() => setContractMachine(machine)} title="Hantera serviceavtal">
                  <FileCheck className="w-3 h-3 mr-1" /> Avtal
                </Button>
              )}
              {userRole !== "customer" && machine.service_contract && machine.service_contract !== "none" && (
                <Button size="sm" variant="outline" onClick={() => handleDownloadContract(machine)} title="Ladda ner serviceavtal">
                  <Download className="w-3 h-3" />
                </Button>
              )}
              {userRole !== "customer" && (
                <>
                  <Button size="sm" variant="ghost" className="flex-shrink-0" onClick={() => { setEditing(machine); setShowForm(true); }}>
                    Redigera
                  </Button>
                  <Button size="icon" variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50 flex-shrink-0" onClick={() => handleDelete(machine)} title="Ta bort maskin">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
         <div>
           <h1 className="text-2xl font-bold astomed-title">Maskiner</h1>
           <p className="astomed-subtitle text-sm">{machines.length} maskiner registrerade</p>
         </div>
         {userRole !== "customer" && (
           <div className="flex gap-2">
             <Link to="/DeletedMachines">
               <Button variant="outline" className="border-dashed text-slate-500">
                 <Trash2 className="w-4 h-4 mr-2" /> Papperskorg
               </Button>
             </Link>
             <Button onClick={() => { setEditing(null); setShowForm(true); }} className="astomed-btn-primary">
               <Plus className="w-4 h-4 mr-2" /> Ny maskin
             </Button>
           </div>
         )}
       </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Sök serienummer eller modell..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterModel} onValueChange={setFilterModel}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Alla modeller" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alla modeller</SelectItem>
            {MODELS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterCustomer} onValueChange={setFilterCustomer}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Alla kunder" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alla kunder</SelectItem>
            {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterContract} onValueChange={setFilterContract}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Avtalsstatus" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alla maskiner</SelectItem>
            <SelectItem value="active">Aktivt avtal</SelectItem>
            <SelectItem value="none">Inget avtal</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="col-span-full text-center py-12 text-slate-400">
          <Monitor className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Inga maskiner hittades</p>
        </div>
      ) : (
        <>
          {/* Desktop Grid View */}
          <div className="hidden md:grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map(machine => renderCard(machine))}
          </div>

          {/* Mobile Carousel View */}
          <div className="md:hidden">
            {filtered.length > 1 && (
              <div className="text-center text-xs text-slate-400 mb-3 flex items-center justify-center gap-2">
                <span>←</span> Svep för fler maskiner ({filtered.length} st) <span>→</span>
              </div>
            )}
            <Carousel className="w-full" opts={{ align: "start" }}>
              <CarouselContent>
                {filtered.map(machine => (
                  <CarouselItem key={machine.id} className="basis-11/12 sm:basis-8/12">
                    {renderCard(machine, true)}
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          </div>
        </>
      )}

      {contractMachine && (
        <ServiceContractModal
          machine={contractMachine}
          onSave={handleContractSave}
          onClose={() => setContractMachine(null)}
        />
      )}

      {reportData && (
        <ServiceReportModal
          record={reportData.record}
          machine={reportData.machine}
          customer={reportData.customer}
          onClose={() => setReportData(null)}
        />
      )}

      {showForm && (
        <MachineForm
          machine={editing}
          customers={customers}
          preselectedCustomerId={preselectedCustomer}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditing(null); }}
        />
      )}
    </div>
  );
}