import { useState } from "react";
import { X, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";

const TECHNICIANS = ["Erik Lindström", "Anna Karlsson", "Johan Bergström", "Maria Svensson"];

export default function ConvertLeadModal({ lead, onClose, onConverted }) {
  const [form, setForm] = useState({
    company_name: lead.company_name || "",
    contact_person: lead.contact_person || "",
    email: lead.email || "",
    phone: lead.phone || "",
    org_number: lead.org_number || "",
    address: lead.address || "",
    postal_code: lead.postal_code || "",
    city: lead.city || "",
    notes: ""
  });
  const [technician, setTechnician] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleConvert = async () => {
    setSaving(true);
    try {
      // 1. Create customer
      const customer = await base44.entities.Customer.create({
        company_name: form.company_name,
        contact_person: form.contact_person,
        email: form.email,
        phone: form.phone,
        org_number: form.org_number,
        address: form.address,
        postal_code: form.postal_code,
        city: form.city,
        notes: form.notes
      });

      // 2. Create a machine placeholder
      const machine = await base44.entities.Machine.create({
        model: "Soprano Platinum", // placeholder - can be updated later
        serial_number: lead.serial_number || "OKÄND",
        customer_id: customer.id,
        notes: `Maskin från serviceförfrågan: ${lead.machine_name}${lead.manufacturer ? ` (${lead.manufacturer})` : ""}`
      });

      // 3. Create service record
      const serviceRecord = await base44.entities.ServiceRecord.create({
        customer_id: customer.id,
        machine_id: machine.id,
        service_type: lead.service_type || "standard",
        service_date: new Date().toISOString().split("T")[0],
        description: lead.service_description,
        technician_name: technician || "",
        status: technician ? "in_progress" : "pending"
      });

      // 4. Update lead status
      await base44.entities.PublicServiceLead.update(lead.id, {
        status: technician ? "assigned" : "customer_created",
        customer_id: customer.id,
        service_record_id: serviceRecord.id,
        assigned_technician: technician || null
      });

      setDone(true);
      setTimeout(() => onConverted(), 2000);
    } finally {
      setSaving(false);
    }
  };

  if (done) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "#e8f2f2" }}>
            <CheckCircle className="w-8 h-8" style={{ color: "#3a9e9e" }} />
          </div>
          <h2 className="text-lg font-bold astomed-title mb-2">Kund skapad!</h2>
          <p className="astomed-subtitle text-sm">Kunden och serviceärendet har skapats och är nu redo för hantering.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
          <h2 className="text-lg font-bold astomed-title">Skapa kund från förfrågan</h2>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
        </div>

        <div className="p-6 space-y-5">
          <p className="text-sm text-gray-500 p-3 rounded-lg" style={{ background: "#f4f9f9" }}>
            Granska och bekräfta uppgifterna nedan. En ny kund, maskin och ett serviceärende skapas automatiskt.
          </p>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">Kunduppgifter</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1">
                <Label>Företagsnamn</Label>
                <Input value={form.company_name} onChange={e => set("company_name", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Kontaktperson</Label>
                <Input value={form.contact_person} onChange={e => set("contact_person", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Telefon</Label>
                <Input value={form.phone} onChange={e => set("phone", e.target.value)} />
              </div>
              <div className="col-span-2 space-y-1">
                <Label>E-post</Label>
                <Input value={form.email} onChange={e => set("email", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Organisationsnummer</Label>
                <Input value={form.org_number} onChange={e => set("org_number", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Stad</Label>
                <Input value={form.city} onChange={e => set("city", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Adress</Label>
                <Input value={form.address} onChange={e => set("address", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Postnummer</Label>
                <Input value={form.postal_code} onChange={e => set("postal_code", e.target.value)} />
              </div>
              <div className="col-span-2 space-y-1">
                <Label>Interna anteckningar</Label>
                <Textarea value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Valfria anteckningar..." rows={2} />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">Tilldela tekniker (valfritt)</h3>
            <Select value={technician} onValueChange={setTechnician}>
              <SelectTrigger><SelectValue placeholder="Välj tekniker..." /></SelectTrigger>
              <SelectContent>
                {TECHNICIANS.map(t => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t bg-slate-50 rounded-b-2xl">
          <Button variant="outline" onClick={onClose}>Avbryt</Button>
          <Button className="astomed-btn-primary" onClick={handleConvert} disabled={saving}>
            {saving ? "Skapar..." : "Skapa kund & serviceärende"}
          </Button>
        </div>
      </div>
    </div>
  );
}