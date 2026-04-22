import { createClientFromRequest } from 'npm:@base44/sdk@0.8.26';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        const today = new Date().toISOString().split("T")[0];
        
        const pendingRecords = await base44.asServiceRole.entities.ServiceRecord.filter({ status: "pending" });
        
        let updated = 0;
        for (const record of pendingRecords) {
            if (record.service_date && record.service_date <= today) {
                await base44.asServiceRole.entities.ServiceRecord.update(record.id, { status: "in_progress" });
                updated++;
            }
        }

        return Response.json({ success: true, updated });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});