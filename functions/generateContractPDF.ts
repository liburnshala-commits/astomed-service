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

        // Title
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text('Serviceavtal', 20, 20);

        // Astomed details
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('Astomed AB', 150, 20);
        doc.text('Jägerhorns väg 5', 150, 25);
        doc.text('141 75 Kungens kurva', 150, 30);

        // Customer details
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Kunduppgifter:', 20, 50);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text('Företag: ' + (customer.company_name || ''), 20, 57);
        doc.text('Org.nr: ' + (customer.org_number || ''), 20, 62);
        doc.text('Tel: ' + (customer.phone || ''), 20, 67);
        doc.text('E-post: ' + (customer.email || ''), 20, 72);

        // Machine details
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Maskininformation:', 20, 87);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text('Maskin: ' + (machine.model || ''), 20, 94);
        doc.text('Serienummer: ' + (machine.serial_number || ''), 20, 99);
        doc.text('Avtal: ' + (machine.service_contract === 'basic' ? 'BAS - Astomed 3.0' : machine.service_contract || ''), 20, 104);
        
        if (machine.contract_start_date) {
            const startDate = new Date(machine.contract_start_date).toLocaleDateString('sv-SE');
            doc.text('Startdatum: ' + startDate, 20, 109);
        }
        
        if (machine.contract_binding_months) {
            doc.text('Bindningstid: ' + machine.contract_binding_months + ' månader', 20, 114);
        }

        // Terms
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Avtalsvillkor:', 20, 130);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        
        const terms = [
            '1. Avtalstid och Uppsägning\nServiceavtalet löper med en initial bindningstid om 12 månader från avtalets tecknande. Om uppsägning ej sker förlängs avtalet automatiskt med tolv (12) månader i taget.',
            '2. Betalningsvillkor\nBetalning sker månadsvis eller kvartalsvis i förskott via autogiro. Vid utebliven betalning förbehåller sig Astomed rätten att pausa servicetjänster samt debitera dröjsmålsränta enligt lag.',
            '3. Prisjusteringar\nAstomed äger rätt att årligen justera avgiften i enlighet med konsumentprisindex (KPI) eller vid betydande kostnadsökningar för reservdelar och logistik. Kunden ska meddelas om prisjustering senast 30 dagar innan de träder i kraft.',
            '4. Omfattning\nAvtalet omfattar ordinarie underhåll enligt specifikation för respektive maskin. Reparationer utöver standardservice samt reservdelar debiteras enligt gällande prislista med avtalad rabatt om 20 % för reservdelar och 20% på resekostnader.'
        ];
        
        let yOffset = 138;
        for (let i = 0; i < terms.length; i++) {
            const lines = doc.splitTextToSize(terms[i], 170);
            doc.text(lines, 20, yOffset);
            yOffset += (lines.length * 5) + 4;
        }
        
        // Service description from Machine if available
        yOffset += 5;
        if (machine.standard_service_description) {
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('Standardservice och underhåll:', 20, yOffset);
            
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            yOffset += 7;
            
            const descLines = doc.splitTextToSize(machine.standard_service_description, 170);
            doc.text(descLines, 20, yOffset);
            yOffset += (descLines.length * 5) + 3;
            
            if (machine.standard_service_price) {
                doc.text('Pris: ' + machine.standard_service_price + ' SEK', 20, yOffset);
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