import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { Plus, Search, Monitor, Wrench, Building2, FileCheck, Download, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import MachineForm from "@/components/machines/MachineForm.jsx";
import ServiceContractModal from "@/components/machines/ServiceContractModal.jsx";

const MODELS = [
  "Soprano Platinum", "Soprano Titanium", "Alma Harmony", "Aldix (Triodus)",
  "PrimeLase", "Elysion", "PicoLo", "Helius", "Splendor X", "Pento"
];

const statusColor = { active: "bg-green-100 text-green-700", inactive: "bg-slate-100 text-slate-600", service: "bg-orange-100 text-orange-700" };
const statusLabel = { active: "Aktiv", inactive: "Inaktiv", service: "På service" };

export default function Machines() {
  const [machines, setMachines] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState("");
  const [filterModel, setFilterModel] = useState("all");
  const [filterCustomer, setFilterCustomer] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [contractMachine, setContractMachine] = useState(null);
  const [userRole, setUserRole] = useState(null);

  const urlParams = new URLSearchParams(window.location.search);
  const preselectedCustomer = urlParams.get("customer");

  const load = async () => {
    const currentUser = await base44.auth.me();
    setUserRole(currentUser?.role);
    if (currentUser?.role === "customer") {
      const ownCustomers = await base44.entities.Customer.filter({ email: currentUser.email });
      const cust = ownCustomers[0];
      setCustomers(cust ? [cust] : []);
      if (cust) {
        const [m, r] = await Promise.all([
          base44.entities.Machine.filter({ customer_id: cust.id }, "-created_date"),
          base44.entities.ServiceRecord.filter({ customer_id: cust.id }, "-service_date")
        ]);
        setMachines(m.filter(x => !x.is_deleted));
        setRecords(r);
      }
    } else {
      const [m, c, r] = await Promise.all([
        base44.entities.Machine.list("-created_date"),
        base44.entities.Customer.list(),
        base44.entities.ServiceRecord.list("-service_date")
      ]);
      setMachines(m.filter(x => !x.is_deleted));
      setCustomers(c);
      setRecords(r);
    }
  };

  useEffect(() => {
    load();
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
    const matchSearch = m.serial_number?.toLowerCase().includes(search.toLowerCase()) || m.model?.toLowerCase().includes(search.toLowerCase());
    const matchModel = filterModel === "all" || m.model === filterModel;
    const matchCustomer = filterCustomer === "all" || m.customer_id === filterCustomer;
    return matchSearch && matchModel && matchCustomer;
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
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map(machine => {
          const customer = getCustomer(machine.customer_id);
          const serviceCount = getServiceCount(machine.id);
          const lastService = getLastService(machine.id);
          const displayServiceDate = lastService ? lastService.service_date : machine.service_date;
          return (
            <Card key={machine.id} className="astomed-card">
              <CardContent className="p-5">
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
                <div className="text-xs astomed-muted mb-4 pt-3 border-t space-y-1" style={{ borderColor: "#dce8e8" }}>
                  <div className="flex items-center justify-between">
                    <span>{serviceCount} servicetillfällen</span>
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
                      <div className="flex items-center justify-between">
                        <span>
                          Avtal: <span className={`font-semibold px-1.5 py-0.5 rounded ${expired ? "bg-red-100 text-red-700" : contractBadgeColor[machine.service_contract]}`}>{contractLabel[machine.service_contract] || machine.service_contract}</span>
                        </span>
                        <span className={expired ? "text-red-600 font-medium" : ""}>
                          {expired ? "Utgånget " : "Giltigt t.o.m. "}{expiry.toLocaleDateString("sv-SE")}
                        </span>
                      </div>
                    );
                  })()}
                </div>
                <div className="flex gap-2 flex-wrap">
                   <Link to={createPageUrl(`ServiceRecords?machine=${machine.id}`)}>
                     <Button size="sm" variant="outline" className="w-full">
                       <Wrench className="w-3 h-3 mr-1" /> Starta service
                     </Button>
                   </Link>
                   {userRole !== "customer" && (
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
              </CardContent>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-12 text-slate-400">
            <Monitor className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Inga maskiner hittades</p>
          </div>
        )}
      </div>

      {contractMachine && (
        <ServiceContractModal
          machine={contractMachine}
          onSave={handleContractSave}
          onClose={() => setContractMachine(null)}
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