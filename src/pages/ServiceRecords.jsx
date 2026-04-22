import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { useLocation } from "react-router-dom";
import { Plus, Search, Wrench, Trash2, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import ServiceRecordForm from "@/components/service/ServiceRecordForm.jsx";
import ServiceRecordDetail from "@/components/service/ServiceRecordDetail.jsx";
import CustomerServiceRequestForm from "@/components/service/CustomerServiceRequestForm.jsx";
import AdvancedFilters from "@/components/service/AdvancedFilters.jsx";
import PullToRefresh from "@/components/ui/pull-to-refresh.jsx";
import { useAuth } from "@/lib/AuthContext";

const statusColor = {
  pending: "bg-yellow-100 text-yellow-800",
  planned: "bg-blue-100 text-blue-800",
  awaiting_approval: "bg-orange-100 text-orange-800",
  in_progress: "bg-yellow-400 text-yellow-900",
  completed: "bg-green-100 text-green-800",
  invoiced: "bg-purple-100 text-purple-800"
};
const statusLabel = { pending: "Väntar", planned: "Planerad", awaiting_approval: "Inväntar godkännande", in_progress: "Pågående", completed: "Slutförd", invoiced: "Fakturerad" };
const typeLabel = { standard: "Standard", advanced: "Avancerad" };
const typeColor = { standard: "bg-slate-100 text-slate-700", advanced: "bg-indigo-100 text-indigo-700" };

export default function ServiceRecords() {
  const queryClient = useQueryClient();
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

  useEffect(() => {
    if (isNewParam) {
      setShowForm(true);
    }
  }, [isNewParam]);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);

  const { user } = useAuth();

  const { data: pageData } = useQuery({
    queryKey: ["serviceRecordsPage", user?.role, user?.email],
    queryFn: async () => {
      if (user?.role === "customer") {
        const allCustomers = await base44.entities.Customer.filter({ email: user.email });
        const cust = allCustomers[0] || null;
        if (cust) {
          const [r, m] = await Promise.all([
            base44.entities.ServiceRecord.filter({ customer_id: cust.id }, "-created_date"),
            base44.entities.Machine.filter({ customer_id: cust.id })
          ]);
          return { records: r, machines: m, customers: [cust], userCustomer: cust };
        }
        return { records: [], machines: [], customers: [], userCustomer: null };
      } else {
        const [r, m, c] = await Promise.all([
          base44.entities.ServiceRecord.list("-created_date"),
          base44.entities.Machine.list(),
          base44.entities.Customer.list()
        ]);
        return { records: r, machines: m, customers: c, userCustomer: null };
      }
    },
    enabled: !!user,
    staleTime: 30 * 1000,
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
    keepPreviousData: true,
  });

  const records = pageData?.records || [];
  const machines = pageData?.machines || [];
  const customers = pageData?.customers || [];
  const userCustomer = pageData?.userCustomer || null;

  const load = () => queryClient.invalidateQueries({ queryKey: ["serviceRecordsPage"] });

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
    if (user?.role === "customer" && userCustomer && r.customer_id !== userCustomer.id) return false;

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

      <Tabs value={filters.status} onValueChange={(val) => setFilters(f => ({ ...f, status: val }))} className="w-full mt-6">
        <div className="overflow-x-auto pb-2 -mx-6 px-6 md:mx-0 md:px-0">
          <TabsList className="h-auto p-1 bg-slate-100/50 flex w-max min-w-full">
            <TabsTrigger value="all" className="flex-1 whitespace-nowrap">Alla</TabsTrigger>
            <TabsTrigger value="in_progress" className="flex-1 whitespace-nowrap">Pågående</TabsTrigger>
            <TabsTrigger value="planned" className="flex-1 whitespace-nowrap">Planerad</TabsTrigger>
            <TabsTrigger value="pending" className="flex-1 whitespace-nowrap">Väntande</TabsTrigger>
            <TabsTrigger value="awaiting_approval" className="flex-1 whitespace-nowrap">Inväntar godkännande</TabsTrigger>
            <TabsTrigger value="completed" className="flex-1 whitespace-nowrap">Slutförd</TabsTrigger>
            <TabsTrigger value="invoiced" className="flex-1 whitespace-nowrap">Fakturerad</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value={filters.status} className="mt-4 focus-visible:outline-none focus-visible:ring-0">
          {/* Desktop List View */}
        <div className="hidden md:flex flex-col space-y-3">
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
                        {isNyinkommen(record) && <Badge className="bg-red-500 text-white hover:bg-red-600 border-0">Nyinkommen</Badge>}
                        <Badge className={typeColor[record.service_type]}>{typeLabel[record.service_type]}</Badge>
                        <Badge className={statusColor[record.status]}>{statusLabel[record.status]}</Badge>
                      </div>
                      <div className="text-xs astomed-muted font-mono mb-1">SN: {machine?.serial_number}</div>
                      <div className="flex flex-wrap gap-4 text-sm astomed-subtitle">
                        <span>{customer?.company_name || "Okänd kund"}{customer?.city ? ` (${customer.city})` : ""}</span>
                        <span>Tekniker: {record.technician_name}</span>
                        <span>{record.service_date ? format(new Date(record.service_date), "d MMM yyyy", { locale: sv }) : ""}</span>
                      </div>
                      {record.total_cost > 0 && (
                        <div className="text-sm font-semibold astomed-title mt-1">{record.total_cost?.toLocaleString("sv-SE")} kr</div>
                      )}
                    </div>
                    <div className="flex gap-2 flex-shrink-0 self-start" onClick={e => e.stopPropagation()}>
                      <Button size="sm" variant="outline" onClick={(e) => handleCopyLink(record, e)} title="Kopiera länk till ärende">
                        <Copy className="w-4 h-4 mr-2" /> Kopiera länk
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => { setEditing(record); setShowForm(true); }}>
                        Redigera
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
        </div>

        {/* Mobile Carousel View */}
        <div className="md:hidden pb-4 mt-4">
          {filtered.length > 1 && (
            <div className="text-center text-xs text-slate-400 mb-3 flex items-center justify-center gap-2">
              <span>←</span> Svep för fler ärenden ({filtered.length} st) <span>→</span>
            </div>
          )}
          <Carousel className="w-full" opts={{ align: "start" }}>
            <CarouselContent>
              {filtered.map(record => {
                const machine = getMachine(record.machine_id);
                const customer = getCustomer(record.customer_id);
                return (
                  <CarouselItem key={record.id} className="basis-11/12 sm:basis-8/12">
                    <Card className="bg-white shadow-sm border-slate-200 mx-1 h-full flex flex-col cursor-pointer" onClick={() => setViewing(record)}>
                      <CardContent className="p-4 space-y-4 flex-1 flex flex-col">
                        <div className="flex justify-between items-start gap-2">
                          <div className="min-w-0">
                            <h3 className="font-semibold text-lg leading-tight text-slate-900 truncate">{machine?.model || "Okänd maskin"}</h3>
                            <div className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
                              <span className="truncate font-mono text-xs">SN: {machine?.serial_number}</span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1 flex-shrink-0">
                            {isNyinkommen(record) && (
                              <Badge className="bg-red-500 text-white hover:bg-red-600 border-0 px-2.5 py-1 text-[10px] uppercase tracking-wider text-center">
                                Nyinkommen
                              </Badge>
                            )}
                            <Badge className={`border-0 px-2.5 py-1 text-[10px] uppercase tracking-wider text-center ${statusColor[record.status]}`}>
                              {statusLabel[record.status]}
                            </Badge>
                            <Badge className={`border-0 px-2 py-0.5 text-[10px] ${typeColor[record.service_type]}`}>
                              {typeLabel[record.service_type]}
                            </Badge>
                          </div>
                        </div>

                        <div className="space-y-2 text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100 flex-1">
                          <div className="flex justify-between items-center py-1">
                            <span className="text-slate-500">Kund:</span>
                            <span className="font-medium truncate max-w-[150px] text-right" title={customer?.city ? `${customer.company_name} (${customer.city})` : customer?.company_name}>{customer?.company_name || "Okänd kund"}{customer?.city ? ` (${customer.city})` : ""}</span>
                          </div>
                          <div className="flex justify-between items-center py-1">
                            <span className="text-slate-500">Tekniker:</span>
                            <span className="font-medium">{record.technician_name || "Ej angiven"}</span>
                          </div>
                          <div className="flex justify-between items-center py-1">
                            <span className="text-slate-500">Datum:</span>
                            <span className="font-medium">{record.service_date ? format(new Date(record.service_date), "d MMM yyyy", { locale: sv }) : "-"}</span>
                          </div>
                          {record.total_cost > 0 && (
                            <div className="flex justify-between items-center py-1 pt-2 border-t border-slate-200 mt-1">
                              <span className="text-slate-500">Total kostnad:</span>
                              <span className="font-bold text-slate-900">{record.total_cost?.toLocaleString("sv-SE")} kr</span>
                            </div>
                          )}
                        </div>

                        <div className="pt-2 space-y-2">
                          <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                            <Button className="h-11 px-4 text-slate-500" variant="outline" onClick={(e) => handleCopyLink(record, e)} title="Kopiera länk">
                              <Copy className="w-4 h-4 mr-2" /> Länk
                            </Button>
                            <Button className="flex-1 h-11" variant="outline" onClick={() => { setEditing(record); setShowForm(true); }}>
                              Redigera
                            </Button>
                            {(user?.role !== "customer" || record.status === "pending") && (
                              <Button className="h-11 px-4 text-red-500 hover:text-red-700 hover:bg-red-50 border border-transparent hover:border-red-100" variant="ghost" onClick={(e) => handleDelete(record, e)}>
                                <Trash2 className="w-5 h-5" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </CarouselItem>
                );
              })}
            </CarouselContent>
          </Carousel>
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-400 w-full">
            <Wrench className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Inga serviceärenden hittades</p>
          </div>
        )}
        </TabsContent>
      </Tabs>

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
    </PullToRefresh>
  );
}