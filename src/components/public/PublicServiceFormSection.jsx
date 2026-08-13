import React, { useState, useEffect } from "react";
import { Send, Wrench, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";

export default function PublicServiceFormSection({ onSuccess, onOpenPrivacy }) {
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
    serial_number: "",
    notes: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [orgNumberWarning, setOrgNumberWarning] = useState("");
  const [templates, setTemplates] = useState([]);

  const set = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const data = await base44.entities.ServiceAgreementTemplate.list();
        setTemplates(data.sort((a, b) => a.name.localeCompare(b.name)));
      } catch (err) {
        console.error("Failed to load templates", err);
      }
    };
    fetchTemplates();
  }, []);

  useEffect(() => {
    const checkOrgNumber = async () => {
      const orgNo = form.org_number.trim();
      setOrgNumberWarning("");
      
      if (!orgNo) return;

      const isValidFormat = /^\d{6}-?\d{4}$/.test(orgNo);
      if (!isValidFormat && orgNo.length >= 10) {
        setOrgNumberWarning("Ogiltigt format på organisationsnummer (förväntat format: XXXXXX-XXXX).");
        return;
      }

      if (isValidFormat) {
        try {
          const customers = await base44.entities.Customer.filter({ org_number: orgNo });
          if (customers.length > 0) {
            setOrgNumberWarning(`Detta organisationsnummer finns redan registrerat på kunden "${customers[0].company_name}".`);
          }
        } catch (error) {
          console.error("Kunde inte kontrollera organisationsnummer", error);
        }
      }
    };

    const timer = setTimeout(checkOrgNumber, 600);
    return () => clearTimeout(timer);
  }, [form.org_number]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const finalMachineName = form.machine_name === "Annan" && form.other_machine_name ?
      `Annan (${form.other_machine_name})` :
      form.machine_name;

      const submitData = {
        ...form,
        machine_name: finalMachineName,
        service_description: form.notes || `Serviceförfrågan för ${finalMachineName}.`
      };
      const appUrl = window.location.origin;
      const res = await fetch(`${appUrl}/api/functions/createPublicServiceLead`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData)
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Fel vid skickning");
      }
      onSuccess();
    } catch (error) {
      console.error("Submission error:", error);
      alert(`Ett fel uppstod: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const isValid = form.company_name && form.contact_person && form.email && form.phone && form.machine_name && privacyAccepted && (form.machine_name !== "Annan" || form.other_machine_name);

  return (
    <section id="anmalan" className="py-24 px-4 md:px-12 bg-[#fcf8f2] relative">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col items-center text-center mb-12">
          <div className="flex items-start gap-8 mb-8">
            <div className="flex flex-col items-center">
              <img src="https://media.base44.com/images/public/69a9446fcb1cd4ab529479ba/bebd0b7cf_Liburn-2026.jpg" alt="Liburn" className="w-28 h-28 rounded-full object-cover shadow-lg border-4 border-white mb-3" />
              <span className="font-bold text-[#1b3a3a]">Liburn</span>
              <span className="text-sm text-slate-500">Produktspecialist Service</span>
              <a href="tel:0761616855" className="text-sm text-[#3a9e9e] font-semibold mt-1 hover:underline">076-161 68 55</a>
            </div>
            <div className="flex flex-col items-center">
              <img src="https://cdn.shopify.com/s/files/1/0548/7348/9459/files/Astomed_2025-11-25_kl._10.53.12.png?v=1764064622" alt="Elman" className="w-28 h-28 rounded-full object-cover shadow-lg border-4 border-white mb-3" />
              <span className="font-bold text-[#1b3a3a]">Elman</span>
              <span className="text-sm text-slate-500">Produktspecialist Service</span>
            </div>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-[#1b3a3a] mb-4">Säkra din klinik redan idag</h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Fyll i formuläret nedan för en kostnadsfri konsultation om hur våra flexibla serviceavtal kan skydda din investering och göra dig redo för lagen.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-xl p-8 md:p-12 space-y-8 border border-slate-100">
          {/* Kunduppgifter */}
          <div>
            <h3 className="text-lg font-bold text-[#1b3a3a] border-b border-slate-100 pb-3 mb-6 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-[#e8f2f2] text-[#3a9e9e] flex items-center justify-center text-sm">1</span> 
              Dina företaguppgifter
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <Label className="text-slate-700">Företagsnamn *</Label>
                <Input className="h-11 bg-slate-50/50" value={form.company_name} onChange={(e) => set("company_name", e.target.value)} placeholder="Ditt företag AB" required />
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-700">Organisationsnummer</Label>
                <Input className="h-11 bg-slate-50/50" value={form.org_number} onChange={(e) => set("org_number", e.target.value)} placeholder="XXXXXX-XXXX" />
                {orgNumberWarning && (
                  <p className="text-amber-600 text-xs font-medium flex items-start gap-1 pt-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>{orgNumberWarning}</span>
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-700">Kontaktperson *</Label>
                <Input className="h-11 bg-slate-50/50" value={form.contact_person} onChange={(e) => set("contact_person", e.target.value)} placeholder="För- och efternamn" required />
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-700">Telefon *</Label>
                <Input className="h-11 bg-slate-50/50" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="07XXXXXXXX" required />
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <Label className="text-slate-700">E-post *</Label>
                <Input className="h-11 bg-slate-50/50" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="din@email.se" required />
              </div>
            </div>
          </div>

          {/* Maskinuppgifter */}
          <div>
            <h3 className="text-lg font-bold text-[#1b3a3a] border-b border-slate-100 pb-3 mb-6 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-[#e8f2f2] text-[#3a9e9e] flex items-center justify-center text-sm">2</span> 
              Maskinuppgifter
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <Label className="text-slate-700">Maskintyp *</Label>
                <Select value={form.machine_name || undefined} onValueChange={(v) => set("machine_name", v)} required>
                  <SelectTrigger className="h-11 bg-slate-50/50">
                    <SelectValue placeholder="Välj maskintyp" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) =>
                      <SelectItem key={template.id} value={template.name}>{template.name}</SelectItem>
                    )}
                    <SelectItem value="Annan">Annan</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-slate-700">Serienummer (frivilligt)</Label>
                <Input className="h-11 bg-slate-50/50" value={form.serial_number || ""} onChange={(e) => set("serial_number", e.target.value)} placeholder="Kan fyllas i senare" />
              </div>
              
              {form.machine_name === "Annan" &&
                <div className="sm:col-span-2 space-y-1.5">
                  <Label className="text-slate-700">Maskinnamn *</Label>
                  <Input className="h-11 bg-slate-50/50" value={form.other_machine_name || ""} onChange={(e) => set("other_machine_name", e.target.value)} placeholder="Vilken maskin gäller det?" required />
                </div>
              }

              {(() => {
                const selectedTemplate = templates.find(t => t.name === form.machine_name);
                if (selectedTemplate) {
                  return (
                    <div className="sm:col-span-2 p-5 bg-[#f0f7f7] rounded-xl border border-[#d2e8e8]">
                      <h4 className="font-bold text-[#1b3a3a] mb-3 flex items-center gap-2">
                        <Wrench className="w-4 h-4 text-[#3a9e9e]" />
                        Standardservice och underhåll – {selectedTemplate.name}
                      </h4>
                      <ul className="space-y-2.5 text-sm text-slate-700">
                        {selectedTemplate.included_services && selectedTemplate.included_services.map((detail, idx) =>
                          <li key={idx} className="flex gap-2.5 items-start">
                            <CheckCircle2 className="w-4 h-4 text-[#3a9e9e] shrink-0 mt-0.5" />
                            <span>{detail}</span>
                          </li>
                        )}
                      </ul>
                      {selectedTemplate.price_per_month && (
                        <div className="mt-4 pt-4 border-t border-[#d2e8e8]">
                          <p className="text-sm font-semibold text-[#1b3a3a]">
                            Pris: {selectedTemplate.price_per_month} kr/månad eller {selectedTemplate.price_per_month * 12} kr per år
                          </p>
                          <div className="mt-4 pt-4 border-t border-slate-200 text-right">
                            <p className="text-xs text-slate-500 mb-1">Jämförspris vid Engångsservice (utan avtal):</p>
                            <p className="text-lg font-bold text-[#1b3a3a] mb-2">{Math.round(selectedTemplate.price_per_month * 12 * 1.30).toLocaleString('sv-SE')} kr / gång</p>
                            <p className="text-xs text-slate-500 italic">* Inkluderar ej rabatt på reservdelar, arbetskostnader eller resor.</p>
                            <p className="text-xs text-slate-500 italic">* Engångsservice kan ej prioriteras vid hög belastning.</p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }
                
                if (form.machine_name === "Annan") {
                  return (
                    <div className="sm:col-span-2 p-5 bg-[#f0f7f7] rounded-xl border border-[#d2e8e8]">
                      <h4 className="font-bold text-[#1b3a3a] mb-3 flex items-center gap-2">
                        <Wrench className="w-4 h-4 text-[#3a9e9e]" />
                        Maskin som ej finns i listan
                      </h4>
                      <ul className="space-y-2.5 text-sm text-slate-700">
                        <li className="flex gap-2.5 items-start">
                          <CheckCircle2 className="w-4 h-4 text-[#3a9e9e] shrink-0 mt-0.5" />
                          <span>Vi återkommer till dig angående om vi kan serva just din maskin</span>
                        </li>
                      </ul>
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded border ${privacyAccepted ? 'bg-[#3a9e9e] border-[#3a9e9e]' : 'bg-white border-slate-300'} flex items-center justify-center transition-colors group-hover:border-[#3a9e9e]`}>
                 <input
                  type="checkbox"
                  checked={privacyAccepted}
                  onChange={(e) => setPrivacyAccepted(e.target.checked)}
                  className="opacity-0 absolute" 
                />
                {privacyAccepted && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
              </div>
              
              <span className="text-sm text-slate-600 leading-relaxed">
                Jag godkänner att mina uppgifter hanteras säkert enligt Astomeds{" "}
                <button
                  type="button"
                  onClick={onOpenPrivacy}
                  className="text-[#3a9e9e] hover:underline font-semibold">
                  integritetspolicy
                </button>
                .
              </span>
            </label>
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full h-14 text-lg font-medium bg-[#1b3a3a] hover:bg-[#122727] text-white shadow-lg transition-all"
            disabled={!isValid || submitting}>
            {submitting ? "Skickar förfrågan..." : "Skicka intresseanmälan"}
            {!submitting && <Send className="w-5 h-5 ml-2" />}
          </Button>
        </form>

        {/* Footer inside anmalan */}
        <div className="mt-8 text-center">
          <p className="text-slate-500">
            Har du redan ett aktivt serviceavtal?{" "}
            <button onClick={() => base44.auth.redirectToLogin()} className="text-[#3a9e9e] font-semibold hover:underline">
              Logga in i kundportalen här
            </button>
          </p>
        </div>
      </div>
    </section>
  );
}