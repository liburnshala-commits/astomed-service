import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, CalendarClock, Wrench, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function PublicHeroSection() {
  const navigate = useNavigate();
  return (
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
            <Button onClick={() => navigate('/Calculator')} size="lg" variant="outline" className="bg-transparent text-white border-white/30 hover:bg-white/10 hover:text-white h-14 px-8">
              Räkna på klinikens lönsamhet
            </Button>
            <a href="#ssm-lagen">
              <Button size="lg" variant="outline" className="bg-transparent text-white border-white/30 hover:bg-white/10 hover:text-white h-14 px-8">
                Läs om nya lagen
              </Button>
            </a>
          </div>
        </div>
        <div className="hidden md:block">
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
  );
}