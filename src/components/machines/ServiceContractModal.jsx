import { useState } from "react";
import { X, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const SERVICE_CONTRACTS = [
  {
    value: "none",
    label: "Inget Serviceavtal",
    description: "Service utan avtal – ordinarie priser tillämpas.",
    features: [
      "Reservdelar debiteras enligt Astomeds ordinarie prislista.",
      "Restid debiteras enligt ordinarie taxa baserat på avstånd och tidsåtgång.",
      "Timpris för service och arbete utgår enligt gällande standardpris.",
      "Ingen prioritering vid akuta serviceärenden.",
      "Kontakt: 08-410 77 900 | kontakt@astomed.se | www.astomed.se/service"
    ]
  },
  {
    value: "basic",
    label: "BAS – Astomed 3.0",
    interval: "Var 12:e månad",
    description: "Serviceavtal & Framtidssäkring: Astomed 3.0\n\nDin partner för teknisk drift, juridisk trygghet och klinisk kompetens sedan 2005.",
    features: [
      "STANDARD: Drift & Trygghet – Säkerställer hög drifttid och att personalen är med tekniken.",
      "Intervall: Var 12:e månad.",
      "Prestandakontroll: Mätning av uteffekt och kalibrering.",
      "Lokalanalys: Rådgivning kring rummets lasersäkerhet.",
      "Support: Fri teknisk rådgivning via telefon och fjärrsupport under avtalstiden.",
      "Juridiskt stöd: Dokumentation som krävs för anmälan till SSM.",
      "Kontakt: 08-410 77 900 | kontakt@astomed.se | www.astomed.se/service"
    ]
  },
];

export default function ServiceContractModal({ machine, onSave, onClose }) {
  const [form, setForm] = useState({
    service_contract: machine?.service_contract || "none",
    contract_start_date: machine?.contract_start_date || "",
    contract_binding_months: machine?.contract_binding_months || "",
    service_date: machine?.service_date || "",
    next_service_date: machine?.next_service_date || ""
  });

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const selectedContract = SERVICE_CONTRACTS.find(c => c.value === form.service_contract);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
          <h2 className="text-lg font-bold text-slate-900">Serviceavtal & Servicedatum</h2>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
        </div>

        <div className="p-6 space-y-5">
          <div className="space-y-1">
            <Label>Serviceavtal</Label>
            <Select value={form.service_contract} onValueChange={v => set("service_contract", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {SERVICE_CONTRACTS.map(c => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedContract && form.service_contract !== "none" && (
            <div className="p-3 rounded-xl border" style={{ background: "#f4fafa", borderColor: "#dce8e8" }}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold astomed-label">{selectedContract.label}</span>
                {selectedContract.interval && (
                  <span className="text-xs astomed-muted ml-auto">{selectedContract.interval}</span>
                )}
              </div>
              <p className="text-xs astomed-subtitle mb-2">{selectedContract.description}</p>
              <ul className="space-y-1">
                {selectedContract.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-xs astomed-subtitle">
                    <CheckCircle2 className="w-3 h-3 mt-0.5 flex-shrink-0" style={{ color: "#3a9e9e" }} />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {form.service_contract !== "none" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Avtalets startdatum</Label>
                <Input type="date" value={form.contract_start_date} onChange={e => set("contract_start_date", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Bindningstid</Label>
                <Select value={String(form.contract_binding_months || "")} onValueChange={v => set("contract_binding_months", Number(v))}>
                  <SelectTrigger><SelectValue placeholder="Välj..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6">6 månader</SelectItem>
                    <SelectItem value="12">12 månader</SelectItem>
                    <SelectItem value="24">24 månader</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Senaste servicedatum</Label>
              <Input type="date" value={form.service_date} onChange={e => set("service_date", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Nästa servicedatum</Label>
              <Input type="date" value={form.next_service_date} onChange={e => set("next_service_date", e.target.value)} />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t bg-slate-50 rounded-b-2xl">
          <Button variant="outline" onClick={onClose}>Avbryt</Button>
          <Button onClick={() => onSave(form)} className="astomed-btn-primary">
            Spara
          </Button>
        </div>
      </div>
    </div>
  );
}