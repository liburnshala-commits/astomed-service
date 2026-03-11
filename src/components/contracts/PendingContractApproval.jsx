import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Building2, Monitor, FileCheck, Calendar } from "lucide-react";
import { format, addMonths, parseISO } from "date-fns";
import { sv } from "date-fns/locale";

const bindingLabel = { 6: "6 månader", 12: "12 månader", 24: "24 månader" };

export default function PendingContractApproval({ machine, customer, onApprove, onReject }) {
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleApprove = async () => {
    setLoading(true);
    await onApprove(machine);
    setLoading(false);
  };

  const handleReject = async () => {
    setLoading(true);
    await onReject(machine);
    setLoading(false);
  };

  const projectedEnd = machine.contract_binding_months
    ? addMonths(new Date(), machine.contract_binding_months)
    : null;

  return (
    <div className="bg-white rounded-xl border-2 border-amber-200 p-5 space-y-4">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-amber-50 flex-shrink-0">
          <FileCheck className="w-6 h-6 text-amber-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold text-slate-800">Avtalsförfrågan från kund</h3>
            <Badge className="bg-amber-100 text-amber-800 border-0">Väntar</Badge>
          </div>

          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <span className="font-medium text-slate-700">{customer?.company_name || "–"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Monitor className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <div>
                <div className="font-medium text-slate-700">{machine.model}</div>
                <div className="text-xs text-slate-400 font-mono">SN: {machine.serial_number}</div>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-slate-50 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Begärt avtal:</span>
              <span className="font-semibold text-slate-800">
                {machine.requested_service_contract === "basic" ? "Basic – Astomed 3.0" : machine.requested_service_contract}
              </span>
            </div>
            {machine.contract_binding_months && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Bindningstid:</span>
                  <span className="font-semibold text-slate-800">
                    {bindingLabel[machine.contract_binding_months] || `${machine.contract_binding_months} månader`}
                  </span>
                </div>
                {projectedEnd && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Beräknat slutdatum:</span>
                    <span className="font-semibold text-slate-800">
                      {format(projectedEnd, "d MMM yyyy", { locale: sv })}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>

          {!showConfirm ? (
            <div className="flex gap-3 mt-4">
              <Button
                onClick={() => setShowConfirm(true)}
                disabled={loading}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Godkänn
              </Button>
              <Button
                onClick={handleReject}
                disabled={loading}
                variant="outline"
                className="flex-1 border-red-300 text-red-700 hover:bg-red-50"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Avslå
              </Button>
            </div>
          ) : (
            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg space-y-3">
              <p className="text-sm font-semibold text-amber-900">
                ⚠️ Viktigt att komma ihåg
              </p>
              <p className="text-xs text-amber-800">
                När du godkänner detta serviceavtal, glöm inte att lägga in faktureringen i ekonomisystemet.
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={handleApprove}
                  disabled={loading}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {loading ? "Godkänner..." : "Jag förstår, godkänn"}
                </Button>
                <Button
                  onClick={() => setShowConfirm(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Avbryt
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}