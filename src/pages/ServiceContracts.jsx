import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { addMonths, format, isPast, parseISO } from "date-fns";
import { sv } from "date-fns/locale";
import { FileCheck, Search, Building2, Monitor, Pencil, Clock, Download } from "lucide-react";
import ServiceContractModal from "@/components/machines/ServiceContractModal";
import PendingContractApproval from "@/components/contracts/PendingContractApproval";

const bindingLabel = { 6: "6 mån", 12: "12 mån", 24: "24 mån" };

function contractStatus(machine) {
  if (!machine.service_contract || machine.service_contract === "none") return null;
  if (machine.contract_status === "inactive") return "inactive";
  if (!machine.contract_start_date || !machine.contract_binding_months) return "active";
  const end = addMonths(parseISO(machine.contract_start_date), machine.contract_binding_months);
  return isPast(end) ? "expired" : "active";
}

function endDate(machine) {
  if (!machine.contract_start_date || !machine.contract_binding_months) return null;
  return addMonths(parseISO(machine.contract_start_date), machine.contract_binding_months);
}

export default function ServiceContracts() {
  const [machines, setMachines] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [editingMachine, setEditingMachine] = useState(null);

  useEffect(() => {
    Promise.all([
      base44.entities.Machine.list(),
      base44.entities.Customer.list()
    ]).then(([m, c]) => {
      setMachines(m);
      setCustomers(c);
    });
  }, []);

  const customerMap = Object.fromEntries(customers.map(c => [c.id, c]));

  const handleContractSave = async (form) => {
    await base44.entities.Machine.update(editingMachine.id, form);
    setMachines(prev => prev.map(m => m.id === editingMachine.id ? { ...m, ...form } : m));
    setEditingMachine(null);
  };

  const handleApproveRequest = async (machine) => {
    const updateData = {
      service_contract: machine.requested_service_contract,
      service_contract_status: "approved",
      contract_start_date: new Date().toISOString().split("T")[0],
      contract_binding_months: machine.contract_binding_months
    };
    await base44.entities.Machine.update(machine.id, updateData);
    setMachines(prev => prev.map(m => m.id === machine.id ? { ...m, ...updateData } : m));
  };

  const handleRejectRequest = async (machine) => {
    await base44.entities.Machine.update(machine.id, {
      service_contract_status: "rejected",
      requested_service_contract: "none"
    });
    setMachines(prev => prev.map(m =>
      m.id === machine.id
        ? { ...m, service_contract_status: "rejected", requested_service_contract: "none" }
        : m
    ));
  };

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

  const contracted = machines
    .filter(m => m.service_contract && m.service_contract !== "none")
    .filter(m => {
      if (!search) return true;
      const cust = customerMap[m.customer_id];
      const q = search.toLowerCase();
      return (
        m.model?.toLowerCase().includes(q) ||
        m.serial_number?.toLowerCase().includes(q) ||
        cust?.company_name?.toLowerCase().includes(q) ||
        cust?.contact_person?.toLowerCase().includes(q)
      );
    });

  const active = contracted.filter(m => contractStatus(m) === "active");
  const expired = contracted.filter(m => contractStatus(m) === "expired" || contractStatus(m) === "inactive");

  const pendingRequests = machines
    .filter(m => m.service_contract_status === "pending")
    .filter(m => {
      if (!search) return true;
      const cust = customerMap[m.customer_id];
      const q = search.toLowerCase();
      return (
        m.model?.toLowerCase().includes(q) ||
        m.serial_number?.toLowerCase().includes(q) ||
        cust?.company_name?.toLowerCase().includes(q) ||
        cust?.contact_person?.toLowerCase().includes(q)
      );
    });

  const renderRow = (machine) => {
    const cust = customerMap[machine.customer_id];
    const status = contractStatus(machine);
    const end = endDate(machine);

    return (
      <tr 
        key={machine.id} 
        className={`border-b border-slate-200 last:border-0 transition-colors ${
          status === "active" 
            ? "bg-green-100 hover:bg-green-200" 
            : "bg-red-100 hover:bg-red-200"
        }`}
      >
        <td className="py-3 px-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <div>
              <div className="font-medium text-slate-800">{cust?.company_name || "–"}</div>
              {cust?.contact_person && (
                <div className="text-xs text-slate-500">{cust.contact_person}</div>
              )}
            </div>
          </div>
        </td>
        <td className="py-3 px-4">
          <div className="flex items-center gap-2">
            <Monitor className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <div>
              <div className="font-medium text-slate-800">{machine.model}</div>
              <div className="text-xs text-slate-400 font-mono">SN: {machine.serial_number}</div>
            </div>
          </div>
        </td>
        <td className="py-3 px-4 text-sm text-slate-600">
          {machine.service_contract === "basic" ? "BAS – Astomed 3.0" : machine.service_contract}
        </td>
        <td className="py-3 px-4 text-sm text-slate-600">
          {machine.contract_start_date
            ? format(parseISO(machine.contract_start_date), "d MMM yyyy", { locale: sv })
            : "–"}
        </td>
        <td className="py-3 px-4">
          {machine.contract_binding_months
            ? <Badge variant="outline">{bindingLabel[machine.contract_binding_months] || `${machine.contract_binding_months} mån`}</Badge>
            : "–"}
        </td>
        <td className="py-3 px-4 text-sm text-slate-600">
          {end ? format(end, "d MMM yyyy", { locale: sv }) : "–"}
        </td>
        <td className="py-3 px-4">
          {status === "active"
            ? <Badge className="bg-emerald-100 text-emerald-800 border-0">Aktivt</Badge>
            : <Badge className="bg-slate-100 text-slate-600 border-0">{status === "inactive" ? "Inaktivt" : "Utgånget"}</Badge>}
        </td>
        <td className="py-3 px-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleDownloadContract(machine)}
              className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
              title="Ladda ner avtal"
            >
              <Download className="w-4 h-4" />
            </button>
            {status === "active" && (
              <button
                onClick={() => setEditingMachine(machine)}
                className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                title="Redigera avtal"
              >
                <Pencil className="w-4 h-4" />
              </button>
            )}
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="astomed-icon-box w-10 h-10">
          <FileCheck className="w-5 h-5" style={{ color: "#1b3a3a" }} />
        </div>
        <div>
          <h1 className="text-2xl font-bold astomed-title">Serviceavtal</h1>
          <p className="text-sm astomed-muted">Översikt av alla tecknade serviceavtal</p>
        </div>
        <div className="ml-auto flex gap-3 items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              className="pl-9 w-56"
              placeholder="Sök kund, maskin, SN..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Totalt tecknade", value: contracted.length },
          { label: "Aktiva avtal", value: active.length },
          { label: "Utgångna avtal", value: expired.length },
          { label: "Väntar på godkännande", value: pendingRequests.length, highlight: pendingRequests.length > 0 },
        ].map(stat => (
          <div key={stat.label} className={`astomed-card p-4 rounded-xl border ${stat.highlight ? "border-amber-300 bg-amber-50" : "bg-white"}`}>
            <div className={`text-2xl font-bold ${stat.highlight ? "text-amber-800" : "astomed-title"}`}>{stat.value}</div>
            <div className={`text-xs mt-0.5 ${stat.highlight ? "text-amber-700 font-semibold" : "astomed-muted"}`}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Pending requests section */}
      {pendingRequests.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-amber-600" />
            <h2 className="text-lg font-bold astomed-title">Väntande förfrågningar</h2>
            <Badge className="bg-amber-100 text-amber-800 border-0">{pendingRequests.length}</Badge>
          </div>
          <div className="space-y-4">
            {pendingRequests.map(machine => (
              <PendingContractApproval
                key={machine.id}
                machine={machine}
                customer={customerMap[machine.customer_id]}
                onApprove={handleApproveRequest}
                onReject={handleRejectRequest}
              />
            ))}
          </div>
        </div>
      )}

      {/* Active contracts table */}
      <div className="bg-white rounded-xl border border-slate-200 mb-6 overflow-hidden">
        <div className="px-5 py-3 border-b bg-slate-50 flex items-center gap-2">
          <span className="font-semibold text-slate-700 text-sm">Aktiva serviceavtal</span>
          <Badge className="bg-emerald-100 text-emerald-800 border-0 ml-1">{active.length}</Badge>
        </div>
        {active.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-sm">Inga aktiva serviceavtal</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
                  <th className="py-2 px-4 text-left font-medium">Kund</th>
                  <th className="py-2 px-4 text-left font-medium">Maskin</th>
                  <th className="py-2 px-4 text-left font-medium">Avtal</th>
                  <th className="py-2 px-4 text-left font-medium">Startdatum</th>
                  <th className="py-2 px-4 text-left font-medium">Bindningstid</th>
                  <th className="py-2 px-4 text-left font-medium">Slutdatum</th>
                  <th className="py-2 px-4 text-left font-medium">Status</th>
                  <th className="py-2 px-4 text-left font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {active.map(renderRow)}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Expired contracts table */}
      {editingMachine && (
        <ServiceContractModal
          machine={editingMachine}
          onSave={handleContractSave}
          onClose={() => setEditingMachine(null)}
        />
      )}

      {expired.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-3 border-b bg-slate-50 flex items-center gap-2">
            <span className="font-semibold text-slate-700 text-sm">Utgångna serviceavtal</span>
            <Badge className="bg-slate-100 text-slate-600 border-0 ml-1">{expired.length}</Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
                  <th className="py-2 px-4 text-left font-medium">Kund</th>
                  <th className="py-2 px-4 text-left font-medium">Maskin</th>
                  <th className="py-2 px-4 text-left font-medium">Avtal</th>
                  <th className="py-2 px-4 text-left font-medium">Startdatum</th>
                  <th className="py-2 px-4 text-left font-medium">Bindningstid</th>
                  <th className="py-2 px-4 text-left font-medium">Slutdatum</th>
                  <th className="py-2 px-4 text-left font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {expired.map(renderRow)}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}