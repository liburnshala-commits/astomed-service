import { useState, useEffect } from "react";
import { Send, Wrench, ArrowLeft, ExternalLink, AlertCircle, LogIn, CheckCircle2, Shield, Settings, Info, CalendarClock, BookOpen, AlertTriangle, ChevronDown, Monitor, Box, Menu, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import PrivacyPolicyContent from "../components/PrivacyPolicyContent";
import ChatWidget from "../components/chat/ChatWidget";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useNavigate } from "react-router-dom";
import PublicHeroSection from "@/components/public/PublicHeroSection";
import SsmRegulationsSection from "@/components/public/SsmRegulationsSection";
import TillstandSection from "@/components/public/TillstandSection";
import PublicServicesSection from "@/components/public/PublicServicesSection";
import SsmRequirementsSection from "@/components/public/SsmRequirementsSection";
import PublicPortalSection from "@/components/public/PublicPortalSection";

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [templates, setTemplates] = useState([]);

  const set = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const data = await base44.entities.ServiceAgreementTemplate.list();
        setTemplates(data);
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
      <div className="min-h-screen flex flex-col bg-slate-50">
        <header className="bg-[#1b3a3a] text-white py-4 px-6 md:px-12 flex justify-between items-center shadow-md">
          <button 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} 
            className="flex items-center gap-3 hover:opacity-90 transition-opacity"
          >
            <div className="w-10 h-10 bg-white rounded-md flex items-center justify-center overflow-hidden">
               <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69a9446fcb1cd4ab529479ba/bc2852de1_channels4_profile-2.jpg" alt="Astomed" className="w-full h-full object-cover" />
            </div>
            <span className="font-bold text-xl tracking-wider">ASTOMED</span>
          </button>
        </header>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-10 text-center border-t-4 border-[#3a9e9e]">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 bg-[#e8f2f2]">
              <CheckCircle2 className="w-8 h-8 text-[#3a9e9e]" />
            </div>
            <h2 className="text-2xl font-bold mb-3 text-[#1b3a3a]">Förfrågan skickad!</h2>
            <p className="text-gray-500 mb-6">Tack! Vi har tagit emot din serviceförfrågan och återkommer till dig så snart som möjligt för att lägga upp en smidig plan för din klinik.</p>
            <Button onClick={() => setSuccess(false)} variant="outline" className="w-full">Gå tillbaka</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      {/* Navbar */}
      <header className="bg-[#1b3a3a] text-white py-4 px-6 md:px-12 flex justify-between items-center sticky top-0 z-50 shadow-md">
        <button 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} 
          className="flex items-center gap-3 hover:opacity-90 transition-opacity"
        >
          <div className="w-10 h-10 bg-white rounded-md flex items-center justify-center overflow-hidden">
             <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69a9446fcb1cd4ab529479ba/bc2852de1_channels4_profile-2.jpg" alt="Astomed" className="w-full h-full object-cover" />
          </div>
          <span className="font-bold text-xl tracking-wider">ASTOMED</span>
        </button>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium">
           <a href="#om-oss" className="hover:text-[#3a9e9e] transition-colors">Om oss</a>
           <a href="#tjanster" className="hover:text-[#3a9e9e] transition-colors">Våra tjänster</a>
           <a href="#ssm-lagen" className="hover:text-[#3a9e9e] transition-colors">Nya SSM-lagen</a>
           <a href="#anmalan" className="hover:text-[#3a9e9e] transition-colors">Serviceavtal</a>
           <button onClick={() => navigate('/Calculator')} className="text-[#3a9e9e] font-bold hover:text-white transition-colors">Klinikkalkylator</button>
           <a href="https://www.stralsakerhetsmyndigheten.se/omraden/kroppsbehandlingar/anmalan-av-estetisk-verksamhet/" target="_blank" rel="noopener noreferrer" className="text-[#3a9e9e] font-bold hover:text-white transition-colors">Anmäl din klinik</a>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => base44.auth.redirectToLogin()} variant="outline" className="text-[#1b3a3a] bg-white hover:bg-slate-100 border-0 hidden sm:flex">
            <LogIn className="w-4 h-4 mr-2" /> Kundportal
          </Button>
          <button 
            className="md:hidden text-white hover:text-white/80 p-1" 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
          </button>
        </div>
      </header>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-[#1b3a3a] pt-[88px] px-6 flex flex-col gap-6 text-white text-lg overflow-y-auto pb-10">
           <a href="#om-oss" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-[#3a9e9e] transition-colors border-b border-white/10 pb-3">Om oss</a>
           <a href="#tjanster" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-[#3a9e9e] transition-colors border-b border-white/10 pb-3">Våra tjänster</a>
           <a href="#ssm-lagen" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-[#3a9e9e] transition-colors border-b border-white/10 pb-3">Nya SSM-lagen</a>
           <a href="#anmalan" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-[#3a9e9e] transition-colors border-b border-white/10 pb-3">Serviceavtal</a>
           <button onClick={() => { setIsMobileMenuOpen(false); navigate('/Calculator'); }} className="text-[#3a9e9e] font-bold text-left hover:text-white transition-colors border-b border-white/10 pb-3">Klinikkalkylator</button>
           <a href="https://www.stralsakerhetsmyndigheten.se/omraden/kroppsbehandlingar/anmalan-av-estetisk-verksamhet/" target="_blank" rel="noopener noreferrer" className="text-[#3a9e9e] font-bold hover:text-white transition-colors pb-3">Anmäl din klinik</a>
           <Button onClick={() => base44.auth.redirectToLogin()} variant="outline" className="text-[#1b3a3a] bg-white hover:bg-slate-100 border-0 mt-4 sm:hidden w-full max-w-sm mx-auto h-12 text-base">
             <LogIn className="w-5 h-5 mr-2" /> Kundportal
           </Button>
        </div>
      )}

      {/* Hero Section */}
      <PublicHeroSection />
      {/* Nya föreskrifter från Strålsäkerhetsmyndigheten */}
      <SsmRegulationsSection />

      {/* Tillståndsansökan Section */}
      <TillstandSection />

      {/* Våra tjänster / Serviceavtal */}
      <PublicServicesSection />

      {/* Vad kommer att krävas i anmälan */}
      <SsmRequirementsSection />

      {/* Kundportalen Section */}
      <PublicPortalSection />

      {/* Form Section */}
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
                  <Select value={form.machine_name} onValueChange={(v) => set("machine_name", v)} required>
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
                    onClick={() => setShowPrivacyDialog(true)}
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

      {/* Om oss Section */}
      <section id="om-oss" className="py-20 px-6 md:px-12 max-w-7xl mx-auto bg-white">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-sm font-bold tracking-widest uppercase text-[#3a9e9e] mb-3">Om Astomed</h2>
            <h3 className="text-3xl md:text-4xl font-bold text-[#1b3a3a] mb-6">Nordens ledande leverantör sedan 2005</h3>
            <p className="text-lg text-slate-600 mb-6 leading-relaxed">
              Vi på Astomed har funnits på marknaden sedan 2005 och var på den tiden ganska ensamma om att erbjuda utrustning till hälso- och skönhetsbranschen. Idag är vi ledande leverantör i Norden och erbjuder professionell estetisk och medicinteknisk utrustning.
            </p>
            <p className="text-lg text-slate-600 mb-8 leading-relaxed">
              Astomed säkerställer alltid att maskinerna vi arbetar med är säkra, effektiva och att det finns forskning som stödjer maskinernas funktion. Vi har kontor i Sverige, Finland och Norge, och i huset har vi en serviceverkstad med tekniker på heltid.
            </p>
            <ul className="space-y-4 mb-8">
              <li className="flex items-center gap-3 text-slate-700 font-medium">
                <CheckCircle2 className="w-5 h-5 text-[#3a9e9e]" /> Över 15 års erfarenhet i branschen
              </li>
              <li className="flex items-center gap-3 text-slate-700 font-medium">
                <CheckCircle2 className="w-5 h-5 text-[#3a9e9e]" /> Egen serviceverkstad med tekniker
              </li>
              <li className="flex items-center gap-3 text-slate-700 font-medium">
                <CheckCircle2 className="w-5 h-5 text-[#3a9e9e]" /> Komplett utbud för kliniker
              </li>
            </ul>
          </div>
          <div className="relative">
            <a href="https://klinikutrustning.se/utrustning/aldix-smart-diodlaser" target="_blank" rel="noopener noreferrer" className="relative z-10 block hover:opacity-95 transition-opacity">
              <img src="https://wp.klinikutrustning.se/wp-content/uploads/2025/12/maskiner-astomed.jpg" alt="Astomed Klinikutrustning" className="rounded-2xl shadow-2xl w-full" />
            </a>
            <div className="absolute -inset-4 bg-gradient-to-tr from-[#e8f2f2] to-transparent rounded-3xl -z-10 transform translate-x-4 translate-y-4"></div>
          </div>
        </div>
      </section>

      {/* Main Footer */}
      <footer className="bg-[#112424] text-slate-400 py-12 px-6 md:px-12 text-sm text-center">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-white/10 rounded-md flex items-center justify-center overflow-hidden">
                 <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69a9446fcb1cd4ab529479ba/bc2852de1_channels4_profile-2.jpg" alt="Astomed" className="w-full h-full object-cover opacity-80 grayscale" />
             </div>
             <span className="font-bold text-lg tracking-widest text-slate-300">ASTOMED</span>
          </div>
          <p>© {new Date().getFullYear()} Astomed AB. Alla rättigheter förbehållna.</p>
          <div className="flex gap-6 justify-center">
             <a href="https://astomed.se" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">astomed.se</a>
             <a href="https://klinikutrustning.se" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">klinikutrustning.se</a>
             <a href="https://astomedshop.se" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">astomedshop.se</a>
          </div>
        </div>
      </footer>

      {/* Privacy Policy Dialog */}
      <Dialog open={showPrivacyDialog} onOpenChange={setShowPrivacyDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0">
          <PrivacyPolicyContent />
          <div className="p-6 border-t border-slate-100 flex-shrink-0">
            <Button
              className="w-full bg-[#1b3a3a] hover:bg-[#122727] text-white"
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