import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  UserPlus, Mail, Search, RefreshCw,
  Building2, Phone, ClipboardList, Eye
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";

export default function NewCustomers() {
  const [customers, setCustomers] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const [customersData, usersData] = await Promise.all([
        base44.entities.Customer.list("-created_date", 100),
        base44.entities.User.list()
      ]);
      setCustomers(customersData);
      setUsers(usersData);
    } catch(e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleApprove = async (email) => {
    if (!confirm("Vill du godkänna denna kund och ge dem åtkomst till portalen?")) return;
    try {
      await base44.functions.invoke('updateUserRole', { email, role: 'customer' });
      // Reload data to see changes
      loadData();
    } catch(e) {
      alert("Kunde inte godkänna kunden: " + e.message);
    }
  };

  const filtered = customers.filter(c => {
    const searchLower = search.toLowerCase();
    return (
      c.company_name?.toLowerCase().includes(searchLower) ||
      c.org_number?.toLowerCase().includes(searchLower) ||
      c.contact_person?.toLowerCase().includes(searchLower) ||
      c.email?.toLowerCase().includes(searchLower) ||
      c.phone?.toLowerCase().includes(searchLower) ||
      c.city?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold astomed-title">Nya Kunder (Registreringar)</h1>
          <p className="astomed-subtitle text-sm mt-1">Översikt över nyligen skapade kundkonton via kundportalen</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadData} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Uppdatera
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          className="pl-9"
          placeholder="Sök på företag, kontakt, e-post..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Customers list */}
      {loading ? (
        <div className="text-center py-16 text-gray-400">Laddar...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>Inga kunder hittades</p>
        </div>
      ) : (
        <>
          {/* Desktop list view */}
          <div className="hidden md:flex flex-col space-y-3">
            {filtered.map(customer => {
              const customerUser = users.find(u => u.email === customer.email);
              const isPending = customerUser?.role === 'pending_customer';
              return (
              <div key={customer.id} className="bg-white border rounded-xl p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <span className="font-semibold astomed-title text-base">{customer.company_name}</span>
                      {customer.org_number && <Badge className="text-xs bg-gray-100 text-gray-700">{customer.org_number}</Badge>}
                      {!customer.is_imported && (
                        <Badge className="text-xs bg-green-100 text-green-800">Nyregistrering</Badge>
                      )}
                      {isPending && (
                        <Badge className="text-xs bg-yellow-100 text-yellow-800">Väntar på godkännande</Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-1 text-sm text-gray-600">
                      <span className="flex items-center gap-1.5">
                        <UserPlus className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        {customer.contact_person || 'Ingen kontaktperson'}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        {customer.phone || 'Inget telefonnummer'}
                      </span>
                      <span className="flex items-center gap-1.5 truncate">
                        <Mail className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        {customer.email || 'Ingen e-post'}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        {customer.city || 'Okänd ort'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-3">
                      Registrerad: {new Date(customer.created_date).toLocaleDateString("sv-SE", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => window.location.href = `/CustomerDetails?id=${customer.id}`}>
                      <Eye className="w-3.5 h-3.5" /> Gå till kundkort
                    </Button>
                    {isPending && (
                      <Button size="sm" className="gap-1.5 text-xs astomed-btn-primary" onClick={() => handleApprove(customer.email)}>
                        Godkänn
                      </Button>
                    )}
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
                <span>←</span> Svep för fler kunder ({filtered.length} st) <span>→</span>
              </div>
            )}
            <Carousel className="w-full" opts={{ align: "start" }}>
              <CarouselContent>
                {filtered.map(customer => {
                  const customerUser = users.find(u => u.email === customer.email);
                  const isPending = customerUser?.role === 'pending_customer';
                  return (
                  <CarouselItem key={customer.id} className="basis-11/12 sm:basis-8/12">
                    <Card className="bg-white shadow-sm border-slate-200 mx-1 h-full flex flex-col">
                      <CardContent className="p-4 space-y-4 flex-1 flex flex-col">
                        <div className="flex justify-between items-start gap-2">
                          <div className="min-w-0">
                            <h3 className="font-semibold text-lg leading-tight text-slate-900 truncate">{customer.company_name}</h3>
                            <div className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
                              <UserPlus className="w-4 h-4 flex-shrink-0" />
                              <span className="truncate">{customer.contact_person || 'Ingen kontaktperson'}</span>
                            </div>
                          </div>
                          <div className="flex flex-col gap-1 items-end shrink-0">
                            {!customer.is_imported && (
                              <Badge className="border-0 px-2 py-0.5 text-[10px] bg-green-100 text-green-800">
                                Nyregistrering
                              </Badge>
                            )}
                            {isPending && (
                              <Badge className="border-0 px-2 py-0.5 text-[10px] bg-yellow-100 text-yellow-800">
                                Väntar
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2 text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">
                          {customer.phone ? (
                            <a href={`tel:${customer.phone}`} className="flex items-center gap-3 text-blue-600 hover:underline py-1">
                              <Phone className="w-4 h-4 flex-shrink-0" /> <span className="truncate">{customer.phone}</span>
                            </a>
                          ) : (
                            <div className="flex items-center gap-3 text-slate-400 py-1">
                              <Phone className="w-4 h-4 flex-shrink-0" /> Saknas
                            </div>
                          )}
                          {customer.email ? (
                            <a href={`mailto:${customer.email}`} className="flex items-center gap-3 text-blue-600 hover:underline py-1">
                              <Mail className="w-4 h-4 flex-shrink-0" /> <span className="truncate">{customer.email}</span>
                            </a>
                          ) : (
                            <div className="flex items-center gap-3 text-slate-400 py-1">
                              <Mail className="w-4 h-4 flex-shrink-0" /> Saknas
                            </div>
                          )}
                          <div className="flex items-center gap-3 text-slate-700 py-1">
                            <Building2 className="w-4 h-4 flex-shrink-0 text-slate-400" /> <span className="truncate">{customer.city || 'Ort saknas'}</span>
                          </div>
                        </div>

                        <div className="pt-2 mt-auto flex gap-2">
                          <Button className="h-11 shadow-sm flex-1" variant="outline" onClick={() => window.location.href = `/CustomerDetails?id=${customer.id}`}>
                            <Eye className="w-4 h-4 mr-2" /> Kundkort
                          </Button>
                          {isPending && (
                            <Button className="h-11 shadow-sm flex-1 astomed-btn-primary" onClick={() => handleApprove(customer.email)}>
                              Godkänn
                            </Button>
                          )}
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
  );
}