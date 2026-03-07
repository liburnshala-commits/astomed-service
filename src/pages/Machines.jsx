import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { Plus, Search, Monitor, Wrench, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import MachineForm from "@/components/machines/MachineForm.jsx";

const MODELS = [
  "Soprano Platinum", "Soprano Titanium", "Aldix (Triodus)",
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
        setMachines(m);
        setRecords(r);
      }
    } else {
      const [m, c, r] = await Promise.all([
        base44.entities.Machine.list("-created_date"),
        base44.entities.Customer.list(),
        base44.entities.ServiceRecord.list("-service_date")
      ]);
      setMachines(m);
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

  const filtered = machines.filter(m => {
    const matchSearch = m.serial_number?.toLowerCase().includes(search.toLowerCase()) || m.model?.toLowerCase().includes(search.toLowerCase());
    const matchModel = filterModel === "all" || m.model === filterModel;
    const matchCustomer = filterCustomer === "all" || m.customer_id === filterCustomer;
    return matchSearch && matchModel && matchCustomer;
  });

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

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
         <div>
           <h1 className="text-2xl font-bold astomed-title">Maskiner</h1>
           <p className="astomed-subtitle text-sm">{machines.length} maskiner registrerade</p>
         </div>
         {userRole !== "customer" && (
           <Button onClick={() => { setEditing(null); setShowForm(true); }} className="astomed-btn-primary">
             <Plus className="w-4 h-4 mr-2" /> Ny maskin
           </Button>
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
          return (
            <Card key={machine.id} className="astomed-card">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="astomed-icon-box flex-shrink-0" style={{ width: 40, height: 40 }}>
                    <Monitor className="w-5 h-5" style={{ color: "#1b3a3a" }} />
                  </div>
                  <Badge className={statusColor[machine.status || "active"]}>{statusLabel[machine.status || "active"]}</Badge>
                </div>
                <h3 className="font-bold astomed-title mb-0.5">{machine.model}</h3>
                <p className="text-xs astomed-muted mb-3 font-mono">SN: {machine.serial_number}</p>
                {customer && (
                  <div className="flex items-center gap-1.5 text-sm astomed-subtitle mb-3">
                    <Building2 className="w-3.5 h-3.5 astomed-muted" />
                    {customer.company_name}
                  </div>
                )}
                <div className="flex items-center justify-between text-xs astomed-muted mb-4 pt-3 border-t" style={{ borderColor: "#dce8e8" }}>
                  <span>{serviceCount} servicetillfällen</span>
                  {lastService && <span>Senast: {lastService.service_date}</span>}
                </div>
                <div className="flex gap-2">
                   <Link to={createPageUrl(`ServiceRecords?machine=${machine.id}`)} className="flex-1">
                     <Button size="sm" variant="outline" className="w-full">
                       <Wrench className="w-3 h-3 mr-1" /> Service
                     </Button>
                   </Link>
                   {userRole !== "customer" && (
                     <Button size="sm" variant="ghost" onClick={() => { setEditing(machine); setShowForm(true); }}>
                       Redigera
                     </Button>
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