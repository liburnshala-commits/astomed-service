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

        // Add custom encoding support for Swedish characters
        doc.setLanguage("sv");

        // Set font and size for title
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text(doc.splitTextToSize('Serviceavtal', 170), 20, 20);

        // Add Astomed details
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(decodeURIComponent(escape('Astomed AB')), 150, 20);
        doc.text(decodeURIComponent(escape('Jägerhorns väg 5')), 150, 25);
        doc.text(decodeURIComponent(escape('141 75 Kungens kurva')), 150, 30);
        doc.text(decodeURIComponent(escape('Tel: (+46) 08-410 77 900')), 150, 35);
        doc.text(decodeURIComponent(escape('E-post: kontakt@astomed.se')), 150, 40);

        // Add customer details
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(decodeURIComponent(escape('Kunduppgifter:')), 20, 50);
        doc.setFont('helvetica', 'normal');
        doc.text(decodeURIComponent(escape(`Företagsnamn: ${customer.company_name || ''}`)), 20, 57);
        doc.text(decodeURIComponent(escape(`Organisationsnummer: ${customer.org_number || ''}`)), 20, 62);
        doc.text(decodeURIComponent(escape(`Telefon: ${customer.phone || ''}`)), 20, 67);
        doc.text(decodeURIComponent(escape(`E-post: ${customer.email || ''}`)), 20, 72);
        doc.text(decodeURIComponent(escape(`Adress: ${customer.address || ''}, ${customer.postal_code || ''} ${customer.city || ''}`)), 20, 77);

        // Add machine details
        doc.setFont('helvetica', 'bold');
        doc.text(decodeURIComponent(escape('Maskininformation:')), 20, 87);
        doc.setFont('helvetica', 'normal');
        doc.text(decodeURIComponent(escape(`Maskintyp: ${machine.model || ''}`)), 20, 94);
        doc.text(decodeURIComponent(escape(`Serienummer: ${machine.serial_number || ''}`)), 20, 99);
        doc.text(decodeURIComponent(escape(`Serviceavtal: ${machine.service_contract === "basic" ? "BAS – Astomed 3.0" : machine.service_contract || ''}`)), 20, 104);
        doc.text(decodeURIComponent(escape(`Avtalstid: ${machine.contract_binding_months ? machine.contract_binding_months + " månader" : ''}`)), 20, 109);
        doc.text(decodeURIComponent(escape(`Startdatum: ${machine.contract_start_date ? new Date(machine.contract_start_date).toLocaleDateString('sv-SE') : ''}`)), 20, 114);

        // Contract terms
        const terms = [
            '1. Avtalstid och Uppsägning',
            'Serviceavtalet löper med en initial bindningstid om 12 månader från avtalets tecknande. Om uppsägning ej sker förlängs avtalet automatiskt med tolv (12) månader i taget.',
            '',
            '2. Betalningsvillkor',
            'Betalning sker månadsvis eller kvartalsvis i förskott via autogiro. Vid utebliven betalning förbehåller sig Astomed rätten att pausa servicetjänster samt debitera dröjsmålsränta enligt lag.',
            '',
            '3. Prisjusteringar',
            'Astomed äger rätt att årligen justera avgiften i enlighet med konsumentprisindex (KPI) eller vid betydande kostnadsökningar för reservdelar och logistik. Kunden ska meddelas om prisjustering senast 30 dagar innan de träder i kraft.',
            '',
            '4. Omfattning',
            'Avtalet omfattar ordinarie underhåll enligt specifikation för respektive maskin. Reparationer utöver standardservice samt reservdelar debiteras enligt gällande prislista med avtalad rabatt om 20 % för reservdelar och 20% på resekostnader.'
        ];

        let yOffset = 125;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        terms.forEach(term => {
            const encodedTerm = decodeURIComponent(escape(term));
            const splitText = doc.splitTextToSize(encodedTerm, 170);
            doc.text(splitText, 20, yOffset);
            yOffset += (splitText.length * 4) + 2;
        });

        // Signatures area
        yOffset += 10;
        if (yOffset > 250) {
            doc.addPage();
            yOffset = 20;
        }
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(decodeURIComponent(escape('Underskrifter:')), 20, yOffset);
        yOffset += 10;
        doc.setFont('helvetica', 'normal');
        doc.text('____________________________', 20, yOffset);
        doc.text(decodeURIComponent(escape('Datum')), 20, yOffset + 5);
        doc.text('____________________________', 120, yOffset);
        doc.text(decodeURIComponent(escape('Astomed AB')), 120, yOffset + 5);
        yOffset += 20;
        doc.text('____________________________', 20, yOffset);
        doc.text(decodeURIComponent(escape('Kundens underskrift')), 20, yOffset + 5);

        const pdfBytes = doc.output('arraybuffer');

        return new Response(pdfBytes, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': 'attachment; filename="serviceavtal.pdf"'
            }
        });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});