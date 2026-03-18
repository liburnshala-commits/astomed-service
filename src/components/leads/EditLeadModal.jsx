import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { X } from "lucide-react";

export default function EditLeadModal({ lead, onClose, onSave }) {
  const [form, setForm] = useState({
    company_name: lead.company_name || "",
    org_number: lead.org_number || "",
    contact_person: lead.contact_person || "",
    email: lead.email || "",
    phone: lead.phone || "",
    notes: lead.notes || "",
  });

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSave = () => {
    onSave(lead.id, form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
          <h2 className="text-lg font-bold text-slate-900">Redigera Prospekt</h2>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label>Företagsnamn</Label>
              <Input value={form.company_name} onChange={e => set("company_name", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Kontaktperson</Label>
              <Input value={form.contact_person} onChange={e => set("contact_person", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Org.nummer</Label>
              <Input value={form.org_number} onChange={e => set("org_number", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>E-post</Label>
              <Input type="email" value={form.email} onChange={e => set("email", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Telefon</Label>
              <Input value={form.phone} onChange={e => set("phone", e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Anteckningar</Label>
            <Textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={3} />
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t bg-slate-50 rounded-b-2xl">
          <Button variant="outline" onClick={onClose}>Avbryt</Button>
          <Button onClick={handleSave} className="astomed-btn-primary">Spara ändringar</Button>
        </div>
      </div>
    </div>
  );
}