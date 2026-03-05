import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { Plus, Search, Building2, Phone, Mail, ExternalLink, Copy, Check, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import CustomerForm from "@/components/customers/CustomerForm.jsx";
import DeleteCustomerDialog from "@/components/gdpr/DeleteCustomerDialog.jsx";

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [machines, setMachines] = useState([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [copied, setCopied] = useState(null);
  const [deletingCustomer, setDeletingCustomer] = useState(null);

  const load = () => {
    Promise.all([
      base44.entities.Customer.list("-created_date"),
      base44.entities.Machine.list()
    ]).then(([c, m]) => { setCustomers(c); setMachines(m); });
  };

  useEffect(() => { load(); }, []);

  const filtered = customers.filter(c =>
    c.company_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.org_number?.includes(search) ||
    c.contact_person?.toLowerCase().includes(search.toLowerCase())
  );

  const getMachineCount = (customerId) => machines.filter(m => m.customer_id === customerId).length;

  const handleSave = async (data) => {
    if (!data.portal_token) {
      data.portal_token = Math.random().toString(36).substring(2, 18);
    }
    if (editing) {
      await base44.entities.Customer.update(editing.id, data);
    } else {
      await base44.entities.Customer.create(data);
    }
    setShowForm(false);
    setEditing(null);
    load();
  };

  const copyPortalLink = (token, id) => {
    const url = `${window.location.origin}${createPageUrl("CustomerPortal")}?token=${token}`;
    navigator.clipboard.writeText(url);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Kunder</h1>
          <p className="text-slate-500 text-sm">{customers.length} kunder registrerade</p>
        </div>
        <Button onClick={() => { setEditing(null); setShowForm(true); }} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" /> Ny kund
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input placeholder="Sök kund, org.nr eller kontaktperson..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="grid gap-4">
        {filtered.map(customer => (
          <Card key={customer.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Building2 className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <h3 className="font-semibold text-slate-900 truncate">{customer.company_name}</h3>
                  </div>
                  {customer.org_number && <p className="text-xs text-slate-400 ml-6 mb-2">Org.nr: {customer.org_number}</p>}
                  <div className="grid sm:grid-cols-3 gap-2 ml-6">
                    {customer.contact_person && <div className="text-sm text-slate-600">👤 {customer.contact_person}</div>}
                    {customer.phone && <div className="text-sm text-slate-600 flex items-center gap-1"><Phone className="w-3 h-3" /> {customer.phone}</div>}
                    {customer.email && <div className="text-sm text-slate-600 flex items-center gap-1"><Mail className="w-3 h-3" /> {customer.email}</div>}
                  </div>
                  {(customer.address || customer.city) && (
                    <div className="text-xs text-slate-400 ml-6 mt-1">{customer.address}{customer.city ? `, ${customer.city}` : ""}</div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                    {getMachineCount(customer.id)} maskin{getMachineCount(customer.id) !== 1 ? "er" : ""}
                  </Badge>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => copyPortalLink(customer.portal_token, customer.id)}>
                      {copied === customer.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span className="ml-1 text-xs">{copied === customer.id ? "Kopierad!" : "Portal"}</span>
                    </Button>
                    <Link to={createPageUrl(`Machines?customer=${customer.id}`)}>
                      <Button size="sm" variant="outline">
                        <ExternalLink className="w-3 h-3 mr-1" /> Maskiner
                      </Button>
                    </Link>
                    <Button size="sm" variant="ghost" onClick={() => { setEditing(customer); setShowForm(true); }}>
                      Redigera
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
    </div>
  );
}