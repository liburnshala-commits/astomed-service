import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Plus, Search, Wrench, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import ServiceRecordForm from "@/components/service/ServiceRecordForm.jsx";
import ServiceRecordDetail from "@/components/service/ServiceRecordDetail.jsx";
import CustomerServiceRequestForm from "@/components/service/CustomerServiceRequestForm.jsx";
import AdvancedFilters from "@/components/service/AdvancedFilters.jsx";

const statusColor = {
  pending: "bg-yellow-100 text-yellow-800",
  awaiting_approval: "bg-orange-100 text-orange-800",
  in_progress: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  invoiced: "bg-purple-100 text-purple-800"
};
const statusLabel = { pending: "Väntar", awaiting_approval: "Inväntar godkännande", in_progress: "Pågående", completed: "Slutförd", invoiced: "Fakturerad" };
const typeLabel = { standard: "Standard", advanced: "Avancerad" };
const typeColor = { standard: "bg-slate-100 text-slate-700", advanced: "bg-indigo-100 text-indigo-700" };

export default function ServiceRecords() {
  const [records, setRecords] = useState([]);
  const [machines, setMachines] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [user, setUser] = useState(null);
  const [userCustomer, setUserCustomer] = useState(null);
  const urlParams = new URLSearchParams(window.location.search);
  const preselectedMachine = urlParams.get("machine");

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState(urlParams.get("status") || "all");
  const [filterType, setFilterType] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);

  const load = async () => {
    const currentUser = await base44.auth.me();
    setUser(currentUser);

    if (currentUser?.role === "customer") {
      // Customers: only fetch their own data
      const allCustomers = await base44.entities.Customer.filter({ email: currentUser.email });
      const cust = allCustomers[0] || null;
      setUserCustomer(cust);
      setCustomers(cust ? [cust] : []);

      if (cust) {
        const [r, m] = await Promise.all([
          base44.entities.ServiceRecord.filter({ customer_id: cust.id }, "-service_date"),
          base44.entities.Machine.filter({ customer_id: cust.id })
        ]);
        setRecords(r);
        setMachines(m);
      } else {
        setRecords([]);
        setMachines([]);
      }
    } else {
      const [r, m, c] = await Promise.all([
        base44.entities.ServiceRecord.list("-service_date"),
        base44.entities.Machine.list(),
        base44.entities.Customer.list()
      ]);
      setRecords(r);
      setMachines(m);
      setCustomers(c);
    }
  };

  useEffect(() => { load(); }, []);

  const getMachine = (id) => machines.find(m => m.id === id);
  const getCustomer = (id) => customers.find(c => c.id === id);

  const filtered = records.filter(r => {
    // Customers only see their own records
    if (user?.role === "customer" && userCustomer && r.customer_id !== userCustomer.id) {
      return false;
    }
    
    const machine = getMachine(r.machine_id);
    const customer = getCustomer(r.customer_id);
    const matchSearch = machine?.model?.toLowerCase().includes(search.toLowerCase()) ||
      machine?.serial_number?.toLowerCase().includes(search.toLowerCase()) ||
      customer?.company_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.technician_name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || r.status === filterStatus;
    const matchType = filterType === "all" || r.service_type === filterType;
    const matchMachine = !preselectedMachine || r.machine_id === preselectedMachine;
    return matchSearch && matchStatus && matchType && matchMachine;
  });

  const handleDelete = async (record, e) => {
    e.stopPropagation();
    if (!window.confirm(`Radera serviceärendet för ${getMachine(record.machine_id)?.model || "maskinen"}? Detta kan inte ångras.`)) return;
    await base44.entities.ServiceRecord.delete(record.id);
    const currentUser = await base44.auth.me();
    base44.functions.invoke('logAuditEntry', {
      action: 'delete',
      entity_type: 'ServiceRecord',
      entity_id: record.id,
      entity_label: `${getMachine(record.machine_id)?.model || 'Okänd maskin'} – ${getCustomer(record.customer_id)?.company_name || ''}`,
      user_email: currentUser?.email || 'unknown',
      user_name: currentUser?.full_name || currentUser?.email,
      details: `Serviceärende raderat`
    });
    load();
  };

  const handleSave = async (data) => {
    const currentUser = await base44.auth.me();
    if (editing) {
      await base44.entities.ServiceRecord.update(editing.id, data);
      base44.functions.invoke('logAuditEntry', {
        action: 'update',
        entity_type: 'ServiceRecord',
        entity_id: editing.id,
        entity_label: `${getMachine(editing.machine_id)?.model || 'Okänd maskin'} – ${getCustomer(editing.customer_id)?.company_name || ''}`,
        user_email: currentUser?.email || 'unknown',
        user_name: currentUser?.full_name || currentUser?.email,
        details: `Serviceärende uppdaterat, status: ${data.status}`
      });
    } else {
      const created = await base44.entities.ServiceRecord.create(data);
      base44.functions.invoke('logAuditEntry', {
        action: 'create',
        entity_type: 'ServiceRecord',
        entity_id: created.id,
        entity_label: `${getMachine(data.machine_id)?.model || 'Okänd maskin'} – ${getCustomer(data.customer_id)?.company_name || ''}`,
        user_email: currentUser?.email || 'unknown',
        user_name: currentUser?.full_name || currentUser?.email,
        details: `Nytt serviceärende skapat, typ: ${data.service_type}`
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
          <h1 className="text-2xl font-bold astomed-title">Serviceärenden</h1>
          {preselectedMachine && (
            <p className="text-slate-500 text-sm">
              Filtrerat: {getMachine(preselectedMachine)?.model} · {getMachine(preselectedMachine)?.serial_number}
            </p>
          )}
          {!preselectedMachine && <p className="astomed-subtitle text-sm">{records.length} totalt</p>}
        </div>
        {user?.role !== "customer" && (
          <Button onClick={() => { setEditing(null); setShowForm(true); }} className="astomed-btn-primary">
            <Plus className="w-4 h-4 mr-2" /> Nytt ärende
          </Button>
        )}
        {user?.role === "customer" && (
          <Button onClick={() => { setEditing(null); setShowForm(true); }} className="astomed-btn-primary">
            <Plus className="w-4 h-4 mr-2" /> Beställ service
          </Button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Sök maskin, kund, tekniker..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alla statuser</SelectItem>
            <SelectItem value="pending">Väntar</SelectItem>
            <SelectItem value="awaiting_approval">Inväntar godkännande</SelectItem>
            <SelectItem value="in_progress">Pågående</SelectItem>
            <SelectItem value="completed">Slutförd</SelectItem>
            <SelectItem value="invoiced">Fakturerad</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Typ" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alla typer</SelectItem>
            <SelectItem value="standard">Standard</SelectItem>
            <SelectItem value="advanced">Avancerad</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {filtered.map(record => {
          const machine = getMachine(record.machine_id);
          const customer = getCustomer(record.customer_id);
          return (
            <Card key={record.id} className="astomed-card cursor-pointer" onClick={() => setViewing(record)}>
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 astomed-icon-box flex-shrink-0" style={{ width: 40, height: 40 }}>
                    <Wrench className="w-5 h-5" style={{ color: "#1b3a3a" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-semibold astomed-title">{machine?.model || "Okänd maskin"}</span>
                      <Badge className={typeColor[record.service_type]}>{typeLabel[record.service_type]}</Badge>
                      <Badge className={statusColor[record.status]}>{statusLabel[record.status]}</Badge>
                    </div>
                    <div className="text-xs astomed-muted font-mono mb-1">SN: {machine?.serial_number}</div>
                    <div className="flex flex-wrap gap-4 text-sm astomed-subtitle">
                      <span>{customer?.company_name || "Okänd kund"}</span>
                      <span>Tekniker: {record.technician_name}</span>
                      <span>{record.service_date ? format(new Date(record.service_date), "d MMM yyyy", { locale: sv }) : ""}</span>
                    </div>
                    {record.total_cost > 0 && (
                      <div className="text-sm font-semibold astomed-title mt-1">{record.total_cost?.toLocaleString("sv-SE")} kr</div>
                    )}
                  </div>
                  <div className="flex gap-2 flex-shrink-0 self-start" onClick={e => e.stopPropagation()}>
                    <Button size="sm" variant="outline" onClick={() => { setEditing(record); setShowForm(true); }}>
                      <span className="hidden sm:inline">Redigera</span><span className="sm:hidden">✏️</span>
                    </Button>
                    {(user?.role !== "customer" || record.status === "pending") && (
                      <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={(e) => handleDelete(record, e)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <Wrench className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Inga serviceärenden hittades</p>
          </div>
        )}
      </div>

      {showForm && user?.role === "customer" && (
        <CustomerServiceRequestForm
          machines={machines}
          customer={userCustomer}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={() => { setShowForm(false); load(); }}
        />
      )}

      {showForm && user?.role !== "customer" && (
        <ServiceRecordForm
          record={editing}
          machines={machines}
          customers={customers}
          preselectedMachineId={preselectedMachine}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditing(null); }}
        />
      )}

      {viewing && (
        <ServiceRecordDetail
          record={viewing}
          machine={getMachine(viewing.machine_id)}
          customer={getCustomer(viewing.customer_id)}
          userRole={user?.role}
          onClose={() => setViewing(null)}
          onEdit={() => { setEditing(viewing); setViewing(null); setShowForm(true); }}
          onUpdated={load}
          onDeleted={load}
        />
      )}
    </div>
  );
}