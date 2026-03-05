import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const MODELS = [
  "Soprano Platinum", "Soprano Titanium", "Aldix (Triodus)",
  "PrimeLase", "Elysion", "PicoLo", "Helius", "Splendor X", "Pento"
];

export default function MachineForm({ machine, customers, preselectedCustomerId, onSave, onClose }) {
  const [form, setForm] = useState({
    model: machine?.model || "",
    serial_number: machine?.serial_number || "",
    customer_id: machine?.customer_id || preselectedCustomerId || "",
    installation_date: machine?.installation_date || "",
    warranty_expiry: machine?.warranty_expiry || "",
    status: machine?.status || "active",
    service_interval: machine?.service_interval || "",
    service_contract: machine?.service_contract || "none",
    notes: machine?.notes || ""
  });

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

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
                </SelectContent>
              </Select>
            </div>
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
            <div className="space-y-1">
              <Label>Garanti till</Label>
              <Input type="date" value={form.warranty_expiry} onChange={e => set("warranty_expiry", e.target.value)} />
            </div>
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
          <Button onClick={() => onSave(form)} className="bg-blue-600 hover:bg-blue-700" disabled={!form.model || !form.serial_number || !form.customer_id}>
            {machine ? "Spara ändringar" : "Registrera maskin"}
          </Button>
        </div>
      </div>
    </div>
  );
}