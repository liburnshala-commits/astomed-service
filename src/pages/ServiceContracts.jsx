import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useQuery } from "@tanstack/react-query";
import { addMonths, format, isPast, parseISO } from "date-fns";
import { sv } from "date-fns/locale";
import { FileCheck, Search, Building2, Monitor, Pencil, Clock, Download, Trash2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ServiceContractModal from "@/components/machines/ServiceContractModal";
import PendingContractApproval from "@/components/contracts/PendingContractApproval";
import MultiMachineContractModal from "@/components/contracts/MultiMachineContractModal";
import RemoveContractDialog from "@/components/contracts/RemoveContractDialog";

const bindingLabel = { 6: "6 mån", 12: "12 mån", 24: "24 mån" };

function contractStatus(machine) {
  if (!machine.service_contract || machine.service_contract === "none") return "inactive";
  if (machine.contract_status === "inactive") return "inactive";
  if (machine.contract_status === "pending_signature") return "pending_signature";
  if (machine.contract_status === "rejected") return "rejected";
  if (!machine.contract_start_date || !machine.contract_binding_months) return "active";
  const end = addMonths(parseISO(machine.contract_start_date), machine.contract_binding_months);
  return isPast(end) ? "expired" : "active";
}

function endDate(machine) {
  if (!machine.contract_start_date || !machine.contract_binding_months) return null;
  return addMonths(parseISO(machine.contract_start_date), machine.contract_binding_months);
}

export default function ServiceContracts() {
  const urlParams = new URLSearchParams(window.location.search);
  const initialStatusFilter = urlParams.get("status") || "all";

  const { data: user } = useQuery({
    queryKey: ["me"],
    queryFn: () => base44.auth.me(),
    staleTime: 5 * 60 * 1000,
  });

  const userRole = user?.role;
  const isTechnician = userRole === "technician";

  const [machines, setMachines] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter);
  const [editingMachine, setEditingMachine] = useState(null);
  const [showMultiContract, setShowMultiContract] = useState(false);

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

  const handleStatusChange = async (machine, newStatus) => {
    await base44.entities.Machine.update(machine.id, { contract_status: newStatus });
    setMachines(prev => prev.map(m => m.id === machine.id ? { ...m, contract_status: newStatus } : m));
  };

  const [machineToRemove, setMachineToRemove] = useState(null);

  const handleRemoveContract = (machine) => {
    setMachineToRemove(machine);
  };

  const handleConfirmRemove = async (updateData) => {
    if (!machineToRemove) return;
    await base44.entities.Machine.update(machineToRemove.id, updateData);
    setMachines(prev => prev.map(m => m.id === machineToRemove.id ? { ...m, ...updateData } : m));
    setMachineToRemove(null);
  };

  const handleApproveRequest = async (machine) => {
    const updateData = {
      service_contract: machine.requested_service_contract,
      service_contract_status: "approved",
      contract_start_date: new Date().toISOString().split("T")[0],
      contract_created_date: new Date().toISOString().split("T")[0],
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

  const allContracted = machines
    .filter(m => m.service_contract && m.service_contract !== "none")
    .filter(m => {
      if (isTechnician && contractStatus(m) !== "active") return false;
      if (!search) return true;
      const cust = customerMap[m.customer_id];
      const q = search.toLowerCase();
      return (
        m.model?.toLowerCase().includes(q) ||
        m.serial_number?.toLowerCase().includes(q) ||
        cust?.company_name?.toLowerCase().includes(q) ||
        cust?.org_number?.toLowerCase().includes(q) ||
        cust?.contact_person?.toLowerCase().includes(q) ||
        cust?.email?.toLowerCase().includes(q) ||
        cust?.phone?.toLowerCase().includes(q) ||
        cust?.city?.toLowerCase().includes(q)
      );
    });

  const contracted = allContracted.filter(m => {
    if (statusFilter === "all") return true;
    return contractStatus(m) === statusFilter;
  });

  const activeCount = allContracted.filter(m => contractStatus(m) === "active").length;
  const pendingCount = allContracted.filter(m => contractStatus(m) === "pending_signature").length;
  const inactiveCount = allContracted.filter(m => contractStatus(m) === "inactive").length;
  const rejectedCount = allContracted.filter(m => contractStatus(m) === "rejected").length;
  const expiredCount = allContracted.filter(m => contractStatus(m) === "expired").length;

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
        cust?.org_number?.toLowerCase().includes(q) ||
        cust?.contact_person?.toLowerCase().includes(q) ||
        cust?.email?.toLowerCase().includes(q) ||
        cust?.phone?.toLowerCase().includes(q) ||
        cust?.city?.toLowerCase().includes(q)
      );
    });

  const renderMobileCard = (machine) => {
    const cust = customerMap[machine.customer_id];
    const status = contractStatus(machine);
    const end = endDate(machine);

    return (
      <CarouselItem key={machine.id} className="basis-11/12 sm:basis-8/12">
        <Card className={`bg-white shadow-sm border-slate-200 mx-1 h-full flex flex-col ${
          status === "active" ? "border-l-4 border-l-emerald-500" : "border-l-4 border-l-red-500"
        }`}>
          <CardContent className="p-4 space-y-4 flex-1 flex flex-col">
            <div className="flex justify-between items-start gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1 text-slate-800 font-semibold">
                  <Monitor className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span className="truncate">{machine.model}</span>
                </div>
                <div className="text-xs text-slate-500 font-mono">SN: {machine.serial_number}</div>
              </div>
              <Badge className={`border-0 px-2.5 py-1 text-[10px] uppercase tracking-wider text-center ${
                status === "active" ? "bg-emerald-100 text-emerald-800" : 
                status === "pending_signature" ? "bg-amber-100 text-amber-800" : 
                status === "rejected" ? "bg-red-100 text-red-800" : 
                "bg-slate-100 text-slate-600"
              }`}>
                {status === "active" ? "Aktivt" : status === "pending_signature" ? "Under signering" : status === "rejected" ? "Nekat" : "Inaktivt/Utgånget"}
              </Badge>
            </div>

            <div className="space-y-2 text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100 flex-1">
              <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-200">
                <Building2 className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate text-slate-800">{cust?.company_name || "–"}</div>
                  {cust?.contact_person && <div className="text-xs text-slate-500 truncate">{cust.contact_person}</div>}
                </div>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500">Avtalstyp:</span>
                <span className="font-medium truncate max-w-[150px] text-right">{machine.service_contract === "basic" ? "BAS – Astomed 3.0" : machine.service_contract}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500">Bindningstid:</span>
                <span className="font-medium">{machine.contract_binding_months ? (bindingLabel[machine.contract_binding_months] || (machine.contract_binding_months + " mån")) : "–"}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500">Slutdatum:</span>
                <span className="font-medium">{end ? format(end, "d MMM yyyy", { locale: sv }) : "–"}</span>
              </div>
            </div>

            <div className="pt-2 space-y-3">
              <Select 
                value={machine.contract_status || "active"} 
                onValueChange={(val) => handleStatusChange(machine, val)}
                disabled={isTechnician}
              >
                <SelectTrigger className="w-full h-11 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Aktivt</SelectItem>
                  <SelectItem value="inactive">Inaktivt</SelectItem>
                  <SelectItem value="pending_signature">Under signering</SelectItem>
                  <SelectItem value="rejected">Nekat signering</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Button className="flex-1 h-11" variant="outline" onClick={() => setEditingMachine(machine)} disabled={status !== "active"}>
                  <Pencil className="w-4 h-4 mr-2 text-slate-500" /> Redigera
                </Button>
                <Button className="h-11 px-4 border border-slate-200 hover:bg-slate-100 text-slate-600" variant="ghost" onClick={() => handleDownloadContract(machine)}>
                  <Download className="w-5 h-5" />
                </Button>
                <Button className="h-11 px-4 text-red-500 hover:bg-red-50 hover:text-red-700 border border-transparent hover:border-red-100" variant="ghost" onClick={() => handleRemoveContract(machine)}>
                  <Trash2 className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </CarouselItem>
    );
  };

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
              {cust ? (
                <Link to={createPageUrl(`Machines?customer=${cust.id}`)} className="font-medium text-slate-800 hover:text-[#3a9e9e] hover:underline">
                  {cust.company_name || "–"}
                </Link>
              ) : (
                <div className="font-medium text-slate-800">–</div>
              )}
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
          {machine.contract_created_date
            ? format(parseISO(machine.contract_created_date), "d MMM yyyy", { locale: sv })
            : "–"}
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
          <Select 
            value={machine.contract_status || "active"} 
            onValueChange={(val) => handleStatusChange(machine, val)}
            disabled={isTechnician}
          >
            <SelectTrigger className={`h-8 w-32 text-xs font-semibold border-0 ${
              status === "active" ? "bg-emerald-100 text-emerald-800" : 
              status === "pending_signature" ? "bg-amber-100 text-amber-800" : 
              status === "rejected" ? "bg-red-100 text-red-800" : 
              "bg-slate-100 text-slate-600"
            }`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Aktivt</SelectItem>
              <SelectItem value="inactive">Inaktivt</SelectItem>
              <SelectItem value="pending_signature">Under signering</SelectItem>
              <SelectItem value="rejected">Nekat signering</SelectItem>
            </SelectContent>
          </Select>
          {status === "expired" && (
            <div className="text-[10px] text-red-500 mt-1 font-medium">Utgånget</div>
          )}
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
            <button
              onClick={() => handleRemoveContract(machine)}
              className="p-1.5 rounded hover:bg-red-100 text-red-400 hover:text-red-700 transition-colors"
              title="Ta bort avtal"
            >
              <Trash2 className="w-4 h-4" />
            </button>
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
              className="pl-9 w-64"
              placeholder="Sök kund, stad, maskin, SN..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          {!isTechnician && (
            <Button onClick={() => setShowMultiContract(true)} className="astomed-btn-primary">Nytt Serviceavtal</Button>
          )}
        </div>
      </div>

      {/* Summary cards */}
      {!isTechnician && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Under signering", value: pendingCount },
          { label: "Signerade avtal", value: activeCount },
          { label: "Offert", value: inactiveCount },
          { label: "Nekat signering", value: rejectedCount, highlight: rejectedCount > 0 },
        ].map(stat => (
          <div key={stat.label} className={`astomed-card p-4 rounded-xl border ${stat.highlight ? "border-amber-300 bg-amber-50" : "bg-white"}`}>
            <div className={`text-2xl font-bold ${stat.highlight ? "text-amber-800" : "astomed-title"}`}>{stat.value}</div>
            <div className={`text-xs mt-0.5 ${stat.highlight ? "text-amber-700 font-semibold" : "astomed-muted"}`}>{stat.label}</div>
          </div>
        ))}
        </div>
        )}

        {/* Pending requests section */}
        {!isTechnician && pendingRequests.length > 0 && (
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

      {/* Contracts table with Tabs */}
      <Tabs value={isTechnician ? "all" : statusFilter} onValueChange={setStatusFilter} className="w-full mb-6">
        {!isTechnician && (
          <TabsList className="flex flex-wrap h-auto justify-start mb-4 bg-slate-100/50 p-1">
            <TabsTrigger value="all" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Alla ({allContracted.length})</TabsTrigger>
            <TabsTrigger value="active" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Aktiva ({activeCount})</TabsTrigger>
            <TabsTrigger value="pending_signature" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Under signering ({pendingCount})</TabsTrigger>
            <TabsTrigger value="inactive" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Offert / Inaktiva ({inactiveCount})</TabsTrigger>
            <TabsTrigger value="rejected" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Nekade ({rejectedCount})</TabsTrigger>
            <TabsTrigger value="expired" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Utgångna ({expiredCount})</TabsTrigger>
          </TabsList>
        )}
        
        <TabsContent value={isTechnician ? "all" : statusFilter} className="mt-0">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-3 border-b bg-slate-50 flex items-center gap-2">
              <span className="font-semibold text-slate-700 text-sm">
                {statusFilter === "all" && "Alla serviceavtal"}
                {statusFilter === "active" && "Aktiva serviceavtal"}
                {statusFilter === "pending_signature" && "Avtal under signering"}
                {statusFilter === "inactive" && "Offert / Inaktiva avtal"}
                {statusFilter === "rejected" && "Nekade serviceavtal"}
                {statusFilter === "expired" && "Utgångna serviceavtal"}
              </span>
              <Badge className="bg-slate-200 text-slate-700 border-0 ml-1">{contracted.length}</Badge>
            </div>
            {contracted.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-sm">Inga serviceavtal hittades</div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
                        <th className="py-2 px-4 text-left font-medium">Kund</th>
                        <th className="py-2 px-4 text-left font-medium">Maskin</th>
                        <th className="py-2 px-4 text-left font-medium">Avtal</th>
                        <th className="py-2 px-4 text-left font-medium">Skapat</th>
                        <th className="py-2 px-4 text-left font-medium">Startdatum</th>
                        <th className="py-2 px-4 text-left font-medium">Bindningstid</th>
                        <th className="py-2 px-4 text-left font-medium">Slutdatum</th>
                        <th className="py-2 px-4 text-left font-medium">Status</th>
                        <th className="py-2 px-4 text-left font-medium"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {contracted.map(renderRow)}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Carousel View */}
                <div className="md:hidden p-4 bg-slate-50">
                  {contracted.length > 1 && (
                    <div className="text-center text-xs text-slate-400 mb-3 flex items-center justify-center gap-2">
                      <span>←</span> Svep för fler avtal ({contracted.length} st) <span>→</span>
                    </div>
                  )}
                  <Carousel className="w-full" opts={{ align: "start" }}>
                    <CarouselContent>
                      {contracted.map(renderMobileCard)}
                    </CarouselContent>
                  </Carousel>
                </div>
              </>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {editingMachine && (
        <ServiceContractModal
          machine={editingMachine}
          onSave={handleContractSave}
          onClose={() => setEditingMachine(null)}
        />
      )}

      {showMultiContract && (
        <MultiMachineContractModal 
          onClose={() => setShowMultiContract(false)}
          onSave={() => {
            setShowMultiContract(false);
            base44.entities.Machine.list().then(setMachines);
          }}
        />
      )}

      {machineToRemove && (
        <RemoveContractDialog
          machine={machineToRemove}
          onClose={() => setMachineToRemove(null)}
          onConfirm={handleConfirmRemove}
        />
      )}
    </div>
  );
}