import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { machineServiceDetails } from "../MachineServiceDetails";

const MODELS = [
  "Soprano ICE Platinum",
  "Soprano Titanium",
  "Alma Harmony",
  "Helios",
  "Picolo",
  "Cocoon Elysion",
  "Aldix Smart Laser",
  "Pento 9900",
  "PrimeLase HR",
  "PrimeLase Excel",
  "PrimeLase Excel HR",
  "Soprano Platinum",
  "Soprano Titanium Special Edition",
  "Aldix (Triodus)",
  "PrimeLase",
  "Elysion",
  "PicoLo",
  "Splendor X",
  "Pento",
  "Clearlight IPL",
  "Fraction CO2",
  "Mezotix",
  "IOXO Laser",
  "IOXO Microneedling",
  "Focus Dual",
  "Ultraformer III",
  "Powershape 2",
  "Indiba",
  "CMSlim",
  "Coolshaping 2",
  "Hydra Beauty 2",
  "Dermadrop",
  "Carbomed",
  "Cryopen",
  "CryoIQ",
  "Reoxy",
  "Oxyhelp",
  "Omega PDT",
  "Eskimo Luftkylare",
  "TBH Röksug"
];

const isCustomModel = (model) => model && !MODELS.includes(model);

export default function MachineForm({ machine, customers, preselectedCustomerId, onSave, onClose }) {
  const existingIsCustom = machine?.model ? isCustomModel(machine.model) : false;

  const [form, setForm] = useState({
    model: existingIsCustom ? "Annan" : (machine?.model || ""),
    custom_model: existingIsCustom ? machine.model : "",
    manufacturer: machine?.manufacturer || "",
    serial_number: machine?.serial_number || "",
    customer_id: machine?.customer_id || preselectedCustomerId || "",
    installation_date: machine?.installation_date || "",
    warranty_expiry: machine?.warranty_expiry || "",
    status: machine?.status || "active",
    service_contract: machine?.service_contract || "none",
    notes: machine?.notes || ""
  });

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSave = () => {
    const saveData = { ...form };
    if (form.model === "Annan") {
      saveData.model = form.custom_model;
    }
    delete saveData.custom_model;
    onSave(saveData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
          <h2 className="text-lg font-bold text-slate-900">{machine ? "Redigera maskin" : "Ny maskin"}</h2>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1">
              <Label>Modell *</Label>
              <Select value={form.model} onValueChange={v => set("model", v)}>
                <SelectTrigger><SelectValue placeholder="Välj modell" /></SelectTrigger>
                <SelectContent>
                  {MODELS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  <SelectItem value="Annan">Annan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.model === "Annan" && (
              <>
                <div className="col-span-2 space-y-1">
                  <Label>Maskinnamn *</Label>
                  <Input value={form.custom_model} onChange={e => set("custom_model", e.target.value)} placeholder="Ange maskinens namn" />
                </div>
                <div className="col-span-2 space-y-1">
                  <Label>Tillverkare</Label>
                  <Input value={form.manufacturer} onChange={e => set("manufacturer", e.target.value)} placeholder="Ange tillverkare" />
                </div>
              </>
            )}
            {form.model && form.model !== "Annan" && (
              <div className="col-span-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-2">
                  {machineServiceDetails[form.model]?.title || `Servicebeskrivning för ${form.model}`}
                </h3>
                <ul className="space-y-2 text-sm text-blue-800">
                  {(machineServiceDetails[form.model]?.details || ["Service och underhåll enligt tillverkarens specifikationer", "Kontakta oss för mer information"]).map((detail, idx) => (
                    <li key={idx} className="flex gap-2">
                      <span className="text-blue-600">•</span>
                      <span dangerouslySetInnerHTML={{ __html: detail }} />
                    </li>
                  ))}
                </ul>
                {machineServiceDetails[form.model]?.additionalInfo && (
                  <div className="mt-3 pt-3 border-t border-blue-300">
                    <p className="text-sm font-semibold text-blue-900">
                      {machineServiceDetails[form.model].additionalInfo}
                    </p>
                  </div>
                )}
              </div>
            )}
            <div className="col-span-2 space-y-1">
              <Label>Serienummer *</Label>
              <Input value={form.serial_number} onChange={e => set("serial_number", e.target.value)} placeholder="SN-XXXXXX" />
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Kund *</Label>
              <Select value={form.customer_id} onValueChange={v => set("customer_id", v)}>
                <SelectTrigger><SelectValue placeholder="Välj kund" /></SelectTrigger>
                <SelectContent>
                  {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Installationsdatum</Label>
              <Input type="date" value={form.installation_date} onChange={e => set("installation_date", e.target.value)} />
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Garanti till</Label>
              <Input type="date" value={form.warranty_expiry} onChange={e => set("warranty_expiry", e.target.value)} />
            </div>
            {/* Service contract management moved to dedicated flow */}
            <div className="col-span-2 space-y-1">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Aktiv</SelectItem>
                  <SelectItem value="inactive">Inaktiv</SelectItem>
                  <SelectItem value="service">På service</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Anteckningar</Label>
              <Textarea value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Övriga anteckningar..." rows={3} />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 p-6 border-t bg-slate-50 rounded-b-2xl">
          <Button variant="outline" onClick={onClose}>Avbryt</Button>
          <Button onClick={handleSave} className="astomed-btn-primary" disabled={!form.model || (form.model === "Annan" && !form.custom_model) || !form.serial_number || !form.customer_id}>
            {machine ? "Spara ändringar" : "Registrera maskin"}
          </Button>
        </div>
      </div>
    </div>
  );
}