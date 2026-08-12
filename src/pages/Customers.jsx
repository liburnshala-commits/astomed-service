import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { Plus, Search, Building2, Phone, Mail, ExternalLink, Trash2, UserPlus, Check, Copy, Loader2, Database, Upload, MessageSquare, Download, Star, MonitorUp } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import CustomerForm from "@/components/customers/CustomerForm.jsx";
import DeleteCustomerDialog from "@/components/gdpr/DeleteCustomerDialog.jsx";
import CustomerLatestInteraction from "@/components/customers/CustomerLatestInteraction.jsx";
import ImportCustomersModal from "@/components/customers/ImportCustomersModal.jsx";
import SendSmsModal from "@/components/customers/SendSmsModal";
import SendBulkSmsModal from "@/components/customers/SendBulkSmsModal";
import CustomerCard from "@/components/customers/CustomerCard.jsx";
import { useAuth } from "@/lib/AuthContext";

export default function Customers() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [specialFilter, setSpecialFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [inviting, setInviting] = useState(null);
  const [generatingLink, setGeneratingLink] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [deletingCustomer, setDeletingCustomer] = useState(null);
  const [cleaningData, setCleaningData] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [smsCustomer, setSmsCustomer] = useState(null);
  const [showBulkSms, setShowBulkSms] = useState(false);

  const { user } = useAuth();
  const userRole = user?.role;

  const { data: pageData } = useQuery({
    queryKey: ["customersPage", user?.role, user?.email],
    queryFn: async () => {
      if (['customer', 'user'].includes(user?.role)) {
        const ownCustomers = await base44.entities.Customer.filter({ email: user.email });
        if (ownCustomers[0]) {
          const m = await base44.entities.Machine.filter({ customer_id: ownCustomers[0].id });
          return { customers: ownCustomers, machines: m };
        }
        return { customers: ownCustomers, machines: [] };
      } else {
        const [c, m] = await Promise.all([
          base44.entities.Customer.filter({}, "-created_date", 10000),
          base44.entities.Machine.filter({}, "-created_date", 10000)
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

  const isCustomerInvited = (customer) => {
    if (!customer?.email) return false;
    if (customer.is_invited) return true;
    return users.some(u => u.email.toLowerCase() === customer.email.toLowerCase());
  };

  const load = () => queryClient.invalidateQueries({ queryKey: ["customersPage"] });

  const urlParams = new URLSearchParams(window.location.search);
  const filterParam = urlParams.get("filter");

  const filtered = customers.filter(c => {
    // 1. Basic properties
    const phone = (c.phone || "").replace(/[\s-]/g, "");
    const hasMobile = phone.startsWith("+467") || phone.startsWith("467") || phone.startsWith("07") || phone.startsWith("7");
    
    // 2. Contract status helper
    const hasActiveContract = machines.some(m => 
      m.customer_id === c.id && 
      m.service_contract && 
      m.service_contract !== "none" && 
      (!m.contract_status || m.contract_status === "active")
    );

    // 3. Dropdowns (specialFilter)
    if (specialFilter === "imported" && !c.is_imported) return false;
    if (specialFilter === "updated_import" && !c.has_added_machine_via_import) return false;
    if (specialFilter === "active_contract" && !hasActiveContract) return false;
    if (specialFilter === "mobile_number" && !hasMobile) return false;
    if (specialFilter === "imported_mobile" && (!c.is_imported || !hasMobile)) return false;
    if (specialFilter === "mobile_no_contract" && (!hasMobile || hasActiveContract)) return false;

    // 4. URL Param (signed)
    if (filterParam === "signed" && !hasActiveContract) return false;

    // 5. Text Search
    const searchLower = search.toLowerCase();
    return c.company_name?.toLowerCase().includes(searchLower) ||
      c.org_number?.toLowerCase().includes(searchLower) ||
      c.contact_person?.toLowerCase().includes(searchLower) ||
      c.email?.toLowerCase().includes(searchLower) ||
      c.phone?.toLowerCase().includes(searchLower) ||
      c.city?.toLowerCase().includes(searchLower);
  });

  const getMachineCount = (customerId) => machines.filter(m => m.customer_id === customerId).length;
  const getContractCount = (customerId) => machines.filter(m => m.customer_id === customerId && m.service_contract && m.service_contract !== "none").length;

  const getContractStatusInfo = (customerId) => {
    const customerMachines = machines.filter(m => m.customer_id === customerId && m.service_contract && m.service_contract !== "none");
    if (customerMachines.length === 0) return { count: 0, hasRejected: false, hasActive: false };
    
    const hasRejected = customerMachines.some(m => m.contract_status === "rejected");
    const hasActive = customerMachines.some(m => !m.contract_status || m.contract_status === "active");
    
    return { count: customerMachines.length, hasRejected, hasActive };
  };

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

  const exportToCsv = () => {
    const headers = ["Företag", "Kontaktperson", "Telefon", "E-post", "Ort"];
    const rows = filtered.map(c => [
      `"${(c.company_name || "").replace(/"/g, '""')}"`,
      `"${(c.contact_person || "").replace(/"/g, '""')}"`,
      `"${(c.phone || "").replace(/"/g, '""')}"`,
      `"${(c.email || "").replace(/"/g, '""')}"`,
      `"${(c.city || "").replace(/"/g, '""')}"`
    ]);
    
    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Kunder_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderCard = (customer, isMobile = false) => {
    return (
      <div key={customer.id}>
        <CustomerCard
          customer={customer}
          isMobile={isMobile}
          userRole={userRole}
          contractInfo={getContractStatusInfo(customer.id)}
          machineCount={getMachineCount(customer.id)}
          isInvited={isCustomerInvited(customer)}
          generatingLink={generatingLink}
          copiedId={copiedId}
          inviting={inviting}
          handleToggleDelete={handleToggleDelete}
          setSmsCustomer={setSmsCustomer}
          generateAndCopyPortalLink={generateAndCopyPortalLink}
          inviteCustomer={inviteCustomer}
          setEditing={setEditing}
          setShowForm={setShowForm}
          setDeletingCustomer={setDeletingCustomer}
        />
      </div>
    );
  };

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
        <div className="flex gap-2 flex-wrap justify-end">
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
              <span className="hidden sm:inline">Rensa raderade</span>
            </Button>
          )}
          {userRole === "admin" && (
            <Button onClick={() => setShowBulkSms(true)} variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50">
              <MessageSquare className="w-4 h-4 sm:mr-2" /> <span className="hidden sm:inline">Mass-SMS</span>
            </Button>
          )}
          <Button onClick={() => setShowImport(true)} variant="outline" className="border-dashed">
            <Upload className="w-4 h-4 sm:mr-2" /> <span className="hidden sm:inline">Importera</span>
          </Button>
          <Button onClick={exportToCsv} variant="outline" className="border-dashed">
            <Download className="w-4 h-4 sm:mr-2" /> <span className="hidden sm:inline">Exportera</span>
          </Button>
          <Button onClick={() => { setEditing(null); setShowForm(true); }} className="astomed-btn-primary">
            <Plus className="w-4 h-4 sm:mr-2" /> <span className="hidden sm:inline">Ny kund</span>
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={specialFilter} onValueChange={setSpecialFilter}>
          <SelectTrigger className="w-full sm:w-[250px] bg-white h-10 border-slate-200">
            <SelectValue placeholder="Filtrera lista..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alla kunder</SelectItem>
            <SelectItem value="imported">Nyimporterade (stjärna)</SelectItem>
            <SelectItem value="updated_import">Uppdaterade vid import (maskin)</SelectItem>
            <SelectItem value="active_contract">Aktiva serviceavtal</SelectItem>
            <SelectItem value="mobile_number">Mobilnummer (07, +467...)</SelectItem>
            <SelectItem value="imported_mobile">Importerade med mobilnummer</SelectItem>
            <SelectItem value="mobile_no_contract">Mobilnummer utan serviceavtal</SelectItem>
          </SelectContent>
        </Select>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 astomed-muted" />
          <Input placeholder="Sök kund, org.nr, kontaktperson, stad..." className="pl-9 bg-white" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
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

      {smsCustomer && (
        <SendSmsModal customer={smsCustomer} onClose={() => setSmsCustomer(null)} />
      )}

      {showBulkSms && (
        <SendBulkSmsModal customers={filtered} onClose={() => setShowBulkSms(false)} />
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