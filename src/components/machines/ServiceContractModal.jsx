import { useState, useEffect } from "react";
import { X, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import RemoveContractDialog from "@/components/contracts/RemoveContractDialog";

export default function ServiceContractModal({ machine, onSave, onClose }) {
  const [templates, setTemplates] = useState([]);
  const [form, setForm] = useState({
    service_contract: machine?.service_contract || "none",
    contract_status: machine?.contract_status || "active",
    contract_start_date: machine?.contract_start_date || "",
    contract_binding_months: 12,
    service_agreement_template_id: machine?.service_agreement_template_id || "",
    contract_discount_percent: machine?.contract_discount_percent || 0,
    contract_created_date: machine?.contract_created_date || ""
  });

  useEffect(() => {
    base44.entities.ServiceAgreementTemplate.list().then(setTemplates);
  }, []);

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const selectedTemplate = templates.find(t => t.id === form.service_agreement_template_id);
  const [confirmRemove, setConfirmRemove] = useState(false);

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
              <ul className="space-y-1 mb-3">
                {(selectedTemplate.included_services || []).map((f, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-xs astomed-subtitle">
                    <CheckCircle2 className="w-3 h-3 mt-0.5 flex-shrink-0" style={{ color: "#3a9e9e" }} />
                    {f}
                  </li>
                ))}
              </ul>
              {selectedTemplate.price_per_month && (
                <div className="mt-3 pt-3 border-t border-[#dce8e8]">
                  <p className="text-xs text-slate-500 mb-1">Jämförspris vid <span className="font-semibold">Engångsservice</span> (utan avtal):</p>
                  <p className="text-sm font-bold text-slate-700">{Math.round(selectedTemplate.price_per_month * 12 * 1.30).toLocaleString('sv-SE')} kr / gång</p>
                  <p className="text-[10px] text-slate-400 mt-1 italic">* Inkluderar ej 20% rabatt på reservdelar, arbetskostnader och resor.</p>
                </div>
              )}
            </div>
          )}

          {form.service_contract !== "none" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Skapat datum</Label>
                <Input type="date" value={form.contract_created_date} onChange={e => set("contract_created_date", e.target.value)} />
              </div>
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
                    <SelectItem value="pending_signature">Under signering</SelectItem>
                    <SelectItem value="rejected">Nekat signering</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1 col-span-2">
                <Label>Rabatt (%)</Label>
                <Input type="number" min="0" max="100" value={form.contract_discount_percent} onChange={e => set("contract_discount_percent", Number(e.target.value))} />
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center p-6 border-t bg-slate-50 rounded-b-2xl">
          {machine?.service_contract && machine.service_contract !== "none" ? (
            <Button 
              type="button"
              variant="outline" 
              className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700" 
              onClick={() => setConfirmRemove(true)}
            >
              Ta bort avtal
            </Button>
          ) : <div />}
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose}>Avbryt</Button>
            <Button onClick={async () => {
              const dataToSave = { ...form };
              if (dataToSave.service_contract !== "none" && !dataToSave.contract_created_date) {
                dataToSave.contract_created_date = new Date().toISOString().split("T")[0];
              }
              
              if (dataToSave.service_contract !== "none" && !machine.service_date) {
                const u = await base44.auth.me();
                if (u) {
                  await base44.entities.Notification.create({
                    user_email: u.email,
                    title: "Saknar servicedatum",
                    message: `Serviceavtal skapades för ${machine.model} (SN: ${machine.serial_number}), men senaste servicedatum saknas. Vänligen uppdatera maskinen.`,
                    type: "warning",
                    related_entity: "Machine",
                    related_entity_id: machine.id
                  });
                }
              }

              onSave(dataToSave);
            }} className="astomed-btn-primary">
              Spara
            </Button>
          </div>
        </div>
      </div>
      {confirmRemove && (
        <RemoveContractDialog
          machine={machine}
          onClose={() => setConfirmRemove(false)}
          onConfirm={(updateData) => {
            setConfirmRemove(false);
            onSave(updateData);
          }}
        />
      )}
    </div>
  );
}