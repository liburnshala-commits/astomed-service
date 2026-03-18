import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Search, Calendar as CalendarIcon, Trash2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import MultiMachineContractModal from "@/components/contracts/MultiMachineContractModal";

export default function ServiceContractLeads() {
  const [leads, setLeads] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  // New Lead Form State
  const [newLead, setNewLead] = useState({ customer_id: "", status: "new", follow_up_date: "" });
  
  // Conversion state
  const [convertingLead, setConvertingLead] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [leadsData, customersData] = await Promise.all([
        base44.entities.ServiceContractLead.list(),
        base44.entities.Customer.list()
      ]);
      setLeads(leadsData);
      setCustomers(customersData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLead = async () => {
    if (!newLead.customer_id) return;
    await base44.entities.ServiceContractLead.create({
      customer_id: newLead.customer_id,
      status: newLead.status,
      follow_up_date: newLead.follow_up_date || null
    });
    setShowAddForm(false);
    setNewLead({ customer_id: "", status: "new", follow_up_date: "" });
    fetchData();
  };

  const handleUpdateStatus = async (id, newStatus) => {
    await base44.entities.ServiceContractLead.update(id, { status: newStatus });
    fetchData();
  };

  const handleDelete = async (id) => {
    if (confirm("Är du säker på att du vill ta bort detta prospekt?")) {
      await base44.entities.ServiceContractLead.delete(id);
      fetchData();
    }
  };

  const handleConversionComplete = async () => {
    if (convertingLead) {
      await base44.entities.ServiceContractLead.update(convertingLead.id, { status: "accepted" });
    }
    setConvertingLead(null);
    fetchData();
  };

  const statusMap = {
    new: { label: "Nytt", color: "bg-blue-100 text-blue-800" },
    contacted: { label: "Kontaktad", color: "bg-amber-100 text-amber-800" },
    proposal_sent: { label: "Offert skickad", color: "bg-purple-100 text-purple-800" },
    accepted: { label: "Accepterad", color: "bg-emerald-100 text-emerald-800" },
    rejected: { label: "Avvisad", color: "bg-red-100 text-red-800" },
  };

  const filteredLeads = leads.filter(l => {
    const cust = customers.find(c => c.id === l.customer_id);
    return cust?.company_name?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Serviceavtals-prospekt</h1>
          <p className="text-slate-500">Hantera befintliga kunder som är potentiella för serviceavtal.</p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)} className="astomed-btn-primary">
          <Plus className="w-4 h-4 mr-2" /> Nytt Prospekt
        </Button>
      </div>

      {showAddForm && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
          <h2 className="font-semibold text-lg">Skapa nytt prospekt</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Välj Kund</Label>
              <Select value={newLead.customer_id} onValueChange={v => setNewLead({...newLead, customer_id: v})}>
                <SelectTrigger><SelectValue placeholder="Välj kund..." /></SelectTrigger>
                <SelectContent>
                  {customers.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={newLead.status} onValueChange={v => setNewLead({...newLead, status: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(statusMap).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Uppföljningsdatum</Label>
              <Input type="date" value={newLead.follow_up_date} onChange={e => setNewLead({...newLead, follow_up_date: e.target.value})} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowAddForm(false)}>Avbryt</Button>
            <Button onClick={handleCreateLead} disabled={!newLead.customer_id} className="astomed-btn-primary">Spara Prospekt</Button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center gap-2">
          <Search className="w-5 h-5 text-slate-400" />
          <Input 
            placeholder="Sök på kundnamn..." 
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
                  <th className="px-4 py-3">Kund</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Uppföljning</th>
                  <th className="px-4 py-3 text-right">Åtgärder</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLeads.map(lead => {
                  const customer = customers.find(c => c.id === lead.customer_id);
                  return (
                    <tr key={lead.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {customer?.company_name || "Okänd kund"}
                      </td>
                      <td className="px-4 py-3 w-48">
                        <Select value={lead.status} onValueChange={(v) => handleUpdateStatus(lead.id, v)}>
                          <SelectTrigger className={`h-8 border-none font-medium ${statusMap[lead.status]?.color}`}>
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
                        {lead.status !== 'accepted' && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                            onClick={() => setConvertingLead(lead)}
                          >
                            <ArrowRight className="w-4 h-4 mr-1" /> Konvertera
                          </Button>
                        )}
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

      {convertingLead && (
        <MultiMachineContractModal 
          initialCustomerId={convertingLead.customer_id}
          onClose={() => setConvertingLead(null)}
          onSave={handleConversionComplete}
        />
      )}
    </div>
  );
}