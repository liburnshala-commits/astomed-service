import { X, Printer, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { useState } from "react";
import { createPortal } from "react-dom";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

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
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const serviceDate = record.service_date ? format(new Date(record.service_date), "d MMMM yyyy", { locale: sv }) : "";
  const printDate = format(new Date(), "d MMMM yyyy", { locale: sv });
  const typeLabel = record.service_type === "standard" ? "Standard årlig service" : "Avancerad service";
  const partsTotal = (record.parts_used || []).reduce((s, p) => s + (p.unit_price || 0) * (p.quantity || 1), 0);

  const handleDownloadPDF = async () => {
    const input = document.getElementById('service-report');
    if (!input) return;
    
    setGeneratingPDF(true);
    try {
      const clone = input.cloneNode(true);
      clone.classList.remove('overflow-y-auto', 'flex-1');
      clone.style.overflow = 'visible';
      clone.style.height = 'auto';
      clone.style.maxHeight = 'none';
      
      const wrapper = document.createElement('div');
      wrapper.style.position = 'absolute';
      wrapper.style.left = '0px';
      wrapper.style.top = '0px';
      wrapper.style.width = '800px';
      wrapper.style.height = 'auto';
      wrapper.style.zIndex = '-9999';
      wrapper.style.pointerEvents = 'none';
      wrapper.style.backgroundColor = '#ffffff';
      
      wrapper.appendChild(clone);
      document.body.appendChild(wrapper);

      // Ge webbläsaren en bråkdels sekund att applicera alla nya styles och expandera höjden
      await new Promise(resolve => setTimeout(resolve, 150));

      const canvas = await html2canvas(wrapper, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: wrapper.scrollWidth,
        height: wrapper.scrollHeight,
        windowWidth: 800,
        windowHeight: wrapper.scrollHeight,
        x: 0,
        y: 0,
        scrollX: 0,
        scrollY: 0
      });

      document.body.removeChild(wrapper);
      
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      let heightLeft = pdfHeight;
      let position = 0;
      
      pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft > 0) {
        position -= pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save(`Servicerapport_${machine?.serial_number || 'Maskin'}_${format(new Date(), 'yyyyMMdd')}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setGeneratingPDF(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center bg-black/50 p-4 sm:p-6 py-10">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-full flex flex-col overflow-hidden">

        {/* Toolbar */}
        <div className="flex items-center justify-between p-4 border-b bg-white z-10 shrink-0 print:hidden">
          <h2 className="font-bold text-slate-900">Servicerapport</h2>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => window.print()} title="Skriv ut">
              <Printer className="w-4 h-4 mr-1" /> Skriv ut
            </Button>
            <Button size="sm" variant="outline" onClick={handleDownloadPDF} disabled={generatingPDF} className="bg-slate-900 text-white hover:bg-slate-800 hover:text-white border-transparent">
              {generatingPDF ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
              Ladda ner PDF
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
          </div>
        </div>

        {/* Report content */}
        <div id="service-report" className="p-10 font-sans text-slate-800 text-sm print:p-2 print:text-[11px] leading-snug overflow-y-auto flex-1">

          {/* Top meta */}
          <div className="text-xs text-slate-400 mb-1">{format(new Date(), "yyyyMMdd")}</div>
          <div className="text-xs text-slate-400 mb-6 print:mb-2">{COMPANY.zip.split(" ").slice(2).join(" ")}</div>

          {/* Title */}
          <h1 className="text-3xl print:text-xl font-black uppercase tracking-wide text-slate-900 mb-6 print:mb-2">SERVICERAPPORT</h1>

          {/* Date & location */}
          <div className="mb-1"><strong>Datum:</strong> {serviceDate || printDate}</div>
          {customer?.city && <div className="mb-4 print:mb-1"><strong>Plats:</strong> {customer.city}</div>}

          <hr className="my-5 print:my-1 border-slate-200" />

          {/* Customer info */}
          <h2 className="font-bold text-sm print:text-[11px] mb-2 print:mb-0.5">Kundinformation</h2>
          <div className="mb-1"><strong>Klinik:</strong> {customer?.company_name}</div>
          {customer?.org_number && <div className="mb-4 print:mb-1"><strong>Organisationsnummer:</strong> {customer.org_number}</div>}

          <hr className="my-5 print:my-1 border-slate-200" />

          {/* Machine info */}
          <h2 className="font-bold text-sm print:text-[11px] mb-2 print:mb-0.5">Utrustningsinformation</h2>
          <ul className="list-disc list-inside space-y-1 mb-4 print:mb-1">
            <li><strong>Maskintyp:</strong> {machine?.model}</li>
            <li><strong>Tillverkare:</strong> Alma</li>
            <li><strong>Serienummer:</strong> {machine?.serial_number}</li>
          </ul>

          <hr className="my-5 print:my-1 border-slate-200" />

          {/* Ärende */}
          <h2 className="font-bold text-sm print:text-[11px] mb-2 print:mb-0.5">Ärende</h2>
          <ul className="list-disc list-inside space-y-1 mb-4 print:mb-1">
            <li><strong>Typ av service:</strong> {typeLabel}</li>
          </ul>

          <hr className="my-5 print:my-1 border-slate-200" />

          {/* Technical assessment */}
          {(record.description || record.measured_laser_power || record.pulse_count || record.measured_laser_power_2 || record.pulse_count_2) && (
            <>
              <h2 className="font-bold text-sm print:text-[11px] mb-2 print:mb-0.5">Teknisk bedömning & Mätvärden</h2>
              {record.description && <p className="mb-3 text-slate-700 leading-relaxed whitespace-pre-line">{record.description}</p>}
              
              {(record.measured_laser_power || record.pulse_count || record.measured_laser_power_2 || record.pulse_count_2) && (
                <div className="mb-4 print:mb-1 text-slate-700">
                  {(record.measured_laser_power || record.pulse_count) && (
                    <div className="mb-2">
                      {machine?.model === "Soprano Titanium" && <div className="font-semibold text-xs mb-1">Handenhet 1</div>}
                      <ul className="list-disc list-inside space-y-1">
                        {record.measured_laser_power && <li><strong>Uppmätt lasereffekt:</strong> {record.measured_laser_power}</li>}
                        {record.pulse_count && <li><strong>Antal pulser:</strong> {record.pulse_count.toLocaleString("sv-SE")}</li>}
                      </ul>
                    </div>
                  )}
                  {(record.measured_laser_power_2 || record.pulse_count_2) && (
                    <div>
                      {machine?.model === "Soprano Titanium" && <div className="font-semibold text-xs mb-1">Handenhet 2</div>}
                      <ul className="list-disc list-inside space-y-1">
                        {record.measured_laser_power_2 && <li><strong>Uppmätt lasereffekt:</strong> {record.measured_laser_power_2}</li>}
                        {record.pulse_count_2 && <li><strong>Antal pulser:</strong> {record.pulse_count_2.toLocaleString("sv-SE")}</li>}
                      </ul>
                    </div>
                  )}
                </div>
              )}
              <hr className="my-5 print:my-1 border-slate-200" />
            </>
          )}

          {/* Parts & Costs */}
          <h2 className="font-bold text-sm print:text-[11px] mb-2 print:mb-0.5">Värdering och kostnader</h2>
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
              <h2 className="font-bold text-sm print:text-[11px] mb-2 print:mb-0.5">Bilder</h2>
              <div className="grid grid-cols-3 gap-2">
                {record.images.map((img, i) => (
                  <img key={i} src={img} alt={`Bild ${i+1}`} className="w-full h-32 print:h-20 object-cover rounded border" />
                ))}
              </div>
            </div>
          )}

          <hr className="my-6 border-slate-300" />

          {/* Technician / Signature */}
          <h2 className="font-bold text-sm print:text-[11px] mb-3 print:mb-1">Reparatör</h2>
          {record.technician_name && <div className="mb-1 print:mb-0"><strong>Tekniker:</strong> {record.technician_name}</div>}
          <div className="mb-1">Ort: <strong>{COMPANY.zip.split(" ").slice(2).join(" ")}</strong></div>
          <div className="mb-6 print:mb-1">Datum: <strong>{serviceDate || printDate}</strong></div>
          <div className="grid grid-cols-2 gap-10 mt-4 print:mt-2 print:break-inside-avoid">
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
          <hr className="mt-10 mb-4 print:mt-2 print:mb-1 border-slate-300" />
          <div className="grid grid-cols-4 gap-4 text-xs print:text-[9px] text-slate-500 print:break-inside-avoid">
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
    </div>,
    document.body
  );
}