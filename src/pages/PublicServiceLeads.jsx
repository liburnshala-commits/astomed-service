import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  UserPlus, Wrench, Archive, Eye, Search, RefreshCw,
  Building2, Phone, Mail, Cpu, ClipboardList, Trash2
} from "lucide-react";
import { toast } from "sonner";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import LeadDetailModal from "@/components/leads/LeadDetailModal.jsx";
import ConvertLeadModal from "@/components/leads/ConvertLeadModal.jsx";

const statusConfig = {
  new: { label: "Ny", color: "bg-blue-100 text-blue-800" },
  customer_created: { label: "Kund skapad", color: "bg-green-100 text-green-800" },
  assigned: { label: "Tilldelad", color: "bg-purple-100 text-purple-800" },
  archived: { label: "Arkiverad", color: "bg-gray-100 text-gray-600" }
};

export default function PublicServiceLeads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedLead, setSelectedLead] = useState(null);
  const [convertLead, setConvertLead] = useState(null);

  const loadLeads = async () => {
    setLoading(true);
    const data = await base44.entities.PublicServiceLead.list("-created_date", 100);
    setLeads(data);
    setLoading(false);
  };

  useEffect(() => { loadLeads(); }, []);

  const filtered = leads.filter(l => {
    const searchLower = search.toLowerCase();
    const matchSearch =
      l.company_name?.toLowerCase().includes(searchLower) ||
      l.org_number?.toLowerCase().includes(searchLower) ||
      l.contact_person?.toLowerCase().includes(searchLower) ||
      l.email?.toLowerCase().includes(searchLower) ||
      l.phone?.toLowerCase().includes(searchLower) ||
      l.machine_name?.toLowerCase().includes(searchLower) ||
      l.serial_number?.toLowerCase().includes(searchLower);
    const matchStatus = statusFilter === "all" || l.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const counts = {
    all: leads.length,
    new: leads.filter(l => l.status === "new").length,
    customer_created: leads.filter(l => l.status === "customer_created").length,
    assigned: leads.filter(l => l.status === "assigned").length,
    archived: leads.filter(l => l.status === "archived").length,
  };

  const handleArchive = async (lead) => {
    await base44.entities.PublicServiceLead.update(lead.id, { status: "archived" });
    loadLeads();
  };

  const handleDelete = async (lead) => {
    if (!confirm(`Vill du verkligen radera förfrågan från ${lead.company_name}? Detta går inte att ångra.`)) {
      return;
    }
    try {
      await base44.entities.PublicServiceLead.delete(lead.id);
      toast.success("Förfrågan raderad");
      loadLeads();
    } catch (error) {
      toast.error("Kunde inte radera förfrågan: " + error.message);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold astomed-title">Serviceförfrågningar</h1>
          <p className="astomed-subtitle text-sm mt-1">Inkommande förfrågningar från externa kunder</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadLeads} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Uppdatera
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {[
          { key: "all", label: "Alla" },
          { key: "new", label: "Nya" },
          { key: "customer_created", label: "Kund skapad" },
          { key: "assigned", label: "Tilldelade" },
          { key: "archived", label: "Arkiverade" },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              statusFilter === tab.key
                ? "text-white"
                : "bg-white border text-gray-600 hover:bg-gray-50"
            }`}
            style={statusFilter === tab.key ? { background: "#1b3a3a" } : {}}
          >
            {tab.label}
            <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
              statusFilter === tab.key ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
            }`}>{counts[tab.key]}</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          className="pl-9"
          placeholder="Sök på företag, kontakt eller maskin..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Leads list */}
      {loading ? (
        <div className="text-center py-16 text-gray-400">Laddar...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>Inga förfrågningar hittades</p>
        </div>
      ) : (
        <>
          {/* Desktop list view */}
          <div className="hidden md:flex flex-col space-y-3">
            {filtered.map(lead => {
              const sc = statusConfig[lead.status] || statusConfig.new;
              return (
                <div key={lead.id} className="bg-white border rounded-xl p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <span className="font-semibold astomed-title text-base">{lead.company_name}</span>
                        <Badge className={`text-xs ${sc.color}`}>{sc.label}</Badge>
                        {lead.service_type === "advanced" && (
                          <Badge className="text-xs bg-orange-100 text-orange-800">Avancerad</Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-1 text-sm text-gray-600">
                        <span className="flex items-center gap-1.5">
                          <UserPlus className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                          {lead.contact_person}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                          {lead.phone}
                        </span>
                        <span className="flex items-center gap-1.5 truncate">
                          <Mail className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                          {lead.email}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Cpu className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                          {lead.machine_name}{lead.manufacturer ? ` (${lead.manufacturer})` : ""}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-2 line-clamp-2">{lead.service_description}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(lead.created_date).toLocaleDateString("sv-SE", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => setSelectedLead(lead)}>
                        <Eye className="w-3.5 h-3.5" /> Detaljer
                      </Button>
                      {lead.status === "new" && (
                        <Button size="sm" className="gap-1.5 text-xs astomed-btn-primary" onClick={() => setConvertLead(lead)}>
                          <Building2 className="w-3.5 h-3.5" /> Skapa kund
                        </Button>
                      )}
                      {lead.status !== "archived" && (
                        <Button size="sm" variant="ghost" className="gap-1.5 text-xs text-gray-400 hover:text-gray-600" onClick={() => handleArchive(lead)}>
                          <Archive className="w-3.5 h-3.5" /> Arkivera
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" className="gap-1.5 text-xs text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(lead)}>
                        <Trash2 className="w-3.5 h-3.5" /> Radera
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Mobile Carousel View */}
          <div className="md:hidden pb-4">
            {filtered.length > 1 && (
              <div className="text-center text-xs text-slate-400 mb-3 flex items-center justify-center gap-2">
                <span>←</span> Svep för fler förfrågningar ({filtered.length} st) <span>→</span>
              </div>
            )}
            <Carousel className="w-full" opts={{ align: "start" }}>
              <CarouselContent>
                {filtered.map(lead => {
                  const sc = statusConfig[lead.status] || statusConfig.new;
                  return (
                    <CarouselItem key={lead.id} className="basis-11/12 sm:basis-8/12">
                      <Card className="bg-white shadow-sm border-slate-200 mx-1 h-full flex flex-col">
                        <CardContent className="p-4 space-y-4 flex-1 flex flex-col">
                          <div className="flex justify-between items-start gap-2">
                            <div className="min-w-0">
                              <h3 className="font-semibold text-lg leading-tight text-slate-900 truncate">{lead.company_name}</h3>
                              <div className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
                                <UserPlus className="w-4 h-4 flex-shrink-0" />
                                <span className="truncate">{lead.contact_person}</span>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1 flex-shrink-0">
                              <Badge className={`border-0 px-2.5 py-1 text-[10px] uppercase tracking-wider text-center ${sc.color}`}>
                                {sc.label}
                              </Badge>
                              {lead.service_type === "advanced" && (
                                <Badge className="border-0 px-2 py-0.5 text-[10px] bg-orange-100 text-orange-800">
                                  Avancerad
                                </Badge>
                              )}
                            </div>
                          </div>

                          <div className="space-y-2 text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">
                            {lead.phone ? (
                              <a href={`tel:${lead.phone}`} className="flex items-center gap-3 text-blue-600 hover:underline py-1">
                                <Phone className="w-4 h-4 flex-shrink-0" /> <span className="truncate">{lead.phone}</span>
                              </a>
                            ) : (
                              <div className="flex items-center gap-3 text-slate-400 py-1">
                                <Phone className="w-4 h-4 flex-shrink-0" /> Saknas
                              </div>
                            )}
                            {lead.email ? (
                              <a href={`mailto:${lead.email}`} className="flex items-center gap-3 text-blue-600 hover:underline py-1">
                                <Mail className="w-4 h-4 flex-shrink-0" /> <span className="truncate">{lead.email}</span>
                              </a>
                            ) : (
                              <div className="flex items-center gap-3 text-slate-400 py-1">
                                <Mail className="w-4 h-4 flex-shrink-0" /> Saknas
                              </div>
                            )}
                          </div>

                          <div className="text-sm text-slate-700 bg-blue-50/50 p-3 rounded-lg border border-blue-100/50 flex-1">
                            <div className="flex items-center gap-2 font-medium text-slate-800 mb-1.5">
                              <Cpu className="w-4 h-4" />
                              {lead.machine_name}{lead.manufacturer ? ` (${lead.manufacturer})` : ""}
                            </div>
                            <span className="text-slate-600 line-clamp-3 text-xs leading-relaxed">{lead.service_description}</span>
                          </div>

                          <div className="pt-2 space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                              <Button className="h-11 shadow-sm w-full" variant="outline" onClick={() => setSelectedLead(lead)}>
                                <Eye className="w-4 h-4 mr-2" /> Detaljer
                              </Button>
                              {lead.status === "new" ? (
                                <Button className="h-11 shadow-sm w-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200" onClick={() => setConvertLead(lead)}>
                                  <Building2 className="w-4 h-4 mr-2" /> Skapa kund
                                </Button>
                              ) : (
                                <Button className="h-11 shadow-sm w-full" variant="outline" disabled>
                                  <Building2 className="w-4 h-4 mr-2 opacity-50" /> Skapad
                                </Button>
                              )}
                            </div>
                            <div className="flex gap-2">
                              {lead.status !== "archived" && (
                                <Button className="flex-1 h-11" variant="ghost" onClick={() => handleArchive(lead)}>
                                  <Archive className="w-4 h-4 mr-2" /> Arkivera
                                </Button>
                              )}
                              <Button className="flex-1 h-11 text-red-500 hover:text-red-700 hover:bg-red-50" variant="ghost" onClick={() => handleDelete(lead)}>
                                <Trash2 className="w-4 h-4 mr-2" /> Radera
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

      {selectedLead && (
        <LeadDetailModal lead={selectedLead} onClose={() => setSelectedLead(null)} />
      )}
      {convertLead && (
        <ConvertLeadModal lead={convertLead} onClose={() => setConvertLead(null)} onConverted={() => { setConvertLead(null); loadLeads(); }} />
      )}
    </div>
  );
}