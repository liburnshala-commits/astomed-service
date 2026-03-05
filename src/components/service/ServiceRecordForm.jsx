import { useState } from "react";
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
    label: "Inget avtal",
    description: null,
    features: []
  },
  {
    value: "basic",
    label: "BAS – Regelefterlevnad",
    interval: "Var 24:e månad",
    description: "Fokus på att uppfylla de lagstadgade kraven för anmälningsplikt till lägsta möjliga kostnad.",
    features: [
      "Säkerhetskontroll – Teknisk genomgång av maskinens säkerhetsfunktioner",
      "Dokumentation – Serviceprotokoll inför myndighetstillsyn",
      "Filterservice – Grundläggande funktionskontroll och rengöring av filterenheter"
    ]
  },
  {
    value: "standard",
    label: "STANDARD – Drift & Trygghet",
    interval: "Var 12:e månad",
    badge: "Rekommenderas",
    description: "Säkerställer hög drifttid och att personalen är \"väl förtrogen\" med tekniken enligt de nya kraven.",
    features: [
      "Allt i BAS ingår",
      "Prestandakontroll – Mätning av uteffekt och kalibrering",
      "Lokalanalys – Rådgivning kring rummets lasersäkerhet",
      "Support – Fri teknisk rådgivning via telefon och fjärrsupport"
    ]
  },
  {
    value: "premium",
    label: "PREMIUM – Total Partner",
    interval: "Var 6:e månad (eller var 3:e vid hög belastning)",
    description: "All-inclusive-lösning för kliniker med hög belastning som kräver maximal trygghet.",
    features: [
      "Allt i STANDARD ingår",
      "Certifierande Utbildning – Årlig privat utbildning på plats",
      "Prioriterad Service – Garanterad teknikerrespons inom 24–48 timmar",
      "Lånemaskin – Tillgång till ersättningsutrustning vid servicebehov",
      "Förmåner – Rabatterade priser på filter, tippar och förbrukningsvaror"
    ]
  }
];

const TECHNICIANS = [
  "Anders Karlsson",
  "Erik Lindström",
  "Maria Johansson",
  "Peter Svensson",
  "Sara Nilsson",
];

