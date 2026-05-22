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
  const [machines, setMachines] = useState([]);
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
         const cust = ownCustomers[0];
         setCustomer(cust);
         if (cust) {
            const m = await base44.entities.Machine.filter({ customer_id: cust.id });
            setMachines(m);
         }
      }
    };
    load();
  }, []);

  const handleFileUpload = async (e, fieldName, isArray = false) => {
    const files = Array.from(e.target.files);
    if(files.length === 0) return;
    
    for (const file of files) {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        try {
          const res = await base44.integrations.Core.UploadFile({ file: reader.result });
          if (res.file_url) {
            if (isArray) {
               setFormData(prev => ({ ...prev, [fieldName]: [...(prev[fieldName] || []), res.file_url] }));
            } else {
               setFormData(prev => ({ ...prev, [fieldName]: res.file_url }));
            }
          }
        } catch(err) { console.error(err); }
      };
    }
  };

  const handleChange = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async () => {
     setLoading(true);
     try {
       const record = await base44.entities.DeliveryControl.create({
          ...formData,
          customer_id: customer?.id,
          control_date: new Date().toISOString().split('T')[0]
       });
       await base44.functions.invoke("generateDeliveryControlPDF", { deliveryControlId: record.id });
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
               
               <div className="space-y-4">
                  <div>
                    <Label className="mb-2 block">Välj befintlig maskin (valfritt)</Label>
                    <select 
                      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0088ff]"
                      value={formData.machine_id || ''}
                      onChange={e => {
                        const m = machines.find(x => x.id === e.target.value);
                        if (m) {
                           setFormData(prev => ({
                             ...prev,
                             machine_id: m.id,
                             model: m.model,
                             serial_number: m.serial_number,
                             manufacturer: m.manufacturer
                           }));
                        } else {
                           handleChange('machine_id', '');
                        }
                      }}
                    >
                      <option value="">-- Ny maskin (manuell inmatning) --</option>
                      {machines.map(m => (
                        <option key={m.id} value={m.id}>{m.model} ({m.serial_number})</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Maskinmodell</Label>
                      <Input value={formData.model || ''} onChange={e => handleChange('model', e.target.value)} />
                    </div>
                    <div>
                      <Label>Serienummer</Label>
                      <Input value={formData.serial_number || ''} onChange={e => handleChange('serial_number', e.target.value)} />
                    </div>
                    <div>
                      <Label>Tillverkare</Label>
                      <Input value={formData.manufacturer || ''} onChange={e => handleChange('manufacturer', e.target.value)} />
                    </div>
                    <div>
                      <Label>Maskintyp</Label>
                      <Input placeholder="T.ex. Laser" value={formData.machine_type || ''} onChange={e => handleChange('machine_type', e.target.value)} />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Leveransdatum</Label>
                      <Input type="date" value={formData.delivery_date || ''} onChange={e => handleChange('delivery_date', e.target.value)} />
                    </div>
                    <label className="flex items-center gap-3 border p-3 rounded-lg bg-white cursor-pointer mt-5">
                       <Checkbox checked={formData.is_used_machine} onCheckedChange={c => handleChange('is_used_machine', c)} />
                       <span className="text-sm">Begagnad maskin</span>
                    </label>
                  </div>
                  
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <Label className="mb-3 block font-semibold">Certifikat (t.ex. MDR)</Label>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                       <Input placeholder="Typ (t.ex. MDR)" value={formData.certificate_type || ''} onChange={e => handleChange('certificate_type', e.target.value)} />
                       <Input placeholder="Nummer" value={formData.certificate_number || ''} onChange={e => handleChange('certificate_number', e.target.value)} />
                    </div>
                    <div className="flex flex-col gap-2">
                       <span className="text-xs text-slate-500 font-medium">Bifoga fil (frivilligt)</span>
                       <input type="file" onChange={e => handleFileUpload(e, 'certificate_file_url')} className="text-sm" />
                       {formData.certificate_file_url && <span className="text-xs text-green-600 font-bold">✓ Uppladdad!</span>}
                    </div>
                  </div>
               </div>
               
               <div className="pt-4 border-t">
                 <Label className="font-semibold mb-3 block">Förpackning & Skick</Label>
                 <div className="space-y-3">
                    <div className="flex items-center justify-between border p-3 rounded-xl bg-white shadow-sm">
                       <span className="text-sm font-medium">Bilder på förpackning</span>
                       <div className="flex items-center gap-3">
                         {formData.packaging_photos_url?.length > 0 && <span className="text-xs font-semibold text-green-600">{formData.packaging_photos_url.length} bilder</span>}
                         <label className="cursor-pointer bg-blue-50 text-blue-600 px-3 py-1.5 rounded text-xs font-semibold hover:bg-blue-100 transition-colors">
                           Ladda upp <input type="file" multiple accept="image/*" className="hidden" onChange={e => handleFileUpload(e, 'packaging_photos_url', true)} />
                         </label>
                       </div>
                    </div>
                    <label className="flex items-center gap-3 border p-4 rounded-xl bg-white cursor-pointer hover:border-blue-200">
                       <Checkbox checked={formData.packaging_ok} onCheckedChange={c => handleChange('packaging_ok', c)} />
                       <span className="text-sm">Jag har fotograferat förpackningen från alla håll</span>
                    </label>
                    <label className="flex items-center gap-3 border p-4 rounded-xl bg-white cursor-pointer hover:border-blue-200">
                       <Checkbox checked={formData.no_visible_damage_packaging} onCheckedChange={c => handleChange('no_visible_damage_packaging', c)} />
                       <span className="text-sm">Det finns inga synliga skador på förpackningen</span>
                    </label>
                    
                    <div className="flex items-center justify-between border p-3 rounded-xl bg-white shadow-sm mt-4">
                       <span className="text-sm font-medium">Bilder på maskinen</span>
                       <div className="flex items-center gap-3">
                         {formData.machine_photos_url?.length > 0 && <span className="text-xs font-semibold text-green-600">{formData.machine_photos_url.length} bilder</span>}
                         <label className="cursor-pointer bg-blue-50 text-blue-600 px-3 py-1.5 rounded text-xs font-semibold hover:bg-blue-100 transition-colors">
                           Ladda upp <input type="file" multiple accept="image/*" className="hidden" onChange={e => handleFileUpload(e, 'machine_photos_url', true)} />
                         </label>
                       </div>
                    </div>
                    <label className="flex items-center gap-3 border p-4 rounded-xl bg-white cursor-pointer hover:border-blue-200">
                       <Checkbox checked={formData.machine_photos_ok} onCheckedChange={c => handleChange('machine_photos_ok', c)} />
                       <span className="text-sm">Maskinen är fotograferad från alla håll</span>
                    </label>
                    <label className="flex items-center gap-3 border p-4 rounded-xl bg-white cursor-pointer hover:border-blue-200">
                       <Checkbox checked={formData.no_cracks_dents_stains} onCheckedChange={c => handleChange('no_cracks_dents_stains', c)} />
                       <span className="text-sm">Inga sprickor, bucklor eller fläckar</span>
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
                  <div className="pt-4">
                     <Label className="mb-2 block">Övriga kommentarer (Steg 2)</Label>
                     <Textarea value={formData.other_comments_step2 || ''} onChange={e => handleChange('other_comments_step2', e.target.value)} placeholder="Finns det något mer att notera kring uppackningen?" />
                  </div>
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
                     <Checkbox checked={formData.no_abnormal_vibrations} onCheckedChange={c => handleChange('no_abnormal_vibrations', c)} />
                     <span className="text-sm">Inga onormala vibrationer</span>
                  </label>
                  <label className="flex items-center gap-3 border p-4 rounded-xl bg-white cursor-pointer hover:border-blue-200">
                     <Checkbox checked={formData.emergency_stop_functions} onCheckedChange={c => handleChange('emergency_stop_functions', c)} />
                     <span className="text-sm">Nödstopp fungerar</span>
                  </label>
                  <div className="pt-4">
                     <Label className="mb-2 block">Övriga kommentarer (Steg 3)</Label>
                     <Textarea value={formData.other_comments_step3 || ''} onChange={e => handleChange('other_comments_step3', e.target.value)} placeholder="T.ex. detaljer om felande nödstopp etc." />
                  </div>
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
                    <div className="pt-2">
                       <Label className="mb-2 block">Övriga kommentarer (Funktionstest)</Label>
                       <Textarea value={formData.other_comments_step4_function || ''} onChange={e => handleChange('other_comments_step4_function', e.target.value)} />
                    </div>
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
                    <div className="pt-2">
                       <Label className="mb-2 block">Övriga kommentarer (Säkerhet)</Label>
                       <Textarea value={formData.other_comments_step4_safety || ''} onChange={e => handleChange('other_comments_step4_safety', e.target.value)} />
                    </div>
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