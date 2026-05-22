import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ChevronLeft, Check, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export default function FunctionControlForm() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [templates, setTemplates] = useState([]);
  const [customerMachines, setCustomerMachines] = useState([]);
  const [formData, setFormData] = useState({
     machine_starts: false,
     no_strange_sounds_smells: false,
     no_abnormal_vibrations: false,
     no_leakage: false,
     emergency_stop_functions: false,
     light_beam_symmetrical: false,
     foot_pedal_functions: false,
     safety_glasses_present: false,
     warning_sign_present: false,
     status: "Godkänd",
     can_machine_be_used: "Maskinen får användas"
  });
  const [loading, setLoading] = useState(false);
  const [customer, setCustomer] = useState(null);

  useEffect(() => {
    const load = async () => {
      const user = await base44.auth.me();
      if (user) {
         const allTemplates = await base44.entities.ServiceAgreementTemplate.list();
         setTemplates(allTemplates);

         if (user.role === 'admin' || user.role === 'technician') {
            const m = await base44.entities.Machine.list();
            setCustomerMachines(m);
         } else {
            const ownCustomers = await base44.entities.Customer.filter({ email: user.email });
            if (ownCustomers && ownCustomers.length > 0) {
               setCustomer(ownCustomers[0]);
               const m = await base44.entities.Machine.filter({ customer_id: ownCustomers[0].id });
               setCustomerMachines(m);
            }
         }
      }
    };
    load();
  }, []);

  const handleChange = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async () => {
     setLoading(true);
     try {
       const record = await base44.entities.FunctionControl.create({
          ...formData,
          customer_id: formData.customer_id || customer?.id,
          control_date: new Date().toISOString().split('T')[0]
       });
       await base44.functions.invoke("generateFunctionControlPDF", { functionControlId: record.id });
       navigate("/FunctionControls");
     } catch (e) {
       alert("Gick inte att spara: " + e.message);
     }
     setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
       <div className="bg-white border-b px-4 py-3 flex items-center justify-between sticky top-0 z-10">
         <button onClick={() => navigate("/FunctionControls")} className="flex items-center gap-1 text-primary">
            <ChevronLeft className="w-5 h-5" /> Stäng
         </button>
         <div className="font-semibold text-center">
            Steg {step}/3 <br/>
            <span className="text-xs text-slate-500 font-normal">
              {step === 1 && "Välj maskin"}
              {step === 2 && "Test & Säkerhet"}
              {step === 3 && "Sammanfattning"}
            </span>
         </div>
         <button className="text-primary flex items-center gap-1 text-sm font-medium disabled:opacity-50" onClick={handleSubmit} disabled={loading}>
            {loading ? "Sparar..." : "Spara"}
         </button>
       </div>
       
       <div className="flex items-center justify-center gap-2 py-4 px-6 bg-white border-b border-slate-100">
         {[1,2,3].map(i => (
           <div key={i} className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
             step > i ? "bg-primary/10 text-primary" : step === i ? "bg-primary text-primary-foreground" : "bg-slate-100 text-slate-400"
           }`}>
             {step > i ? <Check className="w-4 h-4" /> : i}
           </div>
         ))}
       </div>

       <div className="flex-1 p-4 max-w-lg mx-auto w-full space-y-6 pb-24">
          {step === 1 && (
             <div className="space-y-6">
               <div className="bg-primary/5 p-4 rounded-xl text-sm text-primary">
                 Välj maskin för funktionskontrollen.
               </div>
               
               <div className="space-y-4">
                  <div>
                    <Label className="mb-2 block">Välj maskinmodell</Label>
                    <select 
                      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      value={formData.machine_model || ''}
                      onChange={e => handleChange('machine_model', e.target.value)}
                    >
                      <option value="">-- Manuell inmatning --</option>
                      {templates.map(t => (
                        <option key={t.id} value={t.name}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Maskinmodell</Label>
                      <Input value={formData.machine_model || ''} onChange={e => handleChange('machine_model', e.target.value)} />
                    </div>
                    <div>
                      <Label>Serienummer</Label>
                      <div className="space-y-2">
                        <select 
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          value={formData.machine_id || ''}
                          onChange={e => {
                            const m = customerMachines.find(x => x.id === e.target.value);
                            if (m) {
                               setFormData(prev => ({
                                 ...prev,
                                 machine_id: m.id,
                                 serial_number: m.serial_number,
                                 customer_id: m.customer_id
                               }));
                            } else {
                               setFormData(prev => ({ ...prev, machine_id: '', serial_number: '' }));
                            }
                          }}
                        >
                          <option value="">-- Välj befintligt eller skriv in --</option>
                          {customerMachines
                            .filter(m => !formData.machine_model || m.model === formData.machine_model)
                            .map(m => (
                            <option key={m.id} value={m.id}>{m.serial_number} {m.model !== formData.machine_model ? `(${m.model})` : ''}</option>
                          ))}
                        </select>
                        <Input placeholder="Serienummer..." value={formData.serial_number || ''} onChange={e => handleChange('serial_number', e.target.value)} />
                      </div>
                    </div>
                  </div>
               </div>
             </div>
          )}

          {step === 2 && (
             <div className="space-y-6">
               <div>
                 <Label className="font-semibold mb-3 block">Uppstart & Grundfunktion</Label>
                 <div className="space-y-2">
                    <label className="flex items-center gap-3 border p-4 rounded-xl bg-white cursor-pointer hover:border-primary/20">
                       <Checkbox checked={formData.machine_starts} onCheckedChange={c => handleChange('machine_starts', c)} />
                       <span className="text-sm">Maskinen startar korrekt</span>
                    </label>
                    <label className="flex items-center gap-3 border p-4 rounded-xl bg-white cursor-pointer hover:border-primary/20">
                       <Checkbox checked={formData.no_strange_sounds_smells} onCheckedChange={c => handleChange('no_strange_sounds_smells', c)} />
                       <span className="text-sm">Inga konstiga ljud eller lukter</span>
                    </label>
                    <label className="flex items-center gap-3 border p-4 rounded-xl bg-white cursor-pointer hover:border-primary/20">
                       <Checkbox checked={formData.no_abnormal_vibrations} onCheckedChange={c => handleChange('no_abnormal_vibrations', c)} />
                       <span className="text-sm">Inga onormala vibrationer</span>
                    </label>
                    <label className="flex items-center gap-3 border p-4 rounded-xl bg-white cursor-pointer hover:border-primary/20">
                       <Checkbox checked={formData.emergency_stop_functions} onCheckedChange={c => handleChange('emergency_stop_functions', c)} />
                       <span className="text-sm">Nödstopp fungerar</span>
                    </label>
                 </div>
               </div>

               <div>
                 <Label className="font-semibold mb-3 block">Testa maskinen</Label>
                 <div className="space-y-2">
                    <label className="flex items-center gap-3 border p-4 rounded-xl bg-white cursor-pointer hover:border-primary/20">
                       <Checkbox checked={formData.light_beam_symmetrical} onCheckedChange={c => handleChange('light_beam_symmetrical', c)} />
                       <span className="text-sm">Ljusstrålen är symmetrisk/jämn (om tillämpligt)</span>
                    </label>
                    <label className="flex items-center gap-3 border p-4 rounded-xl bg-white cursor-pointer hover:border-primary/20">
                       <Checkbox checked={formData.foot_pedal_functions} onCheckedChange={c => handleChange('foot_pedal_functions', c)} />
                       <span className="text-sm">Fotpedalen fungerar</span>
                    </label>
                    <label className="flex items-center gap-3 border p-4 rounded-xl bg-white cursor-pointer hover:border-primary/20">
                       <Checkbox checked={formData.no_leakage} onCheckedChange={c => handleChange('no_leakage', c)} />
                       <span className="text-sm">Inget läckage</span>
                    </label>
                    <div className="pt-2">
                        <Label className="mb-2 block text-sm">Uppmätt lasereffekt (om tillämpligt)</Label>
                        <Input value={formData.measured_laser_power || ''} onChange={e => handleChange('measured_laser_power', e.target.value)} placeholder="T.ex. 1200W" />
                    </div>
                 </div>
               </div>
               
               <div>
                 <Label className="font-semibold mb-3 block">Skyddsutrustning</Label>
                 <div className="space-y-2">
                    <label className="flex items-center gap-3 border p-4 rounded-xl bg-white cursor-pointer hover:border-primary/20">
                       <Checkbox checked={formData.safety_glasses_present} onCheckedChange={c => handleChange('safety_glasses_present', c)} />
                       <span className="text-sm">Skyddsglasögon finns</span>
                    </label>
                    <label className="flex items-center gap-3 border p-4 rounded-xl bg-white cursor-pointer hover:border-primary/20">
                       <Checkbox checked={formData.warning_sign_present} onCheckedChange={c => handleChange('warning_sign_present', c)} />
                       <span className="text-sm">Varningsskylt finns till dörren med rätt laserklass</span>
                    </label>
                 </div>
               </div>
             </div>
          )}

          {step === 3 && (
             <div className="space-y-8">
                <div>
                   <h3 className="text-lg font-bold mb-4">Ditt beslut</h3>
                   <Label className="text-xs font-semibold text-slate-500 uppercase mb-3 block">Funktionskontroll status</Label>
                   <div className="flex gap-2 bg-slate-100 p-1 rounded-xl">
                     {["Godkänd", "Godkänd med anmärkning", "Ej godkänd"].map(opt => (
                        <button key={opt}
                           onClick={() => handleChange('status', opt)}
                           className={`flex-1 py-2 px-1 text-xs font-medium rounded-lg transition-all ${formData.status === opt ? 'bg-white shadow-sm text-green-700' : 'text-slate-500 hover:text-slate-700'}`}
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
                       { v: "Maskinen får användas", desc: "Allt ser bra ut, maskinen kan användas" },
                       { v: "Får användas efter åtgärd", desc: "Något måste fixas först" },
                       { v: "Maskinen får inte användas", desc: "Det finns allvarliga fel" }
                     ].map(opt => (
                        <div key={opt.v}
                           onClick={() => handleChange('can_machine_be_used', opt.v)}
                           className={`p-4 border rounded-xl cursor-pointer transition-all ${formData.can_machine_be_used === opt.v ? 'bg-primary/5 border-primary' : 'bg-white hover:border-slate-300'}`}
                        >
                           <div className={`font-semibold text-sm ${formData.can_machine_be_used === opt.v ? 'text-primary' : 'text-slate-700'}`}>{opt.v}</div>
                           <div className="text-xs text-slate-500 mt-1">{opt.desc}</div>
                        </div>
                     ))}
                   </div>
                </div>

                <div>
                   <Label className="font-semibold mb-2 block">Övriga kommentarer</Label>
                   <Textarea 
                      placeholder="Skriv eventuella kommentarer här..." 
                      value={formData.comments || ''} 
                      onChange={e => handleChange('comments', e.target.value)}
                      className="min-h-[100px] resize-none"
                   />
                </div>
             </div>
          )}
       </div>

       <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t flex justify-between gap-4 max-w-lg mx-auto w-full">
          <Button variant="ghost" onClick={() => setStep(s => Math.max(1, s - 1))} disabled={step === 1} className="text-primary hover:text-primary/70 hover:bg-primary/5">
             Föregående
          </Button>
          {step < 3 ? (
             <Button onClick={() => setStep(s => Math.min(3, s + 1))} className="bg-primary hover:bg-primary/90 rounded-full px-6">
                   Nästa <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
             ) : (
                <Button onClick={handleSubmit} disabled={loading} className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-6">
                {loading ? "Sparar..." : <span className="flex items-center gap-1"><Check className="w-4 h-4 mr-1" /> Slutför</span>}
             </Button>
          )}
       </div>
    </div>
  );
}