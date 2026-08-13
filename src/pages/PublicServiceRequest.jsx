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
import PublicServiceFormSection from "@/components/public/PublicServiceFormSection";
import PublicAboutUsSection from "@/components/public/PublicAboutUsSection";
import PublicMachineTypesSection from "@/components/public/PublicMachineTypesSection";

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

  const [success, setSuccess] = useState(false);
  const [showPrivacyDialog, setShowPrivacyDialog] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
           <a href="#maskintyper" className="hover:text-[#3a9e9e] transition-colors">Maskiner</a>
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
           <a href="#maskintyper" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-[#3a9e9e] transition-colors border-b border-white/10 pb-3">Maskiner</a>
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
      
      {/* Maskintyper */}
      <PublicMachineTypesSection />

      {/* Vad kommer att krävas i anmälan */}
      <SsmRequirementsSection />

      {/* Kundportalen Section */}
      <PublicPortalSection />

      {/* Form Section */}
      <PublicServiceFormSection 
        onSuccess={() => setSuccess(true)} 
        onOpenPrivacy={() => setShowPrivacyDialog(true)} 
      />

      {/* Om oss Section */}
      <PublicAboutUsSection />

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