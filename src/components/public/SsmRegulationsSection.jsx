import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Info } from "lucide-react";

export default function SsmRegulationsSection() {
  return (
    <section id="ssm-lagen" className="py-24 px-6 md:px-12 bg-[#002B3C] text-white">
      <div className="max-w-4xl mx-auto">
        <Badge className="bg-red-500 hover:bg-red-600 text-white mb-6 px-3 py-1 border-0">Viktig Laguppdatering</Badge>
        <h2 className="text-3xl md:text-4xl font-bold mb-6 leading-tight">Nya föreskrifter från Strålsäkerhetsmyndigheten (SSMFS 2026:1)</h2>
        <p className="text-lg text-slate-300 mb-8 leading-relaxed">
          Den 4 maj 2026 införde Strålsäkerhetsmyndigheten (SSM) anmälningsplikt för alla verksamheter som utför estetiska behandlingar med icke-joniserande strålning. Omfattas din utrustning?
        </p>
        
        <div className="space-y-6 mb-8">
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 font-bold text-[#3a9e9e]">1</div>
            <div>
              <h4 className="text-lg font-semibold mb-2">Vem berörs av lagen?</h4>
              <p className="text-slate-400">
                Om din verksamhet utför estetiska behandlingar (ex. hårborttagning, fettreducering, tatueringsborttagning) med <strong>Laser, IPL, Radiofrekvens (RF), Elektromagnetiska fält (HIFEM)</strong> eller <strong>Ultraljud (HIFU)</strong> omfattas du av anmälningsplikten.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 font-bold text-[#3a9e9e]">2</div>
            <div>
              <h4 className="text-lg font-semibold mb-2">Anmälningsportalen är öppen</h4>
              <p className="text-slate-400">
                Anmälan görs via SSM:s e-tjänst med Bank-ID eller Freja eID. Anmälningsavgiften är <strong>0 kronor</strong> för närvarande. <br/><br/>
                <a href="https://anmalningsplikt.ssm.se/" target="_blank" rel="noopener noreferrer" className="text-[#3a9e9e] hover:underline font-semibold flex items-center gap-1 inline-flex">
                  Till anmälningsportalen (anmalningsplikt.ssm.se) <ExternalLink className="w-3 h-3" />
                </a>
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 font-bold text-[#3a9e9e]">3</div>
            <div>
              <h4 className="text-lg font-semibold mb-2">Dokumentationskrav</h4>
              <p className="text-slate-400">
                Regelverket kräver att du som verksamhetsutövare tillhandahåller skriftlig riskinformation till kunder, använder säkra apparater som genomgår <strong>regelbunden service</strong> (vårt serviceavtal löser detta), samt har rutiner och metodbeskrivningar på plats.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 font-bold text-[#3a9e9e]">4</div>
            <div>
              <h4 className="text-lg font-semibold mb-2">Kräver min laser även tillstånd?</h4>
              <p className="text-slate-400">
                Viss användning av lasrar i klass 3B och 4 kan även kräva ett specifikt <strong>lasertillstånd</strong> utöver själva anmälan av estetisk verksamhet (exempelvis för bestrålning av allmän plats eller luftrum, se SSMFS 2014:4).<br/><br/>
                <a href="https://tillstand.ssm.se/login" target="_blank" rel="noopener noreferrer" className="text-[#3a9e9e] hover:underline font-semibold flex items-center gap-1 inline-flex">
                  Ansök om lasertillstånd (tillstand.ssm.se) <ExternalLink className="w-3 h-3" />
                </a>
              </p>
            </div>
          </div>
        </div>

        <div className="bg-[#1b3a3a] p-6 rounded-2xl border border-white/10 shadow-inner">
          <div className="flex items-start gap-4">
            <Info className="w-6 h-6 text-[#3a9e9e] shrink-0 mt-1" />
            <div>
              <h4 className="font-semibold mb-2">Vi hjälper dig med dokumentationen</h4>
              <blockquote className="text-slate-300 italic text-sm leading-relaxed mb-4">
                "För att kunna slutföra din anmälan enligt SSMFS 2026:1 krävs det att din servicehistorik och dina tekniska protokoll är i ordning. Myndigheten kräver att maskinerna underhålls korrekt och regelbundet."
              </blockquote>
              <div className="flex flex-wrap gap-4 mt-2">
                <a href="https://www.stralsakerhetsmyndigheten.se/omraden/kroppsbehandlingar/anmalan-av-estetisk-verksamhet/" target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="outline" className="bg-transparent text-white border-white/30 hover:bg-white/10">
                    Läs mer om anmälan hos SSM <ExternalLink className="w-3 h-3 ml-2" />
                  </Button>
                </a>
                <a href="https://www.stralsakerhetsmyndigheten.se/contentassets/80f15734c6cc4d4c8fe2c19a378a4e59/lathund-sa-anmaler-du-verksamheten.pdf" target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="outline" className="bg-transparent text-white border-white/30 hover:bg-white/10">
                    Lathund: Så anmäler du (PDF) <ExternalLink className="w-3 h-3 ml-2" />
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}