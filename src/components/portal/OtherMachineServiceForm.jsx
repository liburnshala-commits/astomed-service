import { useState } from "react";
import { X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";

export default function OtherMachineServiceForm({ customerId, onClose, onSubmitted }) {
  const [form, setForm] = useState({
    machine_name: "",
    manufacturer: "",
    service_description: "",
    service_type: "standard"
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      // Create a service record note with the other machine info
      const note = `Serviceförfrågan för annan maskin:\n\nMaskintyp: ${form.machine_name}\nTillverkare: ${form.manufacturer}\nBeskrivning: ${form.service_description}`;
      
      await base44.entities.ServiceRecord.create({
        customer_id: customerId,
        machine_id: "",
        service_type: form.service_type,
        service_date: new Date().toISOString().split("T")[0],
        description: note,
        status: "pending"
      });

      setSuccess(true);
      setTimeout(() => {
        onSubmitted();
        onClose();
      }, 2000);
    } catch (error) {
      console.error("Error submitting service request:", error);
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 text-center">
          <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "#e8f2f2" }}>
            <Send className="w-6 h-6" style={{ color: "#3a9e9e" }} />
          </div>
          <h2 className="text-lg font-bold astomed-title mb-2">Förfrågan skickad!</h2>
          <p className="astomed-subtitle text-sm">Astomed kommer att kontakta dig snart angående servicen för din maskin.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
          <h2 className="text-lg font-bold astomed-title">Serviceförfrågan – Annan maskin</h2>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-1">
            <Label>Maskintyp *</Label>
            <Input 
              value={form.machine_name} 
              onChange={e => set("machine_name", e.target.value)} 
              placeholder="T.ex. Laser, IPL, Ultraljud..." 
            />
          </div>

          <div className="space-y-1">
            <Label>Tillverkare</Label>
            <Input 
              value={form.manufacturer} 
              onChange={e => set("manufacturer", e.target.value)} 
              placeholder="T.ex. Candela, Synergon..." 
            />
          </div>

          <div className="space-y-1">
            <Label>Servicetyp *</Label>
            <Select value={form.service_type} onValueChange={v => set("service_type", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard service</SelectItem>
                <SelectItem value="advanced">Avancerad service</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label>Beskrivning av serviceärende *</Label>
            <Textarea 
              value={form.service_description} 
              onChange={e => set("service_description", e.target.value)} 
              placeholder="Beskriv vad som behöver åtgärdas..." 
              rows={4}
            />
          </div>

          <p className="text-xs astomed-muted p-3 rounded-lg" style={{ background: "#f4f9f9" }}>
            Astomed kommer att granska din förfrågan och kontakta dig för att diskutera möjligheterna för service på din maskin.
          </p>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t bg-slate-50 rounded-b-2xl">
          <Button variant="outline" onClick={onClose}>Avbryt</Button>
          <Button 
            onClick={handleSubmit} 
            className="bg-blue-600 hover:bg-blue-700"
            disabled={!form.machine_name || !form.service_description || submitting}
          >
            {submitting ? "Skickar..." : "Skicka förfrågan"}
          </Button>
        </div>
      </div>
    </div>
  );
}