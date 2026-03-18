import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { X } from "lucide-react";

const statusMap = {
  new: "Nytt",
  contacted: "Kontaktad",
  called: "Ringt",
  proposal_sent: "Offert skickad",
  accepted: "Accepterad",
  rejected: "Avvisad",
  no_contract_wanted: "Vill ej ha avtal",
};

export default function NewLeadModal({ customers, onClose, onSave }) {
  const [mode, setMode] = useState("existing"); // "existing" | "new"
  const [form, setForm] = useState({
    customer_id: "",
    company_name: "",
    org_number: "",
    contact_person: "",
    email: "",
    phone: "",
    status: "new",
    follow_up_date: "",
    notes: "",
  });

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const isValid = mode === "existing"
    ? !!form.customer_id
    : !!form.company_name;

  const handleSave = () => {
    const data = mode === "existing"
      ? { customer_id: form.customer_id, status: form.status, follow_up_date: form.follow_up_date || null, notes: form.notes }
      : {
          company_name: form.company_name,
          org_number: form.org_number,
          contact_person: form.contact_person,
          email: form.email,
          phone: form.phone,
          status: form.status,
          follow_up_date: form.follow_up_date || null,
          notes: form.notes,
        };
    onSave(data);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
          <h2 className="text-lg font-bold text-slate-900">Nytt Prospekt</h2>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
        </div>

        <div className="p-6 space-y-5">
          {/* Mode toggle */}
          <div className="flex gap-2 bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setMode("existing")}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${mode === "existing" ? "bg-white shadow text-slate-900" : "text-slate-500"}`}
            >
              Befintlig kund
            </button>
            <button
              onClick={() => setMode("new")}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${mode === "new" ? "bg-white shadow text-slate-900" : "text-slate-500"}`}
            >
              Nytt prospekt
            </button>
          </div>

          {mode === "existing" ? (
            <div className="space-y-2">
              <Label>Välj Kund *</Label>
              <Select value={form.customer_id} onValueChange={v => set("customer_id", v)}>
                <SelectTrigger><SelectValue placeholder="Välj kund..." /></SelectTrigger>
                <SelectContent>
                  {customers.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label>Företagsnamn *</Label>
                  <Input value={form.company_name} onChange={e => set("company_name", e.target.value)} placeholder="AB Företaget" />
                </div>
                <div className="space-y-2">
                  <Label>Org.nummer</Label>
                  <Input value={form.org_number} onChange={e => set("org_number", e.target.value)} placeholder="556XXX-XXXX" />
                </div>
                <div className="space-y-2">
                  <Label>Kontaktperson</Label>
                  <Input value={form.contact_person} onChange={e => set("contact_person", e.target.value)} placeholder="Anna Karlsson" />
                </div>
                <div className="space-y-2">
                  <Label>E-post</Label>
                  <Input type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="anna@foretaget.se" />
                </div>
                <div className="space-y-2">
                  <Label>Telefon</Label>
                  <Input value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="070-000 00 00" />
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(statusMap).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Uppföljningsdatum</Label>
              <Input type="date" value={form.follow_up_date} onChange={e => set("follow_up_date", e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Anteckningar</Label>
            <Textarea value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Ev. anteckningar om prospektet..." rows={3} />
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t bg-slate-50 rounded-b-2xl">
          <Button variant="outline" onClick={onClose}>Avbryt</Button>
          <Button onClick={handleSave} disabled={!isValid} className="astomed-btn-primary">Spara Prospekt</Button>
        </div>
      </div>
    </div>
  );
}