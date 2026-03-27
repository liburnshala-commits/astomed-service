import { useState, useEffect } from "react";
import { Send, Wrench, ArrowLeft, ExternalLink, AlertCircle, ChevronRight, ChevronLeft, Check, Info, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { machineServiceDetails } from "../components/MachineServiceDetails";
import PrivacyPolicyContent from "../components/PrivacyPolicyContent";
import ChatWidget from "../components/chat/ChatWidget";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";

export default function PublicServiceRequest() {
  const [currentStep, setCurrentStep] = useState(0);
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
    if (e) e.preventDefault();
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
      </div>
    );
  }

  const stepsInfo = [
    {
      id: 0,
      title: "1. Anmälningsplikt & Myndighetskrav",
      content: (
        <div className="flex flex-col h-full justify-center max-w-3xl mx-auto w-full">
          <div className="w-16 h-16 rounded-2xl bg-[#fcf8f2] flex items-center justify-center mb-6 border border-[#3a9e9e]/20 shadow-sm">
            <ShieldCheck className="w-8 h-8 text-[#3a9e9e]" />
          </div>
          <h3 className="text-2xl md:text-3xl font-bold mb-4 text-[#1b3a3a]">Anmälningsplikt & Myndighetskrav from 4 maj 2026</h3>
          <p className="text-[#1b3a3a]/80 mb-6 leading-relaxed text-lg">
            Från och med 4 maj inför Strålsäkerhetsmyndigheten anmälningsplikt för alla laserverksamheter. Med Astomeds serviceavtal är din klinik 'inspektionsredo' från dag ett – vi säkrar din dokumentation så att du kan fokusera på dina kunder.
          </p>
          <div className="bg-white p-6 rounded-xl border border-[#1b3a3a]/10 shadow-sm">
            <p className="text-[#1b3a3a] font-medium italic text-lg">
              "Myndighetskraven skärps: Snart är skriftliga rutiner och teknisk historik ett krav för att få driva klinik. Vi digitaliserar din egenkontroll och ser till att du alltid ligger steget före lagen."
            </p>
          </div>
          <div className="mt-8 pt-6 border-t border-[#3a9e9e]/20">
            <a href="https://www.stralsakerhetsmyndigheten.se/omraden/laser/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-sm font-semibold text-[#002B3C] hover:text-[#3a9e9e] transition-colors">
              Läs mer om regelverket för laser <ExternalLink className="w-4 h-4 ml-1.5" />
            </a>
          </div>
        </div>
      )
    },
    {
      id: 1,
      title: "2. Lokalen & Säkerhetsmiljö",
      content: (
        <div className="flex flex-col h-full justify-center max-w-3xl mx-auto w-full">
          <div className="w-16 h-16 rounded-2xl bg-[#fcf8f2] flex items-center justify-center mb-6 border border-[#3a9e9e]/20 shadow-sm">
            <Info className="w-8 h-8 text-[#3a9e9e]" />
          </div>
          <h3 className="text-2xl md:text-3xl font-bold mb-4 text-[#1b3a3a]">Krav på Lokalen & Säkerhetsmiljö</h3>
          <p className="text-[#1b3a3a]/80 mb-6 leading-relaxed text-lg">
            En säker behandling kräver en säker miljö. Vi hjälper dig att säkerställa att din lokal uppfyller kraven för lasersäkerhet, från korrekta varningsskyltar till fungerande interlock-system och dörrspärrar.
          </p>
          <div className="bg-white p-6 rounded-xl border border-[#1b3a3a]/10 shadow-sm">
            <p className="text-[#1b3a3a] font-medium italic text-lg">
              "Strålsäkerhet handlar om mer än bara maskinen. Vi besiktigar din behandlingsmiljö vid varje servicebesök för att garantera att både personal och kunder vistas i en godkänd och riskfri lokal."
            </p>
          </div>
        </div>
      )
    },
    {
      id: 2,
      title: "3. Regelbunden Service",
      content: (
        <div className="flex flex-col h-full justify-center max-w-3xl mx-auto w-full">
          <div className="w-16 h-16 rounded-2xl bg-[#fcf8f2] flex items-center justify-center mb-6 border border-[#3a9e9e]/20 shadow-sm">
            <Wrench className="w-8 h-8 text-[#3a9e9e]" />
          </div>
          <h3 className="text-2xl md:text-3xl font-bold mb-4 text-[#1b3a3a]">Regelbunden Service & Tekniskt Underhåll</h3>
          <p className="text-[#1b3a3a]/80 mb-6 leading-relaxed text-lg">
            Strålskyddslagen är tydlig: fungerande skyddsfunktioner är ditt ansvar som ägare. Genom årlig service garanterar vi att laserns effekt och säkerhetsspärrar levererar exakt det de lovar.
          </p>
          <div className="bg-white p-6 rounded-xl border border-[#1b3a3a]/10 shadow-sm">
            <p className="text-[#1b3a3a] font-medium italic text-lg">
              "Slumpmässig effekt eller instabil stråle är den största orsaken till brännskador. Vår precisionskalibrering minimerar riskerna och maximerar dina behandlingsresultat – dokumenterat och klart."
            </p>
          </div>
          <div className="mt-8 pt-6 border-t border-[#3a9e9e]/20">
            <a href="https://www.stralsakerhetsmyndigheten.se/publikationer/foreskrifter/ssmfs-2014/ssmfs-20144/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-sm font-semibold text-[#002B3C] hover:text-[#3a9e9e] transition-colors">
              Läs föreskriften SSMFS 2014:4 (kap 3-4) <ExternalLink className="w-4 h-4 ml-1.5" />
            </a>
          </div>
        </div>
      )
    },
    {
      id: 3,
      title: "4. Fackmässig Service & CE",
      content: (
        <div className="flex flex-col h-full justify-center max-w-3xl mx-auto w-full">
          <div className="w-16 h-16 rounded-2xl bg-[#fcf8f2] flex items-center justify-center mb-6 border border-[#3a9e9e]/20 shadow-sm">
            <Check className="w-8 h-8 text-[#3a9e9e]" />
          </div>
          <h3 className="text-2xl md:text-3xl font-bold mb-4 text-[#1b3a3a]">Fackmässig Service & CE-märkning (MDR)</h3>
          <p className="text-[#1b3a3a]/80 mb-6 leading-relaxed text-lg">
            Visste du att din CE-märkning kan upphöra om någon som inte har kunskap öppnar maskinen? Som din servicepartner skyddar vi din investering, din försäkring och din juridiska trygghet.
          </p>
          <div className="bg-white p-6 rounded-xl border border-[#1b3a3a]/10 shadow-sm">
            <p className="text-[#1b3a3a] font-medium italic text-lg">
              "Det finns ingen genväg till säkerhet. Genom att anlita Astomeds erfarna tekniker säkerställer du att endast originaldelar och kalibrerad mätutrustning används – ett krav för att uppfylla kraven på medicintekniska produkter (MDR)."
            </p>
          </div>
        </div>
      )
    },
    {
      id: 4,
      title: "5. Serviceavtal Innehåll",
      content: (
        <div className="flex flex-col h-full overflow-y-auto pr-2 pb-4">
          <h2 className="text-2xl md:text-3xl font-bold mb-4 text-[#1b3a3a]">Astomeds Serviceavtal</h2>
          <p className="font-bold mb-6 text-lg text-[#1b3a3a]/80">Detta ingår när du väljer Astomeds serviceavtal:</p>
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#1b3a3a]/10 mb-6">
            <div className="grid md:grid-cols-2 gap-x-8 gap-y-3 text-sm leading-relaxed text-[#1b3a3a]/80">
              <ul className="space-y-3">
                <li className="flex gap-2"><Check className="w-4 h-4 text-[#3a9e9e] shrink-0 mt-0.5" /> Fri teknisk rådgivning via telefon och fjärrsupport under avtalstiden.</li>
                <li className="flex gap-2"><Check className="w-4 h-4 text-[#3a9e9e] shrink-0 mt-0.5" /> Årlig service på 12 månader.</li>
                <li className="flex gap-2"><Check className="w-4 h-4 text-[#3a9e9e] shrink-0 mt-0.5" /> Prestandakontroll. Mätning av uteffekt och kalibrering för att minimera risk för skador.</li>
                <li className="flex gap-2"><Check className="w-4 h-4 text-[#3a9e9e] shrink-0 mt-0.5" /> Rådgivning kring lokalens lasersäkerhet.</li>
                <li className="flex gap-2"><Check className="w-4 h-4 text-[#3a9e9e] shrink-0 mt-0.5" /> Rabatter och förmåner: Du får 20% rabatt på resekostnader och övriga maskinreparationer.</li>
              </ul>
              <ul className="space-y-3">
                <li className="flex gap-2"><Check className="w-4 h-4 text-[#3a9e9e] shrink-0 mt-0.5" /> Kontroll av luftintagsfilter & Lasereffektmätning.</li>
                <li className="flex gap-2"><Check className="w-4 h-4 text-[#3a9e9e] shrink-0 mt-0.5" /> Rengöring av värmeväxlare & Switchade nätaggregat.</li>
                <li className="flex gap-2"><Check className="w-4 h-4 text-[#3a9e9e] shrink-0 mt-0.5" /> Kontroll av nödstopp och interlock.</li>
                <li className="flex gap-2"><Check className="w-4 h-4 text-[#3a9e9e] shrink-0 mt-0.5" /> Upprättande av serviceprotokoll & Serviceuppmärkning.</li>
                <li className="flex gap-2"><Check className="w-4 h-4 text-[#3a9e9e] shrink-0 mt-0.5" /> Påfyllning av destillerat avjoniserad kylvätska.</li>
              </ul>
            </div>
          </div>
          
          <div className="bg-[#fcf8f2] p-6 rounded-2xl border border-[#3a9e9e]/30">
            <h3 className="font-semibold text-[#1b3a3a] mb-4">Välj din maskin för att se detaljer och pris:</h3>
            <Select value={form.machine_name} onValueChange={(v) => set("machine_name", v)}>
              <SelectTrigger className="bg-white h-12 text-base">
                <SelectValue placeholder="Välj maskintyp" />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(machineServiceDetails).map((machine) =>
                  <SelectItem key={machine} value={machine}>{machine}</SelectItem>
                )}
              </SelectContent>
            </Select>

            {form.machine_name && machineServiceDetails[form.machine_name] && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-5 bg-white rounded-xl shadow-sm border border-[#1b3a3a]/10"
              >
                <h4 className="font-bold text-[#1b3a3a] mb-3">
                  {machineServiceDetails[form.machine_name].title}
                </h4>
                <ul className="space-y-2 text-sm text-[#1b3a3a]/80 mb-4">
                  {machineServiceDetails[form.machine_name].details.map((detail, idx) =>
                    <li key={idx} className="flex gap-2">
                      <span className="text-[#3a9e9e]">•</span>
                      <span dangerouslySetInnerHTML={{ __html: detail }} />
                    </li>
                  )}
                </ul>
                
                {machineServiceDetails[form.machine_name].additionalInfo && (
                  <div className="mt-4 pt-4 border-t border-[#1b3a3a]/10">
                    {(() => {
                      const info = machineServiceDetails[form.machine_name].additionalInfo;
                      const match = info.match(/(\d+)/);
                      const price = match ? parseInt(match[0], 10) : null;
                      
                      return (
                        <>
                          <p className="text-base font-bold text-[#1b3a3a]">
                            {info}
                          </p>
                          {price && (
                            <div className="mt-3 pt-3 border-t border-[#1b3a3a]/5 text-right opacity-90">
                              <p className="text-[11px] text-[#1b3a3a]/60 mb-0.5">Jämförspris vid Engångsservice (utan avtal):</p>
                              <p className="text-sm font-semibold text-[#1b3a3a]/80 mb-1">{Math.round(price * 12 * 1.30).toLocaleString('sv-SE')} kr / gång</p>
                              <p className="text-[10px] text-[#1b3a3a]/50 mt-1 italic">* Inkluderar ej 20% rabatt på reservdelar, arbetskostnader och resor.</p>
                              <p className="text-[10px] text-[#1b3a3a]/50 mt-0.5 italic">* Engångsservice kan ej prioriteras på samma sätt som avtalskunder då vi har över 1200 maskinkunder i Sverige.</p>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </div>
      )
    },
    {
      id: 5,
      title: "6. Skicka Förfrågan",
      content: (
        <div className="flex flex-col h-full overflow-y-auto pr-2 pb-4">
          <h2 className="text-2xl font-bold mb-6 text-[#1b3a3a]">Fyll i dina uppgifter</h2>
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[#1b3a3a]">Företagsnamn *</Label>
                <Input value={form.company_name} onChange={(e) => set("company_name", e.target.value)} placeholder="Ditt företag AB" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[#1b3a3a]">Organisationsnummer</Label>
                <Input value={form.org_number} onChange={(e) => set("org_number", e.target.value)} placeholder="XXXXXX-XXXX" />
                {orgNumberWarning && (
                  <p className="text-amber-600 text-xs font-medium flex items-start gap-1 pt-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>{orgNumberWarning}</span>
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-[#1b3a3a]">Kontaktperson *</Label>
                <Input value={form.contact_person} onChange={(e) => set("contact_person", e.target.value)} placeholder="För- och efternamn" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[#1b3a3a]">Telefon *</Label>
                <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="07XXXXXXXX" />
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <Label className="text-[#1b3a3a]">E-post *</Label>
                <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="din@email.se" />
              </div>
            </div>

            <hr className="border-gray-200" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[#1b3a3a]">Maskintyp *</Label>
                <Select value={form.machine_name} onValueChange={(v) => set("machine_name", v)}>
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

              <div className="space-y-1.5">
                <Label className="text-[#1b3a3a]">Serienummer (frivilligt)</Label>
                <Input value={form.serial_number || ""} onChange={(e) => set("serial_number", e.target.value)} placeholder="Ange serienummer" />
              </div>
              
              {form.machine_name === "Annan" && (
                <div className="sm:col-span-2 space-y-1.5">
                  <Label className="text-[#1b3a3a]">Maskinnamn *</Label>
                  <Input value={form.other_machine_name || ""} onChange={(e) => set("other_machine_name", e.target.value)} placeholder="Ange maskinens namn" />
                </div>
              )}
            </div>

            <div className="p-4 bg-[#fcf8f2] rounded-lg border border-[#3a9e9e]/20 mt-4">
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={privacyAccepted}
                  onChange={(e) => setPrivacyAccepted(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-[#3a9e9e] flex-shrink-0" />
                <span className="text-sm text-[#1b3a3a]">
                  Jag har läst och godkänner{" "}
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); setShowPrivacyDialog(true); }}
                    className="text-[#3a9e9e] hover:underline font-bold">
                    integritetspolicyn
                  </button>
                  .
                </span>
              </label>
            </div>
          </div>
        </div>
      )
    }
  ];

  const handleNext = () => {
    if (currentStep < stepsInfo.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  return (
    <div className="min-h-screen py-6 md:py-10 px-4 flex flex-col" style={{ background: "#002B3C" }}>
      <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col">
        
        <div className="flex justify-between items-center mb-6 md:mb-8">
          <a href="https://astomed.se/service/" className="inline-flex items-center text-sm text-slate-300 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" /> Tillbaka till astomed.se
          </a>
          
          <div className="flex space-x-1.5">
            {stepsInfo.map((step, idx) => (
              <div 
                key={idx} 
                className={`h-2 rounded-full transition-all duration-300 ${idx === currentStep ? 'w-8 bg-[#3a9e9e]' : idx < currentStep ? 'w-4 bg-[#3a9e9e]/60' : 'w-4 bg-white/20'}`}
              />
            ))}
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-6 md:mb-8 shrink-0">
          <div className="w-16 h-16 rounded-xl overflow-hidden mx-auto mb-4 shadow-lg border-2 border-white/10" style={{ background: "#1b3a3a" }}>
            <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69a9446fcb1cd4ab529479ba/bc2852de1_channels4_profile-2.jpg" alt="Astomed" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-2xl md:text-4xl font-bold text-white mb-3">Astomed Serviceavtal</h1>
          <p className="text-sm md:text-lg text-slate-300 max-w-2xl mx-auto">
            {currentStep < 4 ? "Lär dig varför ett serviceavtal är din bästa investering för att följa lagen och säkerställa trygga behandlingar." : "Fyll i formuläret nedan så kontaktar vi dig för kostnadsfri konsultation."}
          </p>
        </div>

        {/* Wizard Container */}
        <div className="bg-[#f8fafc] rounded-3xl shadow-2xl overflow-hidden flex flex-col flex-1 relative min-h-[500px]">
          
          <div className="absolute top-0 left-0 w-full h-1 bg-slate-200">
            <motion.div 
              className="h-full bg-[#3a9e9e]"
              initial={{ width: 0 }}
              animate={{ width: `${((currentStep + 1) / stepsInfo.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          <div className="flex-1 p-6 md:p-12 relative overflow-hidden flex flex-col">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="flex-1 h-full flex flex-col"
              >
                {stepsInfo[currentStep].content}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer Controls */}
          <div className="p-4 md:p-6 border-t border-slate-200 bg-white flex items-center justify-between shrink-0">
            <Button 
              variant="ghost" 
              onClick={handlePrev} 
              disabled={currentStep === 0}
              className={`text-[#1b3a3a] ${currentStep === 0 ? 'invisible' : 'visible'}`}
            >
              <ChevronLeft className="w-4 h-4 mr-1 md:mr-2" /> <span className="hidden md:inline">Föregående</span>
            </Button>
            
            <div className="flex gap-2 md:gap-4 items-center">
              {currentStep < stepsInfo.length - 1 && (
                <Button 
                  variant="ghost" 
                  onClick={() => setCurrentStep(stepsInfo.length - 1)}
                  className="text-slate-500 hover:text-[#1b3a3a] text-sm md:text-base hidden sm:flex"
                >
                  Hoppa till formuläret
                </Button>
              )}

              {currentStep < stepsInfo.length - 1 ? (
                <Button 
                  onClick={handleNext}
                  className="bg-[#3a9e9e] hover:bg-[#2e7d7d] text-white px-6 md:px-8 h-10 md:h-12 text-sm md:text-base rounded-xl transition-all"
                >
                  Nästa <ChevronRight className="w-4 h-4 ml-1 md:ml-2" />
                </Button>
              ) : (
                <Button 
                  onClick={handleSubmit}
                  disabled={!isValid || submitting}
                  className="bg-[#1b3a3a] hover:bg-[#112626] text-white px-6 md:px-8 h-10 md:h-12 text-sm md:text-base rounded-xl shadow-lg transition-all"
                >
                  {submitting ? "Skickar..." : "Skicka förfrågan"} <Send className="w-4 h-4 ml-2 hidden md:inline" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Login link bottom */}
        <div className="text-center mt-6 p-4 bg-white/5 rounded-xl border border-white/10">
          <p className="text-sm text-slate-300">
            Har du redan ett konto hos Astomed Service?{" "}
            <a href="/login" className="text-[#3a9e9e] hover:text-white transition-colors font-medium underline">
              Logga in här
            </a>
          </p>
        </div>
      </div>

      {/* Privacy Policy Dialog */}
      <Dialog open={showPrivacyDialog} onOpenChange={setShowPrivacyDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0">
          <PrivacyPolicyContent />
          <div className="p-6 border-t border-slate-100 flex-shrink-0">
            <Button
              className="w-full bg-[#1b3a3a] hover:bg-[#112626] text-white"
              onClick={() => setShowPrivacyDialog(false)}>
              Stäng
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <ChatWidget />
    </div>
  );
}