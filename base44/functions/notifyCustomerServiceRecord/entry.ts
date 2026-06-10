import { createClientFromRequest } from 'npm:@base44/sdk@0.8.26';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { serviceRecordId } = await req.json();

        if (!serviceRecordId) {
            return Response.json({ error: 'Saknar serviceRecordId' }, { status: 400 });
        }

        const record = await base44.asServiceRole.entities.ServiceRecord.get(serviceRecordId);
        const machine = await base44.asServiceRole.entities.Machine.get(record.machine_id);
        const customer = await base44.asServiceRole.entities.Customer.get(record.customer_id);

        // Hämta admins och tekniker för att skicka notiser i appen
        const admins = await base44.asServiceRole.entities.User.filter({ role: 'admin' });
        const techs = await base44.asServiceRole.entities.User.filter({ role: 'technician' });
        const staff = [...admins, ...techs];

        for (const user of staff) {
            await base44.asServiceRole.entities.Notification.create({
                user_email: user.email,
                title: 'Nytt serviceärende från kund',
                message: `${customer.company_name} har skapat ett nytt serviceärende för ${machine.model}.`,
                type: 'info',
                related_entity: 'ServiceRecord',
                related_entity_id: record.id
            });
        }

        // Skicka e-post
        const emailBody = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f6f4;">
                <div style="background: linear-gradient(135deg, #1b3a3a 0%, #254f4f 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
                    <h1 style="color: white; margin: 0; font-size: 24px;">Nytt serviceärende från kund</h1>
                </div>
                
                <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px;">
                    <p style="color: #1b3a3a; font-size: 16px; line-height: 1.6;">
                        En kund har loggat in och skapat ett nytt serviceärende:
                    </p>
                    
                    <div style="background: #e8f2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3a9e9e;">
                        <p style="margin: 5px 0; color: #254f4f;"><strong>Kund:</strong> ${customer.company_name}</p>
                        <p style="margin: 5px 0; color: #254f4f;"><strong>Maskin:</strong> ${machine.model} (SN: ${machine.serial_number})</p>
                    </div>

                    <h3 style="color: #1b3a3a;">Beskrivning av problemet:</h3>
                    <p style="color: #254f4f; line-height: 1.6;">${record.description}</p>
                </div>
            </div>
        `;

        await base44.asServiceRole.integrations.Core.SendEmail({
            to: 'liburn@astomed.se',
            from_name: 'Astomed Pro',
            subject: `Nytt serviceärende från ${customer.company_name}`,
            body: emailBody
        });

        return Response.json({ success: true });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});