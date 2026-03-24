import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { Search, Monitor, Building2, RefreshCw, Trash2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";

export default function DeletedMachines() {
  const [machines, setMachines] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    const [allMachines, allCustomers] = await Promise.all([
      base44.entities.Machine.list("-deleted_date"),
      base44.entities.Customer.list()
    ]);
    
    // Filter only deleted machines
    const deleted = allMachines.filter(m => m.is_deleted);
    setMachines(deleted);
    setCustomers(allCustomers);
    setLoading(false);
  };

  const getCustomer = (id) => customers.find(c => c.id === id);

  const handleRestore = async (machine) => {
    if (confirm(`Vill du återställa ${machine.model} (${machine.serial_number})?`)) {
      await base44.entities.Machine.update(machine.id, { 
        is_deleted: false, 
        deleted_date: null 
      });
      
      const currentUser = await base44.auth.me();
      base44.functions.invoke('logAuditEntry', {
        action: 'update',
        entity_type: 'Machine',
        entity_id: machine.id,
        entity_label: `${machine.model} – SN: ${machine.serial_number}`,
        user_email: currentUser?.email || 'unknown',
        user_name: currentUser?.full_name || currentUser?.email,
        details: `Maskin återställd från papperskorgen`
      });
      
      load();
    }
  };

  const handlePermanentDelete = async (machine) => {
    if (confirm(`VARNING: Detta tar bort ${machine.model} (${machine.serial_number}) PERMANENT. Detta går inte att ångra. Är du säker?`)) {
      await base44.entities.Machine.delete(machine.id);
      
      const currentUser = await base44.auth.me();
      base44.functions.invoke('logAuditEntry', {
        action: 'delete',
        entity_type: 'Machine',
        entity_id: machine.id,
        entity_label: `${machine.model} – SN: ${machine.serial_number}`,
        user_email: currentUser?.email || 'unknown',
        user_name: currentUser?.full_name || currentUser?.email,
        details: `Maskin permanent borttagen från papperskorgen`
      });
      
      load();
    }
  };

  const filtered = machines.filter(m => {
    const cust = getCustomer(m.customer_id);
    const searchLower = search.toLowerCase();
    return (
      m.model?.toLowerCase().includes(searchLower) ||
      m.serial_number?.toLowerCase().includes(searchLower) ||
      cust?.company_name?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
         <div className="flex items-center gap-4">
           <Link to="/Machines">
             <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
           </Link>
           <div>
             <h1 className="text-2xl font-bold text-slate-900">Raderade Maskiner</h1>
             <p className="text-slate-500 text-sm">Återställ eller ta bort maskiner permanent</p>
           </div>
         </div>
       </div>

      <div className="flex items-center gap-3 bg-white p-2 rounded-lg border shadow-sm max-w-md">
        <Search className="w-4 h-4 text-slate-400 ml-2" />
        <Input 
          placeholder="Sök på modell, serienummer eller kund..." 
          className="border-none shadow-none focus-visible:ring-0" 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">Laddar...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
          <Trash2 className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <h3 className="text-lg font-medium text-slate-600">Papperskorgen är tom</h3>
          <p className="text-slate-400">Inga raderade maskiner hittades</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map(machine => {
            const customer = getCustomer(machine.customer_id);
            return (
              <div key={machine.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
                    <Monitor className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{machine.model}</h3>
                    <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                      <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-xs">SN: {machine.serial_number}</span>
                      {customer && (
                        <div className="flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          <span>{customer.company_name}</span>
                        </div>
                      )}
                    </div>
                    {machine.deleted_date && (
                      <div className="text-xs text-red-400 mt-1">
                        Raderad: {format(new Date(machine.deleted_date), "yyyy-MM-dd HH:mm")}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 md:ml-auto">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                    onClick={() => handleRestore(machine)}
                  >
                    <RefreshCw className="w-3 h-3 mr-2" />
                    Återställ
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-red-500 hover:bg-red-50 hover:text-red-700"
                    onClick={() => handlePermanentDelete(machine)}
                  >
                    <Trash2 className="w-3 h-3 mr-2" />
                    Radera permanent
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}