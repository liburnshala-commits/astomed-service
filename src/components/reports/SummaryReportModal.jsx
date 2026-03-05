import { X, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { sv } from "date-fns/locale";

const COMPANY = {
  name: "Astomed Klinikutrustning Sverige AB",
  address: "Jägerhorns väg 3-5",
  zip: "141 75 Kungens Kurva",
  phone: "08 – 410 779 00",
  email: "info@astomed.se",
  web: "www.astomed.se",
  org: "556709 – 9964",
  moms: "SE556709996401",
};

const statusLabel = { pending: "Väntar", in_progress: "Pågående", completed: "Slutförd", invoiced: "Fakturerad" };
const typeLabel = { standard: "Standard service", advanced: "Avancerad service" };

export default function SummaryReportModal({ records, machines, customers, filterLabel, onClose }) {
  const printDate = format(new Date(), "d MMMM yyyy", { locale: sv });
  const getMachine = (id) => machines.find(m => m.id === id);
  const getCustomer = (id) => customers.find(c => c.id === id);

  const totalCost = records.reduce((s, r) => s + (r.total_cost || 0), 0);
  const totalHours = records.reduce((s, r) => s + (r.labor_hours || 0), 0);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">

        {/* Toolbar */}
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10 print:hidden">
          <h2 className="font-bold text-slate-900">Sammanställningsrapport</h2>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => window.print()}>
              <Printer className="w-4 h-4 mr-1" /> Skriv ut / Spara PDF
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
          </div>
        </div>

        {/* Report content */}
        <div id="service-report" className="p-10 font-sans text-slate-800 text-sm">

          <div className="text-xs text-slate-400 mb-1">{format(new Date(), "yyyyMMdd")}</div>
          <div className="text-xs text-slate-400 mb-6">Utskriven: {printDate}</div>

          <div className="mb-4">
            <div className="text-2xl font-black tracking-tight text-slate-900">A</div>
          </div>

          <h1 className="text-3xl font-black uppercase tracking-wide text-slate-900 mb-2">SERVICERAPPORT</h1>
          <div className="text-base text-slate-500 mb-6">Sammanställning · {filterLabel}</div>

          <hr className="my-5 border-slate-200" />

          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-slate-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-slate-900">{records.length}</div>
              <div className="text-xs text-slate-500 mt-1">Antal serviceärenden</div>
            </div>
            <div className="bg-slate-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-slate-900">{totalHours}</div>
              <div className="text-xs text-slate-500 mt-1">Totalt arbetstimmar</div>
            </div>
            <div className="bg-slate-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-slate-900">{totalCost > 0 ? totalCost.toLocaleString("sv-SE") + " kr" : "–"}</div>
              <div className="text-xs text-slate-500 mt-1">Total kostnad</div>
            </div>
          </div>

          <hr className="my-5 border-slate-200" />

          {/* Individual records */}
          <h2 className="font-bold text-base mb-4">Serviceärenden</h2>
          {records.map((record, idx) => {
            const machine = getMachine(record.machine_id);
            const customer = getCustomer(record.customer_id);
            const partsTotal = (record.parts_used || []).reduce((s, p) => s + (p.unit_price || 0) * (p.quantity || 1), 0);
            return (
              <div key={record.id} className="mb-8 border border-slate-200 rounded-lg overflow-hidden">
                {/* Record header */}
                <div className="bg-slate-50 px-5 py-3 flex items-center justify-between">
                  <div className="font-bold text-slate-900">
                    #{idx + 1} · {machine?.model || "Okänd maskin"} · {record.service_date ? format(new Date(record.service_date), "d MMM yyyy", { locale: sv }) : ""}
                  </div>
                  <div className="text-xs text-slate-500">{statusLabel[record.status] || record.status}</div>
                </div>
                <div className="p-5 space-y-3">
                  {/* Customer & Machine */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs font-semibold text-slate-400 uppercase mb-1">Kund</div>
                      <div>{customer?.company_name || "–"}</div>
                      {customer?.city && <div className="text-xs text-slate-500">{customer.city}</div>}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-400 uppercase mb-1">Utrustning</div>
                      <div>{machine?.model || "–"}</div>
                      <div className="text-xs text-slate-500">S/N: {machine?.serial_number || "–"}</div>
                    </div>
                  </div>
                  {/* Service info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs font-semibold text-slate-400 uppercase mb-1">Servicetyp</div>
                      <div>{typeLabel[record.service_type] || record.service_type || "–"}</div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-400 uppercase mb-1">Tekniker</div>
                      <div>{record.technician_name || "–"}</div>
                    </div>
                  </div>
                  {/* Description */}
                  {record.description && (
                    <div>
                      <div className="text-xs font-semibold text-slate-400 uppercase mb-1">Beskrivning / Anteckning</div>
                      <p className="text-slate-700 leading-relaxed whitespace-pre-line">{record.description}</p>
                    </div>
                  )}
                  {/* Parts */}
                  {record.parts_used?.length > 0 && (
                    <div>
                      <div className="text-xs font-semibold text-slate-400 uppercase mb-1">Reservdelar</div>
                      <table className="w-full text-xs border rounded overflow-hidden">
                        <thead className="bg-slate-50">
                          <tr className="text-slate-500">
                            <th className="text-left px-2 py-1">Benämning</th>
                            <th className="text-left px-2 py-1">Art.nr</th>
                            <th className="text-right px-2 py-1">Antal</th>
                            <th className="text-right px-2 py-1">à-pris</th>
                            <th className="text-right px-2 py-1">Summa</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {record.parts_used.map((p, i) => (
                            <tr key={i}>
                              <td className="px-2 py-1">{p.part_name}</td>
                              <td className="px-2 py-1 font-mono text-slate-400">{p.part_number}</td>
                              <td className="px-2 py-1 text-right">{p.quantity}</td>
                              <td className="px-2 py-1 text-right">{(p.unit_price || 0).toLocaleString("sv-SE")} kr</td>
                              <td className="px-2 py-1 text-right font-medium">{((p.unit_price || 0) * (p.quantity || 1)).toLocaleString("sv-SE")} kr</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {/* Costs */}
                  <div className="flex flex-col items-end text-sm gap-0.5">
                    {record.labor_hours > 0 && <div className="text-slate-500">Arbetstid: {record.labor_hours} h</div>}
                    {record.labor_cost > 0 && <div className="text-slate-500">Arbetskostnad: {record.labor_cost.toLocaleString("sv-SE")} kr</div>}
                    {partsTotal > 0 && <div className="text-slate-500">Reservdelar: {partsTotal.toLocaleString("sv-SE")} kr</div>}
                    {record.total_cost > 0 && (
                      <div className="font-bold text-slate-900 border-t border-slate-200 pt-1 mt-1">
                        Totalt: {record.total_cost.toLocaleString("sv-SE")} kr
                      </div>
                    )}
                  </div>
                  {/* Next service */}
                  {record.next_service_date && (
                    <div className="p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
                      Nästa service: <strong>{format(new Date(record.next_service_date), "d MMMM yyyy", { locale: sv })}</strong>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Total summary */}
          {totalCost > 0 && (
            <div className="border-t-2 border-slate-900 pt-4 flex justify-between font-bold text-base">
              <span>Total kostnad alla ärenden</span>
              <span>{totalCost.toLocaleString("sv-SE")} kr</span>
            </div>
          )}

          {/* Footer */}
          <hr className="mt-10 mb-4 border-slate-300" />
          <div className="grid grid-cols-4 gap-4 text-xs text-slate-500">
            <div>
              <div className="font-semibold text-slate-700">Adress</div>
              <div>{COMPANY.name}</div>
              <div>{COMPANY.address}</div>
              <div>{COMPANY.zip}</div>
            </div>
            <div>
              <div className="font-semibold text-slate-700">Telefon</div>
              <div>{COMPANY.phone}</div>
              <div className="font-semibold text-slate-700 mt-1">E-post / Webbplats</div>
              <div>{COMPANY.email} / {COMPANY.web}</div>
            </div>
            <div>
              <div className="font-semibold text-slate-700">Organisationsnr</div>
              <div>{COMPANY.org}</div>
              <div className="mt-1">Godkänd för F-skatt</div>
            </div>
            <div>
              <div className="font-semibold text-slate-700">Momsregnr</div>
              <div>{COMPANY.moms}</div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}