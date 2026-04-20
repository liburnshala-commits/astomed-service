import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X, FileCheck } from "lucide-react";
import { Label } from "@/components/ui/label";

export default function RequestContractModal({ machine, onClose, onSubmit }) {
  const [bindingMonths, setBindingMonths] = useState(12);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    await onSubmit({
      requested_service_contract: "basic",
      service_contract_status: "pending",
      contract_binding_months: bindingMonths
    });
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/50 p-4 sm:p-6 py-10">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-full flex flex-col overflow-hidden">
        <div className="bg-white border-b px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "#e8f2f2" }}>
              <FileCheck className="w-5 h-5" style={{ color: "#1b3a3a" }} />
            </div>
            <div>
              <h2 className="text-lg font-bold astomed-title">Begär serviceavtal</h2>
              <p className="text-xs astomed-muted">{machine.model}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-sm text-blue-900 mb-2">Basic serviceavtal – Astomed 3.0</h3>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• Årlig service ingår</li>
              <li>• Förebyggande underhåll</li>
              <li>• Prioriterad support</li>
              <li>• Rabatterade reservdelar</li>
            </ul>
          </div>

          <div>
            <Label className="astomed-label">Välj bindningstid</Label>
            <div className="grid grid-cols-3 gap-3 mt-2">
              {[6, 12, 24].map(months => (
                <button
                  key={months}
                  onClick={() => setBindingMonths(months)}
                  className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                    bindingMonths === months
                      ? "border-[#3a9e9e] bg-[#e8f2f2] text-[#1b3a3a]"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {months} mån
                </button>
              ))}
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-xs text-yellow-800">
              <strong>OBS:</strong> Din begäran kommer att granskas av en servicetekniker innan den aktiveras.
            </p>
          </div>
        </div>

        <div className="bg-white border-t px-6 py-4 flex gap-3 shrink-0">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Avbryt
          </Button>
          <Button onClick={handleSubmit} disabled={loading} className="flex-1 astomed-btn-primary">
            {loading ? "Skickar..." : "Skicka begäran"}
          </Button>
        </div>
      </div>
    </div>
  );
}