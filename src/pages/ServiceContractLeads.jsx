import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Search, Calendar as CalendarIcon, Trash2, ArrowRight, User, Building2, Phone, Mail, Copy, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import MultiMachineContractModal from "@/components/contracts/MultiMachineContractModal";
import NewLeadModal from "@/components/leads/NewLeadModal";
import EditLeadModal from "@/components/leads/EditLeadModal";

const statusMap = {
  new: { label: "Nytt", color: "bg-blue-100 text-blue-800" },
  contacted: { label: "Kontaktad", color: "bg-amber-100 text-amber-800" },
  called: { label: "Ringt", color: "bg-cyan-100 text-cyan-800" },
  interested: { label: "Intresserad", color: "bg-teal-100 text-teal-800" },
  proposal_sent: { label: "Offert skickad", color: "bg-purple-100 text-purple-800" },
  accepted: { label: "Accepterad", color: "bg-emerald-100 text-emerald-800" },
  rejected: { label: "Avvisad", color: "bg-red-100 text-red-800" },
  no_contract_wanted: { label: "Vill ej ha avtal", color: "bg-gray-100 text-gray-800" },
  not_interested: { label: "Ej intresserad", color: "bg-rose-100 text-rose-800" },
  other_service_contract: { label: "Annat Serviceavtal", color: "bg-orange-100 text-orange-800" },
};

