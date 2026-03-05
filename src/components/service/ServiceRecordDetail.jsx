import { X, Edit, FileText, Calendar, User, Building2, Monitor, Wrench, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import ServiceReportModal from "./ServiceReportModal.jsx";
import { useState } from "react";
import { base44 } from "@/api/base44Client";

const statusColor = {
  pending: "bg-yellow-100 text-yellow-800",
  in_progress: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  invoiced: "bg-purple-100 text-purple-800"
};
const statusLabel = { pending: "Väntar", in_progress: "Pågående", completed: "Slutförd", invoiced: "Fakturerad" };
const typeLabel = { standard: "Standardservice", advanced: "Avancerad service" };

export default function ServiceRecordDetail({ record, machine, customer, onClose, onEdit, onDeleted }) {
  const [showReport, setShowReport] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm("Radera detta serviceärende helt? Detta kan inte ångras.")) return;
    await base44.entities.ServiceRecord.delete(record.id);
    onClose();
    if (onDeleted) onDeleted();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Wrench className="w-4 h-4 text-blue-600" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Serviceärende</h2>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => setShowReport(true)}>
                <FileText className="w-4 h-4 mr-1" /> Rapport
              </Button>
              <Button size="sm" variant="outline" onClick={onEdit}>
                <Edit className="w-4 h-4 mr-1" /> Redigera
              </Button>
              <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={handleDelete}>
                <Trash2 className="w-4 h-4 mr-1" /> Radera
              </Button>
              <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Header badges */}
            <div className="flex flex-wrap gap-2">
              <Badge className={statusColor[record.status]}>{statusLabel[record.status]}</Badge>
              <Badge variant="outline">{typeLabel[record.service_type]}</Badge>
              {record.service_date && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {format(new Date(record.service_date), "d MMMM yyyy", { locale: sv })}
                </Badge>
              )}
            </div>

            {/* Machine & Customer */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-2 mb-2 text-slate-500">
                  <Monitor className="w-4 h-4" />
                  <span className="text-xs font-semibold uppercase tracking-wide">Maskin</span>
                </div>
                <div className="font-semibold text-slate-900">{machine?.model}</div>
                <div className="text-sm text-slate-500 font-mono">SN: {machine?.serial_number}</div>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-2 mb-2 text-slate-500">
                  <Building2 className="w-4 h-4" />
                  <span className="text-xs font-semibold uppercase tracking-wide">Kund</span>
                </div>
                <div className="font-semibold text-slate-900">{customer?.company_name}</div>
                <div className="text-sm text-slate-500">{customer?.contact_person}</div>
              </div>
            </div>

            {/* Technician */}
            {record.technician_name && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <User className="w-4 h-4 text-slate-400" />
                <span>Tekniker: <span className="font-medium text-slate-800">{record.technician_name}</span></span>
              </div>
            )}

            {/* Description */}
            {record.description && (
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Utfört arbete</div>
                <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 rounded-lg p-3">{record.description}</p>
              </div>
            )}

            {/* Parts */}
            {record.parts_used?.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Använda reservdelar</div>
                <div className="border rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                      <tr>
                        <th className="text-left px-3 py-2">Del</th>
                        <th className="text-left px-3 py-2">Art.nr</th>
                        <th className="text-right px-3 py-2">Antal</th>
                        <th className="text-right px-3 py-2">à-pris</th>
                        <th className="text-right px-3 py-2">Summa</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {record.parts_used.map((p, i) => (
                        <tr key={i}>
                          <td className="px-3 py-2 text-slate-800">{p.part_name}</td>
                          <td className="px-3 py-2 text-slate-500 font-mono text-xs">{p.part_number}</td>
                          <td className="px-3 py-2 text-right">{p.quantity}</td>
                          <td className="px-3 py-2 text-right">{p.unit_price?.toLocaleString("sv-SE")} kr</td>
                          <td className="px-3 py-2 text-right font-medium">{((p.unit_price || 0) * (p.quantity || 1)).toLocaleString("sv-SE")} kr</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Costs */}
            <div className="space-y-2">
              {record.labor_hours && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Arbetstimmar</span>
                  <span className="font-medium">{record.labor_hours} tim</span>
                </div>
              )}
              {record.labor_cost && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Arbetskostnad</span>
                  <span className="font-medium">{record.labor_cost?.toLocaleString("sv-SE")} kr</span>
                </div>
              )}
              {record.total_cost > 0 && (
                <div className="flex justify-between text-base font-bold border-t pt-2 mt-2">
                  <span>Totalt</span>
                  <span>{record.total_cost?.toLocaleString("sv-SE")} kr</span>
                </div>
              )}
            </div>

            {/* Images */}
            {record.images?.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Bilder</div>
                <div className="flex flex-wrap gap-2">
                  {record.images.map((img, i) => (
                    <a key={i} href={img} target="_blank" rel="noopener noreferrer">
                      <img src={img} alt={`Bild ${i+1}`} className="w-24 h-24 object-cover rounded-xl border hover:opacity-80 transition-opacity" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Next service */}
            {record.next_service_date && (
              <div className="flex items-center gap-2 text-sm bg-blue-50 text-blue-700 rounded-lg px-3 py-2.5 border border-blue-200">
                <Calendar className="w-4 h-4" />
                Nästa service planerad: <span className="font-semibold">{format(new Date(record.next_service_date), "d MMMM yyyy", { locale: sv })}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {showReport && (
        <ServiceReportModal record={record} machine={machine} customer={customer} onClose={() => setShowReport(false)} />
      )}
    </>
  );
}