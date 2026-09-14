import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { FileWarning, Monitor, ArrowRight, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function MissingProtocols() {
  const [search, setSearch] = useState("");

  const { data: pageData, isLoading } = useQuery({
    queryKey: ["missingProtocolsPage"],
    queryFn: async () => {
      const [customers, machines, records] = await Promise.all([
        base44.entities.Customer.list(),
        base44.entities.Machine.list(),
        base44.entities.ServiceRecord.list()
      ]);
      return { customers, machines, records };
    },
    staleTime: 30 * 1000
  });

  const missingData = useMemo(() => {
    if (!pageData) return [];
    const { customers, machines, records } = pageData;
    
    // Find all machines with active contracts
    const contractedMachines = machines.filter(m => 
      !m.is_deleted &&
      m.service_contract && 
      m.service_contract !== 'none' && 
      (!m.contract_status || m.contract_status === 'active')
    );

    // Group machines by customer
    const machinesByCustomer = contractedMachines.reduce((acc, m) => {
      if (!acc[m.customer_id]) acc[m.customer_id] = [];
      acc[m.customer_id].push(m);
      return acc;
    }, {});

    const results = [];
    
    // Check if these machines have any completed service records
    for (const customerId of Object.keys(machinesByCustomer)) {
      const customer = customers.find(c => c.id === customerId);
      if (!customer || customer.is_deleted) continue;
      
      const missingMachines = machinesByCustomer[customerId].filter(m => {
        // Check if this machine has any completed/invoiced service record
        const hasProtocol = records.some(r => 
          r.machine_id === m.id && 
          (r.status === 'completed' || r.status === 'invoiced')
        );
        return !hasProtocol;
      });

      if (missingMachines.length > 0) {
        results.push({
          customer,
          machines: missingMachines
        });
      }
    }
    
    return results;
  }, [pageData]);

  const filtered = useMemo(() => {
    if (!search) return missingData;
    const lower = search.toLowerCase();
    return missingData.filter(item => 
      item.customer.company_name?.toLowerCase().includes(lower) ||
      item.machines.some(m => m.model?.toLowerCase().includes(lower) || m.serial_number?.toLowerCase().includes(lower))
    );
  }, [missingData, search]);

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500">Laddar...</div>;
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold astomed-title flex items-center gap-2">
            <FileWarning className="w-6 h-6 text-orange-500" />
            Saknar Serviceprotokoll
          </h1>
          <p className="astomed-subtitle text-sm">
            Kunder och maskiner med aktivt avtal som saknar slutförda serviceprotokoll
          </p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 astomed-muted" />
          <Input 
            placeholder="Sök kund eller maskin..." 
            className="pl-9 bg-white" 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <FileWarning className="w-12 h-12 mx-auto mb-3 opacity-30 text-green-500" />
          <p>Alla maskiner med avtal har serviceprotokoll!</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map(item => (
            <Card key={item.customer.id} className="astomed-card overflow-hidden">
              <div className="bg-slate-50 p-4 border-b flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg text-slate-800">{item.customer.company_name}</h3>
                  <div className="text-sm text-slate-500 mt-1">
                    {item.customer.city || "Ort saknas"} • {item.machines.length} maskin{item.machines.length !== 1 ? 'er' : ''} utan protokoll
                  </div>
                </div>
                <Link to={createPageUrl(`CustomerDetails?id=${item.customer.id}`)}>
                  <Button variant="outline" size="sm" className="bg-white">
                    Gå till kund <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-100">
                  {item.machines.map(m => (
                    <div key={m.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-orange-50 text-orange-600 rounded-lg shrink-0">
                          <Monitor className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-medium text-slate-800">{m.model}</div>
                          <div className="text-xs font-mono text-slate-500 mt-0.5">SN: {m.serial_number || "Okänt"}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                          {m.service_contract === 'basic' ? 'BAS' : m.service_contract}
                        </Badge>
                        <Link to={createPageUrl(`ServiceRecords?machine_id=${m.id}`)}>
                          <Button size="sm" variant="secondary" className="text-xs">
                            Skapa service
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}