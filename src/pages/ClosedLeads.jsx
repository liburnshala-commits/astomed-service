import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Search, Archive, Phone, Mail, Building2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const STATUS_LABELS = {
  sold_machines: "Sålt maskiner",
  rejected: "Avvisat",
  no_contract_wanted: "Vill ej ha avtal",
  not_interested: "Ej intresserad",
  other_service_contract: "Annat serviceavtal",
  wrong_phone: "Fel nummer",
  wrong_email: "Fel e-post"
};

const CLOSED_STATUSES = [
  "sold_machines", "rejected", "no_contract_wanted", 
  "not_interested", "other_service_contract", 
  "wrong_phone", "wrong_email"
];

export default function ClosedLeads() {
  const [search, setSearch] = useState("");

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["closedLeads"],
    queryFn: async () => {
      const allLeads = await base44.entities.ServiceContractLead.list("-created_date");
      return allLeads.filter(lead => CLOSED_STATUSES.includes(lead.status));
    },
  });

  const filteredLeads = leads.filter(lead => {
    const s = search.toLowerCase();
    return (
      lead.company_name?.toLowerCase().includes(s) ||
      lead.contact_person?.toLowerCase().includes(s) ||
      lead.email?.toLowerCase().includes(s) ||
      lead.phone?.toLowerCase().includes(s)
    );
  });

  if (isLoading) return <div className="p-8 text-center text-slate-500">Laddar avslutade prospekt...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Archive className="w-6 h-6 text-slate-500" />
            Avslutade Prospekt
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Prospekt som har markerats som ointresserade, avvisade, sålt maskiner, eller har annat serviceavtal.
          </p>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input 
          placeholder="Sök på företag, namn, e-post..." 
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredLeads.map(lead => (
          <Card key={lead.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex justify-between items-start mb-4">
                <div className="font-semibold text-slate-900 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-slate-400" />
                  {lead.company_name || "Okänt företag"}
                </div>
                <Badge variant="secondary" className="bg-slate-100 text-slate-600 text-xs">
                  {STATUS_LABELS[lead.status] || lead.status}
                </Badge>
              </div>

              <div className="space-y-2 text-sm text-slate-600 mb-4">
                {lead.contact_person && (
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    {lead.contact_person}
                  </div>
                )}
                {lead.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {lead.phone}
                  </div>
                )}
                {lead.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{lead.email}</span>
                  </div>
                )}
              </div>

              {lead.notes && (
                <div className="text-xs text-slate-500 bg-slate-50 p-2 rounded border border-slate-100 whitespace-pre-wrap max-h-24 overflow-y-auto">
                  {lead.notes}
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {filteredLeads.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500 bg-white rounded-xl border border-dashed">
            <Archive className="w-8 h-8 mx-auto mb-3 opacity-20" />
            <p>Inga avslutade prospekt hittades.</p>
          </div>
        )}
      </div>
    </div>
  );
}