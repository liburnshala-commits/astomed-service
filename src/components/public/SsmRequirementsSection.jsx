import React from "react";
import { CheckCircle2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SsmRequirementsSection() {
  return (
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
                <p className="text-slate-600">Rutiner för regelbundet underhåll, service och funktionskontroll enligt tillverkarens anvisningar. <em>(Vårt serviceavtal täcker detta!)</em></p>
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
                <h5 className="font-bold text-lg text-slate-900 mb-2">3. Skriftlig riskinformation</h5>
                <p className="text-slate-600">Obligatoriskt krav på att alla kunder ska få muntlig och skriftlig information om risker innan behandling.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <CheckCircle2 className="w-8 h-8 text-[#3a9e9e] shrink-0" />
              <div>
                <h5 className="font-bold text-lg text-slate-900 mb-2">4. Kompetensbevis</h5>
                <p className="text-slate-600">Dokumentation som styrker att personalen har den kunskap som krävs och känner till strålningsriskerna. <em>(Vi erbjuder utbildningar)</em></p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <a href="https://www.stralsakerhetsmyndigheten.se/omraden/kroppsbehandlingar/for-dig-som-utfor-kroppsbehandlingar-med-icke-joniserande-stralning/" target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="bg-[#1b3a3a] hover:bg-[#122727] text-white">
                För dig som utför behandlingar <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            </a>
            <a href="https://www.stralsakerhetsmyndigheten.se/publikationer/foreskrifter/ssmfs-2026/ssmfs-20261-stralsakerhetsmyndighetens-foreskrifter-om-estetiska-behandlingar-med-icke-joniserande-stralning/" target="_blank" rel="noopener noreferrer">
              <Button size="lg" variant="outline" className="text-[#1b3a3a] border-slate-300">
                Läs föreskriften i sin helhet <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}