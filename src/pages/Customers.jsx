import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { Plus, Search, Building2, Phone, Mail, ExternalLink, Trash2, UserPlus, Check, Copy, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import CustomerForm from "@/components/customers/CustomerForm.jsx";
import DeleteCustomerDialog from "@/components/gdpr/DeleteCustomerDialog.jsx";
import CustomerReportsSummary from "@/components/customers/CustomerReportsSummary.jsx";

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [machines, setMachines] = useState([]);
  const [serviceRecords, setServiceRecords] = useState([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [inviting, setInviting] = useState(null);
  const [generatingLink, setGeneratingLink] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [deletingCustomer, setDeletingCustomer] = useState(null);
  const [userRole, setUserRole] = useState(null);

  const load = async (currentUser) => {
    const u = currentUser || await base44.auth.me();
    if (!currentUser) setUserRole(u?.role || null);
    if (u?.role === "customer") {
      const ownCustomers = await base44.entities.Customer.filter({ email: u.email });
      setCustomers(ownCustomers);
      if (ownCustomers[0]) {
        const [m, r] = await Promise.all([
          base44.entities.Machine.filter({ customer_id: ownCustomers[0].id }),
          base44.entities.ServiceRecord.filter({ customer_id: ownCustomers[0].id }, "-service_date", 200)
        ]);
        setMachines(m);
        setServiceRecords(r);
      }
    } else {
      const [c, m, r] = await Promise.all([
        base44.entities.Customer.list("-created_date"),
        base44.entities.Machine.list(),
        base44.entities.ServiceRecord.list("-service_date", 500)
      ]);
      setCustomers(c);
      setMachines(m);
      setServiceRecords(r);
    }
  };

  useEffect(() => {
    base44.auth.me().then(u => {
      setUserRole(u?.role || null);
      load(u);
    });
  }, []);

  const filtered = useMemo(() => customers.filter(c =>
    c.company_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.org_number?.includes(search) ||
    c.contact_person?.toLowerCase().includes(search.toLowerCase())
  ), [customers, search]);

  // Pre-compute machine/record counts per customer — avoids N+1 filter calls in render
  const machineCountMap = useMemo(() => {
    const map = {};
    for (const m of machines) {
      map[m.customer_id] = (map[m.customer_id] || 0) + 1;
    }
    return map;
  }, [machines]);

  const contractCountMap = useMemo(() => {
    const map = {};
    for (const m of machines) {
      if (m.service_contract && m.service_contract !== "none") {
        map[m.customer_id] = (map[m.customer_id] || 0) + 1;
      }
    }
    return map;
  }, [machines]);

  // Pre-compute reports per customer from already-loaded records (eliminates CustomerReportsSummary N+1 API calls)
  const reportsMap = useMemo(() => {
    const map = {};
    for (const r of serviceRecords) {
      if (r.report_url && (r.status === "completed" || r.status === "invoiced")) {
        if (!map[r.customer_id]) map[r.customer_id] = [];
        map[r.customer_id].push(r);
      }
    }
    return map;
  }, [serviceRecords]);

  const getMachineCount = (customerId) => machineCountMap[customerId] || 0;
  const getContractCount = (customerId) => contractCountMap[customerId] || 0;

  const handleSave = async (data) => {
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
      
      try {
        await navigator.clipboard.writeText(portalUrl);
      } catch {
        const textarea = document.createElement("textarea");
        textarea.value = portalUrl;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      
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
     await base44.users.inviteUser(customer.email, "customer");
     toast.success(`Inbjudan skickad till ${customer.email}`);
   } catch (e) {
     toast.error("Kunde inte skicka inbjudan: " + (e.message || "okänt fel"));
   }
   setInviting(null);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold astomed-title">Kunder</h1>
          <p className="astomed-subtitle text-sm">{customers.length} kunder registrerade</p>
        </div>
        <Button onClick={() => { setEditing(null); setShowForm(true); }} className="astomed-btn-primary">
          <Plus className="w-4 h-4 mr-2" /> Ny kund
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 astomed-muted" />
        <Input placeholder="Sök kund, org.nr eller kontaktperson..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="grid gap-4">
        {filtered.map(customer => (
          <Card key={customer.id} className="astomed-card">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Building2 className="w-4 h-4 astomed-muted flex-shrink-0" />
                    <h3 className="font-semibold astomed-title truncate">{customer.company_name}</h3>
                  </div>
                  {customer.org_number && <p className="text-xs astomed-muted ml-6 mb-2">Org.nr: {customer.org_number}</p>}
                  <div className="grid sm:grid-cols-3 gap-2 ml-6">
                    {customer.contact_person && <div className="text-sm astomed-subtitle">👤 {customer.contact_person}</div>}
                    {customer.phone && <div className="text-sm astomed-subtitle flex items-center gap-1"><Phone className="w-3 h-3" /> {customer.phone}</div>}
                    {customer.email && <div className="text-sm astomed-subtitle flex items-center gap-1"><Mail className="w-3 h-3" /> {customer.email}</div>}
                  </div>
                  {(customer.address || customer.city) && (
                    <div className="text-xs astomed-muted ml-6 mt-1">{customer.address}{customer.city ? `, ${customer.city}` : ""}</div>
                  )}
                  <CustomerReportsSummary customerId={customer.id} />
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <div className="flex gap-2 flex-wrap justify-end">
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
                  <div className="flex flex-wrap justify-end gap-2">
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
                      variant="outline"
                      onClick={() => inviteCustomer(customer)}
                      disabled={inviting === customer.id || !customer.email}
                      title={customer.email ? "Bjud in kunden att skapa konto" : "Kunden saknar e-post"}
                    >
                      {inviting === customer.id ? <Check className="w-3 h-3 text-green-500" /> : <UserPlus className="w-3 h-3" />}
                      <span className="ml-1 text-xs hidden sm:inline">{inviting === customer.id ? "Skickat!" : "Bjud in"}</span>
                    </Button>
                    <Link to={createPageUrl(`Machines?customer=${customer.id}`)}>
                      <Button size="sm" variant="outline">
                        <ExternalLink className="w-3 h-3" /><span className="ml-1 hidden sm:inline">Maskiner</span>
                      </Button>
                    </Link>
                    <Button size="sm" variant="ghost" onClick={() => { setEditing(customer); setShowForm(true); }}>
                      <span className="hidden sm:inline">Redigera</span><span className="sm:hidden">✏️</span>
                    </Button>
                    <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => setDeletingCustomer(customer)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Inga kunder hittades</p>
          </div>
        )}
      </div>

      {showForm && (
        <CustomerForm
          customer={editing}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditing(null); }}
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