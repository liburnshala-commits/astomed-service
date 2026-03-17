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

            const renewalDate = new Date(machine.contract_start_date);
            renewalDate.setMonth(renewalDate.getMonth() + 12);
            doc.text('Förnyelsedatum: ' + renewalDate.toLocaleDateString('sv-SE'), 20, 115);
        }
        
        if (machine.contract_binding_months) {
            doc.text('Bindningstid: ' + machine.contract_binding_months + ' månader', 20, 120);
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

        yOffset += 6;
        if (includedServices.length > 0) {
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(27, 58, 58);
            doc.text('AVTALSINNEHÅLL OCH PRIS', 20, yOffset);
            yOffset += 8;

            doc.setFontSize(10);
            doc.text('STANDARDSERVICE OCH UNDERHÅLL – ' + templateName.toUpperCase(), 20, yOffset);
            
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.setTextColor(0, 0, 0);
            yOffset += 6;
            
            for (let i = 0; i < includedServices.length; i++) {
                if (yOffset > 270) {
                    doc.addPage();
                    yOffset = 20;
                }
                const lines = doc.splitTextToSize('• ' + includedServices[i], 170);
                doc.text(lines, 20, yOffset);
                yOffset += (lines.length * 5);
            }
            
            if (templatePrice) {
                yOffset += 5;
                if (yOffset > 250) { doc.addPage(); yOffset = 20; }
                
                // Add a highlighted box for the price
                doc.setDrawColor(220, 232, 232);
                doc.setFillColor(244, 246, 244);
                doc.roundedRect(20, yOffset, 170, 20, 2, 2, 'FD');
                
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(11);
                doc.setTextColor(27, 58, 58);
                doc.text('Pris: ' + templatePrice, 25, yOffset + 8);
                
                doc.setFont('helvetica', 'italic');
                doc.setFontSize(8);
                doc.setTextColor(100, 100, 100);
                doc.text('* Alla priser anges exklusive moms (25%).', 25, yOffset + 15);
                
                yOffset += 28;
            }
        }

        // New page for terms with header
        doc.addPage();

        // Header background on terms page
        doc.setFillColor(27, 58, 58);
        doc.rect(0, 0, 210, 45, 'F');

        try {
            const logoResponse2 = await fetch('https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69a9446fcb1cd4ab529479ba/0060a5b35_channels4_profile-2.jpg');
            const logoBlob2 = await logoResponse2.arrayBuffer();
            const logoBase642 = btoa(String.fromCharCode(...new Uint8Array(logoBlob2)));
            doc.addImage('data:image/jpeg;base64,' + logoBase642, 'JPEG', 15, 8, 25, 25);
        } catch (e) {
            console.log('Logo loading skipped on page 2');
        }

        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text('Avtalsvillkor', 50, 22);

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text('Astomed AB | Jägerhorns väg 5 | 141 75 Kungens kurva', 50, 30);

        doc.setTextColor(0, 0, 0);
        doc.setDrawColor(58, 158, 158);
        doc.line(20, 48, 190, 48);

        // Terms
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(27, 58, 58);
        doc.text('AVTALSVILLKOR', 20, 58);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(0, 0, 0);

        const terms = [
            '1. Avtalstid och Uppsägning\nServiceavtalet löper med en initial bindningstid om 12 månader från avtalets tecknande. Om uppsägning ej sker förlängs avtalet automatiskt med tolv (12) månader i taget.',
            '2. Betalningsvillkor\nBetalning sker månadsvis eller kvartalsvis i förskott via autogiro. Vid utebliven betalning förbehåller sig Astomed rätten att pausa servicetjänster samt debitera dröjsmålsränta enligt lag.',
            '3. Prisjusteringar\nAstomed äger rätt att årligen justera avgiften i enlighet med konsumentprisindex (KPI) eller vid betydande kostnadsökningar för reservdelar och logistik. Kunden ska meddelas om prisjustering senast 30 dagar innan de träder i kraft.',
            '4. Omfattning\nAvtalet omfattar ordinarie underhåll enligt specifikation för respektive maskin. Reparationer utöver standardservice samt reservdelar debiteras enligt gällande prislista med avtalad rabatt om 20 % för reservdelar och 20% på resekostnader.',
            '5. Resekostnader\nMilersättning: En fast ersättning om 100 kr per mil (motsvarande 10 kr per kilometer) debiteras för den totala körsträckan fram och åter från Astomeds servicecenter.\nSamplanering för sänkta kostnader: Astomed strävar aktivt efter att samplanera servicebesök inom samma geografiska område för att minimera miljöpåverkan och sänka kundens omkostnader. Vid lyckad samplanering delas den totala resekostnaden och restidsarvodet proportionerligt mellan de berörda klinikerna.'
        ];

        let termsY = 66;
        for (let i = 0; i < terms.length; i++) {
            const lines = doc.splitTextToSize(terms[i], 170);
            doc.text(lines, 20, termsY);
            termsY += (lines.length * 5) + 4;
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