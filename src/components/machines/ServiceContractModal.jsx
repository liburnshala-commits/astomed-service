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
    contract_status: machine?.contract_status || "active",
    contract_start_date: machine?.contract_start_date || "",
    contract_binding_months: 12,
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
          <h2 className="text-lg font-bold text-slate-900">Serviceavtal</h2>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
        </div>

        <div className="p-6 space-y-5">
          <div className="space-y-1">
            <Label>Serviceavtal</Label>
            <Select value={form.service_contract} onValueChange={v => set("service_contract", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Inget Serviceavtal</SelectItem>
                <SelectItem value="basic">BAS – Astomed 3.0</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {form.service_contract === "basic" && (
            <div className="space-y-1">
              <Label>Välj avtalsmall</Label>
              <Select
                value={form.service_agreement_template_id}
                onValueChange={v => set("service_agreement_template_id", v)}
              >
                <SelectTrigger><SelectValue placeholder="Välj en avtalsmall..." /></SelectTrigger>
                <SelectContent>
                  {templates.map(t => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name} {t.price_per_month ? `– ${t.price_per_month} kr/mån` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {selectedTemplate && (
            <div className="p-3 rounded-xl border" style={{ background: "#f4fafa", borderColor: "#dce8e8" }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold astomed-label">{selectedTemplate.name}</span>
                <span className="text-xs astomed-muted ml-auto">Bindningstid: {selectedTemplate.binding_months} mån</span>
              </div>
              {selectedTemplate.description && (
                <p className="text-xs text-gray-500 mb-2">{selectedTemplate.description}</p>
              )}
              <ul className="space-y-1">
                {(selectedTemplate.included_services || []).map((f, i) => (
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
                <Label>Avtalets status</Label>
                <Select value={form.contract_status} onValueChange={v => set("contract_status", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Aktivt</SelectItem>
                    <SelectItem value="inactive">Inaktivt</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
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