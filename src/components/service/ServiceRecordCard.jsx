import React from "react";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { Wrench, Copy, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const statusColor = {
  pending: "bg-yellow-100 text-yellow-800",
  planned: "bg-blue-100 text-blue-800",
  awaiting_approval: "bg-orange-100 text-orange-800",
  in_progress: "bg-yellow-400 text-yellow-900",
  completed: "bg-green-100 text-green-800",
  invoiced: "bg-purple-100 text-purple-800"
};
const statusLabel = { pending: "Väntar", planned: "Planerad", awaiting_approval: "Inväntar godkännande", in_progress: "Pågående", completed: "Slutförd", invoiced: "Fakturerad" };
const typeLabel = { standard: "Standard", advanced: "Avancerad" };
const typeColor = { standard: "bg-slate-100 text-slate-700", advanced: "bg-indigo-100 text-indigo-700" };

export default function ServiceRecordCard({
  record,
  machine,
  customer,
  isNyinkommen,
  userRole,
  isMobile = false,
  setViewing,
  setEditing,
  setShowForm,
  handleCopyLink,
  handleDelete
}) {

  if (isMobile) {
    return (
      <Card className="bg-white shadow-sm border-slate-200 mx-1 h-full flex flex-col cursor-pointer" onClick={() => setViewing(record)}>
        <CardContent className="p-4 space-y-4 flex-1 flex flex-col">
          <div className="flex justify-between items-start gap-2">
            <div className="min-w-0">
              <h3 className="font-semibold text-lg leading-tight text-slate-900 truncate">{machine?.model || "Okänd maskin"}</h3>
              <div className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
                <span className="truncate font-mono text-xs">SN: {machine?.serial_number}</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              {isNyinkommen && (
                <Badge className="bg-red-500 text-white hover:bg-red-600 border-0 px-2.5 py-1 text-[10px] uppercase tracking-wider text-center">
                  Nyinkommen
                </Badge>
              )}
              <Badge className={`border-0 px-2.5 py-1 text-[10px] uppercase tracking-wider text-center ${statusColor[record.status]}`}>
                {statusLabel[record.status]}
              </Badge>
              <Badge className={`border-0 px-2 py-0.5 text-[10px] ${typeColor[record.service_type]}`}>
                {typeLabel[record.service_type]}
              </Badge>
            </div>
          </div>

          <div className="space-y-2 text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100 flex-1">
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-500">Kund:</span>
              <span className="font-medium truncate max-w-[150px] text-right" title={customer?.city ? `${customer.company_name} (${customer.city})` : customer?.company_name}>{customer?.company_name || "Okänd kund"}{customer?.city ? ` (${customer.city})` : ""}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-500">Tekniker:</span>
              <span className="font-medium">{record.technician_name || "Ej angiven"}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-500">Datum:</span>
              <span className="font-medium">{record.service_date ? format(new Date(record.service_date), "d MMM yyyy", { locale: sv }) : "-"}</span>
            </div>
            {record.total_cost > 0 && (
              <div className="flex justify-between items-center py-1 pt-2 border-t border-slate-200 mt-1">
                <span className="text-slate-500">Total kostnad:</span>
                <span className="font-bold text-slate-900">{record.total_cost?.toLocaleString("sv-SE")} kr</span>
              </div>
            )}
          </div>

          <div className="pt-2 space-y-2">
            <div className="flex gap-2" onClick={e => e.stopPropagation()}>
              <Button className="h-11 px-4 text-slate-500" variant="outline" onClick={(e) => handleCopyLink(record, e)} title="Kopiera länk">
                <Copy className="w-4 h-4 mr-2" /> Länk
              </Button>
              <Button className="flex-1 h-11" variant="outline" onClick={() => { setEditing(record); setShowForm(true); }}>
                Redigera
              </Button>
              {(userRole !== "customer" || record.status === "pending") && (
                <Button className="h-11 px-4 text-red-500 hover:text-red-700 hover:bg-red-50 border border-transparent hover:border-red-100" variant="ghost" onClick={(e) => handleDelete(record, e)}>
                  <Trash2 className="w-5 h-5" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Desktop View
  return (
    <Card className="astomed-card cursor-pointer" onClick={() => setViewing(record)}>
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 astomed-icon-box flex-shrink-0" style={{ width: 40, height: 40 }}>
            <Wrench className="w-5 h-5" style={{ color: "#1b3a3a" }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="font-semibold astomed-title">{machine?.model || "Okänd maskin"}</span>
              {isNyinkommen && <Badge className="bg-red-500 text-white hover:bg-red-600 border-0">Nyinkommen</Badge>}
              <Badge className={typeColor[record.service_type]}>{typeLabel[record.service_type]}</Badge>
              <Badge className={statusColor[record.status]}>{statusLabel[record.status]}</Badge>
            </div>
            <div className="text-xs astomed-muted font-mono mb-1">SN: {machine?.serial_number}</div>
            <div className="flex flex-wrap gap-4 text-sm astomed-subtitle">
              <span>{customer?.company_name || "Okänd kund"}{customer?.city ? ` (${customer.city})` : ""}</span>
              <span>Tekniker: {record.technician_name}</span>
              <span>{record.service_date ? format(new Date(record.service_date), "d MMM yyyy", { locale: sv }) : ""}</span>
            </div>
            {record.total_cost > 0 && (
              <div className="text-sm font-semibold astomed-title mt-1">{record.total_cost?.toLocaleString("sv-SE")} kr</div>
            )}
          </div>
          <div className="flex gap-2 flex-shrink-0 self-start" onClick={e => e.stopPropagation()}>
            <Button size="sm" variant="outline" onClick={(e) => handleCopyLink(record, e)} title="Kopiera länk till ärende">
              <Copy className="w-4 h-4 mr-2" /> Kopiera länk
            </Button>
            <Button size="sm" variant="outline" onClick={() => { setEditing(record); setShowForm(true); }}>
              Redigera
            </Button>
            {(userRole !== "customer" || record.status === "pending") && (
              <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={(e) => handleDelete(record, e)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}