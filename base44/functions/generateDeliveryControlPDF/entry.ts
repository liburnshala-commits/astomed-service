import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { jsPDF } from 'npm:jspdf@4.0.0';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        const payload = await req.json();
        const { deliveryControlId } = payload;
        
        if (!deliveryControlId) {
            return Response.json({ error: 'Missing deliveryControlId' }, { status: 400 });
        }

        const control = await base44.asServiceRole.entities.DeliveryControl.get(deliveryControlId);
        if (!control) {
            return Response.json({ error: 'Control not found' }, { status: 404 });
        }
        
        const doc = new jsPDF();
        
        // Header
        doc.setFontSize(22);
        doc.text('Leveranskontroll Rapport', 20, 20);
        
        doc.setFontSize(12);
        doc.text(`Maskin: ${control.model || 'Ej angiven'}`, 20, 35);
        doc.text(`Serienummer: ${control.serial_number || 'Ej angivet'}`, 20, 42);
        doc.text(`Datum: ${control.control_date || 'Ej angivet'}`, 20, 49);
        
        // Result Summary
        doc.setFontSize(14);
        doc.text('Resultat', 20, 65);
        doc.setFontSize(11);
        doc.text(`Status: ${control.delivery_control_status}`, 20, 72);
        doc.text(`Beslut: ${control.can_machine_be_used}`, 20, 79);
        if (control.final_comments) {
            doc.text(`Kommentar: ${control.final_comments}`, 20, 86);
        }
        
        // Step 1
        let y = 100;
        doc.setFontSize(14);
        doc.text('Steg 1: Om maskinen', 20, y); y += 8;
        doc.setFontSize(10);
        doc.text(`Fotograferad förpackning: ${control.packaging_ok ? 'Ja' : 'Nej'}`, 20, y); y += 6;
        doc.text(`Inga skador på förpackning: ${control.no_visible_damage_packaging ? 'Ja' : 'Nej'}`, 20, y); y += 6;
        doc.text(`Fotograferad maskin: ${control.machine_photos_ok ? 'Ja' : 'Nej'}`, 20, y); y += 6;
        doc.text(`Inga sprickor/bucklor: ${control.no_cracks_dents_stains ? 'Ja' : 'Nej'}`, 20, y); y += 6;
        
        // Step 2
        y += 10;
        doc.setFontSize(14);
        doc.text('Steg 2: Uppackning', 20, y); y += 8;
        doc.setFontSize(10);
        doc.text(`SN stämmer överens: ${control.serial_number_matches_document ? 'Ja' : 'Nej'}`, 20, y); y += 6;
        doc.text(`Allt beställt finns med: ${control.all_ordered_items_present ? 'Ja' : 'Nej'}`, 20, y); y += 6;
        doc.text(`Manual finns: ${control.manual_present ? 'Ja' : 'Nej'}`, 20, y); y += 6;
        
        // Step 3
        y += 10;
        doc.setFontSize(14);
        doc.text('Steg 3: Start', 20, y); y += 8;
        doc.setFontSize(10);
        doc.text(`Maskinen startar: ${control.machine_starts ? 'Ja' : 'Nej'}`, 20, y); y += 6;
        doc.text(`Inga konstiga ljud: ${control.no_strange_sounds_smells ? 'Ja' : 'Nej'}`, 20, y); y += 6;
        doc.text(`Inga vibrationer: ${control.no_abnormal_vibrations ? 'Ja' : 'Nej'}`, 20, y); y += 6;
        doc.text(`Nödstopp fungerar: ${control.emergency_stop_functions ? 'Ja' : 'Nej'}`, 20, y); y += 6;
        
        // Step 4
        y += 10;
        doc.setFontSize(14);
        doc.text('Steg 4: Funktion & Säkerhet', 20, y); y += 8;
        doc.setFontSize(10);
        doc.text(`Jämn ljusstråle: ${control.light_beam_symmetrical ? 'Ja' : 'Nej'}`, 20, y); y += 6;
        doc.text(`Fotpedal fungerar: ${control.foot_pedal_functions ? 'Ja' : 'Nej'}`, 20, y); y += 6;
        doc.text(`Skyddsglasögon finns: ${control.safety_glasses_present ? 'Ja' : 'Nej'}`, 20, y); y += 6;
        doc.text(`Varningsskylt finns: ${control.warning_sign_present ? 'Ja' : 'Nej'}`, 20, y); y += 6;

        const pdfBytes = doc.output('arraybuffer');
        const file = new File([pdfBytes], 'report.pdf', { type: 'application/pdf' });
        
        const uploadRes = await base44.asServiceRole.integrations.Core.UploadFile({ file });
        
        if (uploadRes.file_url) {
            await base44.asServiceRole.entities.DeliveryControl.update(deliveryControlId, {
                report_pdf_url: uploadRes.file_url
            });
            return Response.json({ success: true, url: uploadRes.file_url });
        } else {
            return Response.json({ error: 'Failed to upload PDF' }, { status: 500 });
        }
        
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});