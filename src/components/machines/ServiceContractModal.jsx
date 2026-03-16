import { useState, useEffect } from "react";
import { X, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";

export default function ServiceContractModal({ machine, onSave, onClose }) {
  const [templates, setTemplates] = useState([]);
  const [form, setForm] = useState({
    service_contract: machine?.service_contract || "none",
    contract_start_date: machine?.contract_start_date || "",
    contract_binding_months: 12,
    service_date: machine?.service_date || "",
    next_service_date: machine?.next_service_date || "",
    service_agreement_template_id: machine?.service_agreement_template_id || ""
  });

  useEffect(() => {
    base44.entities.ServiceAgreementTemplate.list().then(setTemplates);
  }, []);

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const selectedTemplate = templates.find(t => t.id === form.service_agreement_template_id);

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
            <div className="space-y-1">
              <Label>Avtalets startdatum</Label>
              <Input type="date" value={form.contract_start_date} onChange={e => set("contract_start_date", e.target.value)} />
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