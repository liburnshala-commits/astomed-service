import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        const { file_url } = await req.json();
        if (!file_url) {
            return Response.json({ error: "Missing file_url" }, { status: 400 });
        }
        
        const response = await fetch(file_url);
        let text = await response.text();
        
        // Ta bort BOM (Byte Order Mark) om den finns
        if (text.charCodeAt(0) === 0xFEFF) {
            text = text.slice(1);
        }

        // Importera papaparse för stabilare hantering av CSV som kan innehålla radbrytningar
        const Papa = (await import('npm:papaparse')).default;

        const parsed = Papa.parse(text, {
            header: true,
            skipEmptyLines: true,
            delimiter: ';'
        });

        const records = [];
        for (const rawRow of parsed.data) {
            // Rensa keys ifall det finns whitespaces
            const row = {};
            for (const key of Object.keys(rawRow)) {
                row[key.trim()] = rawRow[key] ? rawRow[key].trim() : '';
            }

            if (!row.company_name) {
                console.log("Hoppade över rad på grund av saknad company_name", row);
                continue;
            }

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

        let successCount = 0;
        let failCount = 0;
        let skippedCount = 0;

        // Fetch existing leads to avoid duplicates (based on company_name)
        const existingLeads = await base44.asServiceRole.entities.ServiceContractLead.filter({});
        const existingCompanyNames = new Set(existingLeads.map(l => l.company_name.trim().toLowerCase()));
        
        const newRecords = [];
        for (const record of records) {
            if (existingCompanyNames.has(record.company_name.trim().toLowerCase())) {
                skippedCount++;
            } else {
                newRecords.push(record);
                existingCompanyNames.add(record.company_name.trim().toLowerCase());
            }
        }

        // Bulk insert new records
        const chunkSize = 50;
        for (let i = 0; i < newRecords.length; i += chunkSize) {
            const chunk = newRecords.slice(i, i + chunkSize);
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

        return Response.json({ 
            success: true, 
            totalFound: records.length, 
            successCount, 
            failCount,
            skippedCount
        });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});