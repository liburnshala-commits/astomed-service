import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link, useLocation } from "react-router-dom";
import { Plus, Search, Monitor, Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import MachineForm from "@/components/machines/MachineForm.jsx";
import ServiceContractModal from "@/components/machines/ServiceContractModal.jsx";
import ServiceReportModal from "@/components/service/ServiceReportModal.jsx";
import MachineCard from "@/components/machines/MachineCard.jsx";
import MachinesFilterBar from "@/components/machines/MachinesFilterBar.jsx";
import MachinesList from "@/components/machines/MachinesList.jsx";
import { useAuth } from "@/lib/AuthContext";
import { MACHINE_MODELS } from "@/lib/constants";
import { useMachines } from "@/hooks/useMachines";

export default function Machines() {
  const location = useLocation();
  
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
  const [editingSnFor, setEditingSnFor] = useState(null);

  const { user } = useAuth();
  const userRole = user?.role;
  const { machines, records, customers, products, load } = useMachines();

  const handleUpdateSn = async (machineId, newSn) => {
    if (!newSn || newSn.trim() === "") return;
    try {
      await base44.entities.Machine.update(machineId, { serial_number: newSn });
      setEditingSnFor(null);
      load();
    } catch (err) {
      console.error("Kunde inte uppdatera serienummer", err);
      alert("Kunde inte uppdatera serienumret. Försök igen senare.");
    }
  };

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
    return (
      <MachineCard
        key={machine.id}
        machine={machine}
        customer={getCustomer(machine.customer_id)}
        serviceCount={getServiceCount(machine.id)}
        lastService={getLastService(machine.id)}
        products={products}
        userRole={userRole}
        isMobile={isMobile}
        editingSnFor={editingSnFor}
        setEditingSnFor={setEditingSnFor}
        handleUpdateSn={handleUpdateSn}
        setReportData={setReportData}
        setContractMachine={setContractMachine}
        handleDownloadContract={handleDownloadContract}
        setEditing={setEditing}
        setShowForm={setShowForm}
        handleDelete={handleDelete}
      />
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

      {userRole === "customer" && machines.filter(m => !m.serial_number || m.serial_number.toLowerCase() === "okänd" || m.serial_number.toLowerCase() === "saknas" || m.serial_number.trim() === "").length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-amber-800">Viktig information saknas</h3>
            <p className="text-sm text-amber-700 mt-1">En eller flera av dina maskiner saknar ett registrerat serienummer. Vänligen klicka på "Ändra" bredvid serienumret på maskinen för att fylla i det. Detta är viktigt för att service och avtal ska kopplas rätt.</p>
          </div>
        </div>
      )}

      <MachinesFilterBar
        search={search} setSearch={setSearch}
        filterModel={filterModel} setFilterModel={setFilterModel}
        filterCustomer={filterCustomer} setFilterCustomer={setFilterCustomer}
        filterContract={filterContract} setFilterContract={setFilterContract}
        customers={customers}
      />
      
      <MachinesList machines={filtered} renderCard={renderCard} />

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