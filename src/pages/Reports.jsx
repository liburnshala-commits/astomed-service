import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { FileText, Search, Eye, Mail, Filter, CalendarDays, Download, BarChart2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import ServiceReportModal from "@/components/service/ServiceReportModal.jsx";
import SummaryReportModal from "@/components/reports/SummaryReportModal.jsx";
import AnalyticsDashboard from "@/components/reports/AnalyticsDashboard.jsx";
import { toast } from "sonner";

const statusColor = {
  pending: "bg-yellow-100 text-yellow-800",
  in_progress: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  invoiced: "bg-purple-100 text-purple-800"
};
const statusLabel = { pending: "Väntar", in_progress: "Pågående", completed: "Slutförd", invoiced: "Fakturerad" };

function getYears(records) {
  const years = new Set();
  records.forEach(r => {
    if (r.service_date) years.add(new Date(r.service_date).getFullYear());
  });
  return Array.from(years).sort((a, b) => b - a);
}

export default function Reports() {
  const [records, setRecords] = useState([]);
  const [machines, setMachines] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [user, setUser] = useState(null);
  const [search, setSearch] = useState("");
  const [filterYear, setFilterYear] = useState("current");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [filterCustomer, setFilterCustomer] = useState("all");
  const [filterMachine, setFilterMachine] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterTechnician, setFilterTechnician] = useState("all");
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showSummary, setShowSummary] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [activeTab, setActiveTab] = useState("list");

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
    Promise.all([
      base44.entities.ServiceRecord.list("-service_date"),
      base44.entities.Machine.list(),
      base44.entities.Customer.list()
    ]).then(([r, m, c]) => { setRecords(r); setMachines(m); setCustomers(c); });
  }, []);

  const getMachine = (id) => machines.find(m => m.id === id);
  const getCustomer = (id) => customers.find(c => c.id === id);

  // Auto-select machine when customer has only one
  useEffect(() => {
    if (filterCustomer === "all") {
      setFilterMachine("all");
      return;
    }
    const customerMachines = machines.filter(m => m.customer_id === filterCustomer);
    if (customerMachines.length === 1) {
      setFilterMachine(customerMachines[0].id);
    } else {
      setFilterMachine("all");
    }
  }, [filterCustomer, machines]);

  const currentYear = new Date().getFullYear();
  const availableYears = getYears(records);
  const technicians = [...new Set(records.map(r => r.technician_name).filter(Boolean))].sort();

  const filtered = records.filter(r => {
    // Year filter (only if no custom date range)
    if (!filterDateFrom && !filterDateTo) {
      if (filterYear === "current") {
        if (!r.service_date || new Date(r.service_date).getFullYear() !== currentYear) return false;
      } else if (filterYear !== "all") {
        if (!r.service_date || new Date(r.service_date).getFullYear() !== parseInt(filterYear)) return false;
      }
    }
    // Custom date range
    if (filterDateFrom && r.service_date && r.service_date < filterDateFrom) return false;
    if (filterDateTo && r.service_date && r.service_date > filterDateTo) return false;
    // Customer filter
    if (filterCustomer !== "all" && r.customer_id !== filterCustomer) return false;
    // Machine filter
    if (filterMachine !== "all" && r.machine_id !== filterMachine) return false;
    // Status filter
    if (filterStatus !== "all" && r.status !== filterStatus) return false;
    // Technician filter
    if (filterTechnician !== "all" && r.technician_name !== filterTechnician) return false;
    // Search
    if (search) {
      const machine = getMachine(r.machine_id);
      const customer = getCustomer(r.customer_id);
      const q = search.toLowerCase();
      return (
        machine?.model?.toLowerCase().includes(q) ||
        customer?.company_name?.toLowerCase().includes(q) ||
        r.technician_name?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Build a human-readable filter label for the report
  function buildFilterLabel() {
    const parts = [];
    if (filterYear === "current") parts.push(`År ${currentYear}`);
    else if (filterYear === "all") parts.push("Hela historiken");
    else parts.push(`År ${filterYear}`);
    if (filterCustomer !== "all") {
      const c = customers.find(c => c.id === filterCustomer);
      if (c) parts.push(c.company_name);
    }
    if (filterMachine !== "all") {
      const m = machines.find(m => m.id === filterMachine);
      if (m) parts.push(m.model);
    }
    if (filterStatus !== "all") parts.push(statusLabel[filterStatus] || filterStatus);
    return parts.join(" · ");
  }

  function handleExportCSV() {
    const headers = ["Datum", "Kund", "Maskin", "Serienummer", "Tekniker", "Status", "Arbetstimmar", "Arbetskostnad", "Reservdelskostnad", "Totalkostnad", "Beskrivning"];
    const rows = filtered.map(r => {
      const machine = getMachine(r.machine_id);
      const customer = getCustomer(r.customer_id);
      const partsTotal = (r.parts_used || []).reduce((s, p) => s + (p.unit_price || 0) * (p.quantity || 1), 0);
      return [
        r.service_date || "",
        customer?.company_name || "",
        machine?.model || "",
        machine?.serial_number || "",
        r.technician_name || "",
        statusLabel[r.status] || r.status || "",
        r.labor_hours || 0,
        r.labor_cost || 0,
        partsTotal,
        r.total_cost || 0,
        (r.description || "").replace(/"/g, '""'),
      ];
    });
    const csvContent = [headers, ...rows].map(row => row.map(v => `"${v}"`).join(";")).join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `servicerapport_${format(new Date(), "yyyyMMdd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exporterad!");
  }

  async function handleSendEmail() {
    // Determine customer email to use
    let email = null;
    let customerName = null;
    let customerId = null;
    if (filterCustomer !== "all") {
      const c = customers.find(c => c.id === filterCustomer);
      email = c?.email;
      customerName = c?.company_name;
      customerId = c?.id;
    }
    if (!email) {
      toast.error("Välj en specifik kund för att skicka rapport via e-post.");
      return;
    }
    setSendingEmail(true);
    try {
      await base44.functions.invoke("sendReportEmail", {
        customerEmail: email,
        customerName,
        filterLabel: buildFilterLabel(),
        recordCount: filtered.length,
      });

      // Log to AuditLog
      await base44.entities.AuditLog.create({
        action: "create",
        entity_type: "Rapport",
        entity_id: customerId || "unknown",
        entity_label: customerName,
        user_email: user?.email || "",
        user_name: user?.full_name || user?.email || "",
        details: `Servicerapport skickad till ${email} · ${buildFilterLabel()} · ${filtered.length} ärenden`,
      });

      toast.success(`Rapport skickad till ${email}`);
    } catch (e) {
      toast.error("Kunde inte skicka e-post: " + e.message);
    }
    setSendingEmail(false);
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Rapporter</h1>
          <p className="text-slate-500 text-sm">Filtrera, analysera och exportera servicedata</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {activeTab === "list" && (<>
          <Button
            variant="outline"
            onClick={handleExportCSV}
            disabled={filtered.length === 0}
          >
            <Download className="w-4 h-4 mr-1" />
            Exportera CSV
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowSummary(true)}
            disabled={filtered.length === 0}
          >
            <FileText className="w-4 h-4 mr-1" />
            Generera PDF ({filtered.length})
          </Button>
          <Button
            onClick={handleSendEmail}
            disabled={sendingEmail || filtered.length === 0}
            className="astomed-btn-primary"
          >
            <Mail className="w-4 h-4 mr-1" />
            {sendingEmail ? "Skickar..." : "Skicka till kund"}
          </Button>
          </>)}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("list")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "list" ? "border-teal-600 text-teal-700" : "border-transparent text-slate-500 hover:text-slate-700"}`}
        >
          <FileText className="w-4 h-4 inline mr-1.5 -mt-0.5" />
          Serviceärenden
        </button>
        <button
          onClick={() => setActiveTab("analytics")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "analytics" ? "border-teal-600 text-teal-700" : "border-transparent text-slate-500 hover:text-slate-700"}`}
        >
          <BarChart2 className="w-4 h-4 inline mr-1.5 -mt-0.5" />
          Analyser
        </button>
      </div>

      {activeTab === "analytics" && (
        <AnalyticsDashboard records={records} machines={machines} customers={customers} />
      )}

      {activeTab === "list" && (
      <div className="space-y-6">

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3 text-slate-600 font-medium text-sm">
            <Filter className="w-4 h-4" /> Filter
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Year */}
            <div>
              <div className="text-xs text-slate-400 mb-1 flex items-center gap-1"><CalendarDays className="w-3 h-3" /> Tidsperiod</div>
              <Select value={filterYear} onValueChange={v => { setFilterYear(v); setFilterDateFrom(""); setFilterDateTo(""); }}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current">Innevarande år ({currentYear})</SelectItem>
                  <SelectItem value="all">Hela historiken</SelectItem>
                  {availableYears.filter(y => y !== currentYear).map(y => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Date from */}
            <div>
              <div className="text-xs text-slate-400 mb-1">Från datum</div>
              <input
                type="date"
                className="h-8 text-sm w-full border border-input rounded-md px-2 bg-background"
                value={filterDateFrom}
                onChange={e => setFilterDateFrom(e.target.value)}
              />
            </div>
            {/* Date to */}
            <div>
              <div className="text-xs text-slate-400 mb-1">Till datum</div>
              <input
                type="date"
                className="h-8 text-sm w-full border border-input rounded-md px-2 bg-background"
                value={filterDateTo}
                onChange={e => setFilterDateTo(e.target.value)}
              />
            </div>
            {/* Customer */}
            <div>
              <div className="text-xs text-slate-400 mb-1">Kund</div>
              <Select value={filterCustomer} onValueChange={setFilterCustomer}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Alla kunder" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alla kunder</SelectItem>
                  {customers.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Machine */}
            <div>
              <div className="text-xs text-slate-400 mb-1">Maskin</div>
              <Select value={filterMachine} onValueChange={setFilterMachine}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Alla maskiner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alla maskiner</SelectItem>
                  {(filterCustomer !== "all"
                    ? machines.filter(m => m.customer_id === filterCustomer)
                    : machines
                  ).map(m => (
                    <SelectItem key={m.id} value={m.id}>{m.model} · {m.serial_number}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Status */}
            <div>
              <div className="text-xs text-slate-400 mb-1">Status</div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Alla statusar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alla statusar</SelectItem>
                  <SelectItem value="pending">Väntar</SelectItem>
                  <SelectItem value="awaiting_approval">Inv. godkänn.</SelectItem>
                  <SelectItem value="in_progress">Pågående</SelectItem>
                  <SelectItem value="completed">Slutförd</SelectItem>
                  <SelectItem value="invoiced">Fakturerad</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* Technician */}
            <div>
              <div className="text-xs text-slate-400 mb-1">Tekniker</div>
              <Select value={filterTechnician} onValueChange={setFilterTechnician}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Alla tekniker" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alla tekniker</SelectItem>
                  {technicians.map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input placeholder="Sök kund, maskin eller tekniker..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Active filter label */}
      {filtered.length > 0 && (
        <div className="text-xs text-slate-500 flex items-center gap-1">
          <span className="font-medium text-slate-700">{filtered.length} ärenden</span> för: {buildFilterLabel()}
        </div>
      )}

      {/* Records list */}
      <div className="space-y-3">
        {filtered.map(record => {
          const machine = getMachine(record.machine_id);
          const customer = getCustomer(record.customer_id);
          return (
            <Card key={record.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-slate-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-semibold text-slate-900">{machine?.model || "Okänd maskin"}</span>
                      <Badge className={statusColor[record.status]}>{statusLabel[record.status]}</Badge>
                    </div>
                    <div className="text-sm text-slate-500">
                      {customer?.company_name} · {record.service_date ? format(new Date(record.service_date), "d MMM yyyy", { locale: sv }) : ""} · {record.technician_name}
                    </div>
                    {record.total_cost > 0 && <div className="text-sm font-semibold text-slate-700 mt-0.5">{record.total_cost.toLocaleString("sv-SE")} kr</div>}
                    <Button size="sm" className="mt-2 sm:hidden" onClick={() => setSelectedRecord({ record, machine, customer })}>
                      <Eye className="w-4 h-4 mr-1" /> Visa rapport
                    </Button>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => setSelectedRecord({ record, machine, customer })} className="flex-shrink-0 hidden sm:flex">
                    <Eye className="w-4 h-4 mr-1" /> Visa ärende
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Inga ärenden matchar valda filter</p>
          </div>
        )}
      </div>

      </>)}

      {/* Single service record modal */}
      {selectedRecord && (
        <ServiceReportModal
          record={selectedRecord.record}
          machine={selectedRecord.machine}
          customer={selectedRecord.customer}
          onClose={() => setSelectedRecord(null)}
        />
      )}

      {/* Summary report modal */}
      {showSummary && (
        <SummaryReportModal
          records={filtered}
          machines={machines}
          customers={customers}
          filterLabel={buildFilterLabel()}
          onClose={() => setShowSummary(false)}
        />
      )}
    </div>
  );
}