export default function ServiceRecordForm({ record, machines, customers, preselectedMachineId, onSave, onClose }) {
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
    labor_cost: record?.labor_cost || "",
    total_cost: record?.total_cost || "",
    status: record?.status || "pending",
    next_service_date: record?.next_service_date || "",
    images: record?.images || [],
    service_contract: record?.service_contract || ""
  });

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

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

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
    const partsTotal = form.parts_used.reduce((sum, p) => sum + ((p.unit_price || 0) * (p.quantity || 1)), 0);
    return partsTotal + (parseFloat(form.labor_cost) || 0);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
          <h2 className="text-lg font-bold text-slate-900">{record ? "Redigera serviceärende" : "Nytt serviceärende"}</h2>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
        </div>
        <div className="p-6 space-y-6">
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
              <Label>Servicetyp *</Label>
              <Select value={form.service_type} onValueChange={v => set("service_type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standardservice</SelectItem>
                  <SelectItem value="advanced">Avancerad service</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Väntar</SelectItem>
                  <SelectItem value="in_progress">Pågående</SelectItem>
                  <SelectItem value="completed">Slutförd</SelectItem>
                  <SelectItem value="invoiced">Fakturerad</SelectItem>
                </SelectContent>
              </Select>
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
              <Label>Serviceavtal</Label>
              <Select value={form.service_contract} onValueChange={v => set("service_contract", v)}>
                <SelectTrigger><SelectValue placeholder="Välj serviceavtal" /></SelectTrigger>
                <SelectContent>
                  {SERVICE_CONTRACTS.map(c => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.service_contract && form.service_contract !== "none" && (() => {
                const contract = SERVICE_CONTRACTS.find(c => c.value === form.service_contract);
                if (!contract) return null;
                return (
                  <div className="mt-2 p-3 rounded-xl border" style={{ background: "#f4fafa", borderColor: "#dce8e8" }}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold astomed-label">{contract.label}</span>
                      {contract.badge && <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold" style={{ background: "#3a9e9e", color: "#fff" }}>{contract.badge}</span>}
                      {contract.interval && <span className="text-xs astomed-muted ml-auto">{contract.interval}</span>}
                    </div>
                    <p className="text-xs astomed-subtitle mb-2">{contract.description}</p>
                    <ul className="space-y-1">
                      {contract.features.map((f, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-xs astomed-subtitle">
                          <CheckCircle2 className="w-3 h-3 mt-0.5 flex-shrink-0" style={{ color: "#3a9e9e" }} />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })()}
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Tekniker</Label>
              <Select value={form.technician_name} onValueChange={v => set("technician_name", v)}>
                <SelectTrigger><SelectValue placeholder="Välj tekniker" /></SelectTrigger>
                <SelectContent>
                  {TECHNICIANS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Beskrivning av utfört arbete</Label>
              <Textarea value={form.description} onChange={e => set("description", e.target.value)} placeholder="Beskriv vad som utfördes..." rows={4} />
            </div>
          </div>

          {/* Parts */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-base font-semibold">Reservdelar</Label>
              <Button size="sm" variant="outline" onClick={addPart}><Plus className="w-3 h-3 mr-1" /> Lägg till del</Button>
            </div>
            <div className="space-y-2">
              {form.parts_used.map((part, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center">
                  <Input className="col-span-4" placeholder="Delnamn" value={part.part_name} onChange={e => updatePart(i, "part_name", e.target.value)} />
                  <Input className="col-span-3" placeholder="Art.nr" value={part.part_number} onChange={e => updatePart(i, "part_number", e.target.value)} />
                  <Input className="col-span-2" type="number" placeholder="Antal" value={part.quantity} onChange={e => updatePart(i, "quantity", parseFloat(e.target.value))} />
                  <Input className="col-span-2" type="number" placeholder="à-pris" value={part.unit_price} onChange={e => updatePart(i, "unit_price", parseFloat(e.target.value))} />
                  <Button size="icon" variant="ghost" className="col-span-1 text-red-400 hover:text-red-600" onClick={() => removePart(i)}><Trash2 className="w-3 h-3" /></Button>
                </div>
              ))}
              {form.parts_used.length === 0 && <p className="text-sm text-slate-400 text-center py-4 border rounded-lg border-dashed">Inga delar tillagda</p>}
            </div>
          </div>

          {/* Costs */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Arbetstimmar</Label>
              <Input type="number" value={form.labor_hours} onChange={e => set("labor_hours", e.target.value === "" ? "" : parseFloat(e.target.value))} placeholder="0" />
            </div>
            <div className="space-y-1">
              <Label>Arbetskostnad (kr)</Label>
              <Input type="number" value={form.labor_cost} onChange={e => set("labor_cost", e.target.value === "" ? "" : parseFloat(e.target.value))} placeholder="0" />
            </div>
            <div className="col-span-2 p-3 bg-slate-50 rounded-lg flex items-center justify-between">
              <span className="text-sm text-slate-600">Beräknad totalkostnad</span>
              <span className="font-bold text-lg text-slate-900">{calcTotal().toLocaleString("sv-SE")} kr</span>
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Faktisk totalkostnad (kr)</Label>
              <Input type="number" value={form.total_cost} onChange={e => set("total_cost", parseFloat(e.target.value))} placeholder={calcTotal().toString()} />
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
          <Button onClick={() => onSave({
            ...form,
            labor_hours: form.labor_hours === "" ? undefined : Number(form.labor_hours),
            labor_cost: form.labor_cost === "" ? undefined : Number(form.labor_cost),
            total_cost: form.total_cost === "" ? calcTotal() : Number(form.total_cost) || calcTotal()
          })} className="bg-blue-600 hover:bg-blue-700" disabled={!form.machine_id || !form.customer_id || !form.service_date}>
            {record ? "Spara ändringar" : "Skapa ärende"}
          </Button>
        </div>
      </div>
    </div>
  );
}