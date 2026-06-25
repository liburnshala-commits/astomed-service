import { useState } from "react";
import { createPortal } from "react-dom";
import { X, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const MODELS = [
  "Soprano Platinum", "Soprano Titanium", "Alma Harmony", "Aldix (Triodus)",
  "PrimeLase", "Elysion", "PicoLo", "Helius", "Splendor X", "Pento", "Clearlight IPL", "Annan"
];

export default function CustomerForm({ customer, onSave, onClose }) {
  const [form, setForm] = useState({
    company_name: customer?.company_name || "",
    org_number: customer?.org_number || "",
    address: customer?.address || "",
    postal_code: customer?.postal_code || "",
    city: customer?.city || "",
    contact_person: customer?.contact_person || "",
    email: customer?.email || "",
    phone: customer?.phone || "",
    notes: customer?.notes || "",
    portal_token: customer?.portal_token || ""
  });

  const [machine, setMachine] = useState({
    model: "",
    serial_number: "",
    service_date: ""
  });

  const [invite, setInvite] = useState(false);

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));
  const setM = (field, value) => setMachine(prev => ({ ...prev, [field]: value }));

  const isNew = !customer;

  const handleSubmit = () => {
    const machineData = isNew && machine.model ? machine : null;
    onSave(form, machineData, invite);
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center bg-black/40 p-4 sm:p-6 py-10">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-full flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b bg-white shrink-0">
          <h2 className="text-lg font-bold text-slate-900">{customer ? "Redigera kund" : "Ny kund"}</h2>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
        </div>
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1">
              <Label>Företagsnamn *</Label>
              <Input value={form.company_name} onChange={e => set("company_name", e.target.value)} placeholder="AB Exempelföretag" />
            </div>
            <div className="space-y-1">
              <Label>Organisationsnummer</Label>
              <Input value={form.org_number} onChange={e => set("org_number", e.target.value)} placeholder="556XXX-XXXX" />
            </div>
            <div className="space-y-1">
              <Label>Referensperson</Label>
              <Input value={form.contact_person} onChange={e => set("contact_person", e.target.value)} placeholder="Förnamn Efternamn" />
            </div>
            <div className="space-y-1">
              <Label>E-post</Label>
              <Input type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="kontakt@foretag.se" />
              {isNew && form.email && (
                <div className="flex items-center gap-2 mt-1">
                  <input 
                    type="checkbox" 
                    id="inviteCustomer" 
                    checked={invite} 
                    onChange={(e) => setInvite(e.target.checked)} 
                    className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 cursor-pointer" 
                  />
                  <label htmlFor="inviteCustomer" className="text-xs text-slate-600 cursor-pointer select-none">Bjud in kund via e-post</label>
                </div>
              )}
            </div>
            <div className="space-y-1">
              <Label>Telefon</Label>
              <Input value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="08-XXX XX XX" />
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Adress</Label>
              <Input value={form.address} onChange={e => set("address", e.target.value)} placeholder="Gatunamn 1" />
            </div>
            <div className="space-y-1">
              <Label>Postnummer</Label>
              <Input value={form.postal_code} onChange={e => set("postal_code", e.target.value)} placeholder="123 45" />
            </div>
            <div className="space-y-1">
              <Label>Stad</Label>
              <Input value={form.city} onChange={e => set("city", e.target.value)} placeholder="Stockholm" />
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Anteckningar</Label>
              <Textarea value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Övriga anteckningar..." rows={3} />
            </div>
          </div>

          {isNew && (
            <div className="border-t pt-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Monitor className="w-4 h-4" />
                Lägg till maskin (valfritt)
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1">
                  <Label>Maskinmodell</Label>
                  <Select value={machine.model} onValueChange={v => setM("model", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Välj modell..." />
                    </SelectTrigger>
                    <SelectContent>
                      {MODELS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                {machine.model && (
                  <>
                    <div className="space-y-1">
                      <Label>Serienummer</Label>
                      <Input value={machine.serial_number} onChange={e => setM("serial_number", e.target.value)} placeholder="SN-XXXXXX" />
                    </div>
                    <div className="space-y-1">
                      <Label>Senaste servicedatum</Label>
                      <Input type="date" value={machine.service_date} onChange={e => setM("service_date", e.target.value)} />
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-3 p-6 border-t bg-slate-50 shrink-0 rounded-b-2xl">
          <Button variant="outline" onClick={onClose}>Avbryt</Button>
          <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700" disabled={!form.company_name}>
            {customer ? "Spara ändringar" : "Skapa kund"}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}