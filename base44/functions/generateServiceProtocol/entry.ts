import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import { jsPDF } from 'npm:jspdf@4.0.0';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user || user.role === 'customer') {
            return Response.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { recordId } = await req.json();
        if (!recordId) return Response.json({ error: 'Missing recordId' }, { status: 400 });

        const record = await base44.entities.ServiceRecord.get(recordId);
        if (!record) return Response.json({ error: 'Record not found' }, { status: 404 });

        const machine = await base44.entities.Machine.get(record.machine_id);
        const customer = await base44.entities.Customer.get(record.customer_id);

        const doc = new jsPDF();
        
        // Colors
        const primaryColor = '#1b3a3a';
        const slate500 = '#64748b';
        const slate800 = '#1e293b';
        const slate200 = '#e2e8f0';

        let y = 20;

        // Header / Logo
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(24);
        doc.setTextColor(primaryColor);
        doc.text('ASTOMED', 20, y);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(slate500);
        doc.text('Klinikutrustning Sverige AB', 20, y + 6);

        // Header Meta (Date)
        doc.setFontSize(10);
        doc.text(record.service_date || new Date().toISOString().split('T')[0], 190, y, { align: 'right' });
        doc.text('Serviceprotokoll', 190, y + 6, { align: 'right' });

        y += 20;

        // Line
        doc.setDrawColor(slate200);
        doc.line(20, y, 190, y);
        y += 15;

        // Title
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.setTextColor(slate800);
        doc.text('SERVICERAPPORT', 20, y);
        y += 10;

        // Sub meta
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(slate500);
        doc.text(`Datum: ${record.service_date || ''}`, 20, y);
        if (customer?.city) {
            doc.text(`Plats: ${customer.city}`, 20, y + 6);
        }
        y += 15;
        doc.line(20, y, 190, y);
        y += 10;

        // Two column layout for Customer and Machine
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(slate800);
        doc.text('Kundinformation', 20, y);
        doc.text('Utrustning', 110, y);
        
        y += 8;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(slate800);
        doc.text(`Företag: ${customer?.company_name || ''}`, 20, y);
        doc.text(`Kontakt: ${customer?.contact_person || ''}`, 20, y + 6);
        if (customer?.org_number) {
            doc.text(`Org.nr: ${customer.org_number}`, 20, y + 12);
        }

        doc.text(`Modell: ${machine?.model || ''}`, 110, y);
        doc.text(`Tillverkare: Alma`, 110, y + 6);
        doc.text(`SN: ${machine?.serial_number || ''}`, 110, y + 12);
        
        y += 20;
        doc.setDrawColor(slate200);
        doc.line(20, y, 190, y);
        y += 10;

        // Service Assessment
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(slate800);
        doc.text('Teknisk bedömning & Mätvärden', 20, y);
        
        y += 8;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        
        const splitDesc = doc.splitTextToSize(record.description || 'Ingen bedömning angiven.', 170);
        doc.text(splitDesc, 20, y);
        y += (splitDesc.length * 5) + 5;

        let hasMeasurements = false;
        if (record.measured_laser_power || record.pulse_count) {
            doc.setFont('helvetica', 'bold');
            doc.text(machine?.model === "Soprano Titanium" ? 'Handenhet 1' : 'Mätvärden', 20, y);
            y += 6;
            doc.setFont('helvetica', 'normal');
            if (record.measured_laser_power) {
                doc.text(`Lasereffekt: ${record.measured_laser_power}`, 25, y);
                y += 6;
            }
            if (record.pulse_count) {
                doc.text(`Pulser: ${record.pulse_count.toLocaleString('sv-SE')}`, 25, y);
                y += 6;
            }
            hasMeasurements = true;
        }

        if (record.measured_laser_power_2 || record.pulse_count_2) {
            if (hasMeasurements) y += 2;
            doc.setFont('helvetica', 'bold');
            doc.text('Handenhet 2', 20, y);
            y += 6;
            doc.setFont('helvetica', 'normal');
            if (record.measured_laser_power_2) {
                doc.text(`Lasereffekt: ${record.measured_laser_power_2}`, 25, y);
                y += 6;
            }
            if (record.pulse_count_2) {
                doc.text(`Pulser: ${record.pulse_count_2.toLocaleString('sv-SE')}`, 25, y);
                y += 6;
            }
            hasMeasurements = true;
        }

        if (record.extra_handpieces && record.extra_handpieces.length > 0) {
            record.extra_handpieces.forEach((hp: any) => {
                if (hasMeasurements) y += 2;
                doc.setFont('helvetica', 'bold');
                doc.text(hp.label || 'Extra handenhet', 20, y);
                y += 6;
                doc.setFont('helvetica', 'normal');
                if (hp.measured_power) {
                    doc.text(`Lasereffekt: ${hp.measured_power}`, 25, y);
                    y += 6;
                }
                if (hp.pulse_count) {
                    doc.text(`Pulser: ${hp.pulse_count.toLocaleString('sv-SE')}`, 25, y);
                    y += 6;
                }
                hasMeasurements = true;
            });
        }
        
        if (hasMeasurements) {
             y += 4;
        } else {
             y -= 5;
        }
        doc.setDrawColor(slate200);
        doc.line(20, y, 190, y);
        y += 10;

        // Parts / Cost
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Åtgärder och material', 20, y);
        y += 8;

        if (record.parts_used && record.parts_used.length > 0) {
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text('Benämning', 20, y);
            doc.text('Antal', 140, y);
            doc.text('Summa', 170, y);
            y += 6;
            
            doc.setFont('helvetica', 'normal');
            record.parts_used.forEach(part => {
                doc.text(part.part_name || '', 20, y);
                doc.text((part.quantity || 1).toString(), 140, y);
                const sum = ((part.unit_price || 0) * (part.quantity || 1)).toLocaleString('sv-SE') + ' kr';
                doc.text(sum, 170, y);
                y += 6;
                
                if (y > 270) {
                    doc.addPage();
                    y = 20;
                }
            });
            y += 4;
        } else {
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(slate500);
            doc.text('Inga reservdelar registrerade.', 20, y);
            y += 10;
        }

        // Totals
        if (record.total_cost > 0) {
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(slate800);
            y += 4;
            doc.text('Totalt:', 140, y);
            doc.text(record.total_cost.toLocaleString('sv-SE') + ' kr', 170, y);
            y += 10;
        }

        // Footer setup
        if (y > 220) {
            doc.addPage();
            y = 20;
        } else {
            y = 220;
        }

        doc.setDrawColor(slate200);
        doc.line(20, y, 190, y);
        y += 10;

        // Signatures
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Signaturer', 20, y);
        y += 10;

        doc.setFont('helvetica', 'normal');
        doc.text('_________________________________', 20, y);
        doc.text('_________________________________', 110, y);
        y += 6;
        doc.setFontSize(8);
        doc.setTextColor(slate500);
        doc.text(`Tekniker: ${record.technician_name || ''}`, 20, y);
        doc.text(`Kund: ${customer?.contact_person || customer?.company_name || ''}`, 110, y);

        // Very bottom footer
        y = 275;
        doc.setDrawColor(slate200);
        doc.line(20, y, 190, y);
        
        y += 5;
        doc.setFontSize(7);
        doc.setTextColor(slate500);
        
        doc.text('Astomed Klinikutrustning Sverige AB', 20, y);
        doc.text('Jägerhorns väg 3-5', 20, y + 4);
        doc.text('141 75 Kungens Kurva', 20, y + 8);
        
        doc.text('08 - 410 779 00', 80, y);
        doc.text('info@astomed.se', 80, y + 4);
        doc.text('www.astomed.se', 80, y + 8);
        
        doc.text('Org.nr: 556709-9964', 140, y);
        doc.text('Momsregnr: SE556709996401', 140, y + 4);
        doc.text('Godkänd för F-skatt', 140, y + 8);

        const pdfArrayBuffer = doc.output('arraybuffer');
        const uint8Array = new Uint8Array(pdfArrayBuffer);
        const file = new File([uint8Array], `Serviceprotokoll_${recordId}_${Date.now()}.pdf`, { type: 'application/pdf' });

        const uploadRes = await base44.integrations.Core.UploadPrivateFile({ file: file });
        
        await base44.entities.ServiceRecord.update(recordId, {
            protocol_uri: uploadRes.file_uri
        });

        return Response.json({ success: true, protocol_uri: uploadRes.file_uri });
    } catch (error) {
        console.error(error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});