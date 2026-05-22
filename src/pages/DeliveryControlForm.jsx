import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ChevronLeft, Check, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export default function DeliveryControlForm() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
     packaging_ok: false,
     no_visible_damage_packaging: false,
     machine_photos_ok: false,
     no_cracks_dents_stains: false,
     no_leakage_step1: false,
     serial_number_matches_document: false,
     all_ordered_items_present: false,
     manual_present: false,
     machine_starts: false,
     no_strange_sounds_smells: false,
     no_abnormal_vibrations: false,
     no_leakage_step3: false,
     emergency_stop_functions: false,
     light_beam_symmetrical: false,
     foot_pedal_functions: false,
     safety_glasses_present: false,
     warning_sign_present: false,
     delivery_control_status: "Godkänd",
     can_machine_be_used: "Maskinen får användas"
  });
  const [loading, setLoading] = useState(false);
  const [customer, setCustomer] = useState(null);

  useEffect(() => {
    const load = async () => {
      const user = await base44.auth.me();
      if (user) {
         const ownCustomers = await base44.entities.Customer.filter({ email: user.email });
         setCustomer(ownCustomers[0]);
      }
    };
    load();
  }, []);

  const handleChange = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async () => {
     setLoading(true);
     try {
       await base44.entities.DeliveryControl.create({
          ...formData,
          customer_id: customer?.id,
          control_date: new Date().toISOString().split('T')[0]
       });
       navigate(-1);
     } catch (e) {
       alert("Gick inte att spara: " + e.message);
     }
     setLoading(false);
  };

  const renderStepIndicators = () => (
     <div className="flex items-center justify-center gap-2 py-4 px-6 bg-white border-b border-slate-100">
        {[1,2,3,4,5].map(i => (
           <div key={i} className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
              step > i ? "bg-green-100 text-green-600" : step === i ? "bg-[#0088ff] text-white" : "bg-slate-100 text-slate-400"
           }`}>
              {step > i ? <Check className="w-4 h-4" /> : i}
           </div>
        ))}
     </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
       <div className="bg-white border-b px-4 py-3 flex items-center justify-between sticky top-0 z-10">
         <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-[#0088ff]">
            <ChevronLeft className="w-5 h-5" /> Stäng
         </button>
         <div className="font-semibold text-center">
            Steg {step}/5 <br/>
            <span className="text-xs text-slate-500 font-normal">
              {step === 1 && "Om dig och maskinen"}
              {step === 2 && "Packa upp och kolla"}
              {step === 3 && "Starta och testa säkerheten"}
              {step === 4 && "Testa att allt fungerar"}
              {step === 5 && "Sammanfattning"}
            </span>
         </div>
         <button className="text-[#0088ff] flex items-center gap-1 text-sm font-medium" onClick={handleSubmit}>
            Spara
         </button>
       </div>
       
       {renderStepIndicators()}

       <div className="flex-1 p-4 max-w-lg mx-auto w-full space-y-6 pb-24">
          {step === 1 && (
             <div className="space-y-6">
               <div className="bg-blue-50/50 p-4 rounded-xl text-sm text-blue-900">
                 Fyll i grundläggande information om maskinen och bekräfta visuellt skick.
               </div>
               
               <div className="space-y-3">
                  <Label>Maskinmodell</Label>
                  <Input placeholder="T.ex. Deka Lasers Motus PRO" value={formData.model || ''} onChange={e => handleChange('model', e.target.value)} />
               </div>
               <div className="space-y-3">
                  <Label>Serienummer</Label>
                  <Input placeholder="SN..." value={formData.serial_number || ''} onChange={e => handleChange('serial_number', e.target.value)} />
               </div>
               
               <div className="pt-2">
                 <Label className="font-semibold mb-3 block">Förpackning</Label>
                 <div className="space-y-2">
                    <label className="flex items-center gap-3 border p-4 rounded-xl bg-white cursor-pointer hover:border-blue-200 transition-colors">
                       <Checkbox checked={formData.packaging_ok} onCheckedChange={c => handleChange('packaging_ok', c)} />
                       <span className="text-sm">Jag har fotograferat förpackningen från alla håll</span>
                    </label>
                    <label className="flex items-center gap-3 border p-4 rounded-xl bg-white cursor-pointer hover:border-blue-200 transition-colors">
                       <Checkbox checked={formData.no_visible_damage_packaging} onCheckedChange={c => handleChange('no_visible_damage_packaging', c)} />
                       <span className="text-sm">Det finns inga synliga skador på förpackningen</span>
                    </label>
                 </div>
               </div>
             </div>
          )}

          {step === 2 && (
             <div className="space-y-6">
               <div className="bg-blue-50/50 p-4 rounded-xl text-sm text-blue-900">
                 Kontrollera att maskinen stämmer överens med beställningen.
               </div>
               <div className="space-y-2">
                  <label className="flex items-center gap-3 border p-4 rounded-xl bg-white cursor-pointer hover:border-blue-200">
                     <Checkbox checked={formData.serial_number_matches_document} onCheckedChange={c => handleChange('serial_number_matches_document', c)} />
                     <span className="text-sm">Serienummer stämmer överens med dokument</span>
                  </label>
                  <label className="flex items-center gap-3 border p-4 rounded-xl bg-white cursor-pointer hover:border-blue-200">
                     <Checkbox checked={formData.all_ordered_items_present} onCheckedChange={c => handleChange('all_ordered_items_present', c)} />
                     <span className="text-sm">Allt beställt finns med</span>
                  </label>
                  <label className="flex items-center gap-3 border p-4 rounded-xl bg-white cursor-pointer hover:border-blue-200">
                     <Checkbox checked={formData.manual_present} onCheckedChange={c => handleChange('manual_present', c)} />
                     <span className="text-sm">Bruksanvisning finns med</span>
                  </label>
               </div>
             </div>
          )}

          {step === 3 && (
             <div className="space-y-6">
               <div className="bg-blue-50/50 p-4 rounded-xl text-sm text-blue-900">
                 Koppla in strömmen och testa grundläggande start.
               </div>
               <div className="space-y-2">
                  <label className="flex items-center gap-3 border p-4 rounded-xl bg-white cursor-pointer hover:border-blue-200">
                     <Checkbox checked={formData.machine_starts} onCheckedChange={c => handleChange('machine_starts', c)} />
                     <span className="text-sm">Maskinen startar</span>
                  </label>
                  <label className="flex items-center gap-3 border p-4 rounded-xl bg-white cursor-pointer hover:border-blue-200">
                     <Checkbox checked={formData.no_strange_sounds_smells} onCheckedChange={c => handleChange('no_strange_sounds_smells', c)} />
                     <span className="text-sm">Inga konstiga ljud eller lukter</span>
                  </label>
                  <label className="flex items-center gap-3 border p-4 rounded-xl bg-white cursor-pointer hover:border-blue-200">
                     <Checkbox checked={formData.emergency_stop_functions} onCheckedChange={c => handleChange('emergency_stop_functions', c)} />
                     <span className="text-sm">Nödstopp fungerar</span>
                  </label>
               </div>
             </div>
          )}

          {step === 4 && (
             <div className="space-y-6">
               <div>
                 <Label className="font-semibold mb-3 block">Testa maskinen</Label>
                 <div className="space-y-2">
                    <label className="flex items-center gap-3 border p-4 rounded-xl bg-white cursor-pointer hover:border-blue-200">
                       <Checkbox checked={formData.light_beam_symmetrical} onCheckedChange={c => handleChange('light_beam_symmetrical', c)} />
                       <span className="text-sm">Ljusstrålen är symmetrisk/jämn (om det gäller)</span>
                    </label>
                    <label className="flex items-center gap-3 border p-4 rounded-xl bg-white cursor-pointer hover:border-blue-200">
                       <Checkbox checked={formData.foot_pedal_functions} onCheckedChange={c => handleChange('foot_pedal_functions', c)} />
                       <span className="text-sm">Fotpedalen fungerar</span>
                    </label>
                 </div>
               </div>
               
               <div>
                 <Label className="font-semibold mb-3 block">Skyddsutrustning</Label>
                 <div className="space-y-2">
                    <label className="flex items-center gap-3 border p-4 rounded-xl bg-white cursor-pointer hover:border-blue-200">
                       <Checkbox checked={formData.safety_glasses_present} onCheckedChange={c => handleChange('safety_glasses_present', c)} />
                       <span className="text-sm">Skyddsglasögon finns</span>
                    </label>
                    <label className="flex items-center gap-3 border p-4 rounded-xl bg-white cursor-pointer hover:border-blue-200">
                       <Checkbox checked={formData.warning_sign_present} onCheckedChange={c => handleChange('warning_sign_present', c)} />
                       <span className="text-sm">Varningsskylt finns till dörren med rätt laserklass</span>
                    </label>
                 </div>
               </div>
             </div>
          )}

          {step === 5 && (
             <div className="space-y-8">
                <div>
                   <h3 className="text-lg font-bold mb-4">Ditt beslut</h3>
                   <Label className="text-xs font-semibold text-slate-500 uppercase mb-3 block">Leveranskontroll</Label>
                   <div className="flex gap-2 bg-slate-100 p-1 rounded-xl">
                     {["Godkänd", "Godkänd med anmärkning", "Ej godkänd"].map(opt => (
                        <button key={opt}
                           onClick={() => handleChange('delivery_control_status', opt)}
                           className={`flex-1 py-2 px-1 text-xs font-medium rounded-lg transition-all ${formData.delivery_control_status === opt ? 'bg-white shadow-sm text-green-700' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                           {opt}
                        </button>
                     ))}
                   </div>
                </div>

                <div>
                   <Label className="text-xs font-semibold text-slate-500 uppercase mb-3 block">Får maskinen användas?</Label>
                   <div className="space-y-2">
                     {[
                       { v: "Maskinen får användas", desc: "Allt ser bra ut, maskinen kan tas i bruk" },
                       { v: "Får användas efter åtgärd", desc: "Något måste fixas först" },
                       { v: "Maskinen får inte användas", desc: "Det finns allvarliga fel" }
                     ].map(opt => (
                        <div key={opt.v}
                           onClick={() => handleChange('can_machine_be_used', opt.v)}
                           className={`p-4 border rounded-xl cursor-pointer transition-all ${formData.can_machine_be_used === opt.v ? 'bg-blue-50/50 border-blue-300' : 'bg-white hover:border-slate-300'}`}
                        >
                           <div className={`font-semibold text-sm ${formData.can_machine_be_used === opt.v ? 'text-[#0088ff]' : 'text-slate-700'}`}>{opt.v}</div>
                           <div className="text-xs text-slate-500 mt-1">{opt.desc}</div>
                        </div>
                     ))}
                   </div>
                </div>

                <div>
                   <Label className="font-semibold mb-2 block">Vill du lägga till något?</Label>
                   <Textarea 
                      placeholder="Skriv eventuella kommentarer här..." 
                      value={formData.final_comments || ''} 
                      onChange={e => handleChange('final_comments', e.target.value)}
                      className="min-h-[100px] resize-none"
                   />
                </div>
             </div>
          )}
       </div>

       <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t flex justify-between gap-4 max-w-lg mx-auto w-full">
          <Button variant="ghost" onClick={() => setStep(s => Math.max(1, s - 1))} disabled={step === 1} className="text-[#0088ff] hover:text-blue-700 hover:bg-blue-50">
             Föregående
          </Button>
          {step < 5 ? (
             <Button onClick={() => setStep(s => Math.min(5, s + 1))} className="bg-[#0088ff] hover:bg-blue-600 rounded-full px-6">
                Nästa <ChevronRight className="w-4 h-4 ml-1" />
             </Button>
          ) : (
             <Button onClick={handleSubmit} disabled={loading} className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-full px-6">
                <Check className="w-4 h-4 mr-1" /> Slutför
             </Button>
          )}
       </div>
    </div>
  );
}