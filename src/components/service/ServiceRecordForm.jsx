import { useState, useEffect } from "react";
import { X, Plus, Trash2, Upload, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";

const SERVICE_CONTRACTS = [
  {
    value: "none",
    label: "Inget Serviceavtal",
    description: "Service utan avtal – ordinarie priser tillämpas.",
    features: [
      "Reservdelar debiteras enligt Astomeds ordinarie prislista.",
      "Restid debiteras enligt ordinarie taxa baserat på avstånd och tidsåtgång.",
      "Timpris för service och arbete utgår enligt gällande standardpris.",
      "Ingen prioritering vid akuta serviceärenden.",
      "Kontakt: 08-410 77 900 | kontakt@astomed.se | www.astomed.se/service"
    ]
  },
  {
    value: "basic",
    label: "BAS – Astomed 3.0",
    interval: "Var 12:e månad",
    description: "Serviceavtal & Framtidssäkring: Astomed 3.0\n\nDin partner för teknisk drift, juridisk trygghet och klinisk kompetens sedan 2005.\n\nMed de nya föreskrifterna från Strålsäkerhetsmyndigheten (SSM) som träder i kraft 2026, blir regelbunden service och dokumentation avgörande för att få driva din klinik vidare. Astomed erbjuder serviceavtal eller service utan avtal för att säkerställa att du uppfyller kraven på anmälningsplikt, leveranskontroll och personalkompetens.",
    features: [
      "STANDARD: Drift & Trygghet – Säkerställer hög drifttid och att personalen är med tekniken enligt de nya kraven.",
      "Intervall: Var 12:e månad.",
      "Prestandakontroll: Mätning av uteffekt och kalibrering för att minimera risk för skador.",
      "Lokalanalys: Rådgivning kring rummets lasersäkerhet (reflekterande ytor och strålskydd).",
      "Support: Fri teknisk rådgivning via telefon och fjärrsupport under avtalstiden.",
      "Egen Serviceverkstad: Vi har erfarna tekniker och ett komplett reservdelslager i Norden.",
      "Juridiskt stöd: Vi förser dig med den dokumentation som krävs för din anmälan till SSM.",
      "Utbildning i världsklass: Vi ser till att din personal inte bara kan hantera maskinen, utan förstår fysiken och säkerheten bakom.",
      "Kontakt: 08-410 77 900 | kontakt@astomed.se | www.astomed.se/service"
    ]
  }
];

export default function ServiceRecordForm({ record, machines, customers, preselectedMachineId, onSave, onClose }) {
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
    service_contract: record?.service_contract || ""
  });

  const [invoiceError, setInvoiceError] = useState(null);

  const currentMachine = machines.find(m => m.id === form.machine_id);
  const currentContract = currentMachine?.service_contract || "none";

  const handleStatusChange = (v) => {
    if (v === "completed" || v === "invoiced") {
      const missing = [];
      if (!form.technician_name) missing.push("Tekniker");
      // Only require labor hours and cost if no service contract and it's a repair
      if (currentContract === "none" && selectedTemplate === "only_repair") {
        if (!form.labor_hours && form.labor_hours !== 0) missing.push("Arbetstimmar");
        if (!form.labor_cost && form.labor_cost !== 0) missing.push("Arbetskostnad");
      }
      if (missing.length > 0) {
        setInvoiceError(`Fakturaunderlag saknas: ${missing.join(", ")}`);
        return;
      }
    }
    setInvoiceError(null);
    set("status", v);
  };

  const [serialInput, setSerialInput] = useState(() => {
    if (record?.machine_id) {
      const m = machines.find(m => m.id === record.machine_id);
      return m?.serial_number || "";
    }
    if (preselectedMachine) return preselectedMachine.serial_number || "";
    return "";
  });
  const [serialMatch, setSerialMatch] = useState(null); // null | "found" | "not_found"
  const [uploading, setUploading] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState("only_repair");

  useEffect(() => {
    base44.entities.ServiceAgreementTemplate.list().then(setTemplates).catch(console.error);
  }, []);

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
      // Hitta och ta bort moment som kommer från någon mall (bevara manuella)
      const allTemplateServices = new Set(templates.flatMap(t => t.included_services || []));
      const manualParts = prev.parts_used.filter(p => !allTemplateServices.has(p.part_name));
      
      // Rensa bort gamla mall-texter från beskrivningen
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

  const handleSerialChange = (value) => {
    setSerialInput(value);
    const machine = machines.find(m => m.serial_number?.toLowerCase() === value.trim().toLowerCase());
    if (machine) {
      setSerialMatch("found");
      setForm(prev => ({ ...prev, machine_id: machine.id, customer_id: machine.customer_id || prev.customer_id }));
    } else {
      setSerialMatch(value.trim().length > 0 ? "not_found" : null);
      setForm(prev => ({ ...prev, machine_id: "", customer_id: "" }));
    }
  };

  // Auto-fill customer when machine is selected from dropdown
  const handleMachineChange = (machineId) => {
    const machine = machines.find(m => m.id === machineId);
    setSerialInput(machine?.serial_number || "");
    setSerialMatch(machine ? "found" : null);
    setForm(prev => ({ ...prev, machine_id: machineId, customer_id: machine?.customer_id || prev.customer_id }));
  };

  const addPart = () => {
    setForm(prev => ({
      ...prev,
      parts_used: [...prev.parts_used, { part_name: "", part_number: "", quantity: 1, unit_price: 0 }]
    }));
  };

  const updatePart = (i, field, value) => {
    const parts = [...form.parts_used];
    parts[i] = { ...parts[i], [field]: value };
    setForm(prev => ({ ...prev, parts_used: parts }));
  };

  const removePart = (i) => {
    setForm(prev => ({ ...prev, parts_used: prev.parts_used.filter((_, idx) => idx !== i) }));
  };

  const addAdditionalCost = () => {
    setForm(prev => ({
      ...prev,
      additional_costs: [...prev.additional_costs, { description: "", cost: 0 }]
    }));
  };

  const updateAdditionalCost = (i, field, value) => {
    const costs = [...form.additional_costs];
    costs[i] = { ...costs[i], [field]: value };
    setForm(prev => ({ ...prev, additional_costs: costs }));
  };

  const removeAdditionalCost = (i) => {
    setForm(prev => ({ ...prev, additional_costs: prev.additional_costs.filter((_, idx) => idx !== i) }));
  };

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

  const removeImage = (i) => {
    setForm(prev => ({ ...prev, images: prev.images.filter((_, idx) => idx !== i) }));
  };

  const calcTotal = () => {
    const partsTotal = selectedTemplate === "only_repair" 
      ? form.parts_used.reduce((sum, p) => sum + ((p.unit_price || 0) * (p.quantity || 1)), 0)
      : 0;
    const additionalTotal = form.additional_costs.reduce((sum, c) => sum + (parseFloat(c.cost) || 0), 0);
    const laborTotal = selectedTemplate === "only_repair" ? (parseFloat(form.labor_cost) || 0) : 0;
    const manualCost = parseFloat(form.manual_price) || 0;
    const baseTotal = partsTotal + additionalTotal + laborTotal + manualCost;
    const discount = parseFloat(form.discount_percent) || 0;
    return Math.round(baseTotal * (1 - (discount / 100)));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
          <h2 className="text-lg font-bold text-slate-900">{record ? "Redigera serviceärende" : "Nytt serviceärende"}</h2>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
        </div>
        <div className="p-6 space-y-6">
          {currentContract && currentContract !== "none" && (() => {
            const contractInfo = SERVICE_CONTRACTS.find(c => c.value === currentContract);
            if (!contractInfo) return null;
            return (
              <div className="p-4 rounded-xl border" style={{ background: "#f4fafa", borderColor: "#dce8e8" }}>
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className="w-5 h-5" style={{ color: "#3a9e9e" }} />
                  <span className="font-semibold" style={{ color: "#1b3a3a" }}>Aktivt serviceavtal: {contractInfo.label}</span>
                </div>
                <p className="text-sm text-slate-600 ml-7">Denna maskin omfattas av ett serviceavtal. Arbetskostnad och arbetstimmar behöver inte anges för fakturering.</p>
              </div>
            );
          })()}
          {/* Basic info */}
          <div className="grid grid-cols-2 gap-4">
            {/* Serial number lookup */}
            <div className="col-span-2 space-y-1">
              <Label>Serienummer</Label>
              <div className="relative">
                <Input
                  value={serialInput}
                  onChange={e => handleSerialChange(e.target.value)}
                  placeholder="Ange serienummer..."
                  className={serialMatch === "found" ? "border-green-400 focus-visible:ring-green-400" : serialMatch === "not_found" ? "border-orange-400 focus-visible:ring-orange-400" : ""}
                />
                {serialMatch === "found" && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-green-600 font-medium">✓ Maskin hittad</span>}
                {serialMatch === "not_found" && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-orange-500 font-medium">Ej registrerad</span>}
              </div>
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Maskin *</Label>
              <Select value={form.machine_id} onValueChange={handleMachineChange}>
                <SelectTrigger><SelectValue placeholder="Välj maskin" /></SelectTrigger>
                <SelectContent>
                  {machines.map(m => <SelectItem key={m.id} value={m.id}>{m.model} – {m.serial_number}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Kund</Label>
              <Select value={form.customer_id} onValueChange={v => set("customer_id", v)}>
                <SelectTrigger><SelectValue placeholder="Välj kund" /></SelectTrigger>
                <SelectContent>
                  {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={handleStatusChange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Väntar</SelectItem>
                  <SelectItem value="awaiting_approval">Inväntar godkännande</SelectItem>
                  <SelectItem value="in_progress">Pågående</SelectItem>
                  <SelectItem value="completed">Slutförd</SelectItem>
                  <SelectItem value="invoiced">Fakturerad</SelectItem>
                </SelectContent>
              </Select>
              {invoiceError && (
                <p className="text-xs text-red-600 mt-1 bg-red-50 border border-red-200 rounded px-2 py-1">{invoiceError}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label>Servicedatum *</Label>
              <Input type="date" value={form.service_date} onChange={e => set("service_date", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Nästa servicedatum</Label>
              <Input type="date" value={form.next_service_date} onChange={e => set("next_service_date", e.target.value)} />
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
              <Textarea value={form.description} onChange={e => set("description", e.target.value)} placeholder="Beskriv vad som utfördes..." rows={4} />
            </div>
          </div>

          {/* Apply Template */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <Label className="text-sm font-semibold text-slate-800">Fyll i moment från serviceavtalsmall</Label>
            <div className="flex gap-2">
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger className="bg-white"><SelectValue placeholder="Välj serviceavtalsmall..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="only_repair">Endast reparation - ange servicemoment nedan</SelectItem>
                  {templates.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button 
                variant="outline" 
                onClick={() => applyTemplate(selectedTemplate)}
                disabled={!selectedTemplate || selectedTemplate === "only_repair"}
                className="shrink-0 bg-white"
              >
                Applicera moment
              </Button>
            </div>
            <p className="text-xs text-slate-500">
              Detta lägger automatiskt till mallens inkluderade tjänster i listan nedan, redo att checkas av eller prissättas.
            </p>
          </div>

          {/* Parts */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-base font-semibold">Reservdelar & Moment</Label>
              <Button size="sm" variant="outline" onClick={addPart}><Plus className="w-3 h-3 mr-1" /> Lägg till rad</Button>
            </div>
            <div className="space-y-2">
              {form.parts_used.map((part, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center">
                  <Input className={selectedTemplate === "only_repair" ? "col-span-8" : "col-span-11"} placeholder="Namn/Moment" value={part.part_name} onChange={e => updatePart(i, "part_name", e.target.value)} />
                  {selectedTemplate === "only_repair" && (
                    <Input className="col-span-3" type="number" placeholder="Pris (kr)" value={part.unit_price} onChange={e => updatePart(i, "unit_price", parseFloat(e.target.value))} />
                  )}
                  <Button size="icon" variant="ghost" className="col-span-1 text-red-400 hover:text-red-600" onClick={() => removePart(i)}><Trash2 className="w-3 h-3" /></Button>
                </div>
              ))}
              {form.parts_used.length === 0 && <p className="text-sm text-slate-400 text-center py-4 border rounded-lg border-dashed">Inga delar tillagda</p>}
            </div>
          </div>

          {/* Costs */}
          <div className="grid grid-cols-2 gap-4">
            {selectedTemplate === "only_repair" && (
              <>
                <div className="space-y-1">
                  <Label>Arbetstimmar{currentContract === "none" && " *"}</Label>
                  <Input type="number" value={form.labor_hours} onChange={e => set("labor_hours", e.target.value === "" ? "" : parseFloat(e.target.value))} placeholder="0" />
                  {currentContract === "none" && (
                    <p className="text-xs text-slate-500">Oblig. utan avtal</p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label>Timpris (kr/h){currentContract === "none" && " *"}</Label>
                  <Input type="number" value={form.hourly_rate} onChange={e => set("hourly_rate", e.target.value === "" ? "" : parseFloat(e.target.value))} placeholder="0" />
                  {currentContract === "none" && (
                    <p className="text-xs text-slate-500">Oblig. utan avtal</p>
                  )}
                </div>
                <div className="col-span-2 space-y-1">
                  <Label>Arbetskostnad (kr)</Label>
                  <Input type="number" value={form.labor_cost} readOnly className="bg-slate-50 text-slate-600 font-medium" placeholder="0" />
                  <p className="text-xs text-slate-500">Beräknas automatiskt (Timmar × Timpris)</p>
                </div>
              </>
            )}

            <div className="col-span-2 mt-2">
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
                {form.additional_costs.length === 0 && <p className="text-sm text-slate-400 text-center py-4 border rounded-lg border-dashed">Inga övriga kostnader tillagda</p>}
              </div>
            </div>

            <div className="space-y-1 col-span-1 mt-2">
              <Label>Rabatt (%)</Label>
              <Input type="number" min="0" max="100" value={form.discount_percent} onChange={e => set("discount_percent", e.target.value === "" ? "" : parseFloat(e.target.value))} placeholder="0" />
            </div>
            <div className="space-y-1 col-span-1 mt-2">
              <Label>Faktisk kostnad (kr)</Label>
              <Input type="number" value={form.manual_price} onChange={e => set("manual_price", e.target.value === "" ? "" : parseFloat(e.target.value))} placeholder="0" />
            </div>

            <div className="col-span-2 p-3 bg-slate-50 rounded-lg flex items-center justify-between mt-2">
              <span className="text-sm text-slate-600">Beräknad totalkostnad</span>
              <span className="font-bold text-lg text-slate-900">{calcTotal().toLocaleString("sv-SE")} kr</span>
            </div>
          </div>

          {/* Images */}
          <div>
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

        <div className="flex justify-end gap-3 p-6 border-t bg-slate-50 rounded-b-2xl">
          <Button variant="outline" onClick={onClose}>Avbryt</Button>
          {record && calcTotal() > 0 && !record.quote_sent && (
            <Button
              variant="outline"
              className="border-amber-400 text-amber-700 hover:bg-amber-50"
              onClick={() => {
                const { manual_price, ...submitForm } = form;
                onSave({
                  ...submitForm,
                  labor_hours: form.labor_hours === "" ? undefined : Number(form.labor_hours),
                  hourly_rate: form.hourly_rate === "" ? undefined : Number(form.hourly_rate),
                  labor_cost: form.labor_cost === "" ? undefined : Number(form.labor_cost),
                  total_cost: calcTotal(),
                  discount_percent: form.discount_percent === "" ? 0 : Number(form.discount_percent),
                  next_service_date: form.next_service_date || undefined,
                  status: "awaiting_approval",
                  quote_sent: true,
                  quote_approved: "pending"
                });
              }}
            >
              Spara & skicka kostnadsförslag till kund
            </Button>
          )}
          <Button onClick={() => {
            const { manual_price, ...submitForm } = form;
            onSave({
              ...submitForm,
              labor_hours: form.labor_hours === "" ? undefined : Number(form.labor_hours),
              hourly_rate: form.hourly_rate === "" ? undefined : Number(form.hourly_rate),
              labor_cost: form.labor_cost === "" ? undefined : Number(form.labor_cost),
              total_cost: calcTotal(),
              discount_percent: form.discount_percent === "" ? 0 : Number(form.discount_percent),
              next_service_date: form.next_service_date || undefined
            });
          }} className="bg-blue-600 hover:bg-blue-700" disabled={!form.machine_id || !form.customer_id || !form.service_date}>
            {record ? "Spara ändringar" : "Skapa ärende"}
          </Button>
        </div>
      </div>
    </div>
  );
}