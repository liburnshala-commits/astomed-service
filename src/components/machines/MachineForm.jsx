import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileText, Trash2, Loader2 } from "lucide-react";
import { machineServiceDetails } from "../MachineServiceDetails";
import { base44 } from "@/api/base44Client";
import { MACHINE_MODELS } from "@/lib/constants";

const isCustomModel = (model) => model && !MACHINE_MODELS.includes(model);

export default function MachineForm({ machine, customers, preselectedCustomerId, onSave, onClose }) {
  const existingIsCustom = machine?.model ? isCustomModel(machine.model) : false;

  const [form, setForm] = useState({
    model: existingIsCustom ? "Annan" : (machine?.model || ""),
    custom_model: existingIsCustom ? machine.model : "",
    manufacturer: machine?.manufacturer || "",
    serial_number: machine?.serial_number || "",
    customer_id: machine?.customer_id || preselectedCustomerId || "",
    service_date: machine?.service_date || "",
    warranty_expiry: machine?.warranty_expiry || "",
    status: machine?.status || "active",
    service_contract: machine?.service_contract || "none",
    notes: machine?.notes || "",
    documents: machine?.documents || []
  });

  const [uploadingDoc, setUploadingDoc] = useState(false);
  
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingDoc(true);
    try {
      const res = await base44.integrations.Core.UploadFile({ file });
      if (res?.file_url) {
        setForm(prev => ({
          ...prev,
          documents: [...(prev.documents || []), { name: file.name, url: res.file_url }]
        }));
      }
    } catch (err) {
      console.error("Fel vid uppladdning", err);
      alert("Kunde inte ladda upp filen.");
    } finally {
      setUploadingDoc(false);
      e.target.value = "";
    }
  };

  const removeDocument = (index) => {
    setForm(prev => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index)
    }));
  };

  const currentCustomer = customers.find(c => c.id === form.customer_id);
  const [customerContact, setCustomerContact] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");

  useEffect(() => {
    if (currentCustomer) {
      setCustomerContact(currentCustomer.contact_person || "");
      setCustomerEmail(currentCustomer.email || "");
    } else {
      setCustomerContact("");
      setCustomerEmail("");
    }
  }, [currentCustomer?.id]);

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSave = () => {
    if (currentCustomer && (currentCustomer.contact_person !== customerContact || currentCustomer.email !== customerEmail)) {
      base44.entities.Customer.update(currentCustomer.id, { 
        contact_person: customerContact || null, 
        email: customerEmail || null 
      }).catch(console.error);
    }

    const saveData = { ...form };
    if (form.model === "Annan") {
      saveData.model = form.custom_model;
    }
    delete saveData.custom_model;
    onSave(saveData);
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center bg-black/40 p-4 sm:p-6 py-10">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-full flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b bg-white shrink-0">
          <h2 className="text-lg font-bold text-slate-900">{machine ? "Redigera maskin" : "Ny maskin"}</h2>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
        </div>
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1">
              <Label>Modell *</Label>
              <Select value={form.model} onValueChange={v => set("model", v)}>
                <SelectTrigger><SelectValue placeholder="Välj modell" /></SelectTrigger>
                <SelectContent>
                  {MACHINE_MODELS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  <SelectItem value="Annan">Annan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.model === "Annan" && (
              <>
                <div className="col-span-2 space-y-1">
                  <Label>Maskinnamn *</Label>
                  <Input value={form.custom_model} onChange={e => set("custom_model", e.target.value)} placeholder="Ange maskinens namn" />
                </div>
                <div className="col-span-2 space-y-1">
                  <Label>Tillverkare</Label>
                  <Input value={form.manufacturer} onChange={e => set("manufacturer", e.target.value)} placeholder="Ange tillverkare" />
                </div>
              </>
            )}
            {form.model && form.model !== "Annan" && (
              <div className="col-span-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-2">
                  {machineServiceDetails[form.model]?.title || `Servicebeskrivning för ${form.model}`}
                </h3>
                <ul className="space-y-2 text-sm text-blue-800">
                  {(machineServiceDetails[form.model]?.details || ["Service och underhåll enligt tillverkarens specifikationer", "Kontakta oss för mer information"]).map((detail, idx) => (
                    <li key={idx} className="flex gap-2">
                      <span className="text-blue-600">•</span>
                      <span dangerouslySetInnerHTML={{ __html: detail }} />
                    </li>
                  ))}
                </ul>
                {machineServiceDetails[form.model]?.additionalInfo && (
                  <div className="mt-3 pt-3 border-t border-blue-300">
                    <p className="text-sm font-semibold text-blue-900">
                      {machineServiceDetails[form.model].additionalInfo}
                    </p>
                  </div>
                )}
              </div>
            )}
            <div className="col-span-2 space-y-1">
              <Label>Serienummer *</Label>
              <Input value={form.serial_number} onChange={e => set("serial_number", e.target.value)} placeholder="SN-XXXXXX" />
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Kund *</Label>
              <Select value={form.customer_id} onValueChange={v => set("customer_id", v)}>
                <SelectTrigger><SelectValue placeholder="Välj kund" /></SelectTrigger>
                <SelectContent>
                  {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {currentCustomer && (
              <div className="col-span-2 bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm grid grid-cols-2 gap-2 items-center">
                <div>
                  <span className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-0.5">Referensperson (Kund)</span>
                  <Input 
                    type="text" 
                    className="h-7 text-xs px-2 w-full bg-white" 
                    placeholder="T.ex. Anna Andersson"
                    value={customerContact} 
                    onChange={e => setCustomerContact(e.target.value)} 
                  />
                </div>
                <div>
                  <span className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-0.5">E-postadress (Kund)</span>
                  <Input 
                    type="email" 
                    className="h-7 text-xs px-2 w-full bg-white" 
                    placeholder="anna@exempel.se"
                    value={customerEmail} 
                    onChange={e => setCustomerEmail(e.target.value)} 
                  />
                </div>
              </div>
            )}
            <div className="space-y-1">
              <Label>Senaste servicedatum</Label>
              <Input type="date" value={form.service_date} onChange={e => set("service_date", e.target.value)} />
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Garanti till</Label>
              <Input type="date" value={form.warranty_expiry} onChange={e => set("warranty_expiry", e.target.value)} />
            </div>
            {/* Service contract management moved to dedicated flow */}
            <div className="col-span-2 space-y-1">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Aktiv</SelectItem>
                  <SelectItem value="inactive">Inaktiv</SelectItem>
                  <SelectItem value="service">På service</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Anteckningar</Label>
              <Textarea value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Övriga anteckningar..." rows={3} />
            </div>
            
            <div className="col-span-2 space-y-2 mt-2 p-4 border border-slate-200 rounded-lg bg-slate-50">
              <div className="flex items-center justify-between">
                <Label className="font-semibold text-slate-800">Dokument & Filer (t.ex. PDF-manualer)</Label>
                <div className="relative">
                  <Input 
                    type="file" 
                    accept=".pdf,.doc,.docx"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                    onChange={handleFileUpload} 
                    disabled={uploadingDoc}
                  />
                  <Button type="button" size="sm" variant="outline" disabled={uploadingDoc}>
                    {uploadingDoc ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                    Ladda upp fil
                  </Button>
                </div>
              </div>
              
              {form.documents?.length > 0 && (
                <div className="space-y-2 mt-3">
                  {form.documents.map((doc, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-white rounded border border-slate-200 text-sm">
                      <div className="flex items-center gap-2 truncate">
                        <FileText className="w-4 h-4 text-blue-500 flex-shrink-0" />
                        <span className="truncate text-slate-700">{doc.name}</span>
                      </div>
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeDocument(idx)} className="text-red-500 hover:bg-red-50 h-8 w-8 p-0">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 p-6 border-t bg-slate-50 shrink-0 rounded-b-2xl">
          <Button variant="outline" onClick={onClose}>Avbryt</Button>
          <Button onClick={handleSave} className="astomed-btn-primary" disabled={!form.model || (form.model === "Annan" && !form.custom_model) || !form.serial_number || !form.customer_id}>
            {machine ? "Spara ändringar" : "Registrera maskin"}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}