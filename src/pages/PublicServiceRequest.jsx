import { useState } from "react";
import { Send, Wrench, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { machineServiceDetails } from "../components/MachineServiceDetails";
import PrivacyPolicyContent from "../components/PrivacyPolicyContent";
import ChatWidget from "../components/chat/ChatWidget";

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
    serial_number: "",
    notes: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [showPrivacyDialog, setShowPrivacyDialog] = useState(false);

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const finalMachineName = form.machine_name === "Annan" && form.other_machine_name 
        ? `Annan (${form.other_machine_name})` 
        : form.machine_name;

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
      setSuccess(true);
    } catch (error) {
      console.error("Submission error:", error);
      alert(`Ett fel uppstod: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const isValid = form.company_name && form.contact_person && form.email && form.phone && form.machine_name && privacyAccepted && (form.machine_name !== "Annan" || form.other_machine_name);

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "#002B3C" }}>
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
    <div className="min-h-screen py-10 px-4" style={{ background: "#002B3C" }}>
      <div className="max-w-2xl mx-auto">
        
        <a href="https://astomed.se/service/" className="inline-flex items-center text-sm mb-8 text-slate-300 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" /> Tillbaka till astomed.se/service
        </a>

        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 rounded-xl overflow-hidden mx-auto mb-6 shadow-lg border-2 border-white/10" style={{ background: "#1b3a3a" }}>
            <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69a9446fcb1cd4ab529479ba/bc2852de1_channels4_profile-2.jpg" alt="Astomed" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-3xl font-bold mb-4" style={{ color: "#ffffff" }}>Astomed Serviceavtal - kostnadsfri konsultation</h1>
          <p className="text-lg text-slate-200 mb-8">Fyll i formuläret nedan så kontaktar vi dig för kostnadsfri konsultation av serviceavtal för din/dina maskiner.</p>
        </div>

        <div className="mb-10 space-y-6">
          <div className="p-8 md:p-12 rounded-2xl" style={{ background: "#fcf8f2", color: "#1b3a3a" }}>
            <h2 className="text-3xl font-light mb-4">Nya regler stärker säkerheten vid estetiska behandlingar</h2>
            <div className="space-y-6 text-[15px] leading-relaxed">
              <p>
                <strong>4 Maj 2026</strong> kommer nya föreskrifter från Strålsäkerhetsmyndigheten träda i kraft för att stärka skyddet vid behandlingar med icke-joniserande strålning.
              </p>
              
              <div>
                <h3 className="font-bold text-lg mb-2">Obligatorisk anmälningsplikt</h3>
                <p>
                  Senast den 4 Juli 2026 måste alla verksamheter som erbjuder estetiska behandlingar med strålning anmäla sin verksamhet till Strålsäkerhetsmyndigheten. Anmälan ska innehålla information om vilken teknisk utrustning som används i verksamheten. Syftet är att myndigheten ska få bättre översyn och kunna bedriva effektiv tillsyn.
                </p>
              </div>
            </div>
          </div>

          <div className="p-8 md:p-12 rounded-2xl" style={{ background: "#fcf8f2", color: "#1b3a3a" }}>
            <h2 className="text-4xl font-light mb-4">Serviceavtal</h2>
            <p className="font-bold mb-8 text-lg">Vad ingår när du väljer oss?</p>
            
            <div className="relative flex py-5 items-center mb-8">
                <div className="flex-grow border-t border-black/20"></div>
                <span className="flex-shrink-0 mx-4 text-black/40">//</span>
                <div className="flex-grow border-t border-black/20"></div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-x-12 gap-y-4 text-base leading-relaxed">
              <ul className="space-y-3 list-disc pl-5 marker:text-black">
                <li>Fri teknisk rådgivning via telefon och fjärrsupport under avtalstiden.</li>
                <li>Årlig service på 12 månader.</li>
                <li>Prestandakontroll. Mätning av uteffekt och kalibrering för att minimera risk för skador.</li>
                <li>Rådgivning kring lokalens lasersäkerhet.</li>
                <li>Rabatter och förmåner: Du får 20% rabatt på resekostnader och övriga maskinreparationer.</li>
                <li>Byte av pneumatisk avjoniseringsfilter A och B.</li>
                <li>Byte av snabbkopplingar till filter.</li>
                <li>Läckagekontroll.</li>
              </ul>
              <ul className="space-y-3 list-disc pl-5 marker:text-black">
                <li>Kontroll av luftintagsfilter.</li>
                <li>Lasereffektmätning.</li>
                <li>Rengöring av värmeväxlare.</li>
                <li>Rengörning av Switchade nätaggregat.</li>
                <li>Kontroll av nödstopp och interlock.</li>
                <li>Upprättande av serviceprotokoll.</li>
                <li>Serviceuppmärkning av utrustning.</li>
                <li>Kontroll av säkerhetsrem.</li>
                <li>Påfyllning av destillerat avjoniserad kylvätska.</li>
                <li>Spolning av pneumatisk krets.</li>
              </ul>
            </div>
            

          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-8 space-y-6">
          {/* Kunduppgifter */}
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide mb-4" style={{ color: "#254f4f" }}>Dina uppgifter</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Företagsnamn *</Label>
                <Input value={form.company_name} onChange={e => set("company_name", e.target.value)} placeholder="Ditt företag AB" required />
              </div>
              <div className="space-y-1">
                <Label>Organisationsnummer</Label>
                <Input value={form.org_number} onChange={e => set("org_number", e.target.value)} placeholder="XXXXXX-XXXX" />
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
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Maskinuppgifter */}
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide mb-4" style={{ color: "#254f4f" }}>Maskinuppgifter</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
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

              <div className="space-y-1">
                <Label>Serienummer (kan skickas in senare)</Label>
                <Input value={form.serial_number || ""} onChange={e => set("serial_number", e.target.value)} placeholder="Ange serienummer" />
              </div>
              
              {form.machine_name === "Annan" && (
                <div className="sm:col-span-2 space-y-1">
                  <Label>Maskinnamn *</Label>
                  <Input value={form.other_machine_name || ""} onChange={e => set("other_machine_name", e.target.value)} placeholder="Ange maskinens namn" required />
                </div>
              )}

              {form.machine_name && machineServiceDetails[form.machine_name] && (
                <div className="sm:col-span-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-blue-900 mb-2">
                    {machineServiceDetails[form.machine_name].title}
                  </h3>
                  <ul className="space-y-2 text-sm text-blue-800">
                    {machineServiceDetails[form.machine_name].details.map((detail, idx) => (
                     <li key={idx} className="flex gap-2">
                       <span className="text-blue-600">•</span>
                       <span dangerouslySetInnerHTML={{ __html: detail }} />
                     </li>
                    ))}
                  </ul>
                  {machineServiceDetails[form.machine_name].additionalInfo && (
                    <div className="mt-3 pt-3 border-t border-blue-300">
                      <p className="text-sm font-semibold text-blue-900">
                        {machineServiceDetails[form.machine_name].additionalInfo}
                      </p>
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={privacyAccepted}
                onChange={e => setPrivacyAccepted(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-teal-700 flex-shrink-0"
              />
              <span className="text-sm text-gray-700">
                Jag har läst och godkänner{" "}
                <button
                  type="button"
                  onClick={() => setShowPrivacyDialog(true)}
                  className="text-blue-600 hover:underline font-medium"
                >
                  integritetspolicyn
                </button>
                .
              </span>
            </label>
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

        {/* Login link bottom */}
        <div className="text-center mt-6 p-4 bg-white rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600">
            Har du redan ett konto hos Astomed Service och vill beställa service,{" "}
            <a href="/login" className="text-blue-600 hover:underline font-medium">
              klicka på denna länk för att logga in på ditt konto
            </a>. (För att få ett konto måste du ha ett aktivt serviceavtal hos oss.)
          </p>
        </div>
      </div>

      {/* Privacy Policy Dialog */}
      <Dialog open={showPrivacyDialog} onOpenChange={setShowPrivacyDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0">
          <PrivacyPolicyContent />
          <div className="p-6 border-t border-slate-100 flex-shrink-0">
            <Button
              className="w-full astomed-btn-primary"
              onClick={() => setShowPrivacyDialog(false)}
            >
              Stäng
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <ChatWidget />
    </div>
  );
}