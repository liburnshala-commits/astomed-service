import { X, Printer, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { sv } from "date-fns/locale";

export default function ServiceReportModal({ record, machine, customer, onClose }) {
  const serviceDate = record.service_date ? format(new Date(record.service_date), "d MMMM yyyy", { locale: sv }) : "";
  const typeLabel = record.service_type === "standard" ? "Standardservice" : "Avancerad service";
  const statusLabel = { pending: "Väntar", in_progress: "Pågående", completed: "Slutförd", invoiced: "Fakturerad" }[record.status] || record.status;

  const handlePrint = () => window.print();

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10 print:hidden">
          <h2 className="font-bold text-slate-900">Servicerapport</h2>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-1" /> Skriv ut / Spara PDF
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
          </div>
        </div>

        {/* Report content - designed to print well */}
        <div className="p-8 space-y-6" id="service-report">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Servicerapport</h1>
              <p className="text-slate-500 text-sm mt-1">ServiceLog Pro</p>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-400 uppercase tracking-wide">Rapport-ID</div>
              <div className="font-mono text-sm text-slate-600">{record.id?.slice(-8).toUpperCase()}</div>
              <div className="mt-1 text-xs text-slate-400">Utskriven: {format(new Date(), "d MMM yyyy", { locale: sv })}</div>
            </div>
          </div>

          <hr />

          {/* Machine & Customer info */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Maskinuppgifter</h3>
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm"><span className="text-slate-500">Modell</span><span className="font-medium">{machine?.model}</span></div>
                <div className="flex justify-between text-sm"><span className="text-slate-500">Serienummer</span><span className="font-mono font-medium">{machine?.serial_number}</span></div>
                {machine?.installation_date && <div className="flex justify-between text-sm"><span className="text-slate-500">Installerad</span><span>{machine.installation_date}</span></div>}
              </div>
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Kunduppgifter</h3>
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm"><span className="text-slate-500">Företag</span><span className="font-medium">{customer?.company_name}</span></div>
                {customer?.org_number && <div className="flex justify-between text-sm"><span className="text-slate-500">Org.nr</span><span>{customer.org_number}</span></div>}
                {customer?.contact_person && <div className="flex justify-between text-sm"><span className="text-slate-500">Kontakt</span><span>{customer.contact_person}</span></div>}
                {customer?.address && <div className="flex justify-between text-sm"><span className="text-slate-500">Adress</span><span>{customer.address}{customer.city ? `, ${customer.city}` : ""}</span></div>}
                {customer?.phone && <div className="flex justify-between text-sm"><span className="text-slate-500">Telefon</span><span>{customer.phone}</span></div>}
              </div>
            </div>
          </div>

          <hr />

          {/* Service info */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Serviceinformation</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-50 rounded-lg p-3">
                <div className="text-xs text-slate-400 mb-1">Typ</div>
                <div className="font-semibold text-slate-800 text-sm">{typeLabel}</div>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <div className="text-xs text-slate-400 mb-1">Datum</div>
                <div className="font-semibold text-slate-800 text-sm">{serviceDate}</div>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <div className="text-xs text-slate-400 mb-1">Status</div>
                <div className="font-semibold text-slate-800 text-sm">{statusLabel}</div>
              </div>
            </div>
            {record.technician_name && (
              <div className="mt-3 text-sm"><span className="text-slate-500">Tekniker: </span><span className="font-medium">{record.technician_name}</span></div>
            )}
          </div>

          {/* Description */}
          {record.description && (
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Utfört arbete</h3>
              <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 rounded-lg p-4">{record.description}</p>
            </div>
          )}

          {/* Parts table */}
          {record.parts_used?.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Reservdelar</h3>
              <table className="w-full text-sm border rounded-lg overflow-hidden">
                <thead className="bg-slate-50">
                  <tr className="text-xs text-slate-500 uppercase">
                    <th className="text-left px-3 py-2">Benämning</th>
                    <th className="text-left px-3 py-2">Art.nr</th>
                    <th className="text-right px-3 py-2">Antal</th>
                    <th className="text-right px-3 py-2">à-pris</th>
                    <th className="text-right px-3 py-2">Summa</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {record.parts_used.map((p, i) => (
                    <tr key={i}>
                      <td className="px-3 py-2">{p.part_name}</td>
                      <td className="px-3 py-2 font-mono text-xs text-slate-500">{p.part_number}</td>
                      <td className="px-3 py-2 text-right">{p.quantity}</td>
                      <td className="px-3 py-2 text-right">{(p.unit_price || 0).toLocaleString("sv-SE")} kr</td>
                      <td className="px-3 py-2 text-right font-medium">{((p.unit_price || 0) * (p.quantity || 1)).toLocaleString("sv-SE")} kr</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Cost summary */}
          <div className="border rounded-lg p-4 space-y-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Kostnadssammanfattning</h3>
            {record.labor_hours && <div className="flex justify-between text-sm"><span className="text-slate-500">Arbetstid</span><span>{record.labor_hours} timmar</span></div>}
            {record.labor_cost && <div className="flex justify-between text-sm"><span className="text-slate-500">Arbetskostnad</span><span>{record.labor_cost.toLocaleString("sv-SE")} kr</span></div>}
            {record.parts_used?.length > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Reservdelar</span>
                <span>{record.parts_used.reduce((s, p) => s + (p.unit_price || 0) * (p.quantity || 1), 0).toLocaleString("sv-SE")} kr</span>
              </div>
            )}
            {record.total_cost > 0 && (
              <div className="flex justify-between font-bold text-base border-t pt-2 mt-2">
                <span>Totalt att betala</span>
                <span>{record.total_cost.toLocaleString("sv-SE")} kr</span>
              </div>
            )}
          </div>

          {/* Images */}
          {record.images?.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Bilder</h3>
              <div className="grid grid-cols-3 gap-2">
                {record.images.map((img, i) => (
                  <img key={i} src={img} alt={`Bild ${i+1}`} className="w-full h-32 object-cover rounded-lg border" />
                ))}
              </div>
            </div>
          )}

          {/* Next service */}
          {record.next_service_date && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
              Nästa rekommenderade service: <span className="font-bold">{format(new Date(record.next_service_date), "d MMMM yyyy", { locale: sv })}</span>
            </div>
          )}

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-8 mt-8 pt-6 border-t">
            <div>
              <div className="h-12 border-b border-dashed mb-2"></div>
              <div className="text-xs text-slate-400">Teknikersignatur · {record.technician_name}</div>
            </div>
            <div>
              <div className="h-12 border-b border-dashed mb-2"></div>
              <div className="text-xs text-slate-400">Kundsignatur · {customer?.contact_person || customer?.company_name}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}