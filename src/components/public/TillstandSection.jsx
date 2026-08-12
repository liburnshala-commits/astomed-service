import React from "react";
import { Badge } from "@/components/ui/badge";
import { Shield, Info, ExternalLink, CheckCircle2 } from "lucide-react";

export default function TillstandSection() {
  return (
    <section id="tillstand" className="py-24 px-6 md:px-12 bg-[#001f2b] text-white border-t border-white/10">
      <div className="max-w-4xl mx-auto">
        <Badge className="bg-[#3a9e9e] hover:bg-[#2c7a7a] text-white mb-6 px-3 py-1 border-0">Tillståndsansökan</Badge>
        <h2 className="text-3xl md:text-4xl font-bold mb-6 leading-tight">Behöver du söka särskilt lasertillstånd?</h2>
        <p className="text-lg text-slate-300 mb-8 leading-relaxed">
          Utöver den allmänna anmälningsplikten för estetiska verksamheter kan viss användning av starka lasrar (laserklass 3B och 4) kräva ett specifikt tillstånd från Strålsäkerhetsmyndigheten.
        </p>

        <div className="grid sm:grid-cols-2 gap-8 mb-10">
          <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
            <h4 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#3a9e9e]" /> När krävs tillstånd?
            </h4>
            <ul className="space-y-3 text-slate-300 text-sm">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#3a9e9e] shrink-0 mt-1" />
                <span>Starka laserpekare (klass 3R, 3B eller 4).</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#3a9e9e] shrink-0 mt-1" />
                <span>Användning för underhållning, konst eller reklam.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#3a9e9e] shrink-0 mt-1" />
                <span>Användning som ger bestrålning av allmän plats eller luftrummet.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#3a9e9e] shrink-0 mt-1" />
                <span>Innehav av laser som kan hållas i handen på allmän plats.</span>
              </li>
            </ul>
          </div>
          
          <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
            <h4 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Info className="w-5 h-5 text-[#3a9e9e]" /> Så ansöker du
            </h4>
            <p className="text-slate-300 text-sm mb-4">
              Ansökan görs via SSM:s e-tjänst. Du kommer att behöva ange uppgifter om utrustningens specifikationer (våglängd, maxeffekt, laserklass) och säkerhetsåtgärder.
            </p>
            <div className="space-y-3">
              <a href="https://tillstand.ssm.se/login" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 rounded-lg bg-[#3a9e9e]/20 hover:bg-[#3a9e9e]/30 border border-[#3a9e9e]/30 transition-colors">
                <span className="font-semibold text-white">E-tjänst för lasertillstånd</span>
                <ExternalLink className="w-4 h-4 text-[#3a9e9e]" />
              </a>
              <a href="https://www.stralsakerhetsmyndigheten.se/omraden/laser/tillstand-for-laser/" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                <span className="text-sm text-slate-300">Läs mer om lasertillstånd</span>
                <ExternalLink className="w-4 h-4 text-slate-400" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}