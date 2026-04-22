import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Plus, Trash2, Upload, CheckCircle2, ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";

const SERVICE_CONTRACTS = [
  {
    value: "none",
    label: "Inget Serviceavtal"
  },
  {
    value: "basic",
    label: "BAS – Astomed 3.0"
  }
];

export default function ServiceRecordForm({ record, machines, customers, preselectedMachineId, onSave, onClose }) {
  const isCreating = !record;
  const [step, setStep] = useState(1);
  const [isRepair, setIsRepair] = useState(record ? record.service_type === "advanced" : false);
  const [technicians, setTechnicians] = useState(["elman@astomed.se", "liburn@astomed.se"]);
  
  const preselectedMachine = machines.find(m => m.id === preselectedMachineId);

  const [form, setForm] = useState({
    machine_id: record?.machine_id || preselectedMachineId || "",
    customer_id: record?.customer_id || (preselectedMachine?.customer_id || ""),
    service_type: record?.service_type || "standard",
    service_date: record?.service_date || new Date().toISOString().split("T")[0],
    technician_name: record?.technician_name || "",
    description: record?.description || "",
    parts_used: record?.parts_used || [],
    labor_hours: record?.labor_hours || "",
    hourly_rate: record?.hourly_rate || "",
    labor_cost: record?.labor_cost || "",
    manual_price: record && record.total_cost ? Math.max(0, Math.round(record.total_cost / (1 - (record.discount_percent || 0) / 100)) - (
      ((record.parts_used || []).reduce((s, p) => s + (p.unit_price || 0) * (p.quantity || 1), 0)) +
      ((record.additional_costs || []).reduce((s, c) => s + (parseFloat(c.cost) || 0), 0)) +
      (parseFloat(record.labor_cost) || 0)
    )) || "" : "",
    discount_percent: record?.discount_percent || "",
    additional_costs: record?.additional_costs || [],
    status: record?.status || "pending",
    next_service_date: record?.next_service_date || "",
    images: record?.images || [],
    service_contract: record?.service_contract || "",
    measured_laser_power: record?.measured_laser_power || "",
    pulse_count: record?.pulse_count || ""
  });

  const [invoiceError, setInvoiceError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [templates, setTemplates] = useState([]);

  useEffect(() => {
    base44.entities.ServiceAgreementTemplate.list().then(setTemplates).catch(console.error);
  }, []);

  const currentMachine = machines.find(m => m.id === form.machine_id);
  const currentContract = currentMachine?.service_contract || "none";
  const currentCustomer = customers.find(c => c.id === form.customer_id);

  const applyTemplate = (templateId) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;
    
    const filteredServices = (template.included_services || []).filter(service => {
      const s = service.toLowerCase();
      return !s.includes("20 %") && !s.includes("20%") && !s.includes("rabatt");
    });

    const newParts = filteredServices.map(service => ({
      part_name: service,
      part_number: "",
      quantity: 1,
      unit_price: 0
    }));

    setForm(prev => {
      const allTemplateServices = new Set(templates.flatMap(t => t.included_services || []));
      const manualParts = prev.parts_used.filter(p => !allTemplateServices.has(p.part_name));
      
      let newDesc = prev.description || "";
      templates.forEach(t => {
        newDesc = newDesc.replace(`\n\nGenomförda moment från mall (${t.name}):`, "");
        newDesc = newDesc.replace(`Genomförda moment från mall (${t.name}):`, "");
      });
      newDesc = newDesc.trim();

      return {
        ...prev,
        description: newDesc 
          ? `${newDesc}\n\nGenomförda moment från mall (${template.name}):`
          : `Genomförda moment från mall (${template.name}):`,
        parts_used: [...manualParts, ...newParts]
      };
    });
  };

  const set = (field, value) => {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      if (field === "labor_hours" || field === "hourly_rate") {
        const hours = parseFloat(next.labor_hours) || 0;
        const rate = parseFloat(next.hourly_rate) || 0;
        next.labor_cost = hours * rate || "";
      }
      return next;
    });
  };

  const handleMachineChange = (machineId) => {
    const machine = machines.find(m => m.id === machineId);
    setForm(prev => ({ ...prev, machine_id: machineId, customer_id: machine?.customer_id || prev.customer_id }));
  };

  const handleCustomerChange = (customerId) => {
    setForm(prev => {
      const next = { ...prev, customer_id: customerId };
      if (prev.machine_id) {
        const machine = machines.find(m => m.id === prev.machine_id);
        if (machine && machine.customer_id !== customerId) {
          next.machine_id = "";
        }
      }
      return next;
    });
  };

  const handleNextFromStep1 = () => {
    if (!form.customer_id || !form.machine_id || !form.service_date) return;

    if (!isRepair) {
      // It's a standard service
      set("service_type", "standard");
      
      // Apply template automatically
      const machine = machines.find(m => m.id === form.machine_id);
      let templateToApply = null;
      if (machine?.service_agreement_template_id) {
        templateToApply = templates.find(t => t.id === machine.service_agreement_template_id);
      }
      if (!templateToApply && templates.length > 0) {
        templateToApply = templates[0];
      }
      if (templateToApply) {
        applyTemplate(templateToApply.id);
      }

      // Auto-set next service date to 1 year ahead
      if (form.service_date) {
        const date = new Date(form.service_date);
        date.setFullYear(date.getFullYear() + 1);
        set("next_service_date", date.toISOString().split("T")[0]);
      }

      setStep(3); // Skip repair step
    } else {
      set("service_type", "advanced");
      setStep(2);
    }
  };

  const addPart = () => setForm(prev => ({ ...prev, parts_used: [...prev.parts_used, { part_name: "", part_number: "", quantity: 1, unit_price: 0 }] }));
  const updatePart = (i, field, value) => {
    const parts = [...form.parts_used];
    parts[i] = { ...parts[i], [field]: value };
    setForm(prev => ({ ...prev, parts_used: parts }));
  };
  const removePart = (i) => setForm(prev => ({ ...prev, parts_used: prev.parts_used.filter((_, idx) => idx !== i) }));

  const addAdditionalCost = () => setForm(prev => ({ ...prev, additional_costs: [...prev.additional_costs, { description: "", cost: 0 }] }));
  const updateAdditionalCost = (i, field, value) => {
    const costs = [...form.additional_costs];
    costs[i] = { ...costs[i], [field]: value };
    setForm(prev => ({ ...prev, additional_costs: costs }));
  };
  const removeAdditionalCost = (i) => setForm(prev => ({ ...prev, additional_costs: prev.additional_costs.filter((_, idx) => idx !== i) }));

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    const uploaded = await Promise.all(files.map(async (file) => {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      return file_url;
    }));
    setForm(prev => ({ ...prev, images: [...prev.images, ...uploaded] }));
    setUploading(false);
  };
  const removeImage = (i) => setForm(prev => ({ ...prev, images: prev.images.filter((_, idx) => idx !== i) }));

  const calcTotal = () => {
    const partsTotal = isRepair ? form.parts_used.reduce((sum, p) => sum + ((p.unit_price || 0) * (p.quantity || 1)), 0) : 0;
    const additionalTotal = form.additional_costs.reduce((sum, c) => sum + (parseFloat(c.cost) || 0), 0);
    const laborTotal = isRepair ? (parseFloat(form.labor_cost) || 0) : 0;
    const manualCost = parseFloat(form.manual_price) || 0;
    const baseTotal = partsTotal + additionalTotal + laborTotal + manualCost;
    const discount = parseFloat(form.discount_percent) || 0;
    return Math.round(baseTotal * (1 - (discount / 100)));
  };

  const handleSave = () => {
    let finalStatus = form.status;
    
    // Auto-set status on creation based on date
    if (isCreating) {
      const today = new Date().toISOString().split("T")[0];
      if (form.service_date > today) {
        finalStatus = "pending";
      } else {
        finalStatus = "in_progress";
      }
    }

    const { manual_price, ...submitForm } = form;
    onSave({
      ...submitForm,
      status: finalStatus,
      labor_hours: form.labor_hours === "" ? undefined : Number(form.labor_hours),
      hourly_rate: form.hourly_rate === "" ? undefined : Number(form.hourly_rate),
      labor_cost: form.labor_cost === "" ? undefined : Number(form.labor_cost),
      total_cost: calcTotal(),
      discount_percent: form.discount_percent === "" ? 0 : Number(form.discount_percent),
      next_service_date: form.next_service_date || undefined,
      measured_laser_power: form.measured_laser_power || undefined,
      pulse_count: form.pulse_count === "" ? undefined : Number(form.pulse_count)
    });
  };

  const stepTitles = {
    1: "Grunduppgifter",
    2: "Reparationsdetaljer",
    3: "Avslut & Mätvärden"
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center bg-black/40 p-4 sm:p-6 py-10">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-full flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-white z-10 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{record ? "Redigera serviceärende" : "Nytt serviceärende"}</h2>
            <div className="flex items-center gap-2 mt-1">
              {[1, 2, 3].map(s => {
                if (s === 2 && !isRepair) return null;
                return (
                  <div key={s} className={`flex items-center gap-2 ${step === s ? "text-blue-600" : "text-slate-400"}`}>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium ${step === s ? "bg-blue-100" : "bg-slate-100"}`}>
                      {s === 3 && !isRepair ? 2 : s}
                    </div>
                    <span className="text-xs font-medium">{stepTitles[s]}</span>
                    {s !== 3 && <ChevronRight className="w-3 h-3 text-slate-300" />}
                  </div>
                );
              })}
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {step === 1 && (
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1">
                <Label>Kund *</Label>
                <Select value={form.customer_id} onValueChange={handleCustomerChange}>
                  <SelectTrigger><SelectValue placeholder="Välj kund" /></SelectTrigger>
                  <SelectContent>
                    {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-1">
                <Label>Maskin *</Label>
                <Select value={form.machine_id} onValueChange={handleMachineChange} disabled={!form.customer_id}>
                  <SelectTrigger><SelectValue placeholder="Välj maskin" /></SelectTrigger>
                  <SelectContent>
                    {machines
                      .filter(m => m.customer_id === form.customer_id)
                      .map(m => <SelectItem key={m.id} value={m.id}>{m.model} – {m.serial_number}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {currentMachine && (
                <div className="col-span-2 bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm grid grid-cols-3 gap-2">
                  <div>
                    <span className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-0.5">Senaste service</span>
                    <span className="font-medium text-slate-800">{currentMachine.service_date || "Ingen"}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-0.5">Serviceavtal</span>
                    <span className="font-medium text-slate-800">{currentContract === "none" ? "Inget" : (SERVICE_CONTRACTS.find(c => c.value === currentContract)?.label || currentContract)}</span>
                  </div>
                </div>
              )}

              <div className="col-span-2 space-y-1 mt-2">
                <Label>Servicedatum *</Label>
                <Input type="date" value={form.service_date} onChange={e => set("service_date", e.target.value)} />
              </div>

              <div className="col-span-2 space-y-2 mt-4">
                <Label className="text-base">Ärendetyp *</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div 
                    onClick={() => setIsRepair(false)}
                    className={`p-4 border rounded-xl cursor-pointer transition-colors ${!isRepair ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-300'}`}
                  >
                    <div className="font-semibold text-slate-900 mb-1">Standardservice</div>
                    <div className="text-xs text-slate-500">Tillämpar automatiskt rätt avtalsmall och planerar nästa service.</div>
                  </div>
                  <div 
                    onClick={() => setIsRepair(true)}
                    className={`p-4 border rounded-xl cursor-pointer transition-colors ${isRepair ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-300'}`}
                  >
                    <div className="font-semibold text-slate-900 mb-1">Reparation</div>
                    <div className="text-xs text-slate-500">Möjlighet att lägga till reservdelar, arbetskostnad och rabatter.</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && isRepair && (
            <div className="space-y-6">
              {/* Parts */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-base font-semibold">Reservdelar & Moment</Label>
                  <Button size="sm" variant="outline" onClick={addPart}><Plus className="w-3 h-3 mr-1" /> Lägg till rad</Button>
                </div>
                <div className="space-y-2">
                  {form.parts_used.map((part, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2 items-center">
                      <Input className="col-span-8" placeholder="Namn/Moment" value={part.part_name} onChange={e => updatePart(i, "part_name", e.target.value)} />
                      <Input className="col-span-3" type="number" placeholder="Pris (kr)" value={part.unit_price} onChange={e => updatePart(i, "unit_price", parseFloat(e.target.value))} />
                      <Button size="icon" variant="ghost" className="col-span-1 text-red-400 hover:text-red-600" onClick={() => removePart(i)}><Trash2 className="w-3 h-3" /></Button>
                    </div>
                  ))}
                  {form.parts_used.length === 0 && <p className="text-sm text-slate-400 text-center py-4 border rounded-lg border-dashed">Inga delar tillagda</p>}
                </div>
              </div>

              {/* Costs */}
              <div className="grid grid-cols-2 gap-4 border-t pt-4">
                <div className="space-y-1">
                  <Label>Arbetstimmar</Label>
                  <Input type="number" value={form.labor_hours} onChange={e => set("labor_hours", e.target.value === "" ? "" : parseFloat(e.target.value))} placeholder="0" />
                </div>
                <div className="space-y-1">
                  <Label>Timpris (kr/h)</Label>
                  <Input type="number" value={form.hourly_rate} onChange={e => set("hourly_rate", e.target.value === "" ? "" : parseFloat(e.target.value))} placeholder="0" />
                </div>
                <div className="col-span-2 space-y-1">
                  <Label>Arbetskostnad (kr)</Label>
                  <Input type="number" value={form.labor_cost} readOnly className="bg-slate-50 text-slate-600 font-medium" placeholder="0" />
                </div>

                <div className="col-span-2 mt-4">
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-base font-semibold">Övriga kostnadsmoment</Label>
                    <Button size="sm" variant="outline" onClick={addAdditionalCost}><Plus className="w-3 h-3 mr-1" /> Lägg till kostnad</Button>
                  </div>
                  <div className="space-y-2">
                    {form.additional_costs.map((cost, i) => (
                      <div key={i} className="grid grid-cols-12 gap-2 items-center">
                        <Input className="col-span-7" placeholder="Beskrivning (t.ex. Restid, Hotell)" value={cost.description} onChange={e => updateAdditionalCost(i, "description", e.target.value)} />
                        <Input className="col-span-4" type="number" placeholder="Kostnad (kr)" value={cost.cost} onChange={e => updateAdditionalCost(i, "cost", parseFloat(e.target.value))} />
                        <Button size="icon" variant="ghost" className="col-span-1 text-red-400 hover:text-red-600" onClick={() => removeAdditionalCost(i)}><Trash2 className="w-3 h-3" /></Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-1 col-span-1 mt-2">
                  <Label>Rabatt (%)</Label>
                  <Input type="number" min="0" max="100" value={form.discount_percent} onChange={e => set("discount_percent", e.target.value === "" ? "" : parseFloat(e.target.value))} placeholder="0" />
                </div>
              </div>

              {/* Images */}
              <div className="border-t pt-4">
                <Label className="text-base font-semibold mb-3 block">Bilder</Label>
                <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-xl cursor-pointer hover:bg-slate-50 transition-colors text-slate-500 hover:text-slate-700">
                  <Upload className="w-5 h-5" />
                  <span className="text-sm">{uploading ? "Laddar upp..." : "Klicka för att ladda upp bilder"}</span>
                  <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                </label>
                {form.images.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {form.images.map((img, i) => (
                      <div key={i} className="relative group">
                        <img src={img} alt={`Bild ${i+1}`} className="w-20 h-20 object-cover rounded-lg border" />
                        <button onClick={() => removeImage(i)} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 flex items-center justify-center">×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              {!isCreating && (
                <div className="grid grid-cols-2 gap-4 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                  <div className="col-span-2 text-sm font-semibold text-blue-900 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> Mätvärden inför avslut
                  </div>
                  <div className="space-y-1">
                    <Label>Uppmätt lasereffekt (W/J)</Label>
                    <Input value={form.measured_laser_power} onChange={e => set("measured_laser_power", e.target.value)} placeholder="T.ex. 2000W" />
                  </div>
                  <div className="space-y-1">
                    <Label>Antal pulser</Label>
                    <Input type="number" value={form.pulse_count} onChange={e => set("pulse_count", e.target.value === "" ? "" : Number(e.target.value))} placeholder="T.ex. 1500000" />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {!isCreating && (
                  <div className="col-span-2 space-y-1">
                    <Label>Status</Label>
                    <Select value={form.status} onValueChange={v => set("status", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Väntar</SelectItem>
                        <SelectItem value="planned">Planerad</SelectItem>
                        <SelectItem value="awaiting_approval">Inväntar godkännande</SelectItem>
                        <SelectItem value="in_progress">Pågående</SelectItem>
                        <SelectItem value="completed">Slutförd</SelectItem>
                        <SelectItem value="invoiced">Fakturerad</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="col-span-2 space-y-1">
                  <Label>Nästa servicedatum</Label>
                  <Input type="date" value={form.next_service_date} onChange={e => set("next_service_date", e.target.value)} />
                  {!isRepair && <p className="text-xs text-slate-500 mt-1">Sattes automatiskt till 1 år framåt från servicedatumet.</p>}
                </div>

                <div className="col-span-2 space-y-1">
                  <Label>Tekniker</Label>
                  <Select value={form.technician_name} onValueChange={v => set("technician_name", v)}>
                    <SelectTrigger><SelectValue placeholder="Välj tekniker" /></SelectTrigger>
                    <SelectContent>
                      {technicians.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-2 space-y-1">
                  <Label>Beskrivning av utfört arbete</Label>
                  <Textarea value={form.description} onChange={e => set("description", e.target.value)} placeholder="Beskriv vad som utfördes..." rows={6} />
                </div>
              </div>

              {isRepair && (
                <div className="p-3 bg-slate-50 rounded-lg flex items-center justify-between border">
                  <span className="text-sm text-slate-600">Beräknad totalkostnad</span>
                  <span className="font-bold text-lg text-slate-900">{calcTotal().toLocaleString("sv-SE")} kr</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex justify-between items-center p-6 border-t bg-slate-50 shrink-0 rounded-b-2xl">
          <Button variant="outline" onClick={() => step > 1 ? setStep(step === 3 && !isRepair ? 1 : step - 1) : onClose()}>
            {step === 1 ? "Avbryt" : <><ChevronLeft className="w-4 h-4 mr-1" /> Föregående</>}
          </Button>

          {step < 3 ? (
            <Button onClick={() => step === 1 ? handleNextFromStep1() : setStep(3)} className="bg-blue-600 hover:bg-blue-700" disabled={step === 1 && (!form.machine_id || !form.customer_id || !form.service_date)}>
              Nästa steg <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700 text-white">
              {isCreating ? "Skapa ärende" : "Spara ändringar"}
            </Button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}