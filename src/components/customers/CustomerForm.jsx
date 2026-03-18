import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
          <h2 className="text-lg font-bold text-slate-900">{customer ? "Redigera kund" : "Ny kund"}</h2>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1">
              <Label>Företagsnamn *</Label>
              <Input value={form.company_name} onChange={e => set("company_name", e.target.value)} placeholder="AB Exempelföretag" />
            </div>
            <div className="space-y-1">
              <Label>Organisationsnummer (frivilligt)</Label>
              <Input value={form.org_number} onChange={e => set("org_number", e.target.value)} placeholder="556XXX-XXXX" />
            </div>
            <div className="space-y-1">
              <Label>Referensperson</Label>
              <Input value={form.contact_person} onChange={e => set("contact_person", e.target.value)} placeholder="Förnamn Efternamn" />
            </div>
            <div className="space-y-1">
              <Label>E-post</Label>
              <Input type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="kontakt@foretag.se" />
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
        </div>
        <div className="flex justify-end gap-3 p-6 border-t bg-slate-50 rounded-b-2xl">
          <Button variant="outline" onClick={onClose}>Avbryt</Button>
          <Button onClick={() => onSave(form)} className="bg-blue-600 hover:bg-blue-700" disabled={!form.company_name}>
            {customer ? "Spara ändringar" : "Skapa kund"}
          </Button>
        </div>
      </div>
    </div>
  );
}