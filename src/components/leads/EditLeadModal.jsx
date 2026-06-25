import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { X, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";

export default function EditLeadModal({ lead, onClose, onSave }) {
  const [form, setForm] = useState({
    company_name: lead.company_name || "",
    org_number: lead.org_number || "",
    contact_person: lead.contact_person || "",
    email: lead.email || "",
    phone: lead.phone || "",
    address: lead.address || "",
    postal_code: lead.postal_code || "",
    city: lead.city || "",
    notes: lead.notes || "",
  });

  const [createFollowUp, setCreateFollowUp] = useState(false);
  const [followUpDate, setFollowUpDate] = useState(
    format(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), "yyyy-MM-dd")
  );

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSave = () => {
    onSave(lead.id, { ...form, createFollowUp, followUpDate });
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
          
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Adress</Label>
              <Input value={form.address} onChange={e => set("address", e.target.value)} placeholder="Gatuadress" />
            </div>
            <div className="space-y-2">
              <Label>Postnummer</Label>
              <Input value={form.postal_code} onChange={e => set("postal_code", e.target.value)} placeholder="Postnummer" />
            </div>
            <div className="space-y-2">
              <Label>Ort</Label>
              <Input value={form.city} onChange={e => set("city", e.target.value)} placeholder="Ort" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Anteckningar</Label>
            <Textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={3} />
          </div>

          <div className="flex flex-col gap-2 p-3 bg-slate-50 border border-slate-200 rounded-md">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer w-fit">
              <input 
                type="checkbox" 
                className="w-4 h-4 rounded border-gray-300 text-primary cursor-pointer"
                checked={createFollowUp} 
                onChange={(e) => setCreateFollowUp(e.target.checked)} 
              />
              Skapa uppföljning (To-Do)
            </label>
            {createFollowUp && (
              <div className="flex items-center gap-2 pl-6 mt-1">
                <CalendarIcon className="w-4 h-4 text-slate-500" />
                <span className="text-sm text-slate-600">Förfallodatum:</span>
                <Input
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="bg-white w-40 h-8"
                  required={createFollowUp}
                />
              </div>
            )}
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