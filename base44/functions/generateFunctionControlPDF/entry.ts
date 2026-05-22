import { createClientFromRequest } from 'npm:@base44/sdk@0.8.30';
import { jsPDF } from 'npm:jspdf@4.0.0';

Deno.serve(async (req) => {
    try {
        const { functionControlId } = await req.json();
        if (!functionControlId) {
            return Response.json({ error: "Missing functionControlId" }, { status: 400 });
        }

        const base44 = createClientFromRequest(req);
        
        // Fetch Function Control Record
        const record = await base44.asServiceRole.entities.FunctionControl.get(functionControlId);
        if (!record) {
            return Response.json({ error: "Function control record not found" }, { status: 404 });
        }

        // Fetch Customer
        let customer = null;
        if (record.customer_id) {
            customer = await base44.asServiceRole.entities.Customer.get(record.customer_id);
        }

        const doc = new jsPDF();
        let currentY = 20;
        const pageHeight = doc.internal.pageSize.height;
        const marginLeft = 20;

        const checkPageBreak = (neededSpace) => {
            if (currentY + neededSpace > pageHeight - 20) {
                doc.addPage();
                currentY = 20;
                return true;
            }
            return false;
        };

        const renderField = (label, value) => {
            checkPageBreak(10);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(10);
            doc.text(`${label}:`, marginLeft, currentY);
            doc.setFont("helvetica", "normal");
            
            if (value && typeof value === 'string' && value.length > 60) {
                const lines = doc.splitTextToSize(value, 150);
                doc.text(lines, marginLeft + 45, currentY);
                currentY += (lines.length * 5) + 5;
            } else {
                doc.text(value ? String(value) : '-', marginLeft + 45, currentY);
                currentY += 10;
            }
        };

        const renderCheckbox = (label, isChecked) => {
            checkPageBreak(10);
            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
            doc.text(isChecked ? "[ X ]" : "[   ]", marginLeft, currentY);
            doc.text(label, marginLeft + 12, currentY);
            currentY += 8;
        };

        // Header
        doc.setFillColor(27, 58, 58); // Astomed dark green
        doc.rect(0, 0, doc.internal.pageSize.width, 30, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.setFont("helvetica", "bold");
        doc.text("Astomed Pro", marginLeft, 20);
        doc.setFontSize(14);
        doc.setFont("helvetica", "normal");
        doc.text("Funktionskontroll", doc.internal.pageSize.width - marginLeft, 20, { align: "right" });
        
        currentY = 45;
        doc.setTextColor(0, 0, 0);

        // Section: Grundinfo
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Information", marginLeft, currentY);
        currentY += 10;
        
        renderField("Datum", record.control_date);
        renderField("Maskinmodell", record.machine_model);
        renderField("Serienummer", record.serial_number);
        if (customer) {
            renderField("Kund", customer.company_name);
            renderField("Org.nummer", customer.org_number);
        }

        currentY += 5;

        // Section: Test & Säkerhet
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Test & Säkerhet", marginLeft, currentY);
        currentY += 10;

        renderCheckbox("Maskinen startar korrekt", record.machine_starts);
        renderCheckbox("Inga konstiga ljud eller lukter", record.no_strange_sounds_smells);
        renderCheckbox("Inga onormala vibrationer", record.no_abnormal_vibrations);
        renderCheckbox("Inget läckage", record.no_leakage);
        renderCheckbox("Nödstopp fungerar", record.emergency_stop_functions);
        renderCheckbox("Ljusstrålen är symmetrisk (om tillämpligt)", record.light_beam_symmetrical);
        renderCheckbox("Fotpedalen fungerar", record.foot_pedal_functions);
        renderCheckbox("Skyddsglasögon finns", record.safety_glasses_present);
        renderCheckbox("Varningsskylt finns till dörren", record.warning_sign_present);
        
        if (record.measured_laser_power) {
            currentY += 2;
            renderField("Uppmätt lasereffekt", record.measured_laser_power);
        }

        currentY += 10;

        // Section: Resultat & Kommentarer
        checkPageBreak(40);
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Beslut och Kommentarer", marginLeft, currentY);
        currentY += 10;

        renderField("Status", record.status);
        renderField("Får användas?", record.can_machine_be_used);
        
        if (record.comments) {
            currentY += 5;
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.text("Övriga kommentarer:", marginLeft, currentY);
            currentY += 5;
            doc.setFont("helvetica", "normal");
            const commentLines = doc.splitTextToSize(record.comments, 170);
            doc.text(commentLines, marginLeft, currentY);
            currentY += commentLines.length * 5 + 10;
        }

        // Upload and save PDF
        const pdfBytes = doc.output('arraybuffer');
        
        // Use Node/Deno standard Buffer instead of Buffer from node module.
        const base64Data = btoa(String.fromCharCode(...new Uint8Array(pdfBytes)));
        const dataUri = `data:application/pdf;base64,${base64Data}`;

        const uploadRes = await base44.asServiceRole.integrations.Core.UploadFile({
            file: dataUri
        });

        if (uploadRes.file_url) {
            await base44.asServiceRole.entities.FunctionControl.update(record.id, {
                report_pdf_url: uploadRes.file_url
            });
        }

        return Response.json({ success: true, url: uploadRes.file_url });
    } catch (error) {
        console.error("Error generating function control PDF:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});