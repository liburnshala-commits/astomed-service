import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Endast administratörer kan radera data' }, { status: 403 });
        }

        // Hämta alla kunder där is_deleted är true
        const deletedCustomers = await base44.asServiceRole.entities.Customer.list();
        const customersToDelete = deletedCustomers.filter(c => c.is_deleted === true);

        let deletedCount = {
            customers: 0,
            machines: 0,
            serviceRecords: 0
        };

        for (const customer of customersToDelete) {
            // Hämta och radera alla maskiner för denna kund
            const machines = await base44.asServiceRole.entities.Machine.filter({ customer_id: customer.id });
            for (const machine of machines) {
                // Radera alla serviceärenden för denna maskin
                const serviceRecords = await base44.asServiceRole.entities.ServiceRecord.filter({ machine_id: machine.id });
                for (const record of serviceRecords) {
                    await base44.asServiceRole.entities.ServiceRecord.delete(record.id);
                    deletedCount.serviceRecords++;
                }
                
                await base44.asServiceRole.entities.Machine.delete(machine.id);
                deletedCount.machines++;
            }

            // Radera serviceärenden direkt kopplade till kund (om några finns)
            const customerServiceRecords = await base44.asServiceRole.entities.ServiceRecord.filter({ customer_id: customer.id });
            for (const record of customerServiceRecords) {
                await base44.asServiceRole.entities.ServiceRecord.delete(record.id);
                deletedCount.serviceRecords++;
            }

            // Radera kunden
            await base44.asServiceRole.entities.Customer.delete(customer.id);
            deletedCount.customers++;
        }

        return Response.json({
            success: true,
            message: `Raderade ${deletedCount.customers} kunder, ${deletedCount.machines} maskiner och ${deletedCount.serviceRecords} serviceärenden`,
            details: deletedCount
        });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});