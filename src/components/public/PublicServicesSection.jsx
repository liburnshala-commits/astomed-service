import React from "react";
import { Settings, Monitor, BookOpen } from "lucide-react";

export default function PublicServicesSection() {
  return (
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
  );
}