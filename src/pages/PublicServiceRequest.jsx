import { useState } from "react";
import { Send, Wrench, CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { machineServiceDetails } from "@/components/MachineServiceDetails";

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
    preferred_date: null,
    notes: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const submitData = {
        ...form,
        preferred_date: form.preferred_date ? format(form.preferred_date, "yyyy-MM-dd") : null
      };
      const res = await fetch(`https://api.base44.com/api/apps/69a9446fcb1cd4ab529479ba/functions/createPublicServiceLead`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData)
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
              <div className="sm:col-span-2 space-y-1">
                <Label>Maskintyp *</Label>
                <Select value={form.machine_name} onValueChange={v => set("machine_name", v)} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Välj maskintyp" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(machineServiceDetails).map(machine => (
                      <SelectItem key={machine} value={machine}>{machine}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {form.machine_name && machineServiceDetails[form.machine_name] && (
                <div className="sm:col-span-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-blue-900 mb-2">
                    {machineServiceDetails[form.machine_name].title}
                  </h3>
                  <ul className="space-y-2 text-sm text-blue-800">
                    {machineServiceDetails[form.machine_name].details.map((detail, idx) => (
                      <li key={idx} className="flex gap-2">
                        <span className="text-blue-600">•</span>
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
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
                <Label>Föredragen dag för genomgång</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {form.preferred_date ? format(form.preferred_date, "PPP", { locale: sv }) : "Välj ett datum"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={form.preferred_date}
                      onSelect={(date) => set("preferred_date", date)}
                      disabled={(date) => date < new Date()}
                      locale={sv}
                    />
                  </PopoverContent>
                </Popover>
                <p className="text-xs text-gray-500 mt-1">
                  Detta är ett preliminärt datum. Vi bekräftar den exakta tiden via telefonkontakt.
                </p>
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