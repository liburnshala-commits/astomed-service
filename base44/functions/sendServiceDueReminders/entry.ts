import { createClientFromRequest } from 'npm:@base44/sdk@0.8.24';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (user?.role !== 'admin') {
            return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        // Target date: exactly 30 days from now
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + 30);
        const targetDateString = targetDate.toISOString().split('T')[0];

        // Fetch machines with a service contract that are active
        const machines = await base44.asServiceRole.entities.Machine.filter({
            status: "active"
        });

        const dueMachines = machines.filter(m => 
            m.service_contract && m.service_contract !== 'none' && 
            m.next_service_date === targetDateString
        );

        let sentCount = 0;

        for (const machine of dueMachines) {
            const customer = await base44.asServiceRole.entities.Customer.get(machine.customer_id);
            if (customer && customer.email) {
                const subject = `Dags för service: ${machine.model}`;
                const body = `
                    Hej ${customer.contact_person || customer.company_name},<br><br>
                    Det börjar närma sig dags för service på er maskin <b>${machine.model}</b> (SN: ${machine.serial_number}).<br>
                    Nästa rekommenderade servicedatum är ${machine.next_service_date}.<br><br>
                    Vänligen logga in på din kundportal för att boka en tid för service.<br><br>
                    Passa även på att spana in vårt senaste utbud av utrustning på <a href="https://astomed.se/maskiner/">astomed.se</a>.<br><br>
                    Med vänliga hälsningar,<br>
                    Astomed Service
                `;

                await base44.asServiceRole.integrations.Core.SendEmail({
                    to: customer.email,
                    subject: subject,
                    body: body,
                    from_name: "Astomed Service"
                });
                sentCount++;
            }
        }

        return Response.json({ success: true, sent: sentCount, targetDate: targetDateString });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});