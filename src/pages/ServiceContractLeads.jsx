import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Search, Calendar as CalendarIcon, Trash2, ArrowRight, User, Building2, Phone, Mail, Copy, Pencil, Send, MessageSquare, CheckCircle2 } from "lucide-react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
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
  handpiece: { label: "Handenhet", color: "bg-slate-100 text-slate-800" },
  no_serial_number: { label: "Inget serienummer", color: "bg-stone-100 text-stone-800" },
};

export default function ServiceContractLeads() {
  const location = useLocation();
  const { toast } = useToast();
  const urlParams = new URLSearchParams(location.search);
  const initialStatus = urlParams.get("status") || "all";
  const initialSearch = urlParams.get("search") || "";

  const [leads, setLeads] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewLeadModal, setShowNewLeadModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState(initialSearch);

  useEffect(() => {
    const param = new URLSearchParams(location.search).get("search");
    if (param !== null) setSearchTerm(param);
  }, [location.search]);
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
    const { createFollowUp, followUpDate, ...leadData } = updatedData;
    const oldLead = leads.find(l => l.id === id);
    await base44.entities.ServiceContractLead.update(id, leadData);
    
    if (leadData.notes !== undefined && leadData.notes !== (oldLead?.notes || "")) {
      try {
        const user = await base44.auth.me();
        await base44.entities.CustomerInteraction.create({
          customer_id: oldLead?.customer_id || undefined,
          lead_id: id,
          interaction_type: 'other',
          interaction_date: new Date().toISOString(),
          notes: leadData.notes ? `Prospektanteckning uppdaterad: ${leadData.notes}` : "Prospektanteckning borttagen.",
          logged_by: user?.full_name || user?.email || "System"
        });
      } catch (err) {
        console.error("Kunde inte logga anteckning", err);
      }
    }

    if (createFollowUp && followUpDate) {
      try {
        const user = await base44.auth.me();
        await base44.entities.Task.create({
          title: `Uppföljning: Prospekt ${leadData.company_name || oldLead?.company_name || 'Okänd'}`,
          description: leadData.notes || "Följ upp prospekt.",
          status: "pending",
          due_date: followUpDate,
          customer_id: oldLead?.customer_id || undefined,
          lead_id: id,
          assigned_to: user?.email || undefined
        });
      } catch (err) {
        console.error("Kunde inte skapa uppföljning", err);
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
        notes: lead.notes || "",
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

    await base44.entities.ServiceContractLead.update(lead.id, { status: "accepted" });
    toast({
      title: "Prospekt konverterat",
      description: "Kund och maskiner har skapats."
    });
    fetchData();
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
      customer?.contact_person?.toLowerCase().includes(searchLower) ||
      l.proposed_machines?.some(m => 
        m.serial_number?.toLowerCase().includes(searchLower) || 
        m.model?.toLowerCase().includes(searchLower) ||
        `${m.model} (${m.serial_number})`.toLowerCase().includes(searchLower)
      ) ||
      l.machine_ids?.some(id => {
        const m = machines.find(mac => mac.id === id);
        return m?.serial_number?.toLowerCase().includes(searchLower) || 
               m?.model?.toLowerCase().includes(searchLower) ||
               `${m?.model} (${m?.serial_number})`.toLowerCase().includes(searchLower);
      });

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
          <p className="text-slate-500 text-sm sm:text-base">Hantera potentiella kunder för serviceavtal. <span className="font-medium text-slate-700">{filteredLeads.length} visas</span>{filteredLeads.length !== leads.length && <span className="text-slate-400"> av {leads.length} totalt</span>}</p>
        </div>
        <Button onClick={() => setShowNewLeadModal(true)} className="astomed-btn-primary w-full sm:w-auto h-12 sm:h-10 text-base sm:text-sm">
          <Plus className="w-5 h-5 sm:w-4 sm:h-4 mr-2" /> Nytt Prospekt
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-1 w-full bg-slate-50 rounded-lg px-3 py-1 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
            <Search className="w-5 h-5 text-slate-400" />
            <Input
              placeholder="Sök på namn, org.nr, email..."
              className="border-none shadow-none focus-visible:ring-0 px-0 bg-transparent h-10"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-64 h-12 sm:h-10 text-sm bg-slate-50">
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
                          {lead.proposed_machines?.map((m, idx) => {
                            const isRegistered = machines.some(machine => machine.serial_number === m.serial_number);
                            return (
                              <div key={`prop-${idx}`} title={`${m.model} (SN: ${m.serial_number})`} className="flex items-center gap-1">
                                {m.model} <span className="text-slate-400 text-[10px]">({m.serial_number})</span>
                                {isRegistered && <CheckCircle2 className="w-3 h-3 text-emerald-500" title="Registrerad i maskinlistan" />}
                              </div>
                            );
                          })}
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
            <div className="md:hidden p-4 bg-slate-50">
              {filteredLeads.length > 1 && (
                <div className="text-center text-xs text-slate-400 mb-3 flex items-center justify-center gap-2">
                  <span>←</span> Svep för fler prospekt ({filteredLeads.length} st) <span>→</span>
                </div>
              )}
              <Carousel className="w-full" opts={{ align: "start" }}>
                <CarouselContent>
                  {filteredLeads.map(lead => {
                    const contact = getLeadContact(lead);
                    return (
                      <CarouselItem key={lead.id} className="basis-full">
                        <Card className="bg-white shadow-sm border-slate-200 mx-1">
                    <CardContent className="p-4 space-y-4">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <div className="font-semibold text-slate-900 text-lg leading-tight">{getLeadName(lead)}</div>
                          {(lead.contact_person || customers.find(c => c.id === lead.customer_id)?.contact_person) && (
                            <div className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
                              <User className="w-4 h-4" />
                              {lead.contact_person || customers.find(c => c.id === lead.customer_id)?.contact_person}
                            </div>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            {lead.customer_id ? (
                              <Badge variant="outline" className="text-slate-500 font-normal border-slate-200"><User className="w-3 h-3 mr-1" /> Befintlig</Badge>
                            ) : (
                              <Badge variant="outline" className="text-indigo-600 bg-indigo-50 border-indigo-200 font-normal"><Building2 className="w-3 h-3 mr-1" /> Nytt</Badge>
                            )}
                          </div>
                        </div>
                        <Badge className={`${statusMap[lead.status]?.color} border-0 px-2.5 py-1 text-xs text-center break-words max-w-[100px]`}>
                          {statusMap[lead.status]?.label}
                        </Badge>
                      </div>

                      <div className="space-y-2 text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">
                        {contact.phone ? (
                          <a href={`tel:${contact.phone}`} className="flex items-center gap-3 text-blue-600 hover:underline py-1">
                            <Phone className="w-4 h-4 flex-shrink-0" /> <span className="truncate">{formatPhone(contact.phone)}</span>
                          </a>
                        ) : (
                          <div className="flex items-center gap-3 text-slate-400 py-1">
                            <Phone className="w-4 h-4 flex-shrink-0" /> Telefon saknas
                          </div>
                        )}
                        {contact.email ? (
                          <a href={`mailto:${contact.email}`} className="flex items-center gap-3 text-blue-600 hover:underline py-1">
                            <Mail className="w-4 h-4 flex-shrink-0" /> <span className="truncate">{contact.email}</span>
                          </a>
                        ) : (
                          <div className="flex items-center gap-3 text-slate-400 py-1">
                            <Mail className="w-4 h-4 flex-shrink-0" /> E-post saknas
                          </div>
                        )}
                      </div>

                      {lead.notes && (
                        <div className="text-sm text-slate-700 bg-amber-50/50 p-3 rounded-lg border border-amber-100">
                          <span className="font-medium text-slate-800 block mb-1">Anteckningar:</span>
                          <span className="whitespace-pre-line">{lead.notes}</span>
                        </div>
                      )}

                      {(lead.machine_ids?.length > 0 || lead.proposed_machines?.length > 0) && (
                        <div className="text-sm text-slate-700">
                          <span className="font-medium text-slate-800 block mb-1">Maskiner:</span>
                          <ul className="list-disc pl-5 space-y-1 text-slate-600">
                            {lead.machine_ids?.map(id => {
                              const m = machines.find(m => m.id === id);
                              return m ? <li key={id}>{m.model} <span className="text-xs text-slate-400">({m.serial_number})</span></li> : null;
                            })}
                            {lead.proposed_machines?.map((m, idx) => {
                              const isRegistered = machines.some(machine => machine.serial_number === m.serial_number);
                              return (
                                <li key={`prop-${idx}`} className="flex items-center gap-1">
                                  {m.model} <span className="text-xs text-slate-400">({m.serial_number})</span>
                                  {isRegistered && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" title="Registrerad i maskinlistan" />}
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      )}

                      <div className="space-y-3 pt-4 border-t border-slate-100">
                        <div>
                          <label className="text-xs font-semibold text-slate-500 mb-1.5 block uppercase tracking-wider">Status</label>
                          <Select value={lead.status} onValueChange={(v) => handleUpdateStatus(lead.id, v)}>
                            <SelectTrigger className="h-12 text-sm w-full bg-white shadow-sm border-slate-200 focus:ring-blue-100">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(statusMap).map(([k, v]) => (
                                <SelectItem key={k} value={k} className="py-3 text-sm">{v.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <Button 
                            className="h-11 shadow-sm" 
                            variant="outline" 
                            onClick={() => setViewingInteractions(lead)}
                          >
                            <MessageSquare className="w-4 h-4 mr-2 text-slate-500" /> Historik
                          </Button>
                          <Button 
                            className="h-11 shadow-sm" 
                            variant="outline" 
                            onClick={() => setEditingLead(lead)}
                          >
                            <Pencil className="w-4 h-4 mr-2 text-slate-500" /> Redigera
                          </Button>
                        </div>
                        
                        <div className="flex gap-2">
                          {lead.status !== "accepted" && (
                            <Button 
                              className="flex-1 h-11 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 shadow-sm" 
                              onClick={() => handleConvert(lead)}
                            >
                              <ArrowRight className="w-4 h-4 mr-2" /> Konvertera
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            className="h-11 px-4 text-red-500 hover:bg-red-50 hover:text-red-700 border border-transparent hover:border-red-100" 
                            onClick={() => handleDelete(lead.id)}
                            title="Ta bort"
                          >
                            <Trash2 className="w-5 h-5" />
                          </Button>
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