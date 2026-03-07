import { useRef, useState, useEffect } from "react";
import { X, RotateCcw, Check, FileText, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";
import { sv } from "date-fns/locale";

const COMPANY = "Astomed Klinikutrustning Sverige AB";

export default function SignatureModal({ record, machine, customer, onClose, onComplete }) {
  const canvasRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastPos, setLastPos] = useState(null);

  useEffect(() => {
    // Set canvas resolution correctly
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    const ctx = canvas.getContext("2d");
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    ctx.strokeStyle = "#1b3a3a";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  function getPos(e, canvas) {
    const rect = canvas.getBoundingClientRect();
    const src = e.touches ? e.touches[0] : e;
    return {
      x: src.clientX - rect.left,
      y: src.clientY - rect.top,
    };
  }

  function startDraw(e) {
    e.preventDefault();
    const canvas = canvasRef.current;
    const pos = getPos(e, canvas);
    setDrawing(true);
    setLastPos(pos);
    setHasSignature(true);
  }

  function draw(e) {
    e.preventDefault();
    if (!drawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(lastPos.x, lastPos.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    setLastPos(pos);
  }

  function endDraw(e) {
    e.preventDefault();
    setDrawing(false);
    setLastPos(null);
  }

  function clearCanvas() {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  }

  async function handleSave() {
    if (!hasSignature) return;
    setSaving(true);

    // Get signature as base64
    const canvas = canvasRef.current;
    const signatureBase64 = canvas.toDataURL("image/png");

    // Generate PDF using jsPDF
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    const pageW = doc.internal.pageSize.getWidth();
    const margin = 20;

    // Header bar
    doc.setFillColor(27, 58, 58);
    doc.rect(0, 0, pageW, 28, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(COMPANY, margin, 12);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(122, 173, 173);
    doc.text("Servicerapport", margin, 21);

    // Date top right
    doc.setTextColor(200, 220, 220);
    doc.setFontSize(9);
    doc.text(format(new Date(), "d MMM yyyy", { locale: sv }), pageW - margin, 12, { align: "right" });

    let y = 40;
    doc.setTextColor(27, 58, 58);

    // Section helper
    function sectionTitle(title) {
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(100, 140, 140);
      doc.text(title.toUpperCase(), margin, y);
      y += 5;
      doc.setDrawColor(220, 232, 232);
      doc.line(margin, y, pageW - margin, y);
      y += 5;
      doc.setTextColor(27, 58, 58);
      doc.setFont("helvetica", "normal");
    }

    function row(label, value) {
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text(label + ":", margin, y);
      doc.setFont("helvetica", "normal");
      doc.text(String(value || "–"), margin + 45, y);
      y += 7;
    }

    // Machine & Customer
    sectionTitle("Maskin");
    row("Modell", machine?.model);
    row("Serienummer", machine?.serial_number);
    row("Kund", customer?.company_name);
    row("Kontaktperson", customer?.contact_person);
    row("Adress", customer?.city ? `${customer.address || ""}, ${customer.city}` : customer?.address);
    y += 3;

    sectionTitle("Serviceinfo");
    row("Servicetyp", record.service_type === "advanced" ? "Avancerad" : "Standard");
    row("Servicedatum", record.service_date ? format(new Date(record.service_date), "d MMM yyyy", { locale: sv }) : "–");
    row("Tekniker", record.technician_name);
    row("Status", "Slutförd");
    if (record.next_service_date) row("Nästa service", format(new Date(record.next_service_date), "d MMM yyyy", { locale: sv }));
    y += 3;

    // Description
    if (record.description) {
      sectionTitle("Utfört arbete");
      doc.setFontSize(9);
      const lines = doc.splitTextToSize(record.description, pageW - margin * 2);
      doc.text(lines, margin, y);
      y += lines.length * 6 + 4;
    }

    // Parts
    if (record.parts_used?.length > 0) {
      sectionTitle("Reservdelar");
      record.parts_used.forEach(p => {
        doc.setFontSize(9);
        doc.text(`• ${p.part_name} (${p.part_number || "-"})  x${p.quantity}  ${p.unit_price ? p.unit_price * p.quantity + " kr" : ""}`, margin, y);
        y += 6;
      });
      y += 2;
    }

    // Costs
    if (record.total_cost) {
      sectionTitle("Kostnader");
      row("Arbetstimmar", record.labor_hours ? `${record.labor_hours} h` : "–");
      row("Arbetskostnad", record.labor_cost ? `${record.labor_cost.toLocaleString("sv-SE")} kr` : "–");
      row("Totalkostnad", `${record.total_cost.toLocaleString("sv-SE")} kr`);
      y += 3;
    }

    // Signature
    sectionTitle("Teknikersignatur");
    doc.addImage(signatureBase64, "PNG", margin, y, 70, 25);
    y += 28;
    doc.setFontSize(8);
    doc.setTextColor(120, 150, 150);
    doc.text(record.technician_name || "", margin, y);
    doc.text(format(new Date(), "d MMM yyyy HH:mm", { locale: sv }), margin + 75, y);
    y += 10;

    // Footer
    doc.setFillColor(240, 245, 245);
    doc.rect(0, 280, pageW, 17, "F");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 140, 140);
    doc.text("Astomed Klinikutrustning Sverige AB  |  Jägerhorns väg 3-5, 141 75 Kungens Kurva  |  Tel: 08-410 779 00  |  info@astomed.se", pageW / 2, 288, { align: "center" });

    // Convert to Blob and upload
    const pdfBlob = doc.output("blob");
    const pdfFile = new File([pdfBlob], `servicerapport-${record.id}.pdf`, { type: "application/pdf" });
    const { file_url: pdfUrl } = await base44.integrations.Core.UploadFile({ file: pdfFile });

    // Save to ServiceRecord
    await base44.entities.ServiceRecord.update(record.id, {
      status: "completed",
      technician_signature: signatureBase64,
      report_url: pdfUrl,
    });

    setSaving(false);
    onComplete?.();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white w-full max-w-lg rounded-t-2xl shadow-2xl p-5 pb-8"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-bold text-slate-900 text-base">Signera & slutför</h2>
            <p className="text-xs text-slate-500 mt-0.5">{machine?.model} · {customer?.company_name}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Canvas */}
        <div className="relative mb-3">
          <div className="text-xs text-slate-400 mb-1.5 font-medium">Teknikersignatur</div>
          <div className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 overflow-hidden" style={{ touchAction: "none" }}>
            <canvas
              ref={canvasRef}
              style={{ width: "100%", height: "140px", display: "block", cursor: "crosshair", touchAction: "none" }}
              onMouseDown={startDraw}
              onMouseMove={draw}
              onMouseUp={endDraw}
              onMouseLeave={endDraw}
              onTouchStart={startDraw}
              onTouchMove={draw}
              onTouchEnd={endDraw}
            />
          </div>
          {!hasSignature && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none mt-6">
              <span className="text-slate-300 text-sm">Rita din signatur här</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={clearCanvas}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 active:scale-95 transition-all"
          >
            <RotateCcw className="w-4 h-4" /> Rensa
          </button>
          <button
            onClick={handleSave}
            disabled={!hasSignature || saving}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-600 text-white text-sm font-semibold disabled:opacity-50 active:scale-95 transition-all"
          >
            {saving ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Genererar PDF...</>
            ) : (
              <><FileText className="w-4 h-4" /> Spara signatur & generera PDF</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}