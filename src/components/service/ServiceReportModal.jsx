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

export default function ServiceReportModal({ record, machine, customer, onClose }) {
  const serviceDate = record.service_date ? format(new Date(record.service_date), "d MMMM yyyy", { locale: sv }) : "";
  const printDate = format(new Date(), "d MMMM yyyy", { locale: sv });
  const typeLabel = record.service_type === "standard" ? "Standard årlig service" : "Avancerad service";
  const partsTotal = (record.parts_used || []).reduce((s, p) => s + (p.unit_price || 0) * (p.quantity || 1), 0);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">

        {/* Toolbar */}
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10 print:hidden">
          <h2 className="font-bold text-slate-900">Servicerapport</h2>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => window.print()}>
              <Printer className="w-4 h-4 mr-1" /> Skriv ut / Spara PDF
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
          </div>
        </div>

        {/* Report content */}
        <div id="service-report" className="p-10 font-sans text-slate-800 text-sm">

          {/* Top meta */}
          <div className="text-xs text-slate-400 mb-1">{format(new Date(), "yyyyMMdd")}</div>
          <div className="text-xs text-slate-400 mb-6">{COMPANY.zip.split(" ").slice(1).join(" ")}</div>

          {/* Logo / Company name */}
          <div className="mb-6">
            <div className="text-2xl font-black tracking-tight text-slate-900">A</div>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-black uppercase tracking-wide text-slate-900 mb-6">SERVICERAPPORT</h1>

          {/* Date & location */}
          <div className="mb-1"><strong>Datum:</strong> {serviceDate || printDate}</div>
          {customer?.city && <div className="mb-4"><strong>Plats:</strong> {customer.city}</div>}

          <hr className="my-5 border-slate-200" />

          {/* Customer info */}
          <h2 className="font-bold text-sm mb-2">Kundinformation</h2>
          <div className="mb-1"><strong>Klinik:</strong> {customer?.company_name}</div>
          {customer?.org_number && <div className="mb-4"><strong>Organisationsnummer:</strong> {customer.org_number}</div>}

          <hr className="my-5 border-slate-200" />

          {/* Machine info */}
          <h2 className="font-bold text-sm mb-2">Utrustningsinformation</h2>
          <ul className="list-disc list-inside space-y-1 mb-4">
            <li><strong>Maskintyp:</strong> {machine?.model}</li>
            <li><strong>Tillverkare:</strong> Alma</li>
            <li><strong>Serienummer:</strong> {machine?.serial_number}</li>
          </ul>

          <hr className="my-5 border-slate-200" />

          {/* Ärende */}
          <h2 className="font-bold text-sm mb-2">Ärende</h2>
          <ul className="list-disc list-inside space-y-1 mb-4">
            <li><strong>Typ av service:</strong> {typeLabel}</li>
            <li><strong>Ankomstdatum:</strong> Service utförd hos kund</li>
          </ul>

          <hr className="my-5 border-slate-200" />

          {/* Technical assessment */}
          {record.description && (
            <>
              <h2 className="font-bold text-sm mb-2">Teknisk bedömning</h2>
              <p className="mb-3 text-slate-700 leading-relaxed whitespace-pre-line">{record.description}</p>
              <hr className="my-5 border-slate-200" />
            </>
          )}

          {/* Parts & Costs */}
          <h2 className="font-bold text-sm mb-2">Värdering och kostnader</h2>
          {record.parts_used?.length > 0 ? (
            <table className="w-full text-sm mb-3 border rounded overflow-hidden">
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
          ) : (
            <p className="text-slate-500 mb-4">Ej tillämpligt i samband med denna servicekontroll.</p>
          )}
          {record.labor_hours > 0 && (
            <div className="flex justify-between text-sm mb-1"><span className="text-slate-500">Arbetstid</span><span>{record.labor_hours} timmar</span></div>
          )}
          {record.labor_cost > 0 && (
            <div className="flex justify-between text-sm mb-1"><span className="text-slate-500">Arbetskostnad</span><span>{record.labor_cost.toLocaleString("sv-SE")} kr</span></div>
          )}
          {record.total_cost > 0 && (
            <div className="flex justify-between font-bold text-base border-t pt-2 mt-2">
              <span>Totalt</span><span>{record.total_cost.toLocaleString("sv-SE")} kr</span>
            </div>
          )}

          {/* Next service */}
          {record.next_service_date && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
              Nästa rekommenderade service: <strong>{format(new Date(record.next_service_date), "d MMMM yyyy", { locale: sv })}</strong>
            </div>
          )}

          {/* Images */}
          {record.images?.length > 0 && (
            <div className="mt-6">
              <h2 className="font-bold text-sm mb-2">Bilder</h2>
              <div className="grid grid-cols-3 gap-2">
                {record.images.map((img, i) => (
                  <img key={i} src={img} alt={`Bild ${i+1}`} className="w-full h-32 object-cover rounded border" />
                ))}
              </div>
            </div>
          )}

          <hr className="my-6 border-slate-300" />

          {/* Technician / Signature */}
          <h2 className="font-bold text-sm mb-3">Reparatör</h2>
          {record.technician_name && <div className="mb-1"><strong>Tekniker:</strong> {record.technician_name}</div>}
          <div className="mb-1">Ort: <strong>{COMPANY.zip.split(" ").slice(1).join(" ")}</strong></div>
          <div className="mb-6">Datum: <strong>{serviceDate || printDate}</strong></div>
          <div className="grid grid-cols-2 gap-10 mt-4">
            <div>
              <div className="h-10 border-b border-dashed border-slate-400 mb-1"></div>
              <div className="text-xs text-slate-400">Underskrift tekniker · {record.technician_name}</div>
            </div>
            <div>
              <div className="h-10 border-b border-dashed border-slate-400 mb-1"></div>
              <div className="text-xs text-slate-400">Kundsignatur · {customer?.contact_person || customer?.company_name}</div>
            </div>
          </div>

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