export default function ServiceContractLeads() {
  const { toast } = useToast();
  const [leads, setLeads] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewLeadModal, setShowNewLeadModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [convertingLead, setConvertingLead] = useState(null);
  const [convertingCustomerId, setConvertingCustomerId] = useState(null);
  const [editingLead, setEditingLead] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [leadsData, customersData] = await Promise.all([
      base44.entities.ServiceContractLead.list(),
      base44.entities.Customer.list()
    ]);
    setLeads(leadsData);
    setCustomers(customersData);
    setLoading(false);
  };

  const handleCreateLead = async (data) => {
    await base44.entities.ServiceContractLead.create(data);
    setShowNewLeadModal(false);
    fetchData();
  };

  const handleUpdateStatus = async (id, newStatus) => {
    await base44.entities.ServiceContractLead.update(id, { status: newStatus });
    fetchData();
  };

  const handleEditLead = async (id, updatedData) => {
    await base44.entities.ServiceContractLead.update(id, updatedData);
    setEditingLead(null);
    fetchData();
  };

  const handleDelete = async (id) => {
    if (confirm("Är du säker på att du vill ta bort detta prospekt?")) {
      await base44.entities.ServiceContractLead.delete(id);
      fetchData();
    }
  };

  const handleConvert = async (lead) => {
    let customerId = lead.customer_id;

    if (!customerId) {
      const newCustomer = await base44.entities.Customer.create({
        company_name: lead.company_name,
        org_number: lead.org_number || "",
        contact_person: lead.contact_person || "",
        email: lead.email || "",
        phone: lead.phone || "",
      });
      customerId = newCustomer.id;
      await base44.entities.ServiceContractLead.update(lead.id, { customer_id: customerId });
    }

    let createdMachineIds = [...(lead.machine_ids || [])];
    
    if (lead.proposed_machines && lead.proposed_machines.length > 0) {
      const machinePromises = lead.proposed_machines.map(async (machine) => {
        return await base44.entities.Machine.create({
          model: machine.model,
          serial_number: machine.serial_number,
          customer_id: customerId,
          installation_date: machine.installation_date || undefined,
          notes: machine.notes || "Skapad från prospekt",
          status: "active",
          service_contract: "none"
        });
      });
      
      const newMachines = await Promise.all(machinePromises);
      const newMachineIds = newMachines.map(m => m.id);
      
      createdMachineIds = [...createdMachineIds, ...newMachineIds];
      await base44.entities.ServiceContractLead.update(lead.id, { machine_ids: createdMachineIds });
    }

    setConvertingLead({ ...lead, customer_id: customerId, machine_ids: createdMachineIds });
    setConvertingCustomerId(customerId);
  };

  const handleConversionComplete = async () => {
    if (convertingLead) {
      await base44.entities.ServiceContractLead.update(convertingLead.id, { status: "accepted" });
    }
    setConvertingLead(null);
    setConvertingCustomerId(null);
    fetchData();
  };

  const getLeadName = (lead) => {
    if (lead.customer_id) {
      return customers.find(c => c.id === lead.customer_id)?.company_name || "Okänd kund";
    }
    return lead.company_name || "Namnlöst prospekt";
  };

  const getLeadContact = (lead) => {
    if (lead.customer_id) {
      const customer = customers.find(c => c.id === lead.customer_id);
      return { phone: customer?.phone, email: customer?.email };
    }
    return { phone: lead.phone, email: lead.email };
  };

  const getStatusWeight = (status) => {
    if (status === 'interested') return 0;
    const index = Object.keys(statusMap).indexOf(status);
    return index !== -1 ? index + 1 : 99;
  };

  const filteredLeads = leads.filter(l =>
    getLeadName(l).toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => getStatusWeight(a.status) - getStatusWeight(b.status));

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Serviceavtals-prospekt</h1>
          <p className="text-slate-500">Hantera potentiella kunder för serviceavtal.</p>
        </div>
        <Button onClick={() => setShowNewLeadModal(true)} className="astomed-btn-primary">
          <Plus className="w-4 h-4 mr-2" /> Nytt Prospekt
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center gap-2">
          <Search className="w-5 h-5 text-slate-400" />
          <Input
            placeholder="Sök på namn..."
            className="border-none shadow-none focus-visible:ring-0 px-0"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500">Laddar prospekt...</div>
        ) : filteredLeads.length === 0 ? (
          <div className="p-8 text-center text-slate-500">Inga prospekt hittades.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 font-medium">
                <tr>
                  <th className="px-4 py-3">Namn</th>
                  <th className="px-4 py-3">Kontakt</th>
                  <th className="px-4 py-3">Typ</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Uppföljning</th>
                  <th className="px-4 py-3 text-right">Åtgärder</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLeads.map(lead => {
                  const contact = getLeadContact(lead);
                  return (
                  <tr key={lead.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{getLeadName(lead)}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {contact.phone && <div className="flex items-center gap-1"><Phone className="w-3 h-3" /> {contact.phone}</div>}
                      {contact.email && (
                        <div className="flex items-center gap-1 mt-1 group">
                          <Mail className="w-3 h-3" /> 
                          {contact.email}
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(contact.email);
                              toast({
                                title: "Kopierad!",
                                description: "E-postadressen har kopierats till urklipp.",
                              });
                            }}
                            className="ml-1 text-slate-400 hover:text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Kopiera e-post"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                      {!contact.phone && !contact.email && <span className="text-slate-400">-</span>}
                    </td>
                    <td className="px-4 py-3">
                      {lead.customer_id ? (
                        <span className="flex items-center gap-1 text-slate-500 text-xs"><User className="w-3 h-3" /> Befintlig kund</span>
                      ) : (
                        <span className="flex items-center gap-1 text-indigo-500 text-xs"><Building2 className="w-3 h-3" /> Nytt prospekt</span>
                      )}
                    </td>
                    <td className="px-4 py-3 w-44">
                      <Select value={lead.status} onValueChange={(v) => handleUpdateStatus(lead.id, v)}>
                        <SelectTrigger className={`h-8 text-xs font-medium ${statusMap[lead.status]?.color}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(statusMap).map(([k, v]) => (
                            <SelectItem key={k} value={k}>{v.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {lead.follow_up_date ? (
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="w-4 h-4 text-slate-400" />
                          {format(new Date(lead.follow_up_date), "yyyy-MM-dd")}
                        </div>
                      ) : "-"}
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      {lead.status !== "accepted" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                          onClick={() => handleConvert(lead)}
                        >
                          <ArrowRight className="w-4 h-4 mr-1" /> Konvertera
                        </Button>
                      )}
                      <Button size="icon" variant="ghost" className="text-blue-500 hover:bg-blue-50" onClick={() => setEditingLead(lead)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="text-red-500 hover:bg-red-50" onClick={() => handleDelete(lead.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showNewLeadModal && (
        <NewLeadModal
          customers={customers}
          onClose={() => setShowNewLeadModal(false)}
          onSave={handleCreateLead}
        />
      )}

      {convertingLead && (
        <MultiMachineContractModal
          initialCustomerId={convertingCustomerId}
          onClose={() => { setConvertingLead(null); setConvertingCustomerId(null); }}
          onSave={handleConversionComplete}
        />
      )}

      {editingLead && (
        <EditLeadModal
          lead={editingLead}
          onClose={() => setEditingLead(null)}
          onSave={handleEditLead}
        />
      )}
    </div>
  );
}