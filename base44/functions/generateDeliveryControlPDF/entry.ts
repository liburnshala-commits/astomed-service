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
        
        let customer = null;
        if (control.customer_id) {
            customer = await base44.asServiceRole.entities.Customer.get(control.customer_id);
        }
        
        const doc = new jsPDF();
        
        // Header block
        doc.setFillColor(27, 58, 58); // #1b3a3a dark green
        doc.rect(0, 0, 210, 35, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text('Leveranskontroll', 20, 22);
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(control.control_date || new Date().toISOString().split('T')[0], 190, 22, { align: 'right' });
        
        // Sections configuration
        const col1X = 20;
        const col2X = 110;
        let y = 45;
        
        // Customer & Machine Info
        doc.setTextColor(0, 0, 0);
        
        // Box 1: Customer
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Kunduppgifter', col1X, y);
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        let cY = y + 7;
        if (customer) {
            doc.text(`Företag: ${customer.company_name || '-'}`, col1X, cY); cY += 6;
            doc.text(`Org.nr: ${customer.org_number || '-'}`, col1X, cY); cY += 6;
            doc.text(`Adress: ${customer.address || '-'}, ${customer.postal_code || ''} ${customer.city || ''}`, col1X, cY); cY += 6;
            doc.text(`Kontakt: ${customer.contact_person || '-'}`, col1X, cY); cY += 6;
            doc.text(`Telefon: ${customer.phone || '-'}`, col1X, cY); cY += 6;
            doc.text(`E-post: ${customer.email || '-'}`, col1X, cY);
        } else {
            doc.text('Ingen kund kopplad till denna leverans.', col1X, cY);
        }

        // Box 2: Machine
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Maskinuppgifter', col2X, y);
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        let mY = y + 7;
        doc.text(`Modell: ${control.model || 'Ej angiven'}`, col2X, mY); mY += 6;
        doc.text(`Tillverkare: ${control.manufacturer || 'Ej angiven'}`, col2X, mY); mY += 6;
        doc.text(`Serienummer: ${control.serial_number || 'Ej angivet'}`, col2X, mY); mY += 6;
        doc.text(`Maskintyp: ${control.machine_type || 'Ej angiven'}`, col2X, mY); mY += 6;
        doc.text(`Leveransdatum: ${control.delivery_date || 'Ej angivet'}`, col2X, mY); mY += 6;
        doc.text(`Status: ${control.is_used_machine ? 'Begagnad' : 'Ny maskin'}`, col2X, mY);
        
        y = Math.max(cY, mY) + 15;
        
        // Result Summary Box
        doc.setFillColor(245, 247, 250); // Light blueish gray background
        doc.rect(15, y, 180, 25, 'F');
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Beslut & Status', 20, y + 8);
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        
        // Color code the status
        if (control.delivery_control_status === 'Godkänd') doc.setTextColor(22, 163, 74);
        else if (control.delivery_control_status === 'Ej godkänd') doc.setTextColor(220, 38, 38);
        else doc.setTextColor(202, 138, 4);
        
        doc.setFont('helvetica', 'bold');
        doc.text(`${control.delivery_control_status}`, 20, y + 18);
        
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');
        doc.text(`| ${control.can_machine_be_used}`, 65, y + 18);
        
        y += 35;
        
        // Helper to draw checklist items
        const drawCheckItem = (label, isChecked, x, currentY) => {
            doc.setFont('helvetica', 'normal');
            doc.text(label, x + 6, currentY);
            if (isChecked) {
                doc.setTextColor(22, 163, 74);
                doc.setFont('helvetica', 'bold');
                doc.text('✓', x, currentY);
            } else {
                doc.setTextColor(220, 38, 38);
                doc.setFont('helvetica', 'bold');
                doc.text('x', x, currentY);
            }
            doc.setTextColor(0, 0, 0);
            return currentY + 7;
        };

        // Checklists
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Genomgång & Kontroll', 20, y);
        
        y += 10;
        let c1Y = y;
        let c2Y = y;
        
        doc.setFontSize(10);
        
        // Column 1
        doc.setFont('helvetica', 'bold');
        doc.text('Om maskinen & Förpackning', col1X, c1Y); c1Y += 7;
        c1Y = drawCheckItem('Fotograferad förpackning', control.packaging_ok, col1X, c1Y);
        c1Y = drawCheckItem('Inga skador på förpackning', control.no_visible_damage_packaging, col1X, c1Y);
        c1Y = drawCheckItem('Fotograferad maskin', control.machine_photos_ok, col1X, c1Y);
        c1Y = drawCheckItem('Inga sprickor/bucklor', control.no_cracks_dents_stains, col1X, c1Y);
        c1Y += 5;
        
        doc.setFont('helvetica', 'bold');
        doc.text('Uppackning', col1X, c1Y); c1Y += 7;
        c1Y = drawCheckItem('Serienummer stämmer överens', control.serial_number_matches_document, col1X, c1Y);
        c1Y = drawCheckItem('Allt beställt finns med', control.all_ordered_items_present, col1X, c1Y);
        c1Y = drawCheckItem('Manual finns', control.manual_present, col1X, c1Y);
        
        // Column 2
        doc.setFont('helvetica', 'bold');
        doc.text('Start & Ljud', col2X, c2Y); c2Y += 7;
        c2Y = drawCheckItem('Maskinen startar', control.machine_starts, col2X, c2Y);
        c2Y = drawCheckItem('Inga konstiga ljud', control.no_strange_sounds_smells, col2X, c2Y);
        c2Y = drawCheckItem('Inga onormala vibrationer', control.no_abnormal_vibrations, col2X, c2Y);
        c2Y = drawCheckItem('Nödstopp fungerar', control.emergency_stop_functions, col2X, c2Y);
        c2Y += 5;
        
        doc.setFont('helvetica', 'bold');
        doc.text('Funktion & Säkerhet', col2X, c2Y); c2Y += 7;
        c2Y = drawCheckItem('Jämn ljusstråle', control.light_beam_symmetrical, col2X, c2Y);
        c2Y = drawCheckItem('Fotpedal fungerar', control.foot_pedal_functions, col2X, c2Y);
        c2Y = drawCheckItem('Skyddsglasögon finns', control.safety_glasses_present, col2X, c2Y);
        c2Y = drawCheckItem('Varningsskylt finns', control.warning_sign_present, col2X, c2Y);
        
        y = Math.max(c1Y, c2Y) + 15;
        
        // Comments Section
        if (control.other_comments_step2 || control.other_comments_step3 || control.other_comments_step4_function || control.other_comments_step4_safety || control.final_comments) {
            
            if (y > 250) {
               doc.addPage();
               y = 20;
            }
            
            doc.setFillColor(245, 247, 250);
            doc.rect(15, y - 5, 180, 8, 'F');
            doc.setFont('helvetica', 'bold');
            doc.text('Kommentarer och Anteckningar', 20, y);
            y += 8;
            
            doc.setFont('helvetica', 'normal');
            
            const addComment = (title, text) => {
                if (!text) return;
                if (y > 270) { doc.addPage(); y = 20; }
                doc.setFont('helvetica', 'bold');
                doc.text(title + ':', 20, y);
                doc.setFont('helvetica', 'normal');
                
                const splitText = doc.splitTextToSize(text, 170);
                doc.text(splitText, 20, y + 5);
                y += 5 + (splitText.length * 5) + 5;
            };

            addComment('Sammanfattande kommentar', control.final_comments);
            addComment('Uppackning', control.other_comments_step2);
            addComment('Start', control.other_comments_step3);
            addComment('Funktionstest', control.other_comments_step4_function);
            addComment('Säkerhetsutrustning', control.other_comments_step4_safety);
        }
        
        // Footer / Signature area
        if (y > 230) {
            doc.addPage();
            y = 20;
        } else {
            y += 15;
        }
        
        doc.line(20, y, 190, y);
        y += 10;
        doc.text('Utförd av (Namn/Signatur):', 20, y);
        if (control.controlled_by) {
            doc.text(control.controlled_by, 75, y);
        }
        doc.line(75, y + 2, 140, y + 2);

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