import { useState } from "react";
import { X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";

export default function OtherMachineServiceForm({ onClose, onSubmitted }) {
  const [form, setForm] = useState({
    company_name: "",
    contact_person: "",
    email: "",
    phone: "",
    org_number: "",
    address: "",
    postal_code: "",
    city: "",
    machine_name: "",
    manufacturer: "",
    serial_number: "",
    service_description: "",
    service_type: "standard"
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await base44.functions.invoke("createPublicServiceLead", form);
      setSuccess(true);
      setTimeout(() => {
        if (onSubmitted) onSubmitted();
        onClose();
      }, 2500);
    } finally {
      setSubmitting(false);
    }
  };

  const isValid = form.company_name && form.contact_person && form.email && form.phone && form.machine_name && form.service_description;

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "#e8f2f2" }}>
            <Send className="w-7 h-7" style={{ color: "#3a9e9e" }} />
          </div>
          <h2 className="text-lg font-bold astomed-title mb-2">Förfrågan skickad!</h2>
          <p className="astomed-subtitle text-sm">Astomed kommer att granska din förfrågan och kontakta dig inom kort.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
          <h2 className="text-lg font-bold astomed-title">Serviceförfrågan – Annan maskin</h2>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Kunduppgifter */}
          <div>
            <h3 className="text-sm font-semibold astomed-label mb-3 uppercase tracking-wide">Dina uppgifter</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1">
                <Label>Företagsnamn *</Label>
                <Input value={form.company_name} onChange={e => set("company_name", e.target.value)} placeholder="Företagets namn" />
              </div>
              <div className="space-y-1">
                <Label>Kontaktperson *</Label>
                <Input value={form.contact_person} onChange={e => set("contact_person", e.target.value)} placeholder="För- och efternamn" />
              </div>
              <div className="space-y-1">
                <Label>Telefon *</Label>
                <Input value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="07XXXXXXXX" />
              </div>
              <div className="col-span-2 space-y-1">
                <Label>E-post *</Label>
                <Input type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="din@email.se" />
              </div>
              <div className="space-y-1">
                <Label>Organisationsnummer</Label>
                <Input value={form.org_number} onChange={e => set("org_number", e.target.value)} placeholder="XXXXXX-XXXX" />
              </div>
              <div className="space-y-1">
                <Label>Stad</Label>
                <Input value={form.city} onChange={e => set("city", e.target.value)} placeholder="Stad" />
              </div>
              <div className="space-y-1">
                <Label>Adress</Label>
                <Input value={form.address} onChange={e => set("address", e.target.value)} placeholder="Gatuadress" />
              </div>
              <div className="space-y-1">
                <Label>Postnummer</Label>
                <Input value={form.postal_code} onChange={e => set("postal_code", e.target.value)} placeholder="XXX XX" />
              </div>
            </div>
          </div>

          {/* Maskinuppgifter */}
          <div>
            <h3 className="text-sm font-semibold astomed-label mb-3 uppercase tracking-wide">Maskinuppgifter</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Maskintyp *</Label>
                <Input value={form.machine_name} onChange={e => set("machine_name", e.target.value)} placeholder="T.ex. Laser, IPL..." />
              </div>
              <div className="space-y-1">
                <Label>Tillverkare</Label>
                <Input value={form.manufacturer} onChange={e => set("manufacturer", e.target.value)} placeholder="T.ex. Candela..." />
              </div>
              <div className="space-y-1">
                <Label>Serienummer</Label>
                <Input value={form.serial_number} onChange={e => set("serial_number", e.target.value)} placeholder="Maskinens serienummer" />
              </div>
              <div className="space-y-1">
                <Label>Servicetyp *</Label>
                <Select value={form.service_type} onValueChange={v => set("service_type", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard service</SelectItem>
                    <SelectItem value="advanced">Avancerad service</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-1">
                <Label>Beskrivning av serviceärende *</Label>
                <Textarea
                  value={form.service_description}
                  onChange={e => set("service_description", e.target.value)}
                  placeholder="Beskriv vad som behöver åtgärdas..."
                  rows={4}
                />
              </div>
            </div>
          </div>

          <p className="text-xs astomed-muted p-3 rounded-lg" style={{ background: "#f4f9f9" }}>
            Astomed kommer att granska din förfrågan och kontakta dig för att diskutera möjligheterna för service på din maskin.
          </p>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t bg-slate-50 shrink-0 rounded-b-2xl">
          <Button variant="outline" onClick={onClose}>Avbryt</Button>
          <Button
            onClick={handleSubmit}
            className="astomed-btn-primary"
            disabled={!isValid || submitting}
          >
            {submitting ? "Skickar..." : "Skicka förfrågan"}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}