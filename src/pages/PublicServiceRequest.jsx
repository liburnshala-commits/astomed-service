import { useState } from "react";
import { Send, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function PublicServiceRequest() {
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
    service_type: "standard",
    preferred_time_slot: "",
    notes: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`https://api.base44.com/api/apps/69a9446fcb1cd4ab529479ba/functions/createPublicServiceLead`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      if (!res.ok) throw new Error("Fel vid skickning");
      setSuccess(true);
    } finally {
      setSubmitting(false);
    }
  };

  const isValid = form.company_name && form.contact_person && form.email && form.phone && form.machine_name && form.service_description;

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "#f4f6f4" }}>
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-10 text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: "#e8f2f2" }}>
            <Send className="w-8 h-8" style={{ color: "#3a9e9e" }} />
          </div>
          <h2 className="text-2xl font-bold mb-3" style={{ color: "#1b3a3a" }}>Förfrågan skickad!</h2>
          <p className="text-gray-500">Tack! Vi har tagit emot din serviceförfrågan och återkommer till dig så snart som möjligt.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10 px-4" style={{ background: "#f4f6f4" }}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ background: "#1b3a3a" }}>
            <Wrench className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: "#1b3a3a" }}>Serviceförfrågan</h1>
          <p className="text-gray-500">Fyll i formuläret nedan så kontaktar vi dig för att diskutera service av din maskin.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-8 space-y-6">
          {/* Kunduppgifter */}
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide mb-4" style={{ color: "#254f4f" }}>Dina uppgifter</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 space-y-1">
                <Label>Företagsnamn *</Label>
                <Input value={form.company_name} onChange={e => set("company_name", e.target.value)} placeholder="Ditt företag AB" required />
              </div>
              <div className="space-y-1">
                <Label>Kontaktperson *</Label>
                <Input value={form.contact_person} onChange={e => set("contact_person", e.target.value)} placeholder="För- och efternamn" required />
              </div>
              <div className="space-y-1">
                <Label>Telefon *</Label>
                <Input value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="07XXXXXXXX" required />
              </div>
              <div className="sm:col-span-2 space-y-1">
                <Label>E-post *</Label>
                <Input type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="din@email.se" required />
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

          <hr className="border-gray-100" />

          {/* Maskinuppgifter */}
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide mb-4" style={{ color: "#254f4f" }}>Maskinuppgifter</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Maskintyp *</Label>
                <Input value={form.machine_name} onChange={e => set("machine_name", e.target.value)} placeholder="T.ex. Laser, IPL, Ultraljud..." required />
              </div>
              <div className="space-y-1">
                <Label>Tillverkare</Label>
                <Input value={form.manufacturer} onChange={e => set("manufacturer", e.target.value)} placeholder="T.ex. Candela, Syneron..." />
              </div>
              <div className="space-y-1">
                <Label>Serienummer</Label>
                <Input value={form.serial_number} onChange={e => set("serial_number", e.target.value)} placeholder="Maskinens serienummer" />
              </div>
              <div className="space-y-1">
                <Label>Servicetyp</Label>
                <Select value={form.service_type} onValueChange={v => set("service_type", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard service</SelectItem>
                    <SelectItem value="advanced">Avancerad service</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2 space-y-1">
                <Label>Beskriv servicebehovet *</Label>
                <Textarea
                  value={form.service_description}
                  onChange={e => set("service_description", e.target.value)}
                  placeholder="Beskriv vad som behöver åtgärdas, eventuella fel eller symtom..."
                  rows={5}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label>Föredragen tid för genomgång</Label>
                <Select value={form.preferred_time_slot} onValueChange={v => set("preferred_time_slot", v)}>
                  <SelectTrigger><SelectValue placeholder="Välj tid" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="förmiddag">Förmiddag</SelectItem>
                    <SelectItem value="eftermiddag">Eftermiddag</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2 space-y-1">
                <Label>Övriga anteckningar</Label>
                <Textarea
                  value={form.notes}
                  onChange={e => set("notes", e.target.value)}
                  placeholder="Eventuella ytterligare kommentarer eller önskemål..."
                  rows={3}
                />
              </div>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-12 text-base"
            style={{ background: "#1b3a3a" }}
            disabled={!isValid || submitting}
          >
            {submitting ? "Skickar..." : "Skicka serviceförfrågan"}
          </Button>

          <p className="text-xs text-center text-gray-400">
            Dina uppgifter hanteras säkert och används enbart för att kunna kontakta dig angående din serviceförfrågan.
          </p>
        </form>
      </div>
    </div>
  );
}