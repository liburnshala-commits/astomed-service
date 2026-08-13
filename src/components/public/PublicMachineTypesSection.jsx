import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Monitor } from "lucide-react";

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

  useEffect(() => {
    // Fetch all service agreement templates to get their descriptions
    base44.entities.ServiceAgreementTemplate.list()
      .then(res => setTemplates(res))
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
                  <div className="w-12 h-12 bg-[#e8f2f2] rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <Monitor className="w-6 h-6 text-[#3a9e9e]" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-[#1b3a3a] mb-2">{machineName}</h4>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {template?.description || "Beskrivning saknas i systemet."}
                    </p>
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