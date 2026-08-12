import React from "react";
import { CheckCircle2, AlertTriangle, ChevronDown, Box, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PublicPortalSection() {
  return (
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
  );
}