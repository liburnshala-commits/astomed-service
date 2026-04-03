import { useState, useEffect } from "react";
import { Send, Wrench, ArrowLeft, ExternalLink, AlertCircle, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { machineServiceDetails } from "../components/MachineServiceDetails";
import PrivacyPolicyContent from "../components/PrivacyPolicyContent";
import ChatWidget from "../components/chat/ChatWidget";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useNavigate } from "react-router-dom";

export default function PublicServiceRequest() {
  const { isAuthenticated, user, isLoadingAuth } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoadingAuth && isAuthenticated && user) {
      if (user.role === 'customer') {
        navigate('/CustomerDashboard');
      } else {
        navigate('/Dashboard');
      }
    }
  }, [isAuthenticated, user, isLoadingAuth, navigate]);

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
  const [orgNumberWarning, setOrgNumberWarning] = useState("");

  const set = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

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
      </div>);

  }

  return (
    <div className="min-h-screen py-10 px-4" style={{ background: "#002B3C" }}>
      <div className="max-w-2xl mx-auto">
        
        <div className="flex justify-between items-start mb-8">
          <a href="https://astomed.se/service/" className="inline-flex items-center text-sm text-slate-300 hover:text-white transition-colors mt-2">
            <ArrowLeft className="w-4 h-4 mr-2" /> Tillbaka till astomed.se/service
          </a>
          
          <Button 
            onClick={() => base44.auth.redirectToLogin()} 
            className="bg-[#3a9e9e] hover:bg-[#2c7a7a] text-white border-0 shadow-md"
          >
            <LogIn className="w-4 h-4 mr-2" /> Logga in
          </Button>
        </div>

        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 rounded-xl overflow-hidden mx-auto mb-6 shadow-lg border-2 border-white/10" style={{ background: "#1b3a3a" }}>
            <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69a9446fcb1cd4ab529479ba/bc2852de1_channels4_profile-2.jpg" alt="Astomed" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-3xl font-bold mb-4" style={{ color: "#ffffff" }}>Astomed Serviceavtal - kostnadsfri konsultation</h1>
          <p className="text-lg text-slate-200 mb-8">Fyll i formuläret nedan så kontaktar vi dig för kostnadsfri konsultation av serviceavtal för din/dina maskiner.</p>
        </div>

        <div className="mb-10 space-y-8">
          {/* Info Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            
            {/* Card 1 */}
            <div className="p-8 rounded-2xl bg-[#fcf8f2] border-l-4 border-[#3a9e9e] shadow-sm hover:shadow-md transition-shadow flex flex-col">
              <h3 className="text-xl font-bold mb-3 text-[#1b3a3a]">1. Anmälningsplikt & Myndighetskrav from 4 maj 2026.</h3>
              <p className="text-[#1b3a3a]/80 mb-4 leading-relaxed">Från och med 4 maj inför Strålsäkerhetsmyndigheten anmälningsplikt för alla laserverksamheter. Med Astomeds serviceavtal är din klinik 'inspektionsredo' från dag ett – vi säkrar din dokumentation så att du kan fokusera på dina kunder.

              </p>
              <p className="text-[#1b3a3a]/80 font-medium italic flex-grow">
                "Myndighetskraven skärps: Snart är skriftliga rutiner och teknisk historik ett krav för att få driva klinik. Vi digitaliserar din egenkontroll och ser till att du alltid ligger steget före lagen."
              </p>
              <div className="mt-6 pt-4 border-t border-[#3a9e9e]/20">
                <a href="https://www.stralsakerhetsmyndigheten.se/omraden/laser/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-sm font-semibold text-[#002B3C] hover:text-[#002B3C]/80 transition-colors">
                  Läs mer om regelverket för laser <ExternalLink className="w-4 h-4 ml-1.5" />
                </a>
              </div>
            </div>

            {/* Card 2 */}
            <div className="p-8 rounded-2xl bg-[#fcf8f2] border-l-4 border-[#3a9e9e] shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-xl font-bold mb-3 text-[#1b3a3a]">2. Krav på Lokalen & Säkerhetsmiljö</h3>
              <p className="text-[#1b3a3a]/80 mb-4 leading-relaxed">
                En säker behandling kräver en säker miljö. Vi hjälper dig att säkerställa att din lokal uppfyller kraven för lasersäkerhet, från korrekta varningsskyltar till fungerande interlock-system och dörrspärrar.
              </p>
              <p className="text-[#1b3a3a]/80 font-medium italic">
                "Strålsäkerhet handlar om mer än bara maskinen. Vi besiktigar din behandlingsmiljö vid varje servicebesök för att garantera att både personal och kunder vistas i en godkänd och riskfri lokal."
              </p>
            </div>

            {/* Card 3 */}
            <div className="p-8 rounded-2xl bg-[#fcf8f2] border-l-4 border-[#3a9e9e] shadow-sm hover:shadow-md transition-shadow flex flex-col">
              <h3 className="text-xl font-bold mb-3 text-[#1b3a3a]">3. Regelbunden Service & Tekniskt Underhåll</h3>
              <p className="text-[#1b3a3a]/80 mb-4 leading-relaxed">Strålskyddslagen är tydlig: fungerande skyddsfunktioner är ditt ansvar som ägare. Genom årlig service garanterar vi att laserns effekt och säkerhetsspärrar levererar exakt det de lovar.

              </p>
              <p className="text-[#1b3a3a]/80 font-medium italic flex-grow">
                "Slumpmässig effekt eller instabil stråle är den största orsaken till brännskador. Vår precisionskalibrering minimerar riskerna och maximerar dina behandlingsresultat – dokumenterat och klart."
              </p>
              <div className="mt-6 pt-4 border-t border-[#3a9e9e]/20">
                <a href="https://www.stralsakerhetsmyndigheten.se/publikationer/foreskrifter/ssmfs-2014/ssmfs-20144/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-sm font-semibold text-[#002B3C] hover:text-[#002B3C]/80 transition-colors">
                  Läs föreskriften SSMFS 2014:4 (kap 3-4) <ExternalLink className="w-4 h-4 ml-1.5" />
                </a>
              </div>
            </div>

            {/* Card 4 */}
            <div className="p-8 rounded-2xl bg-[#fcf8f2] border-l-4 border-[#3a9e9e] shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-xl font-bold mb-3 text-[#1b3a3a]">4.  Fackmässig Service & CE-märkning (MDR) </h3>
              <p className="text-[#1b3a3a]/80 mb-4 leading-relaxed">Visste du att din CE-märkning kan upphöra om någon som inte har kunskap öppnar maskinen? Som din servicepartner skyddar vi din investering, din försäkring och din juridiska trygghet.

              </p>
              <p className="text-[#1b3a3a]/80 font-medium italic">"Det finns ingen genväg till säkerhet. Genom att anlita Astomeds erfarna tekniker säkerställer du att endast originaldelar och kalibrerad mätutrustning används – ett krav för att uppfylla kraven på medicintekniska produkter (MDR)."

              </p>
            </div>
          </div>

          {/* Included Services List */}
          <div className="p-8 md:p-12 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 text-white">
            <h2 className="text-3xl font-light mb-2">Serviceavtal</h2>
            <p className="font-bold mb-8 text-lg text-slate-300">Detta ingår när du väljer Astomeds serviceavtal:</p>
            
            <div className="grid md:grid-cols-2 gap-x-12 gap-y-4 text-base leading-relaxed text-slate-200">
              <ul className="space-y-3 list-disc pl-5 marker:text-[#3a9e9e]">
                <li>Fri teknisk rådgivning via telefon och fjärrsupport under avtalstiden.</li>
                <li>Årlig service på 12 månader.</li>
                <li>Prestandakontroll. Mätning av uteffekt och kalibrering för att minimera risk för skador.</li>
                <li>Rådgivning kring lokalens lasersäkerhet.</li>
                <li>Rabatter och förmåner: Du får 20% rabatt på resekostnader och övriga maskinreparationer.</li>
                <li>Byte av pneumatisk avjoniseringsfilter A och B.</li>
                <li>Byte av snabbkopplingar till filter.</li>
                <li>Läckagekontroll.</li>
              </ul>
              <ul className="space-y-3 list-disc pl-5 marker:text-[#3a9e9e]">
                <li>Kontroll av luftintagsfilter.</li>
                <li>Lasereffektmätning.</li>
                <li>Rengöring av värmeväxlare.</li>
                <li>Rengörning av Switchade nätaggregat.</li>
                <li>Kontroll av nödstopp och interlock.</li>
                <li>Upprättande av serviceprotokoll i webportal.</li>
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
                <Input value={form.company_name} onChange={(e) => set("company_name", e.target.value)} placeholder="Ditt företag AB" required />
              </div>
              <div className="space-y-1">
                <Label>Organisationsnummer</Label>
                <Input value={form.org_number} onChange={(e) => set("org_number", e.target.value)} placeholder="XXXXXX-XXXX" />
                {orgNumberWarning && (
                  <p className="text-amber-600 text-xs font-medium flex items-start gap-1 pt-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>{orgNumberWarning}</span>
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <Label>Kontaktperson *</Label>
                <Input value={form.contact_person} onChange={(e) => set("contact_person", e.target.value)} placeholder="För- och efternamn" required />
              </div>
              <div className="space-y-1">
                <Label>Telefon *</Label>
                <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="07XXXXXXXX" required />
              </div>
              <div className="sm:col-span-2 space-y-1">
                <Label>E-post *</Label>
                <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="din@email.se" required />
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
                <Select value={form.machine_name} onValueChange={(v) => set("machine_name", v)} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Välj maskintyp" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(machineServiceDetails).map((machine) =>
                      <SelectItem key={machine} value={machine}>{machine}</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label>Serienummer (kan skickas in senare)</Label>
                <Input value={form.serial_number || ""} onChange={(e) => set("serial_number", e.target.value)} placeholder="Ange serienummer" />
              </div>
              
              {form.machine_name === "Annan" &&
              <div className="sm:col-span-2 space-y-1">
                  <Label>Maskinnamn *</Label>
                  <Input value={form.other_machine_name || ""} onChange={(e) => set("other_machine_name", e.target.value)} placeholder="Ange maskinens namn" required />
                </div>
              }

              {form.machine_name && machineServiceDetails[form.machine_name] &&
              <div className="sm:col-span-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-blue-900 mb-2">
                    {machineServiceDetails[form.machine_name].title}
                  </h3>
                  <ul className="space-y-2 text-sm text-blue-800">
                    {machineServiceDetails[form.machine_name].details.map((detail, idx) =>
                  <li key={idx} className="flex gap-2">
                       <span className="text-blue-600">•</span>
                       <span dangerouslySetInnerHTML={{ __html: detail }} />
                     </li>
                  )}
                  </ul>
                  {machineServiceDetails[form.machine_name].additionalInfo &&
                <div className="mt-3 pt-3 border-t border-blue-300">
                      {(() => {
                        const info = machineServiceDetails[form.machine_name].additionalInfo;
                        const match = info.match(/(\d+)/);
                        const price = match ? parseInt(match[0], 10) : null;
                        
                        return (
                          <>
                            <p className="text-sm font-semibold text-blue-900">
                              {info}
                            </p>
                            {price && (
                              <div className="mt-3 pt-3 border-t border-blue-200/60 text-right opacity-90">
                                <p className="text-[11px] text-blue-800/80 mb-0.5">Jämförspris vid Engångsservice (utan avtal):</p>
                                <p className="text-sm font-medium text-blue-800/90 mb-1">{Math.round(price * 12 * 1.30).toLocaleString('sv-SE')} kr / gång</p>
                                <p className="text-[10px] text-blue-700/80 mt-1 italic">* Inkluderar ej 20% rabatt på reservdelar, arbetskostnader och resor.</p>
                                <p className="text-[10px] text-blue-700/80 mt-0.5 italic">* Engångsservice kan ej prioriteras på samma sätt som avtalskunder då vi har över 1200 maskinkunder i Sverige.</p>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                }
                </div>
              }

            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={privacyAccepted}
                onChange={(e) => setPrivacyAccepted(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-teal-700 flex-shrink-0" />
              
              <span className="text-sm text-gray-700">
                Jag har läst och godkänner{" "}
                <button
                  type="button"
                  onClick={() => setShowPrivacyDialog(true)}
                  className="text-blue-600 hover:underline font-medium">
                  
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
            disabled={!isValid || submitting}>
            
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
              onClick={() => setShowPrivacyDialog(false)}>
              
              Stäng
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <ChatWidget />
    </div>);

}