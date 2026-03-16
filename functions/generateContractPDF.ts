import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import { jsPDF } from 'npm:jspdf@4.0.0';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { machineId } = await req.json();

        if (!machineId) {
            return Response.json({ error: 'Machine ID is required' }, { status: 400 });
        }

        const machine = await base44.asServiceRole.entities.Machine.get(machineId);
        if (!machine) {
            return Response.json({ error: 'Machine not found' }, { status: 404 });
        }

        const customer = await base44.asServiceRole.entities.Customer.get(machine.customer_id);
        if (!customer) {
            return Response.json({ error: 'Customer not found' }, { status: 404 });
        }

        const doc = new jsPDF();

        // Header background
        doc.setFillColor(27, 58, 58);
        doc.rect(0, 0, 210, 45, 'F');

        // Fetch and add logo as base64
        try {
            const logoResponse = await fetch('https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69a9446fcb1cd4ab529479ba/0060a5b35_channels4_profile-2.jpg');
            const logoBlob = await logoResponse.arrayBuffer();
            const logoBase64 = btoa(String.fromCharCode(...new Uint8Array(logoBlob)));
            doc.addImage('data:image/jpeg;base64,' + logoBase64, 'JPEG', 15, 8, 25, 25);
        } catch (logoError) {
            console.log('Logo loading skipped');
        }

        // Title
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text('Serviceavtal', 50, 22);

        // Astomed details
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text('Astomed AB | Jägerhorns väg 5 | 141 75 Kungens kurva', 50, 30);

        // Reset color to black
        doc.setTextColor(0, 0, 0);

        // Divider line
        doc.setDrawColor(58, 158, 158);
        doc.line(20, 48, 190, 48);

        // Customer details
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(27, 58, 58);
        doc.text('KUNDUPPGIFTER', 20, 55);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.text('Företag: ' + (customer.company_name || ''), 20, 62);
        doc.text('Organisationsnummer: ' + (customer.org_number || ''), 20, 67);
        doc.text('Telefon: ' + (customer.phone || ''), 20, 72);
        doc.text('E-post: ' + (customer.email || ''), 20, 77);

        // Machine details
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(27, 58, 58);
        doc.text('MASKININFORMATION', 20, 88);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.text('Maskinmodell: ' + (machine.model || ''), 20, 95);
        doc.text('Serienummer: ' + (machine.serial_number || ''), 20, 100);
        doc.text('Serviceavtal: ' + (machine.service_contract === 'basic' ? 'BAS - Astomed 3.0' : machine.service_contract || ''), 20, 105);
        
        if (machine.contract_start_date) {
            const startDate = new Date(machine.contract_start_date).toLocaleDateString('sv-SE');
            doc.text('Startdatum: ' + startDate, 20, 110);
        }
        
        if (machine.contract_binding_months) {
            doc.text('Bindningstid: ' + machine.contract_binding_months + ' månader', 20, 115);
        }

        let yOffset = 125;
        
        // Fetch service agreement template if linked
        let template = null;
        if (machine.service_agreement_template_id) {
            template = await base44.asServiceRole.entities.ServiceAgreementTemplate.get(machine.service_agreement_template_id);
        }

        const includedServices = template?.included_services || [];
        const templateName = template?.name || (machine.model || '');
        const templatePrice = template?.price_per_month ? template.price_per_month + ' kr/månad' : null;

        yOffset += 3;
        if (includedServices.length > 0) {
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(27, 58, 58);
            doc.text('STANDARDSERVICE OCH UNDERHÅLL – ' + templateName.toUpperCase(), 20, yOffset);
            
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8.5);
            doc.setTextColor(0, 0, 0);
            yOffset += 6;
            
            for (let i = 0; i < includedServices.length; i++) {
                if (yOffset > 270) {
                    doc.addPage();
                    yOffset = 20;
                }
                const lines = doc.splitTextToSize('• ' + includedServices[i], 170);
                doc.text(lines, 20, yOffset);
                yOffset += (lines.length * 4) + 1;
            }
            
            if (templatePrice) {
                if (yOffset > 270) { doc.addPage(); yOffset = 20; }
                doc.setFont('helvetica', 'bold');
                doc.text('Pris: ' + templatePrice, 20, yOffset);
            }
        }

        // Generate PDF
        const pdfBytes = doc.output('arraybuffer');

        return new Response(pdfBytes, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': 'attachment; filename="serviceavtal.pdf"'
            }
        });
    } catch (error) {
        console.error('PDF generation error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});