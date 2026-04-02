import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Search, Calendar as CalendarIcon, Trash2, ArrowRight, User, Building2, Phone, Mail, Copy, Pencil, Send, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import MultiMachineContractModal from "@/components/contracts/MultiMachineContractModal";
import NewLeadModal from "@/components/leads/NewLeadModal";
import EditLeadModal from "@/components/leads/EditLeadModal";
import CustomerInteractionsModal from "@/components/customers/CustomerInteractionsModal";

const statusMap = {
  new: { label: "Nytt", color: "bg-blue-100 text-blue-800" },
  sold_machines: { label: "Sålt sina maskiner", color: "bg-amber-100 text-amber-800" },
  mailed: { label: "Mailat", color: "bg-indigo-100 text-indigo-800" },
  called: { label: "Ringt", color: "bg-cyan-100 text-cyan-800" },
  interested: { label: "Intresserad", color: "bg-teal-100 text-teal-800" },
  proposal_sent: { label: "Offert skickad", color: "bg-purple-100 text-purple-800" },
  accepted: { label: "Accepterad", color: "bg-emerald-100 text-emerald-800" },
  rejected: { label: "Avvisad", color: "bg-red-100 text-red-800" },
  no_contract_wanted: { label: "Vill ej ha avtal", color: "bg-gray-100 text-gray-800" },
  not_interested: { label: "Ej intresserad", color: "bg-rose-100 text-rose-800" },
  other_service_contract: { label: "Annat Serviceavtal", color: "bg-orange-100 text-orange-800" },
  wrong_phone: { label: "Fel telefonnummer", color: "bg-red-50 text-red-600 border border-red-200" },
  wrong_email: { label: "Fel mail", color: "bg-red-50 text-red-600 border border-red-200" },
};

