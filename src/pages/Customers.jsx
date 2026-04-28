import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { Plus, Search, Building2, Phone, Mail, ExternalLink, Trash2, UserPlus, Check, Copy, Loader2, Database, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import CustomerForm from "@/components/customers/CustomerForm.jsx";
import DeleteCustomerDialog from "@/components/gdpr/DeleteCustomerDialog.jsx";
import CustomerLatestInteraction from "@/components/customers/CustomerLatestInteraction.jsx";
import ImportCustomersModal from "@/components/customers/ImportCustomersModal.jsx";
import { useAuth } from "@/lib/AuthContext";

export default function Customers() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [inviting, setInviting] = useState(null);
  const [generatingLink, setGeneratingLink] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [deletingCustomer, setDeletingCustomer] = useState(null);
  const [cleaningData, setCleaningData] = useState(false);
  const [showImport, setShowImport] = useState(false);

  const { user } = useAuth();
  const userRole = user?.role;

  const { data: pageData } = useQuery({
    queryKey: ["customersPage", user?.role, user?.email],
    queryFn: async () => {
      if (user?.role === "customer") {
        const ownCustomers = await base44.entities.Customer.filter({ email: user.email });
        if (ownCustomers[0]) {
          const m = await base44.entities.Machine.filter({ customer_id: ownCustomers[0].id });
          return { customers: ownCustomers, machines: m };
        }
        return { customers: ownCustomers, machines: [] };
      } else {
        const [c, m] = await Promise.all([
          base44.entities.Customer.list("-created_date"),
          base44.entities.Machine.list()
        ]);
        let u = [];
        if (user?.role === "admin") {
          try {
            u = await base44.entities.User.list();
          } catch(e) {}
        }
        return { customers: c, machines: m, users: u };
      }
    },
    enabled: !!user,
    staleTime: 30 * 1000,
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
    keepPreviousData: true,
  });

  const customers = pageData?.customers || [];
  const machines = pageData?.machines || [];
  const users = pageData?.users || [];

  const isCustomerInvited = (email) => {
    if (!email) return false;
    return users.some(u => u.email.toLowerCase() === email.toLowerCase());
  };

  const load = () => queryClient.invalidateQueries({ queryKey: ["customersPage"] });

  const urlParams = new URLSearchParams(window.location.search);
  const filterParam = urlParams.get("filter");

  const filtered = customers.filter(c => {
    const searchLower = search.toLowerCase();
    const matchSearch = c.company_name?.toLowerCase().includes(searchLower) ||
      c.org_number?.toLowerCase().includes(searchLower) ||
      c.contact_person?.toLowerCase().includes(searchLower) ||
      c.email?.toLowerCase().includes(searchLower) ||
      c.phone?.toLowerCase().includes(searchLower);

    const matchFilter = filterParam === "signed" ? 
      machines.some(m => m.customer_id === c.id && m.service_contract && m.service_contract !== "none" && (!m.contract_status || m.contract_status === "active")) 
      : true;

    return matchSearch && matchFilter;
  });

  const getMachineCount = (customerId) => machines.filter(m => m.customer_id === customerId).length;
  const getContractCount = (customerId) => machines.filter(m => m.customer_id === customerId && m.service_contract && m.service_contract !== "none").length;

  const handleSave = async (data, machineData, inviteNewCustomer = false) => {
    if (!data.portal_token) {
      data.portal_token = Math.random().toString(36).substring(2, 18);
    }
    const currentUser = await base44.auth.me();
    if (editing) {
      await base44.entities.Customer.update(editing.id, data);
      base44.functions.invoke('logAuditEntry', {
        action: 'update',
        entity_type: 'Customer',
        entity_id: editing.id,
        entity_label: data.company_name,
        user_email: currentUser?.email || 'unknown',
        user_name: currentUser?.full_name || currentUser?.email,
        details: `Kund uppdaterad: ${data.company_name}`
      });
    } else {
      const created = await base44.entities.Customer.create(data);
      base44.functions.invoke('logAuditEntry', {
        action: 'create',
        entity_type: 'Customer',
        entity_id: created.id,
        entity_label: data.company_name,
        user_email: currentUser?.email || 'unknown',
        user_name: currentUser?.full_name || currentUser?.email,
        details: `Ny kund skapad: ${data.company_name}`
      });

      if (machineData && machineData.model) {
        const newMachine = await base44.entities.Machine.create({
          model: machineData.model,
          serial_number: machineData.serial_number || "",
          service_date: machineData.service_date || null,
          customer_id: created.id,
          status: "active",
          service_contract: "none"
        });
        base44.functions.invoke('logAuditEntry', {
          action: 'create',
          entity_type: 'Machine',
          entity_id: newMachine.id,
          entity_label: machineData.model,
          user_email: currentUser?.email || 'unknown',
          user_name: currentUser?.full_name || currentUser?.email,
          details: `Maskin tillagd vid kundregistrering: ${machineData.model} (${machineData.serial_number || 'inget SN'})`
        });
      }

      if (inviteNewCustomer && data.email) {
        try {
          await base44.functions.invoke("inviteUser", {
            email: data.email,
            role: "customer",
            inviterName: currentUser?.full_name || currentUser?.email
          });
          toast.success(`Inbjudan skickad till ${data.email}`);
        } catch (e) {
          toast.error("Kunde inte skicka inbjudan: " + (e.message || "okänt fel"));
        }
      }
    }
    setShowForm(false);
    setEditing(null);
    load();
  };

  const generateAndCopyPortalLink = async (customer) => {
    if (!customer.email) {
      toast.error("Kunden saknar e-postadress.");
      return;
    }
    setGeneratingLink(customer.id);
    try {
      const response = await base44.functions.invoke("generateCustomerPortalToken", {
        customer_id: customer.id,
      });
      const token = response.data.token;
      const portalUrl = `${window.location.origin}/customer-portal?token=${token}`;
      
      const copyToClipboard = async (text) => {
        try {
          if (navigator?.clipboard?.writeText) {
            await navigator.clipboard.writeText(text);
            return;
          }
        } catch (e) {
          console.warn("Clipboard API failed, falling back to execCommand", e);
        }
        
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
          document.execCommand("copy");
        } finally {
          textArea.remove();
        }
      };

      await copyToClipboard(portalUrl);
      
      setCopiedId(customer.id);
      toast.success("Portal-länk kopierad!");
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      toast.error("Fel: " + error.message);
    } finally {
      setGeneratingLink(null);
    }
  };

  const inviteCustomer = async (customer) => {
   if (!customer.email) {
     toast.error("Kunden saknar e-postadress.");
     return;
   }
   setInviting(customer.id);
   try {
     const currentUser = await base44.auth.me();
     await base44.functions.invoke("inviteUser", {
       email: customer.email,
       role: "customer",
       inviterName: currentUser?.full_name || currentUser?.email
     });
     toast.success(`Inbjudan skickad till ${customer.email}`);
   } catch (e) {
     toast.error("Kunde inte skicka inbjudan: " + (e.message || "okänt fel"));
   }
   setInviting(null);
  };

  const handleToggleDelete = async (customer, newIsDeleted) => {
    console.log('handleToggleDelete called:', customer.company_name, newIsDeleted);
    try {
      const updateData = { is_deleted: newIsDeleted };
      if (newIsDeleted) {
        updateData.deleted_date = new Date().toISOString();
      } else {
        updateData.deleted_date = null;
      }
      console.log('Updating customer:', customer.id, updateData);
      await base44.entities.Customer.update(customer.id, updateData);
      console.log('Update successful');
      toast.success(`Kund ${customer.company_name} markerad som ${newIsDeleted ? 'raderad' : 'aktiv'}.`);
      await load();
    } catch (error) {
      console.error('Error updating customer:', error);
      toast.error("Kunde inte uppdatera kundens status: " + error.message);
    }
  };

  const cleanDeletedCustomers = async () => {
    if (!confirm("Är du säker på att du vill radera alla markerade kunder och deras data? Detta går inte att ångra.")) {
      return;
    }
    setCleaningData(true);
    try {
      const response = await base44.functions.invoke("deleteMarkedCustomers", {});
      toast.success(response.data.message);
      load();
    } catch (error) {
      toast.error("Fel vid rensning: " + error.message);
    } finally {
      setCleaningData(false);
    }
  };

  const renderCard = (customer, isMobile = false) => (
    <Card key={customer.id} className={`astomed-card h-full flex flex-col ${isMobile ? 'mx-1' : ''}`}>
      <CardContent className="p-5 flex-1 flex flex-col">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="w-4 h-4 astomed-muted flex-shrink-0" />
              <Link to={createPageUrl(`CustomerDetails?id=${customer.id}`)} className="font-semibold astomed-title truncate hover:text-[#3a9e9e] hover:underline">
                {customer.company_name}
              </Link>
              {customer.is_imported && (
                <span title="Importerad via CSV" className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium flex-shrink-0">⭐ Import</span>
              )}
            </div>
            {userRole === "admin" && (
              <div className="ml-6 mb-2">
                <Button
                  size="sm"
                  variant={customer.is_deleted ? "destructive" : "outline"}
                  onClick={() => handleToggleDelete(customer, !customer.is_deleted)}
                >
                  {customer.is_deleted ? "🗑️ Markerad för radering" : "Aktiv kund"}
                </Button>
              </div>
            )}
            {customer.org_number && <p className="text-xs astomed-muted ml-6 mb-2">Org.nr: {customer.org_number}</p>}
            <div className="grid sm:grid-cols-3 gap-2 ml-6">
              {customer.contact_person && <div className="text-sm astomed-subtitle">👤 {customer.contact_person}</div>}
              {customer.phone && <div className="text-sm astomed-subtitle flex items-center gap-1"><Phone className="w-3 h-3" /> {customer.phone}</div>}
              {customer.email && <div className="text-sm astomed-subtitle flex items-center gap-1"><Mail className="w-3 h-3" /> {customer.email}</div>}
            </div>
            {(customer.address || customer.city) && (
              <div className="text-xs astomed-muted ml-6 mt-1">{customer.address}{customer.city ? `, ${customer.city}` : ""}</div>
            )}
            <div className="mt-3">
              <CustomerLatestInteraction customerId={customer.id} />
            </div>
          </div>
        </div>
        <div className="mt-auto pt-4 border-t border-slate-100 flex flex-col items-start sm:items-end gap-2 flex-shrink-0">
          <div className="flex gap-2 flex-wrap justify-start sm:justify-end w-full mb-1">
            <Link to={createPageUrl(`Machines?customer=${customer.id}`)}>
              <Badge variant="secondary" className="bg-[#e8f2f2] text-[#1b3a3a] cursor-pointer hover:bg-[#d0e8e8] transition-colors">
                {getMachineCount(customer.id)} maskin{getMachineCount(customer.id) !== 1 ? "er" : ""}
              </Badge>
            </Link>
            {getContractCount(customer.id) > 0 && (
              <Link to={createPageUrl(`Machines?customer=${customer.id}`)}>
                <Badge variant="secondary" className="bg-[#f0f7f0] text-[#1a5c2a] cursor-pointer hover:bg-[#d8eddb] transition-colors">
                  {getContractCount(customer.id)} serviceavtal
                </Badge>
              </Link>
            )}
          </div>
          <div className="flex flex-wrap justify-start sm:justify-end w-full gap-2 mt-1">
            <Button
              size="sm"
              variant="outline"
              onClick={() => generateAndCopyPortalLink(customer)}
              disabled={!customer.email || generatingLink === customer.id}
              title={customer.email ? "Generera och kopiera portal-länk" : "Kunden saknar e-post"}
            >
              {generatingLink === customer.id ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : copiedId === customer.id ? (
                <Check className="w-3 h-3 text-green-500" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
              <span className="ml-1 text-xs hidden sm:inline">
                {copiedId === customer.id ? "Kopierad" : "Kopiera länk"}
              </span>
            </Button>
            <Button
              size="sm"
              variant={isCustomerInvited(customer.email) ? "secondary" : "outline"}
              onClick={() => inviteCustomer(customer)}
              disabled={inviting === customer.id || !customer.email}
              title={!customer.email ? "Kunden saknar e-post" : isCustomerInvited(customer.email) ? "Kunden är redan inbjuden (Klicka för att skicka igen)" : "Bjud in kunden att skapa konto"}
              className={`relative ${isCustomerInvited(customer.email) ? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100" : ""}`}
            >
              {isCustomerInvited(customer.email) || inviting === customer.id ? <Check className="w-3 h-3 text-blue-600" /> : <UserPlus className="w-3 h-3" />}
              <span className="ml-1 text-xs hidden sm:inline">
                {isCustomerInvited(customer.email) ? "Inbjuden" : inviting === customer.id ? "Skickat!" : "Bjud in"}
              </span>
              {isCustomerInvited(customer.email) && <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-blue-500 rounded-full"></span>}
            </Button>
            <Link to={createPageUrl(`Machines?customer=${customer.id}`)}>
              <Button size="sm" variant="outline">
                <ExternalLink className="w-3 h-3" /><span className="ml-1 hidden sm:inline">Maskiner</span>
              </Button>
            </Link>
            <Button size="sm" variant="ghost" onClick={() => { setEditing(customer); setShowForm(true); }}>
              <span className="hidden sm:inline">Redigera</span><span className="sm:hidden">✏️</span>
            </Button>
            {userRole !== "technician" && (
              <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => setDeletingCustomer(customer)}>
                <Trash2 className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold astomed-title flex items-center">
            Kunder 
            {filterParam === "signed" && <span className="ml-3 text-sm font-semibold bg-green-100 text-green-800 px-2 py-0.5 rounded-md">Signerade</span>}
          </h1>
          <p className="astomed-subtitle text-sm">{filtered.length} kunder {filterParam === "signed" ? "visas" : "registrerade"}</p>
        </div>
        <div className="flex gap-2">
          {userRole === "admin" && (
            <Button 
              onClick={cleanDeletedCustomers} 
              variant="destructive"
              disabled={cleaningData}
            >
              {cleaningData ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Database className="w-4 h-4 mr-2" />
              )}
              Rensa raderade kunder
            </Button>
          )}
          <Button onClick={() => setShowImport(true)} variant="outline" className="border-dashed">
            <Upload className="w-4 h-4 mr-2" /> Importera
          </Button>
          <Button onClick={() => { setEditing(null); setShowForm(true); }} className="astomed-btn-primary">
            <Plus className="w-4 h-4 mr-2" /> Ny kund
          </Button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 astomed-muted" />
        <Input placeholder="Sök kund, org.nr eller kontaktperson..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Inga kunder hittades</p>
        </div>
      ) : (
        <>
          {/* Desktop Grid View */}
          <div className="hidden md:grid gap-4">
            {filtered.map(customer => renderCard(customer))}
          </div>

          {/* Mobile Carousel View */}
          <div className="md:hidden">
            {filtered.length > 1 && (
              <div className="text-center text-xs text-slate-400 mb-3 flex items-center justify-center gap-2">
                <span>←</span> Svep för fler kunder ({filtered.length} st) <span>→</span>
              </div>
            )}
            <Carousel className="w-full" opts={{ align: "start" }}>
              <CarouselContent>
                {filtered.map(customer => (
                  <CarouselItem key={customer.id} className="basis-11/12 sm:basis-8/12">
                    {renderCard(customer, true)}
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          </div>
        </>
      )}

      {showForm && (
        <CustomerForm
          customer={editing}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditing(null); }}
        />
      )}

      {showImport && (
        <ImportCustomersModal 
          onClose={() => setShowImport(false)}
          onImported={() => load()}
        />
      )}

      {deletingCustomer && (
        <DeleteCustomerDialog
          customer={deletingCustomer}
          machineCount={getMachineCount(deletingCustomer.id)}
          onDeleted={async () => {
            const currentUser = await base44.auth.me();
            base44.functions.invoke('logAuditEntry', {
              action: 'delete',
              entity_type: 'Customer',
              entity_id: deletingCustomer.id,
              entity_label: deletingCustomer.company_name,
              user_email: currentUser?.email || 'unknown',
              user_name: currentUser?.full_name || currentUser?.email,
              details: `Kund raderad (GDPR): ${deletingCustomer.company_name}`
            });
            setDeletingCustomer(null);
            load();
          }}
          onCancel={() => setDeletingCustomer(null)}
        />
      )}
    </div>
  );
}