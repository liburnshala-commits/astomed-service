import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { useLocation } from "react-router-dom";
import { Plus, Search, Wrench } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import ServiceRecordForm from "@/components/service/ServiceRecordForm.jsx";
import ServiceRecordDetail from "@/components/service/ServiceRecordDetail.jsx";
import CustomerServiceRequestForm from "@/components/service/CustomerServiceRequestForm.jsx";
import AdvancedFilters from "@/components/service/AdvancedFilters.jsx";
import PullToRefresh from "@/components/ui/pull-to-refresh.jsx";
import ServiceRecordCard from "@/components/service/ServiceRecordCard.jsx";
import ServiceRecordsList from "@/components/service/ServiceRecordsList.jsx";
import { useAuth } from "@/lib/AuthContext";
import { useServiceRecords } from "@/hooks/useServiceRecords";

export default function ServiceRecords() {
  const location = useLocation();
  const urlParams = new URLSearchParams(location.search);
  const preselectedMachine = urlParams.get("machine");
  const preselectedModel = urlParams.get("model");
  const preselectedId = urlParams.get("id");
  const isNewParam = urlParams.get("new") === "true";

  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    status: urlParams.get("status") || "all",
    type: "all",
    customer: "all",
    machine: "all",
    technician: "all",
    dateFrom: "",
    dateTo: "",
    minCost: "",
    maxCost: "",
    sortBy: "date_desc",
  });
  const [showForm, setShowForm] = useState(isNewParam);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);

  const { user } = useAuth();
  const userRole = user?.role;
  const { records, machines, customers, userCustomer, load } = useServiceRecords();

  useEffect(() => {
    if (isNewParam) {
      setShowForm(true);
    }
  }, [isNewParam]);

  useEffect(() => {
    if (preselectedId && records.length > 0) {
      const found = records.find(r => r.id === preselectedId);
      if (found) setViewing(found);
    }
  }, [preselectedId, records]);

  const getMachine = (id) => machines.find(m => m.id === id);
  const getCustomer = (id) => customers.find(c => c.id === id);

  const technicians = [...new Set(records.map(r => r.technician_name).filter(Boolean))].sort();

  const isNyinkommen = (r) => {
    if (!r.created_date) return false;
    const d = new Date(r.created_date);
    const today = new Date();
    return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear() && r.status === "pending";
  };

  const filtered = records.filter(r => {
    if (userRole === "customer" && userCustomer && r.customer_id !== userCustomer.id) return false;

    const machine = getMachine(r.machine_id);
    const customer = getCustomer(r.customer_id);
    const q = search.toLowerCase();

    if (q && !(
      machine?.model?.toLowerCase().includes(q) ||
      machine?.serial_number?.toLowerCase().includes(q) ||
      customer?.company_name?.toLowerCase().includes(q) ||
      customer?.org_number?.toLowerCase().includes(q) ||
      customer?.contact_person?.toLowerCase().includes(q) ||
      customer?.email?.toLowerCase().includes(q) ||
      customer?.phone?.toLowerCase().includes(q) ||
      r.technician_name?.toLowerCase().includes(q) ||
      r.description?.toLowerCase().includes(q)
    )) return false;

    if (filters.status !== "all" && r.status !== filters.status) return false;
    if (filters.type !== "all" && r.service_type !== filters.type) return false;
    if (filters.customer !== "all" && r.customer_id !== filters.customer) return false;
    if (filters.machine !== "all" && r.machine_id !== filters.machine) return false;
    if (filters.technician !== "all" && r.technician_name !== filters.technician) return false;
    if (filters.dateFrom && r.service_date && r.service_date < filters.dateFrom) return false;
    if (filters.dateTo && r.service_date && r.service_date > filters.dateTo) return false;
    if (filters.minCost !== "" && (r.total_cost || 0) < parseFloat(filters.minCost)) return false;
    if (filters.maxCost !== "" && (r.total_cost || 0) > parseFloat(filters.maxCost)) return false;
    if (preselectedMachine && r.machine_id !== preselectedMachine) return false;
    if (preselectedModel && machine?.model !== preselectedModel) return false;

    return true;
  }).sort((a, b) => {
    const aNew = isNyinkommen(a);
    const bNew = isNyinkommen(b);
    if (aNew && !bNew) return -1;
    if (!aNew && bNew) return 1;

    const getStatusWeight = (status) => {
      if (status === "in_progress") return 3;
      if (status === "planned") return 2;
      if (status === "pending") return 1;
      return 0;
    };
    
    const aWeight = getStatusWeight(a.status);
    const bWeight = getStatusWeight(b.status);
    
    if (aWeight > bWeight) return -1;
    if (aWeight < bWeight) return 1;

    if (filters.sortBy === "date_asc") return (a.created_date || "").localeCompare(b.created_date || "");
    if (filters.sortBy === "cost_desc") return (b.total_cost || 0) - (a.total_cost || 0);
    if (filters.sortBy === "cost_asc") return (a.total_cost || 0) - (b.total_cost || 0);
    return (b.created_date || "").localeCompare(a.created_date || ""); // date_desc default
  });

  const handleCopyLink = (record, e) => {
    e.stopPropagation();
    const url = window.location.origin + createPageUrl(`ServiceRecords?id=${record.id}`);
    navigator.clipboard.writeText(url);
    toast.success("Länk kopierad till urklipp!");
  };

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
    try {
      const currentUser = await base44.auth.me();
      // Auto-update machine status when service is completed or invoiced
      if (data.machine_id && (data.status === "completed" || data.status === "invoiced")) {
        const machine = getMachine(data.machine_id);
        if (machine?.status === "service") {
          await base44.entities.Machine.update(data.machine_id, { status: "active" });
        }
      }
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
    } catch (error) {
      console.error("Fel vid sparning av serviceärende:", error);
      alert("Det gick inte att spara: " + (error.message || "okänt fel"));
    }
  };

  return (
    <PullToRefresh onRefresh={load}>
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold astomed-title">Serviceärenden</h1>
          {preselectedMachine && (
            <p className="text-slate-500 text-sm">
              Filtrerat: {getMachine(preselectedMachine)?.model} · {getMachine(preselectedMachine)?.serial_number}
            </p>
          )}
          {preselectedModel && !preselectedMachine && (
            <p className="text-slate-500 text-sm">Modell: {preselectedModel}</p>
          )}
          {!preselectedMachine && !preselectedModel && <p className="astomed-subtitle text-sm">{records.length} totalt</p>}
        </div>
        {userRole !== "customer" && (
          <Button onClick={() => { setEditing(null); setShowForm(true); }} className="astomed-btn-primary">
            <Plus className="w-4 h-4 mr-2" /> Nytt ärende
          </Button>
        )}
        {userRole === "customer" && (
          <Button onClick={() => { setEditing(null); setShowForm(true); }} className="astomed-btn-primary">
            <Plus className="w-4 h-4 mr-2" /> Beställ service
          </Button>
        )}
      </div>

      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Sök maskin, serienummer, kund, kontakt, e-post, tekniker, beskrivning..."
            className="pl-9"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <AdvancedFilters
          filters={filters}
          onChange={setFilters}
          customers={customers}
          machines={machines}
          technicians={technicians}
        />
      </div>

      <ServiceRecordsList
        records={filtered}
        filters={filters}
        setFilters={setFilters}
        getMachine={getMachine}
        getCustomer={getCustomer}
        isNyinkommen={isNyinkommen}
        userRole={userRole}
        setViewing={setViewing}
        setEditing={setEditing}
        setShowForm={setShowForm}
        handleCopyLink={handleCopyLink}
        handleDelete={handleDelete}
      />

      {showForm && userRole === "customer" && (
        <CustomerServiceRequestForm
          machines={machines}
          customer={userCustomer}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={() => { setShowForm(false); load(); }}
        />
      )}

      {showForm && userRole !== "customer" && (
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
          userRole={userRole}
          onClose={() => setViewing(null)}
          onEdit={() => { setEditing(viewing); setViewing(null); setShowForm(true); }}
          onUpdated={load}
          onDeleted={load}
        />
      )}
    </div>
    </PullToRefresh>
  );
}