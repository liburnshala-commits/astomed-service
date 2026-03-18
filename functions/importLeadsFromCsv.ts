import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        const fileUrl = "https://media.base44.com/files/public/69a9446fcb1cd4ab529479ba/977b8164f_KunderGhali-SopranosBlad1.csv";
        const response = await fetch(fileUrl);
        let text = await response.text();
        
        // Ta bort BOM (Byte Order Mark) om den finns
        if (text.charCodeAt(0) === 0xFEFF) {
            text = text.slice(1);
        }

        const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        const headers = lines[0].split(';');

        const records = [];
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(';');
            const row = {};
            headers.forEach((header, index) => {
                const cleanHeader = header.trim();
                row[cleanHeader] = values[index] !== undefined ? values[index].trim() : '';
            });

            if (!row.company_name) continue;

            const lead = {
                company_name: row.company_name,
                org_number: row.org_number || undefined,
                phone: row.phone || undefined,
                contact_person: row.contact_person || undefined,
                email: row.email || undefined,
                notes: row.notes || undefined,
                status: row.status || 'new',
                service_agreement_template_id: row.service_agreement_template_id || undefined,
                proposed_machines: []
            };

            // Eftersom installationsdatumet ("08-dec.-2016") inte följer YYYY-MM-DD hoppar vi över det,
            // annars kraschar valideringen.

            if (row.model && row.serial_number) {
                lead.proposed_machines.push({
                    model: row.model,
                    serial_number: row.serial_number,
                    notes: row.notes || undefined
                });
            }

            records.push(lead);
        }

        // Bulk insert records
        let successCount = 0;
        let failCount = 0;
        
        const chunkSize = 50;
        for (let i = 0; i < records.length; i += chunkSize) {
            const chunk = records.slice(i, i + chunkSize);
            try {
                await base44.asServiceRole.entities.ServiceContractLead.bulkCreate(chunk);
                successCount += chunk.length;
            } catch (err) {
                console.error(`Misslyckades med chunk vid index ${i}:`, err.message);
                // Fallback till en och en
                for (const r of chunk) {
                    try {
                        await base44.asServiceRole.entities.ServiceContractLead.create(r);
                        successCount++;
                    } catch (e) {
                        console.error("Misslyckades med enskild post:", r.company_name, e.message);
                        failCount++;
                    }
                }
            }
        }

        return Response.json({ success: true, totalFound: records.length, successCount, failCount });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});