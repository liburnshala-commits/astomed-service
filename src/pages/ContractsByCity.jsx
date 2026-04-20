import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Building2, Monitor, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function ContractsByCity() {
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["contractsByCity"],
    queryFn: async () => {
      const [customers, machines] = await Promise.all([
        base44.entities.Customer.list(),
        base44.entities.Machine.list()
      ]);
      return { customers, machines };
    }
  });

  const groupedContracts = useMemo(() => {
    if (!data) return [];
    const { customers, machines } = data;
    
    // Filtrera fram maskiner som har ett aktivt serviceavtal
    const activeContracts = machines.filter(m => 
      m.service_contract && 
      m.service_contract !== "none" && 
      (!m.contract_status || m.contract_status === "active")
    );

    const grouped = {};
    
    activeContracts.forEach(machine => {
      const customer = customers.find(c => c.id === machine.customer_id);
      if (!customer) return;
      
      const city = (customer.city || "Okänd stad").trim();
      const postalCode = (customer.postal_code || "").replace(/\D/g, "");
      
      // Gruppera på de 2 första siffrorna i postnumret
      const prefix = postalCode.length >= 2 ? postalCode.substring(0, 2) : "Okänt";
      const groupKey = prefix === "Okänt" ? city : prefix;
      
      if (!grouped[groupKey]) {
        grouped[groupKey] = {
          id: groupKey,
          prefix: prefix,
          cities: new Set(),
          contracts: [],
          customerCount: new Set()
        };
      }
      
      if (city !== "Okänd stad") {
        grouped[groupKey].cities.add(city);
      }
      grouped[groupKey].contracts.push({ machine, customer });
      grouped[groupKey].customerCount.add(customer.id);
    });

    return Object.values(grouped).map(g => {
      const citiesList = Array.from(g.cities).sort();
      const citiesStr = citiesList.length > 0 ? citiesList.join(", ") : "Okänd ort";
      const label = g.prefix !== "Okänt" 
        ? `Postnummerområde ${g.prefix} (${citiesStr})` 
        : citiesStr;
        
      return {
        id: g.id,
        label: label,
        searchStr: `${g.prefix} ${citiesStr}`.toLowerCase(),
        contracts: g.contracts,
        customerCount: g.customerCount
      };
    }).sort((a, b) => a.label.localeCompare(b.label));
  }, [data]);

  const filteredGroups = useMemo(() => {
    if (!search) return groupedContracts;
    const lowerSearch = search.toLowerCase();
    
    // Filtrera antingen på området/staden, kundnamnet eller maskinmodellen/serienumret
    return groupedContracts.map(group => {
      const isCityMatch = group.searchStr.includes(lowerSearch);
      
      if (isCityMatch) return group; // Returnera hela området om det matchar

      // Annars returnera bara de avtal som matchar i staden
      const matchedContracts = group.contracts.filter(c => 
        c.customer.company_name?.toLowerCase().includes(lowerSearch) ||
        c.machine.model?.toLowerCase().includes(lowerSearch) ||
        c.machine.serial_number?.toLowerCase().includes(lowerSearch)
      );

      if (matchedContracts.length > 0) {
        return { ...group, contracts: matchedContracts };
      }

      return null;
    }).filter(Boolean);

  }, [groupedContracts, search]);

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500">Laddar avtal...</div>;
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold astomed-title flex items-center gap-2">
          <MapPin className="w-6 h-6" /> Avtal per stad
        </h1>
        <p className="text-sm astomed-muted mt-1">Översikt av aktiva serviceavtal grupperat per ort</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input 
          placeholder="Sök på stad, kund eller maskin..." 
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {filteredGroups.length === 0 ? (
        <div className="text-center py-12 text-slate-400 bg-white rounded-xl border border-slate-200">
          <MapPin className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Inga aktiva avtal hittades för sökningen.</p>
        </div>
      ) : (
        <Accordion type="multiple" className="space-y-4">
          {filteredGroups.map(group => (
            <AccordionItem key={group.id} value={group.id} className="bg-white rounded-xl border border-slate-200 px-4">
              <AccordionTrigger className="hover:no-underline py-4">
                <div className="flex items-center justify-between w-full pr-4">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-lg text-slate-800">{group.label}</span>
                    <Badge variant="secondary" className="bg-emerald-50 text-emerald-700">
                      {group.contracts.length} avtal
                    </Badge>
                  </div>
                  <div className="text-sm text-slate-500 font-normal hidden sm:block">
                    {group.customerCount.size} unika {group.customerCount.size === 1 ? "kund" : "kunder"}
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-4">
                <div className="space-y-3 pt-2">
                  {group.contracts.map((contract, idx) => (
                    <div key={`${contract.machine.id}-${idx}`} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100 gap-3 hover:bg-slate-100/50 transition-colors">
                      <div className="flex items-start sm:items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-sm">
                          <Building2 className="w-4 h-4 text-slate-400" />
                        </div>
                        <div>
                          <Link to={createPageUrl(`CustomerDetails?id=${contract.customer.id}`)} className="font-medium text-slate-900 hover:text-[#3a9e9e] hover:underline">
                            {contract.customer.company_name}
                          </Link>
                          <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                            <Monitor className="w-3 h-3" />
                            <span>{contract.machine.model}</span>
                            <span className="font-mono text-[10px] bg-slate-200 px-1 rounded">SN: {contract.machine.serial_number}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <Badge className="bg-teal-100 text-teal-800 border-0 text-xs font-semibold px-2 py-0.5">
                          {contract.machine.service_contract === "basic" ? "BAS – Astomed 3.0" : contract.machine.service_contract}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
}