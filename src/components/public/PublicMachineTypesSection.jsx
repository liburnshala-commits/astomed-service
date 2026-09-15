import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Monitor, ExternalLink } from "lucide-react";

export default function PublicMachineTypesSection() {
  const [templates, setTemplates] = useState([]);

  // The machines specified by the user
  const targetMachines = [
    "Clearlight IPL",
    "Fraction CO2",
    "CoolTech",
    "Alma Harmony",
    "Helios / Helios III",
    "Picolo",
    "Soprano Titanium",
    "Pento / Pento 9900",
    "Splendor X",
    "Aldix (Triodus) / Aldix Smart Laser",
    "Soprano ICE Platinum",
    "PrimeLase (alla)",
    "Elysion / Cocoon Elysion"
  ];

  const machineDataMap = {
    "Clearlight IPL": { description: "Välbeprövad IPL som behandlar flera indikationer.", link: "https://astomed.se/pages/clearlight-ipl" },
    "Fraction CO2": { description: "Nya generationens fraktionerade CO2 laser för kropp och ansikte.", link: "https://astomed.se/pages/fraction-co2" },
    "CoolTech": { description: "Fettfrysning (Cryolipolysis) för effektiv kroppsskulptering.", link: "https://astomed.se/pages/klinikutrustning" },
    "Alma Harmony": { description: "Multifunktionell plattform för avancerade hudbehandlingar.", link: "https://astomed.se/pages/klinikutrustning" },
    "Helios / Helios III": { description: "YAG Laser med 4 handenheter för alla tatueringsfärger.", link: "https://astomed.se/pages/helios-iii-1" },
    "Picolo": { description: "PicoLO laser för tatueringsborttagning & hudföryngring.", link: "https://astomed.se/pages/picolo" },
    "Soprano Titanium": { description: "Laserhårborttagning i toppklass med tre-i-en teknologi.", link: "https://astomed.se/pages/soprano-titanium-1" },
    "Pento / Pento 9900": { description: "Utrustning som ger resultat med YAG- och Alexandritlaser.", link: "https://astomed.se/pages/pento" },
    "Splendor X": { description: "Laserutrustning i världsklass från välkända Lumenis.", link: "https://astomed.se/pages/splendor-x" },
    "Aldix (Triodus) / Aldix Smart Laser": { description: "Laserhårborttagning med välbeprövad diodlaser.", link: "https://astomed.se/pages/aldix-smart-laser" },
    "Soprano ICE Platinum": { description: "#1 på hårborttagning i Sverige sedan 10 år tillbaka.", link: "https://astomed.se/pages/soprano-ice-platinum-1" },
    "PrimeLase (alla)": { description: "Effektiv diodlaser för hårborttagning.", link: "https://astomed.se/pages/klinikutrustning" },
    "Elysion / Cocoon Elysion": { description: "Diodlaser för snabb och säker hårborttagning.", link: "https://astomed.se/pages/klinikutrustning" }
  };

  useEffect(() => {
    // Fetch all service agreement templates to get their descriptions
    const appUrl = window.location.origin;
    fetch(`${appUrl}/api/functions/getPublicServiceAgreementTemplates`, { method: "POST" })
      .then(res => res.json())
      .then(data => setTemplates(Array.isArray(data) ? data : []))
      .catch(console.error);
  }, []);

  return (
    <section id="maskintyper" className="py-24 px-6 md:px-12 bg-slate-50 border-t border-slate-200">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-sm font-bold tracking-widest uppercase text-[#3a9e9e] mb-3">Maskintyper</h2>
          <h3 className="text-3xl md:text-4xl font-bold text-[#1b3a3a] mb-6">Utrustning vi erbjuder service på</h3>
          <p className="text-lg text-slate-600 leading-relaxed">
            Här är ett urval av de maskiner vi hanterar. Nedan ser du information från våra serviceavtalsmallar för respektive utrustning.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {targetMachines.map((machineName) => {
            const template = templates.find(t => t.name.toLowerCase() === machineName.toLowerCase()) || 
                             templates.find(t => t.name.includes(machineName.split(' ')[0]));
                             
            return (
              <div key={machineName} className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  {template?.image_url ? (
                    <div className="w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0 mt-1 overflow-hidden bg-white">
                      <img src={template.image_url} alt={machineName} className="w-full h-full object-contain" />
                    </div>
                  ) : (
                    <div className="w-16 h-16 bg-[#e8f2f2] rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                      <Monitor className="w-8 h-8 text-[#3a9e9e]" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h4 className="text-lg font-bold text-[#1b3a3a] mb-2">{machineName}</h4>
                    <p className="text-sm text-slate-600 leading-relaxed mb-3">
                      {machineDataMap[machineName]?.description || template?.description || "Beskrivning saknas i systemet."}
                    </p>
                    <a 
                      href={machineDataMap[machineName]?.link || "https://astomed.se/pages/klinikutrustning"} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-xs font-semibold text-[#3a9e9e] hover:text-[#2d8080] transition-colors"
                    >
                      Läs mer om maskinen <ExternalLink className="w-3 h-3 ml-1" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}