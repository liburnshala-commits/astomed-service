import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Search, Archive, Phone, Mail, Building2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";

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

  const renderCard = (lead, isMobile = false) => (
    <Card key={lead.id} className={`hover:shadow-md transition-shadow h-full flex flex-col ${isMobile ? 'mx-1' : ''}`}>
      <CardContent className="p-5 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-4 gap-2">
          <div className="font-semibold text-slate-900 flex items-center gap-2 min-w-0">
            <Building2 className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <span className="truncate">{lead.company_name || "Okänt företag"}</span>
          </div>
          <Badge variant="secondary" className="bg-slate-100 text-slate-600 text-[10px] uppercase tracking-wider text-center flex-shrink-0">
            {STATUS_LABELS[lead.status] || lead.status}
          </Badge>
        </div>

        <div className="space-y-2 text-sm text-slate-600 mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100 flex-1">
          {lead.contact_person && (
            <div className="flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <span className="truncate">{lead.contact_person}</span>
            </div>
          )}
          {lead.phone && (
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <span className="truncate">{lead.phone}</span>
            </div>
          )}
          {lead.email && (
            <div className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <span className="truncate">{lead.email}</span>
            </div>
          )}
        </div>

        {lead.proposed_machines && lead.proposed_machines.length > 0 && (
          <div className="text-xs text-slate-600 mb-4 space-y-1.5">
            <span className="font-semibold text-slate-700 block">Föreslagna maskiner:</span>
            {lead.proposed_machines.map((m, idx) => (
              <div key={idx} className="bg-slate-50 p-2 rounded border border-slate-100 flex justify-between items-center">
                <span className="font-medium truncate mr-2">{m.model}</span>
                {m.serial_number && (
                  <Badge variant="outline" className="text-[10px] bg-white whitespace-nowrap font-mono">SN: {m.serial_number}</Badge>
                )}
              </div>
            ))}
          </div>
        )}

        {lead.notes && (
          <div className="text-xs text-slate-500 bg-amber-50/50 p-3 rounded-lg border border-amber-100 whitespace-pre-wrap max-h-24 overflow-y-auto mt-auto">
            <span className="font-medium text-slate-800 block mb-1">Anteckningar:</span>
            {lead.notes}
          </div>
        )}
      </CardContent>
    </Card>
  );

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

      {filteredLeads.length === 0 ? (
        <div className="py-12 text-center text-slate-500 bg-white rounded-xl border border-dashed">
          <Archive className="w-8 h-8 mx-auto mb-3 opacity-20" />
          <p>Inga avslutade prospekt hittades.</p>
        </div>
      ) : (
        <>
          {/* Desktop Grid View */}
          <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredLeads.map(lead => renderCard(lead))}
          </div>

          {/* Mobile Carousel View */}
          <div className="md:hidden">
            {filteredLeads.length > 1 && (
              <div className="text-center text-xs text-slate-400 mb-3 flex items-center justify-center gap-2">
                <span>←</span> Svep för fler ({filteredLeads.length} st) <span>→</span>
              </div>
            )}
            <Carousel className="w-full" opts={{ align: "start" }}>
              <CarouselContent>
                {filteredLeads.map(lead => (
                  <CarouselItem key={lead.id} className="basis-11/12 sm:basis-8/12">
                    {renderCard(lead, true)}
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          </div>
        </>
      )}
    </div>
  );
}