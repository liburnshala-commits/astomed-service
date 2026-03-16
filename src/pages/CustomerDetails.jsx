import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Link, useNavigate } from "react-router-dom";
import { Building2, Phone, Mail, Monitor, ArrowLeft, ExternalLink, Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import CustomerInteractions from "@/components/customers/CustomerInteractions";

export default function CustomerDetails() {
  const [customer, setCustomer] = useState(null);
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const urlParams = new URLSearchParams(window.location.search);
  const customerId = urlParams.get("id");

  useEffect(() => {
    if (!customerId) return;
    Promise.all([
      base44.entities.Customer.get(customerId),
      base44.entities.Machine.filter({ customer_id: customerId })
    ]).then(([c, m]) => {
      setCustomer(c);
      setMachines(m);
      setLoading(false);
    }).catch(err => {
      console.error("Fel vid laddning", err);
      setLoading(false);
    });
  }, [customerId]);

  if (loading) return <div className="p-8 text-center text-slate-500">Laddar kundbild...</div>;
  if (!customer) return <div className="p-8 text-center text-red-500">Kunden hittades inte.</div>;

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="shrink-0">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold astomed-title flex items-center gap-2">
            {customer.company_name}
            {customer.is_deleted && <Badge variant="destructive" className="ml-2">Markerad för radering</Badge>}
          </h1>
          <p className="text-sm astomed-muted flex items-center gap-2">
            Kundprofil och historik
            {customer.org_number && <span>• Org.nr: {customer.org_number}</span>}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Vänster kolumn: Kontaktinfo & Maskiner */}
        <div className="space-y-6 lg:col-span-1">
          <Card className="astomed-card border-0 shadow-sm">
            <CardContent className="p-5 space-y-4">
              <h3 className="font-semibold text-slate-800 border-b pb-2">Kontaktinformation</h3>
              
              <div className="space-y-3">
                {customer.contact_person && (
                  <div>
                    <div className="text-xs font-medium text-slate-400 mb-0.5">Kontaktperson</div>
                    <div className="text-sm font-medium text-slate-700">{customer.contact_person}</div>
                  </div>
                )}
                {customer.phone && (
                  <div>
                    <div className="text-xs font-medium text-slate-400 mb-0.5">Telefon</div>
                    <div className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" /> {customer.phone}
                    </div>
                  </div>
                )}
                {customer.email && (
                  <div>
                    <div className="text-xs font-medium text-slate-400 mb-0.5">E-post</div>
                    <div className="text-sm font-medium text-slate-700 flex items-center gap-1.5 break-all">
                      <Mail className="w-3.5 h-3.5 text-slate-400" /> {customer.email}
                    </div>
                  </div>
                )}
                {(customer.address || customer.city) && (
                  <div>
                    <div className="text-xs font-medium text-slate-400 mb-0.5">Adress</div>
                    <div className="text-sm font-medium text-slate-700">
                      {customer.address}<br />
                      {customer.postal_code} {customer.city}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="astomed-card border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between border-b pb-2 mb-4">
                <h3 className="font-semibold text-slate-800">Kundens maskiner</h3>
                <Badge variant="secondary" className="bg-[#e8f2f2] text-[#1b3a3a]">{machines.length}</Badge>
              </div>

              <div className="space-y-3">
                {machines.length === 0 ? (
                  <p className="text-sm text-slate-400">Inga maskiner registrerade.</p>
                ) : (
                  machines.map(m => (
                    <div key={m.id} className="p-3 border rounded-lg bg-slate-50/50 flex flex-col gap-1">
                      <div className="flex justify-between items-start">
                        <div className="font-medium text-sm text-slate-800">{m.model}</div>
                        <Badge className={`text-[10px] px-1.5 py-0 border-0 ${m.status === 'service' ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'}`}>
                          {m.status === 'service' ? 'På service' : 'Aktiv'}
                        </Badge>
                      </div>
                      <div className="text-xs text-slate-500 font-mono">SN: {m.serial_number}</div>
                      {m.service_contract && m.service_contract !== 'none' && (
                         <div className="text-[10px] text-teal-700 font-medium mt-1">
                           Serviceavtal: {m.service_contract === 'basic' ? 'BAS' : m.service_contract}
                         </div>
                      )}
                    </div>
                  ))
                )}
                
                <Link to={createPageUrl(`Machines?customer=${customer.id}`)} className="block mt-4">
                  <Button variant="outline" size="sm" className="w-full text-xs">
                    Hantera maskiner <ExternalLink className="w-3 h-3 ml-1.5" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Höger kolumn: Interaktioner (CRM) */}
        <div className="lg:col-span-2">
          <CustomerInteractions customerId={customer.id} />
        </div>

      </div>
    </div>
  );
}