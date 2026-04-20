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
        
        doc.setFontSize(20);
        doc.text('Serviceprotokoll', 20, 20);
        
        doc.setFontSize(12);
        doc.text(`Datum: ${record.service_date || ''}`, 20, 30);
        doc.text(`Tekniker: ${record.technician_name || ''}`, 20, 40);
        
        doc.setFontSize(14);
        doc.text('Kundinformation', 20, 55);
        doc.setFontSize(12);
        doc.text(`Företag: ${customer?.company_name || ''}`, 20, 65);
        doc.text(`Kontaktperson: ${customer?.contact_person || ''}`, 20, 75);
        
        doc.setFontSize(14);
        doc.text('Maskininformation', 20, 90);
        doc.setFontSize(12);
        doc.text(`Modell: ${machine?.model || ''}`, 20, 100);
        doc.text(`Serienummer: ${machine?.serial_number || ''}`, 20, 110);
        doc.text(`Serviceavtal: ${machine?.service_contract === 'basic' ? 'Basic' : 'Inget'}`, 20, 120);
        
        doc.setFontSize(14);
        doc.text('Servicebeskrivning & Mätvärden', 20, 135);
        doc.setFontSize(10);
        const splitDesc = doc.splitTextToSize(record.description || 'Ingen beskrivning', 170);
        doc.text(splitDesc, 20, 145);

        let y = 145 + (splitDesc.length * 5) + 5;
        
        if (record.measured_laser_power) {
            doc.text(`Uppmätt lasereffekt: ${record.measured_laser_power}`, 20, y);
            y += 6;
        }
        if (record.pulse_count) {
            doc.text(`Antal pulser: ${record.pulse_count}`, 20, y);
            y += 6;
        }
        
        y += 5;
        
        if (record.parts_used && record.parts_used.length > 0) {
            doc.setFontSize(14);
            doc.text('Utbytta delar', 20, y);
            y += 10;
            doc.setFontSize(10);
            record.parts_used.forEach(part => {
                doc.text(`- ${part.part_name} (Art: ${part.part_number}) x${part.quantity}`, 20, y);
                y += 7;
            });
        }

        const pdfArrayBuffer = doc.output('arraybuffer');
        const uint8Array = new Uint8Array(pdfArrayBuffer);
        const file = new File([uint8Array], `Serviceprotokoll_${recordId}.pdf`, { type: 'application/pdf' });

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