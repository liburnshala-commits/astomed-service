import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const leads = await base44.asServiceRole.entities.ServiceContractLead.list();
        const customers = await base44.asServiceRole.entities.Customer.list();
        
        let toUpdate = [];
        
        for (const lead of leads) {
            if (lead.status === 'wrong_email') continue;
            
            let email = lead.email;
            if (lead.customer_id) {
                const customer = customers.find(c => c.id === lead.customer_id);
                if (customer && customer.email) {
                    email = customer.email;
                }
            }
            
            if (!email || email.trim() === '') {
                toUpdate.push(lead.id);
            }
        }
        
        // Process in small batches
        const batchSize = 10;
        let updatedCount = 0;
        for (let i = 0; i < toUpdate.length; i += batchSize) {
            const batch = toUpdate.slice(i, i + batchSize);
            await Promise.all(batch.map(id => 
                base44.asServiceRole.entities.ServiceContractLead.update(id, { status: "wrong_email" })
            ));
            updatedCount += batch.length;
            // Sleep to avoid rate limits
            await new Promise(r => setTimeout(r, 200));
        }
        
        return Response.json({ success: true, needsUpdate: toUpdate.length, updatedCount });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});