export default function ServiceContractLeads() {
  const { toast } = useToast();
  const urlParams = new URLSearchParams(window.location.search);
  const initialStatus = urlParams.get("status") || "all";

  const [leads, setLeads] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewLeadModal, setShowNewLeadModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [convertingLead, setConvertingLead] = useState(null);
  const [convertingCustomerId, setConvertingCustomerId] = useState(null);
  const [editingLead, setEditingLead] = useState(null);
  const [viewingInteractions, setViewingInteractions] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [leadsData, customersData, machinesData] = await Promise.all([
      base44.entities.ServiceContractLead.list(),
      base44.entities.Customer.list(),
      base44.entities.Machine.list()
    ]);
    setLeads(leadsData);
    setCustomers(customersData);
    setMachines(machinesData);
    setLoading(false);
  };

  const handleCreateLead = async (data) => {
    const newLead = await base44.entities.ServiceContractLead.create(data);
    
    if (data.notes) {
      try {
        const user = await base44.auth.me();
        await base44.entities.CustomerInteraction.create({
          customer_id: data.customer_id || undefined,
          lead_id: newLead.id,
          interaction_type: 'other',
          interaction_date: new Date().toISOString(),
          notes: `Nytt prospekt skapat med anteckning: ${data.notes}`,
          logged_by: user?.full_name || user?.email || "System"
        });
      } catch (err) {
        console.error("Kunde inte logga anteckning", err);
      }
    }

    setShowNewLeadModal(false);
    fetchData();
  };

  const handleUpdateStatus = async (id, newStatus) => {
    await base44.entities.ServiceContractLead.update(id, { status: newStatus });
    fetchData();
  };

  const handleEditLead = async (id, updatedData) => {
    const oldLead = leads.find(l => l.id === id);
    await base44.entities.ServiceContractLead.update(id, updatedData);
    
    if (updatedData.notes !== undefined && updatedData.notes !== (oldLead?.notes || "")) {
      try {
        const user = await base44.auth.me();
        await base44.entities.CustomerInteraction.create({
          customer_id: oldLead?.customer_id || undefined,
          lead_id: id,
          interaction_type: 'other',
          interaction_date: new Date().toISOString(),
          notes: updatedData.notes ? `Prospektanteckning uppdaterad: ${updatedData.notes}` : "Prospektanteckning borttagen.",
          logged_by: user?.full_name || user?.email || "System"
        });
      } catch (err) {
        console.error("Kunde inte logga anteckning", err);
      }
    }

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

  const formatPhone = (phone) => {
    if (!phone) return "";
    let str = String(phone).trim();
    if (str.includes("E") || str.includes("e") || str.includes(",")) {
      str = str.replace(",", ".");
      const num = parseFloat(str);
      if (!isNaN(num)) {
        str = num.toLocaleString('fullwide', {useGrouping:false});
      }
    }
    if (str.startsWith("46") && str.length >= 10) {
      str = "+" + str;
    }
    return str;
  };

  const getStatusWeight = (status) => {
    const index = Object.keys(statusMap).indexOf(status);
    return index !== -1 ? index + 1 : 99;
  };

  const handleSendProposal = async (lead) => {
    const contact = getLeadContact(lead);
    if (!contact.email) {
      toast({
        title: "Kunde inte skicka",
        description: "Prospektet saknar e-postadress.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      await base44.functions.invoke('sendServiceContractProposalEmail', { to: contact.email });
      await base44.entities.ServiceContractLead.update(lead.id, { status: 'proposal_sent' });
      
      const user = await base44.auth.me();
      await base44.functions.invoke('logAuditEntry', {
        action: 'update',
        entity_type: 'ServiceContractLead',
        entity_id: lead.id,
        entity_label: getLeadName(lead),
        user_email: user?.email || 'unknown',
        user_name: user?.full_name || user?.email,
        details: `Offert skickad via e-post till ${contact.email}`
      });

      await base44.entities.CustomerInteraction.create({
        customer_id: lead.customer_id || undefined,
        lead_id: lead.id,
        interaction_type: 'email',
        interaction_date: new Date().toISOString(),
        notes: `Offert för serviceavtal skickad till ${contact.email}.`,
        logged_by: user?.full_name || user?.email || "System"
      });

      toast({
        title: "Offert skickad!",
        description: `E-post skickades till ${contact.email}`,
      });
      fetchData();
    } catch (error) {
      // Specialhantering för Base44 e-postrestriktion
      const isEmailRestriction = error.message?.includes("500") || error.message?.includes("outside the app");
      toast({
        title: isEmailRestriction ? "Kan inte skicka e-post" : "Ett fel uppstod",
        description: isEmailRestriction 
          ? "I testläget kan e-post endast skickas till registrerade användare i systemet. Ändra prospektets e-post till din egen för att testa." 
          : error.message,
        variant: "destructive"
      });
    }
  };

  const filteredLeads = leads.filter(l => {
    const customer = l.customer_id ? customers.find(c => c.id === l.customer_id) : null;
    const contact = getLeadContact(l);
    const searchLower = searchTerm.toLowerCase();
    
    const matchesSearch = 
      getLeadName(l).toLowerCase().includes(searchLower) ||
      l.org_number?.toLowerCase().includes(searchLower) ||
      l.contact_person?.toLowerCase().includes(searchLower) ||
      contact.email?.toLowerCase().includes(searchLower) ||
      contact.phone?.toLowerCase().includes(searchLower) ||
      l.notes?.toLowerCase().includes(searchLower) ||
      customer?.company_name?.toLowerCase().includes(searchLower) ||
      customer?.org_number?.toLowerCase().includes(searchLower) ||
      customer?.contact_person?.toLowerCase().includes(searchLower);

    const matchesStatus = statusFilter === "all" || l.status === statusFilter;
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    const aHasPhone = !!getLeadContact(a).phone;
    const bHasPhone = !!getLeadContact(b).phone;
    if (aHasPhone && !bHasPhone) return -1;
    if (!aHasPhone && bHasPhone) return 1;
    
    return getStatusWeight(a.status) - getStatusWeight(b.status);
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Serviceavtals-prospekt</h1>
          <p className="text-slate-500">Hantera potentiella kunder för serviceavtal. <span className="font-medium text-slate-700">{filteredLeads.length} visas</span>{filteredLeads.length !== leads.length && <span className="text-slate-400"> av {leads.length} totalt</span>}</p>
        </div>
        <Button onClick={() => setShowNewLeadModal(true)} className="astomed-btn-primary">
          <Plus className="w-4 h-4 mr-2" /> Nytt Prospekt
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-1 w-full">
            <Search className="w-5 h-5 text-slate-400" />
            <Input
              placeholder="Sök på namn..."
              className="border-none shadow-none focus-visible:ring-0 px-0"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48 h-9 text-sm">
              <SelectValue placeholder="Filtrera på status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alla statusar</SelectItem>
              {Object.entries(statusMap).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500">Laddar prospekt...</div>
        ) : filteredLeads.length === 0 ? (
          <div className="p-8 text-center text-slate-500">Inga prospekt hittades.</div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 font-medium">
                  <tr>
                    <th className="px-2 py-3 w-1/4">Namn</th>
                    <th className="px-2 py-3">Kontakt</th>
                    <th className="px-2 py-3">Maskin(er)</th>
                    <th className="px-2 py-3 w-[160px]">Status</th>
                    <th className="px-2 py-3 text-right w-[180px]">Åtgärder</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLeads.map(lead => {
                    const contact = getLeadContact(lead);
                    return (
                    <tr key={lead.id} className="hover:bg-slate-50">
                      <td className="px-2 py-3">
                        <div className="font-medium text-slate-900">{getLeadName(lead)}</div>
                        {(lead.contact_person || customers.find(c => c.id === lead.customer_id)?.contact_person) && (
                          <div className="text-xs text-slate-500 mb-0.5">
                            {lead.contact_person || customers.find(c => c.id === lead.customer_id)?.contact_person}
                          </div>
                        )}
                        <div className="mb-1">
                          {lead.customer_id ? (
                            <span className="flex items-center gap-1 text-slate-500 text-[10px]"><User className="w-3 h-3" /> Befintlig kund</span>
                          ) : (
                            <span className="flex items-center gap-1 text-indigo-500 text-[10px]"><Building2 className="w-3 h-3" /> Nytt prospekt</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {lead.notes ? (
                            <div className="text-xs text-slate-500 max-w-xs truncate" title={lead.notes}>
                              {lead.notes}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 italic">Inga anteckningar</span>
                          )}
                          <button 
                            onClick={(e) => { e.stopPropagation(); setEditingLead(lead); }}
                            className="text-slate-400 hover:text-blue-500 transition-colors"
                            title="Lägg till/redigera anteckning"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                      <td className="px-2 py-3 text-xs text-slate-600">
                        {contact.phone && <div className="flex items-center gap-1 mb-1"><Phone className="w-3 h-3" /> {formatPhone(contact.phone)}</div>}
                        {contact.email && (
                          <div className="flex items-center gap-1 group">
                            <Mail className="w-3 h-3" /> 
                            <span className="truncate max-w-[150px]" title={contact.email}>{contact.email}</span>
                            <button 
                              onClick={() => {
                                navigator.clipboard.writeText(contact.email);
                                toast({ title: "Kopierad!", description: "E-postadressen kopierad." });
                              }}
                              className="ml-1 text-slate-400 hover:text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="px-2 py-3 text-xs text-slate-600">
                        <div className="flex flex-col gap-1">
                          {lead.machine_ids?.map(id => {
                            const m = machines.find(m => m.id === id);
                            return m ? <div key={id} title={`${m.model} (SN: ${m.serial_number})`}>{m.model} <span className="text-slate-400 text-[10px]">({m.serial_number})</span></div> : null;
                          })}
                          {lead.proposed_machines?.map((m, idx) => (
                            <div key={`prop-${idx}`} title={`${m.model} (SN: ${m.serial_number})`}>{m.model} <span className="text-slate-400 text-[10px]">({m.serial_number})</span></div>
                          ))}
                        </div>
                      </td>
                      <td className="px-2 py-3">
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
                        {lead.follow_up_date && (
                          <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-1 justify-center">
                            <CalendarIcon className="w-3 h-3" />
                            {format(new Date(lead.follow_up_date), "yyyy-MM-dd")}
                          </div>
                        )}
                      </td>
                      <td className="px-2 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {lead.status !== "accepted" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                              onClick={() => handleConvert(lead)}
                              title="Konvertera till kund/maskin"
                            >
                              <ArrowRight className="w-4 h-4" />
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-slate-500 hover:bg-slate-100" onClick={() => setViewingInteractions(lead)} title="Logga/visa historik">
                            <MessageSquare className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-blue-500 hover:bg-blue-50" onClick={() => setEditingLead(lead)} title="Redigera">
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-500 hover:bg-red-50" onClick={() => handleDelete(lead.id)} title="Ta bort">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4 p-4 bg-slate-50">
              {filteredLeads.map(lead => {
                const contact = getLeadContact(lead);
                return (
                  <Card key={lead.id} className="bg-white">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <div className="font-semibold text-slate-900">{getLeadName(lead)}</div>
                          {(lead.contact_person || customers.find(c => c.id === lead.customer_id)?.contact_person) && (
                            <div className="text-xs text-slate-500 mt-0.5">
                              {lead.contact_person || customers.find(c => c.id === lead.customer_id)?.contact_person}
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-xs mt-0.5">
                            {lead.customer_id ? (
                              <span className="text-slate-500 flex items-center gap-1"><User className="w-3 h-3" /> Befintlig</span>
                            ) : (
                              <span className="text-indigo-500 flex items-center gap-1"><Building2 className="w-3 h-3" /> Ny</span>
                            )}
                          </div>
                        </div>
                        <Badge className={`${statusMap[lead.status]?.color} border-0`}>
                          {statusMap[lead.status]?.label}
                        </Badge>
                      </div>

                      <div className="space-y-1 text-sm text-slate-600">
                        {contact.phone && <div className="flex items-center gap-2"><Phone className="w-3 h-3" /> {formatPhone(contact.phone)}</div>}
                        {contact.email && <div className="flex items-center gap-2"><Mail className="w-3 h-3" /> {contact.email}</div>}
                      </div>

                      {(lead.machine_ids?.length > 0 || lead.proposed_machines?.length > 0) && (
                        <div className="bg-slate-50 p-2 rounded text-xs text-slate-700">
                          {lead.machine_ids?.map(id => {
                            const m = machines.find(m => m.id === id);
                            return m ? <div key={id} className="truncate">{m.model} ({m.serial_number})</div> : null;
                          })}
                          {lead.proposed_machines?.map((m, idx) => (
                            <div key={`prop-${idx}`} className="truncate">{m.model} ({m.serial_number})</div>
                          ))}
                        </div>
                      )}

                      <div className="pt-2 border-t flex flex-wrap gap-2 justify-between items-center">
                        <Select value={lead.status} onValueChange={(v) => handleUpdateStatus(lead.id, v)}>
                          <SelectTrigger className="h-8 w-[140px] text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(statusMap).map(([k, v]) => (
                              <SelectItem key={k} value={k}>{v.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <div className="flex gap-1">
                          {lead.status !== "accepted" && (
                            <Button size="sm" variant="outline" className="h-8 w-8 p-0 text-emerald-600" onClick={() => handleConvert(lead)} title="Konvertera">
                              <ArrowRight className="w-4 h-4" />
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-slate-500" onClick={() => setViewingInteractions(lead)}><MessageSquare className="w-4 h-4" /></Button>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setEditingLead(lead)}><Pencil className="w-4 h-4" /></Button>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-500" onClick={() => handleDelete(lead.id)}><Trash2 className="w-4 h-4" /></Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
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

      {viewingInteractions && (
        <CustomerInteractionsModal
          customerId={viewingInteractions.customer_id}
          leadId={viewingInteractions.id}
          title={`Historik: ${getLeadName(viewingInteractions)}`}
          onClose={() => setViewingInteractions(null)}
        />
      )}
    </div>
  );
}