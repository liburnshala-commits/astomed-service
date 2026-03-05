import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Wrench, CheckCircle } from "lucide-react";

export default function RequestServiceModal({ machines, customer, user, onClose }) {
  const [selectedMachineId, setSelectedMachineId] = useState(machines.length === 1 ? machines[0].id : "");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);

  const selectedMachine = machines.find(m => m.id === selectedMachineId);

  const handleSubmit = async () => {
    if (!selectedMachineId) return;
    setLoading(true);
    setError(null);
    try {
      await base44.functions.invoke("requestService", {
        machineId: selectedMachineId,
        machineName: selectedMachine?.model || "",
        serialNumber: selectedMachine?.serial_number || "",
        customerName: customer?.company_name || user?.full_name || "",
        customerEmail: user?.email || customer?.email || "",
        message: message.trim(),
      });
      setDone(true);
    } catch (e) {
      setError("Kunde inte skicka beställning. Försök igen.");
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b">
          <div className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-blue-600" />
            <h2 className="font-bold text-slate-800">Beställ service</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {done ? (
          <div className="p-8 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <h3 className="font-bold text-slate-800 text-lg mb-2">Beställning skickad!</h3>
            <p className="text-slate-500 text-sm mb-5">Vi har mottagit din servicebeställning och återkommer inom kort för att boka in en tid. En bekräftelse har skickats till din e-post.</p>
            <Button onClick={onClose} className="bg-slate-800 hover:bg-slate-900 text-white">Stäng</Button>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Välj maskin</label>
              <Select value={selectedMachineId} onValueChange={setSelectedMachineId}>
                <SelectTrigger>
                  <SelectValue placeholder="Välj maskin..." />
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

            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Meddelande (valfritt)</label>
              <Textarea
                placeholder="Beskriv problemet eller vad ni vill att vi tittar på..."
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={4}
              />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="flex gap-3 pt-1">
              <Button variant="outline" onClick={onClose} className="flex-1">Avbryt</Button>
              <Button
                onClick={handleSubmit}
                disabled={!selectedMachineId || loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {loading ? "Skickar..." : "Skicka beställning"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}