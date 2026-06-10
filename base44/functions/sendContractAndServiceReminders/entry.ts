import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);

        const [machines, customers, users] = await Promise.all([
            base44.asServiceRole.entities.Machine.list(),
            base44.asServiceRole.entities.Customer.list(),
            base44.asServiceRole.entities.User.list(),
        ]);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const customerMap = Object.fromEntries(customers.map(c => [c.id, c]));
        const staffEmails = users
            .filter(u => u.role === 'admin' || u.role === 'technician')
            .map(u => u.email)
            .filter(Boolean);

        const results = [];

        const daysUntil = (dateStr) => {
            const d = new Date(dateStr);
            d.setHours(0, 0, 0, 0);
            return Math.round((d - today) / (1000 * 60 * 60 * 24));
        };

        const sendToAll = async (emails, subject, body) => {
            for (const email of emails) {
                await base44.asServiceRole.functions.invoke('sendSmtpEmail', { to: email, subject, body });
            }
        };

        for (const machine of machines) {
            const customer = customerMap[machine.customer_id];
            if (!customer) continue;

            const machineName = `${machine.model} (S/N: ${machine.serial_number})`;
            const customerName = customer.company_name;
            const customerEmail = customer.email;

            // --- Serviceavtalets utgång ---
            if (
                machine.service_contract === 'basic' &&
                machine.contract_start_date &&
                machine.contract_binding_months
            ) {
                const start = new Date(machine.contract_start_date);
                start.setMonth(start.getMonth() + Number(machine.contract_binding_months));
                start.setHours(0, 0, 0, 0);
                const expiryDateStr = start.toLocaleDateString('sv-SE');
                const days = daysUntil(start);

                if (days === 30) {
                    const customerBody = `Hej ${customerName},\n\nDetta är en påminnelse om att ert serviceavtal för ${machineName} löper ut den ${expiryDateStr} – om 30 dagar.\n\nKontakta oss för att förnya avtalet och säkerställa fortsatt support.\n\nMed vänliga hälsningar,\nAstomed Service`;
                    const staffBody = `[Serviceavtal löper ut om 30 dagar]\n\nKund: ${customerName}\nMaskin: ${machineName}\nAvtalet löper ut: ${expiryDateStr}\n\nKontakta kunden för avtalsförnyelse.`;

                    if (customerEmail) await sendToAll([customerEmail], `Påminnelse: Serviceavtal för ${machineName} löper ut om 30 dagar`, customerBody);
                    await sendToAll(staffEmails, `[Astomed] Serviceavtal utgår om 30 dagar – ${customerName}`, staffBody);

                    results.push({ type: 'contract_expiry', machine: machineName, customer: customerName, date: expiryDateStr });
                }
            }

            // --- Nästa planerade service ---
            if (machine.next_service_date) {
                const days = daysUntil(machine.next_service_date);
                const serviceDateStr = new Date(machine.next_service_date).toLocaleDateString('sv-SE');

                if (days === 30) {
                    const customerBody = `Hej ${customerName},\n\nDetta är en påminnelse om att planerad service för ${machineName} är bokad den ${serviceDateStr} – om 30 dagar.\n\nHör av er om ni behöver ändra tid.\n\nMed vänliga hälsningar,\nAstomed Service`;
                    const staffBody = `[Planerad service om 30 dagar]\n\nKund: ${customerName}\nMaskin: ${machineName}\nServicedatum: ${serviceDateStr}`;

                    if (customerEmail) await sendToAll([customerEmail], `Påminnelse: Planerad service för ${machineName} om 30 dagar`, customerBody);
                    await sendToAll(staffEmails, `[Astomed] Planerad service om 30 dagar – ${customerName}`, staffBody);

                    results.push({ type: 'service_due', machine: machineName, customer: customerName, date: serviceDateStr });
                }
            }
        }

        return Response.json({ success: true, reminders_sent: results.length, results });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});