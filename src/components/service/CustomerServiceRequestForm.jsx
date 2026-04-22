import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Wrench, Upload, CheckCircle } from "lucide-react";
import { createPortal } from "react-dom";

export default function CustomerServiceRequestForm({ machines, customer, onClose, onSaved }) {
  const [machineId, setMachineId] = useState(machines.length === 1 ? machines[0].id : "");
  const [description, setDescription] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [lastServiceDate, setLastServiceDate] = useState("");
  const [image, setImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const selectedMachine = machines.find(m => m.id === machineId);

  const handleMachineChange = (id) => {
    setMachineId(id);
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setImage(file_url);
    setUploading(false);
  };

  const handleSubmit = async () => {
    if (!machineId) return;
    setLoading(true);
    try {
      let finalDescription = description.trim();
      if (preferredDate) {
        finalDescription += `\n\nÖnskat datum för service: ${preferredDate}`;
      }
      if (lastServiceDate) {
        finalDescription += `\nKänd senaste servicedatum: ${lastServiceDate}`;
      }

      const newRecord = await base44.entities.ServiceRecord.create({
        machine_id: machineId,
        customer_id: customer.id,
        service_type: "standard",
        service_date: preferredDate || new Date().toISOString().split("T")[0],
        description: finalDescription,
        status: "pending",
        images: image ? [image] : []
      });
      
      // Notifiera admin om det nya ärendet (både e-post och i appen)
      await base44.functions.invoke('notifyCustomerServiceRecord', { serviceRecordId: newRecord.id });
      
      setDone(true);
      if (onSaved) onSaved();
    } catch (error) {
      console.error(error);
      alert("Något gick fel när ärendet skulle skapas. Försök igen.");
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-start sm:items-center justify-center p-4 py-10 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md my-auto shrink-0 relative">
        <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white z-10 rounded-t-xl">
          <div className="flex items-center gap-2">
            <Wrench className="w-5 h-5" style={{ color: "#1b3a3a" }} />
            <h2 className="font-bold" style={{ color: "#1b3a3a" }}>Nytt serviceärende</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {done ? (
          <div className="p-8 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <h3 className="font-bold text-lg mb-2" style={{ color: "#1b3a3a" }}>Ärendet är skapat!</h3>
            <p className="text-slate-500 text-sm mb-5">Vi har tagit emot ditt serviceärende och återkommer inom kort.</p>
            <Button onClick={onClose} className="astomed-btn-primary">Stäng</Button>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            {/* Machine select */}
            <div>
              <label className="text-sm font-medium mb-1 block" style={{ color: "#254f4f" }}>Välj maskin *</label>
              <Select value={machineId} onValueChange={handleMachineChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Välj din maskin..." />
                </SelectTrigger>
                <SelectContent>
                  {machines.map(m => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.model} – SN: {m.serial_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>



            {/* Information about SSM */}
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-sm text-slate-600">
              <p><strong>Viktig information angående service:</strong></p>
              <p className="mt-1">SSM (Strålsäkerhetsmyndigheten) kräver att lasermaskiner servas en gång om året.</p>
              <p className="mt-1">Du hittar ditt senaste servicedatum i det protokoll du fått senast, eller på en klisterlapp på baksidan av maskinen.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Senaste service */}
              <div>
                <label className="text-sm font-medium mb-1 block" style={{ color: "#254f4f" }}>Senaste servicedatum (om känt)</label>
                <Input
                  type="date"
                  value={lastServiceDate}
                  onChange={e => setLastServiceDate(e.target.value)}
                />
              </div>

              {/* Önskat datum */}
              <div>
                <label className="text-sm font-medium mb-1 block" style={{ color: "#254f4f" }}>Önskat datum för nästa service</label>
                <Input
                  type="date"
                  value={preferredDate}
                  onChange={e => setPreferredDate(e.target.value)}
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="text-sm font-medium mb-1 block" style={{ color: "#254f4f" }}>Beskriv problemet eller ärendet (frivilligt)</label>
              <Textarea
                placeholder="Vad är det för problem? Beskriv så detaljerat som möjligt..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={4}
              />
            </div>

            {/* Image upload */}
            <div>
              <label className="text-sm font-medium mb-1 block" style={{ color: "#254f4f" }}>Bild (valfritt)</label>
              {image ? (
                <div className="relative inline-block">
                  <img src={image} alt="Uppladdad" className="h-24 rounded-lg object-cover border" />
                  <button
                    onClick={() => setImage(null)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                  >×</button>
                </div>
              ) : (
                <label className="flex items-center gap-2 p-3 border-2 border-dashed border-slate-200 rounded-lg cursor-pointer hover:border-slate-300 transition-colors">
                  <Upload className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-500">{uploading ? "Laddar upp..." : "Klicka för att ladda upp bild"}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} disabled={uploading} />
                </label>
              )}
            </div>

            <div className="flex gap-3 pt-1">
              <Button variant="outline" onClick={onClose} className="flex-1">Avbryt</Button>
              <Button
                onClick={handleSubmit}
                disabled={!machineId || loading || uploading}
                className="flex-1 astomed-btn-primary"
              >
                {loading ? "Skickar..." : "Skicka ärende"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}