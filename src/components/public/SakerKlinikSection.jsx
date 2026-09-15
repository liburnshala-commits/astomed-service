import React from "react";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, ExternalLink, CheckCircle2, Award } from "lucide-react";

export default function SakerKlinikSection() {
  return (
    <section id="certifiering" className="py-24 px-6 md:px-12 bg-white text-slate-800">
      <div className="max-w-4xl mx-auto">
        <Badge className="bg-[#1b3a3a] hover:bg-[#122727] text-white mb-6 px-3 py-1 border-0">Certifiering</Badge>
        <h2 className="text-3xl md:text-4xl font-bold mb-6 text-[#1b3a3a] leading-tight flex items-center gap-3">
          Bli en Säker Klinik <Award className="w-8 h-8 text-[#3a9e9e]" />
        </h2>
        <p className="text-lg text-slate-600 mb-8 leading-relaxed">
          Vi uppmuntrar alla våra kunder att certifiera sig och sin verksamhet. Genom att bli en Säker Klinik visar du dina patienter att ni står för kvalitet, säkerhet och trygghet i era behandlingar. 
        </p>

        <div className="grid sm:grid-cols-2 gap-8 mb-10">
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h4 className="text-xl font-semibold mb-4 text-[#1b3a3a] flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#3a9e9e]" /> Varför certifiera sig?
            </h4>
            <ul className="space-y-3 text-slate-600 text-sm">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#3a9e9e] shrink-0 mt-1" />
                <span>Bygger ett ökat förtroende hos era patienter.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#3a9e9e] shrink-0 mt-1" />
                <span>Kvalitetsstämpel som garanterar säker utrustning och rätt kompetens.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#3a9e9e] shrink-0 mt-1" />
                <span>Trygghet i att ni uppfyller lagkrav och riktlinjer.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#3a9e9e] shrink-0 mt-1" />
                <span>Stärker varumärket och konkurrenskraften.</span>
              </li>
            </ul>
          </div>
          
          <div className="bg-[#e8f2f2] p-6 rounded-2xl border border-[#d2e8e8]">
            <h4 className="text-xl font-semibold mb-4 text-[#1b3a3a] flex items-center gap-2">
              Ansök om certifiering
            </h4>
            <p className="text-slate-700 text-sm mb-6">
              All information om certifieringsprocessen, krav och hur ni går tillväga hittar ni hos Säker Klinik. Ta steget idag för en tryggare bransch.
            </p>
            <div className="space-y-3">
              <a href="https://sakerklinik.se" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 rounded-lg bg-[#3a9e9e] hover:bg-[#2c7a7a] transition-colors shadow-sm">
                <span className="font-semibold text-white">Besök sakerklinik.se</span>
                <ExternalLink className="w-4 h-4 text-white" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}