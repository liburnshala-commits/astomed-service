import { useState } from "react";
import { X, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { machineServiceDetails } from "../MachineServiceDetails";
import { MACHINE_MODELS } from "@/lib/constants";

const TECHNICIANS = ["Elman@astomed.se", "Liburn@Astomed.se"];

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
  const [machineModel, setMachineModel] = useState(() => {
    if (lead.machine_name && MACHINE_MODELS.includes(lead.machine_name)) return lead.machine_name;
    if (lead.machine_name) return "Annan";
    return "Soprano Platinum";
  });
  const [customModel, setCustomModel] = useState(() => {
    if (lead.machine_name && !MACHINE_MODELS.includes(lead.machine_name)) return lead.machine_name;
    return "";
  });
  const [serialNumber, setSerialNumber] = useState(lead.serial_number || "");
  const [technician, setTechnician] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleConvert = async () => {
    setSaving(true);
    try {
      // 1. Create or find customer
      let customer;
      if (form.org_number && form.org_number.trim() !== "") {
        const existing = await base44.entities.Customer.filter({ org_number: form.org_number.trim() });
        if (existing && existing.length > 0) {
          customer = existing[0];
        }
      }
      
      if (!customer) {
        customer = await base44.entities.Customer.create({
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
      }

      // 2. Create a machine
      const finalModel = machineModel === "Annan" ? customModel : machineModel;
      const machine = await base44.entities.Machine.create({
        model: finalModel,
        serial_number: serialNumber.trim() || "OKÄND",
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

      // 5. Logga händelsen
      const currentUser = await base44.auth.me();
      const logUser = {
        user_email: currentUser?.email || 'unknown',
        user_name: currentUser?.full_name || currentUser?.email
      };
      await Promise.all([
        base44.functions.invoke('logAuditEntry', { action: 'create', entity_type: 'Customer', entity_id: customer.id, entity_label: customer.company_name, ...logUser, details: `Kund skapad från serviceförfrågan` }),
        base44.functions.invoke('logAuditEntry', { action: 'create', entity_type: 'Machine', entity_id: machine.id, entity_label: `${machine.model} – SN: ${machine.serial_number}`, ...logUser, details: `Maskin skapad från serviceförfrågan` }),
        base44.functions.invoke('logAuditEntry', { action: 'create', entity_type: 'ServiceRecord', entity_id: serviceRecord.id, entity_label: `${machine.model} – ${customer.company_name}`, ...logUser, details: `Serviceärende skapad från lead` }),
        base44.functions.invoke('logAuditEntry', { action: 'update', entity_type: 'PublicServiceLead', entity_id: lead.id, entity_label: lead.company_name, ...logUser, details: `Lead konverterad till kund` }),
      ]);

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
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">Maskinuppgifter</h3>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label>Maskinmodell</Label>
                <Select value={machineModel} onValueChange={setMachineModel}>
                  <SelectTrigger><SelectValue placeholder="Välj modell" /></SelectTrigger>
                  <SelectContent>
                    {MACHINE_MODELS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                    <SelectItem value="Annan">Annan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {machineModel === "Annan" && (
                <div className="space-y-1">
                  <Label>Maskinnamn *</Label>
                  <Input value={customModel} onChange={e => setCustomModel(e.target.value)} placeholder="Ange maskinens namn" />
                </div>
              )}
              <div className="space-y-1">
                <Label>Serienummer *</Label>
                <Input value={serialNumber} onChange={e => setSerialNumber(e.target.value)} placeholder="Ange serienummer (eller OKÄND om det saknas)" />
              </div>
              {machineModel && machineModel !== "Annan" && machineServiceDetails[machineModel] && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-blue-900 mb-2">
                    {machineServiceDetails[machineModel].title}
                  </h3>
                  <ul className="space-y-2 text-sm text-blue-800">
                    {machineServiceDetails[machineModel].details.map((detail, idx) => (
                      <li key={idx} className="flex gap-2">
                        <span className="text-blue-600">•</span>
                        <span dangerouslySetInnerHTML={{ __html: detail }} />
                      </li>
                    ))}
                  </ul>
                  {machineServiceDetails[machineModel].additionalInfo && (
                    <div className="mt-3 pt-3 border-t border-blue-300">
                      <p className="text-sm font-semibold text-blue-900">
                        {machineServiceDetails[machineModel].additionalInfo}
                      </p>
                    </div>
                  )}
                </div>
              )}
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
          <Button className="astomed-btn-primary" onClick={handleConvert} disabled={saving || (machineModel === "Annan" && !customModel) || !serialNumber.trim()}>
            {saving ? "Skapar..." : "Skapa kund & serviceärende"}
          </Button>
        </div>
      </div>
    </div>
  );
}