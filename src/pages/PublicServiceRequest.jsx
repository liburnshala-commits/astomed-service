import { useState, useEffect } from "react";
import { Send, Wrench, ArrowLeft, ExternalLink, AlertCircle, LogIn, CheckCircle2, Shield, Settings, Info, CalendarClock, BookOpen, AlertTriangle, ChevronDown, Monitor, Box } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
           <a href="https://www.stralsakerhetsmyndigheten.se/omraden/kroppsbehandlingar/anmalan-av-estetisk-verksamhet/" target="_blank" rel="noopener noreferrer" className="text-[#3a9e9e] font-bold hover:text-white transition-colors">Anmäl din klinik</a>
        </div>
        <Button onClick={() => base44.auth.redirectToLogin()} variant="outline" className="text-[#1b3a3a] bg-white hover:bg-slate-100 border-0 hidden sm:flex">
          <LogIn className="w-4 h-4 mr-2" /> Kundportal
        </Button>
      </header>

      {/* Hero Section */}
      <section className="relative bg-[#002B3C] text-white py-24 px-6 md:px-12 overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[url('https://wp.klinikutrustning.se/wp-content/uploads/2024/04/full-image-desktop-1024x465.jpg')] bg-cover bg-center"></div>
        <div className="absolute inset-0 bg-[#002B3C]/60 md:bg-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#002B3C] 60% to-transparent hidden md:block"></div>
        <div className="relative max-w-7xl mx-auto z-10 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <Badge className="bg-[#3a9e9e] hover:bg-[#2c7a7a] text-white mb-6 border-0">Service & Trygghet</Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Säkra din klinik inför <span className="text-[#3a9e9e]">framtiden</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-300 mb-8 leading-relaxed max-w-xl">
              Med Astomeds månatliga serviceavtal får du en smidig, flexibel lösning som säkrar din servicehistorik, eliminerar oväntade utgifter och gör din klinik redo för de nya lagkraven 2026.
            </p>
            <div className="flex flex-wrap gap-4">
              <a href="#anmalan">
                <Button size="lg" className="bg-[#3a9e9e] hover:bg-[#2c7a7a] text-white border-0 shadow-lg text-base h-14 px-8">
                  Teckna Serviceavtal
                </Button>
              </a>
              <a href="#ssm-lagen">
                <Button size="lg" variant="outline" className="bg-transparent text-white border-white/30 hover:bg-white/10 hover:text-white h-14 px-8">
                  Läs om nya lagen
                </Button>
              </a>
            </div>
          </div>
          <div className="hidden md:block">
            {/* Visual element */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20 shadow-xl">
                  <Shield className="w-10 h-10 text-[#3a9e9e] mb-4" />
                  <h3 className="text-xl font-semibold mb-2">SSM Redo</h3>
                  <p className="text-sm text-slate-300">Dokumenterad historik och rutiner på plats innan lagen träder i kraft.</p>
                </div>
                <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20 shadow-xl">
                  <CalendarClock className="w-10 h-10 text-[#3a9e9e] mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Inget glapp</h3>
                  <p className="text-sm text-slate-300">Regelbunden service enligt tillverkarens krav utan att du behöver tänka på det.</p>
                </div>
              </div>
              <div className="space-y-4 pt-12">
                <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20 shadow-xl">
                  <Wrench className="w-10 h-10 text-[#3a9e9e] mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Fast månadskostnad</h3>
                  <p className="text-sm text-slate-300">Slipp stora klumpsummor. Dela upp kostnaden för enklare budgetering.</p>
                </div>
                <a href="https://www.stralsakerhetsmyndigheten.se/omraden/kroppsbehandlingar/anmalan-av-estetisk-verksamhet/" target="_blank" rel="noopener noreferrer" className="block bg-red-500/20 hover:bg-red-500/30 backdrop-blur-md p-6 rounded-2xl border border-red-500/40 shadow-xl transition-colors group">
                  <AlertCircle className="w-10 h-10 text-red-400 mb-4 group-hover:scale-110 transition-transform" />
                  <h3 className="text-xl font-semibold mb-2 text-white">Anmäl din klinik nu</h3>
                  <p className="text-sm text-red-100">Portalen har öppnat! Klicka här för att läsa mer och göra din lagstadgade anmälan till SSM.</p>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Nya föreskrifter från Strålsäkerhetsmyndigheten */}
      <section id="ssm-lagen" className="py-24 px-6 md:px-12 bg-[#002B3C] text-white">
        <div className="max-w-4xl mx-auto">
          <Badge className="bg-red-500 hover:bg-red-600 text-white mb-6 px-3 py-1 border-0">Viktig Laguppdatering</Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-6 leading-tight">Nya föreskrifter från Strålsäkerhetsmyndigheten (SSMFS 2026:1)</h2>
          <p className="text-lg text-slate-300 mb-8 leading-relaxed">
            Den 4 maj 2026 införde Strålsäkerhetsmyndigheten (SSM) anmälningsplikt för alla verksamheter som utför estetiska behandlingar med laser och IPL. Är din klinik redo för anmälan?
          </p>
          
          <div className="space-y-6 mb-8">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 font-bold text-[#3a9e9e]">1</div>
              <div>
                <h4 className="text-lg font-semibold mb-2">Portalen är nu öppen</h4>
                <p className="text-slate-400">
                  De nya reglerna och anmälningsportalen är aktiva sedan 4 maj 2026. Du kan läsa mer och göra din anmälan på{" "}
                  <a href="https://anmalningsplikt.ssm.se/" target="_blank" rel="noopener noreferrer" className="text-[#3a9e9e] hover:underline font-semibold">
                    anmalningsplikt.ssm.se
                  </a>.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 font-bold text-[#3a9e9e]">2</div>
              <div>
                <h4 className="text-lg font-semibold mb-2">Övergångsperiod: 4 juli 2026</h4>
                <p className="text-slate-400">För verksamheter som redan är igång den 4 maj finns en tidsfrist. Dessa ska anmälas senast den 4 juli 2026.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 font-bold text-[#3a9e9e]">3</div>
              <div>
                <h4 className="text-lg font-semibold mb-2">Dokumentation krävs</h4>
                <p className="text-slate-400">Vid anmälan krävs bevis på rutiner för funktionskontroll och underhåll, metodbeskrivningar, riskbedömningar och kompetensbevis.</p>
              </div>
            </div>
          </div>

          <div className="bg-[#1b3a3a] p-6 rounded-2xl border border-white/10 shadow-inner">
            <div className="flex items-start gap-4">
              <Info className="w-6 h-6 text-[#3a9e9e] shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold mb-2">Portalen är nu öppen för anmälan!</h4>
                <blockquote className="text-slate-300 italic text-sm leading-relaxed">
                  "Anmälan till SSM är nu öppen. För att kunna slutföra din anmälan krävs det att din servicehistorik och dina tekniska protokoll är i ordning, eftersom myndigheten kräver bevis på att maskinerna underhålls korrekt. Vi hjälper dig att säkerställa att all dokumentation är komplett, så att din anmälan går smidigt. Läs mer och anmäl verksamheten på <a href="https://anmalningsplikt.ssm.se/" target="_blank" rel="noopener noreferrer" className="text-[#3a9e9e] hover:underline font-semibold not-italic">anmalningsplikt.ssm.se</a>."
                </blockquote>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Våra tjänster / Serviceavtal */}
      <section id="tjanster" className="py-24 px-6 md:px-12 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-sm font-bold tracking-widest uppercase text-[#3a9e9e] mb-3">Våra tjänster</h2>
            <h3 className="text-3xl md:text-4xl font-bold text-[#1b3a3a] mb-6">Ett smartare sätt att driva klinik</h3>
            <p className="text-lg text-slate-600 leading-relaxed">
              Vi erbjuder allt du behöver till din klinik – från de senaste maskinerna på marknaden till produkter, utbildning och förstklassig service. Vårt månatliga serviceavtal är skapat för att ge dig trygghet och flexibilitet.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-[#e8f2f2] rounded-xl flex items-center justify-center mb-6">
                <Settings className="w-7 h-7 text-[#3a9e9e]" />
              </div>
              <h4 className="text-xl font-bold text-[#1b3a3a] mb-4">Smidigt Serviceavtal</h4>
              <p className="text-slate-600 leading-relaxed">
                Dela upp kostnaden månadsvis. Få förtur till service, regelbundet underhåll, kalibrering och bibehållen servicehistorik utan att det svider i kassan.
              </p>
            </div>
            <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-[#e8f2f2] rounded-xl flex items-center justify-center mb-6">
                <Monitor className="w-7 h-7 text-[#3a9e9e]" />
              </div>
              <h4 className="text-xl font-bold text-[#1b3a3a] mb-4">Utrustning & Produkter</h4>
              <p className="text-slate-600 leading-relaxed">
                Vi har utrustningen för alla typer av behandlingar samt förbrukningsmaterial, hudvård, fillers och klinikmöbler på astomedshop.se.
              </p>
            </div>
            <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-[#e8f2f2] rounded-xl flex items-center justify-center mb-6">
                <BookOpen className="w-7 h-7 text-[#3a9e9e]" />
              </div>
              <h4 className="text-xl font-bold text-[#1b3a3a] mb-4">Klinikutbildning</h4>
              <p className="text-slate-600 leading-relaxed">
                Kunskap är nyckeln till framgång. Vi erbjuder omfattande utbildningar för att du och din personal ska känna er trygga i ert arbete.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Vad kommer att krävas i anmälan */}
      <section id="anmalan-krav" className="py-24 px-6 md:px-12 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white text-slate-800 rounded-3xl p-8 md:p-12 shadow-sm border border-slate-100">
            <h3 className="text-3xl font-bold mb-6 text-[#1b3a3a]">Vad kommer att krävas i anmälan?</h3>
            <p className="text-lg text-slate-600 mb-8">
              Även om formuläret inte är uppe ännu, vet vi från föreskrifterna vad myndigheten kommer att kräva att klinikerna har på plats. Våra serviceavtal hjälper dig att uppfylla dessa krav automatiskt.
            </p>
            
            <div className="grid sm:grid-cols-2 gap-8 mb-10">
              <div className="flex gap-4">
                <CheckCircle2 className="w-8 h-8 text-[#3a9e9e] shrink-0" />
                <div>
                  <h5 className="font-bold text-lg text-slate-900 mb-2">1. Dokumenterade rutiner</h5>
                  <p className="text-slate-600">Rutiner för funktionskontroll och underhåll av lasermaskiner. <em>(Vårt serviceavtal täcker detta!)</em></p>
                </div>
              </div>
              <div className="flex gap-4">
                <CheckCircle2 className="w-8 h-8 text-[#3a9e9e] shrink-0" />
                <div>
                  <h5 className="font-bold text-lg text-slate-900 mb-2">2. Metodbeskrivningar</h5>
                  <p className="text-slate-600">Skriftliga instruktioner för hur varje behandling utförs säkert.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <CheckCircle2 className="w-8 h-8 text-[#3a9e9e] shrink-0" />
                <div>
                  <h5 className="font-bold text-lg text-slate-900 mb-2">3. Riskbedömning</h5>
                  <p className="text-slate-600">En dokumenterad bedömning av riskerna för varje behandlingstyp.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <CheckCircle2 className="w-8 h-8 text-[#3a9e9e] shrink-0" />
                <div>
                  <h5 className="font-bold text-lg text-slate-900 mb-2">4. Kompetensbevis</h5>
                  <p className="text-slate-600">Dokumentation som styrker att personalen har den kunskap som krävs. <em>(Vi erbjuder utbildningar)</em></p>
                </div>
              </div>
            </div>

            <a href="https://www.stralsakerhetsmyndigheten.se/omraden/kroppsbehandlingar/for-dig-som-utfor-kroppsbehandlingar-med-icke-joniserande-stralning/" target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="bg-[#1b3a3a] hover:bg-[#122727] text-white">
                Läs mer på SSM:s hemsida <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Kundportalen Section */}
      <section className="py-24 px-6 md:px-12 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-sm font-bold tracking-widest uppercase text-[#3a9e9e] mb-3">Vår kundportal</h2>
            <h3 className="text-3xl md:text-4xl font-bold text-[#1b3a3a] mb-6">Hantera din klinik med säkerhet och kontroll</h3>
            <p className="text-lg text-slate-600 leading-relaxed">
              Astomeds kundportal är din digitala kommandocentral för att hålla allt på den nya normen. Dokumentera, spåra och bevisa att du uppfyller strålsäkerhetskraven – allt på ett ställe.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {/* Leveranskontroll */}
            <div className="bg-gradient-to-br from-[#f0f7f7] to-white rounded-2xl p-8 border border-slate-100 shadow-sm hover:shadow-md transition-all">
              <div className="w-14 h-14 bg-[#e8f2f2] rounded-xl flex items-center justify-center mb-6">
                <Box className="w-7 h-7 text-[#3a9e9e]" />
              </div>
              <h4 className="text-xl font-bold text-[#1b3a3a] mb-4">Leveranskontroll</h4>
              <p className="text-slate-600 leading-relaxed mb-4">
                Dokumentera varje maskinleverans steg för steg direkt i portalen. Fotografier, serienummer, certifikat – allt sparas automatiskt.
              </p>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#3a9e9e] shrink-0 mt-0.5" />
                  <span>Bildöversikt av förpackning och maskin</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#3a9e9e] shrink-0 mt-0.5" />
                  <span>Kontrollista för visuellt skick</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#3a9e9e] shrink-0 mt-0.5" />
                  <span>Automatisk PDF-rapport för arkivet</span>
                </li>
              </ul>
            </div>

            {/* Funktionskontroll */}
            <div className="bg-gradient-to-br from-[#f0f7f7] to-white rounded-2xl p-8 border border-slate-100 shadow-sm hover:shadow-md transition-all">
              <div className="w-14 h-14 bg-[#e8f2f2] rounded-xl flex items-center justify-center mb-6">
                <CheckCircle2 className="w-7 h-7 text-[#3a9e9e]" />
              </div>
              <h4 className="text-xl font-bold text-[#1b3a3a] mb-4">Funktionskontroll</h4>
              <p className="text-slate-600 leading-relaxed mb-4">
                Genomför regelbundna funktionskontroller enligt tillverkarens krav. Portalen guidar dig genom processen och sparar alla resultat.
              </p>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#3a9e9e] shrink-0 mt-0.5" />
                  <span>Guidning för varje kontrollpunkt</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#3a9e9e] shrink-0 mt-0.5" />
                  <span>Lasereffektsmätningar dokumenterade</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#3a9e9e] shrink-0 mt-0.5" />
                  <span>Historik för varje maskin</span>
                </li>
              </ul>
            </div>

            {/* Strålsäkerhet */}
            <div className="bg-gradient-to-br from-[#f0f7f7] to-white rounded-2xl p-8 border border-slate-100 shadow-sm hover:shadow-md transition-all">
              <div className="w-14 h-14 bg-[#e8f2f2] rounded-xl flex items-center justify-center mb-6">
                <Shield className="w-7 h-7 text-[#3a9e9e]" />
              </div>
              <h4 className="text-xl font-bold text-[#1b3a3a] mb-4">Strålsäkerhet (SSM)</h4>
              <p className="text-slate-600 leading-relaxed mb-4">
                Möt alla krav från Strålsäkerhetsmyndigheten. Portalen hjälper dig att bygga upp den dokumentation som SSM kräver.
              </p>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#3a9e9e] shrink-0 mt-0.5" />
                  <span>Metodbeskrivningar och rutiner</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#3a9e9e] shrink-0 mt-0.5" />
                  <span>Kompetensregistrering för personal</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#3a9e9e] shrink-0 mt-0.5" />
                  <span>Incidentrapportering och åtgärder</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Portal Preview */}
          <div className="bg-slate-50 border border-slate-100 rounded-3xl p-8 md:p-12 mb-12">
            <div className="max-w-3xl">
              <h4 className="text-2xl font-bold text-[#1b3a3a] mb-4">En portal som växer med dina krav</h4>
              <p className="text-slate-600 mb-6 leading-relaxed">
                Portalen är uppdaterad för att möta de nya strålsäkerhetskraven från 2026. Allt du behöver dokumentera för att anmäla dig till SSM – från leveranskontroller till funktionskontroller och personal­kompetensbevisen – hanteras smidigt i en och samma plattform.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <AlertTriangle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-semibold text-slate-900 mb-1">Börja redan nu</h5>
                    <p className="text-slate-600 text-sm">Vänta inte till den 4 juli. Börja dokumentera redan idag så att all din historia från dag ett är på plats när du behöver anmäla dig till SSM.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-slate-600 mb-6">
              Vill du se hur portalen fungerar? Teckna ett serviceavtal och få tillgång idag.
            </p>
            <a href="#anmalan" className="inline-block">
              <Button size="lg" className="bg-[#3a9e9e] hover:bg-[#2c7a7a] text-white">
                Kom igång med portalen <ChevronDown className="w-5 h-5 ml-2" />
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Form Section */}
      <section id="anmalan" className="py-24 px-4 md:px-12 bg-[#fcf8f2] relative">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col items-center text-center mb-12">
            <div className="flex items-start gap-8 mb-8">
              <div className="flex flex-col items-center">
                <img src="https://astomed.se/wp-content/uploads/2026/04/Liburn-2026.jpg" alt="Liburn" className="w-28 h-28 rounded-full object-cover shadow-lg border-4 border-white mb-3" />
                <span className="font-bold text-[#1b3a3a]">Liburn</span>
                <span className="text-sm text-slate-500">Produktspecialist Service</span>
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
                      {Object.keys(machineServiceDetails).map((machine) =>
                        <SelectItem key={machine} value={machine}>{machine}</SelectItem>
                      )}
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

                {form.machine_name && machineServiceDetails[form.machine_name] &&
                  <div className="sm:col-span-2 p-5 bg-[#f0f7f7] rounded-xl border border-[#d2e8e8]">
                    <h4 className="font-bold text-[#1b3a3a] mb-3 flex items-center gap-2">
                      <Wrench className="w-4 h-4 text-[#3a9e9e]" />
                      {machineServiceDetails[form.machine_name].title}
                    </h4>
                    <ul className="space-y-2.5 text-sm text-slate-700">
                      {machineServiceDetails[form.machine_name].details.map((detail, idx) =>
                        <li key={idx} className="flex gap-2.5 items-start">
                          <CheckCircle2 className="w-4 h-4 text-[#3a9e9e] shrink-0 mt-0.5" />
                          <span dangerouslySetInnerHTML={{ __html: detail }} />
                        </li>
                      )}
                    </ul>
                    {machineServiceDetails[form.machine_name].additionalInfo &&
                      <div className="mt-4 pt-4 border-t border-[#d2e8e8]">
                        {(() => {
                          const info = machineServiceDetails[form.machine_name].additionalInfo;
                          const match = info.match(/(\d+)/);
                          const price = match ? parseInt(match[0], 10) : null;
                          
                          return (
                            <>
                              <p className="text-sm font-semibold text-[#1b3a3a]">
                                {info}
                              </p>
                              {price && (
                                <div className="mt-4 pt-4 border-t border-slate-200 text-right">
                                  <p className="text-xs text-slate-500 mb-1">Jämförspris vid Engångsservice (utan avtal):</p>
                                  <p className="text-lg font-bold text-[#1b3a3a] mb-2">{Math.round(price * 12 * 1.30).toLocaleString('sv-SE')} kr / gång</p>
                                  <p className="text-xs text-slate-500 italic">* Inkluderar ej rabatt på reservdelar, arbetskostnader eller resor.</p>
                                  <p className="text-xs text-slate-500 italic">* Engångsservice kan ej prioriteras vid hög belastning.</p>
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