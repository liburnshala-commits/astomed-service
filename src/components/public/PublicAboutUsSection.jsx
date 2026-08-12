import React from "react";
import { CheckCircle2 } from "lucide-react";

export default function PublicAboutUsSection() {
  return (
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
  );
}