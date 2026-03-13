import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const data = await req.json();

        const requiredFields = ["company_name", "contact_person", "email", "phone", "machine_name", "service_description"];
        for (const field of requiredFields) {
            if (!data[field]) {
                return Response.json({ error: `Saknat obligatoriskt fält: ${field}` }, { status: 400 });
            }
        }

        const lead = await base44.asServiceRole.entities.PublicServiceLead.create({
            company_name: data.company_name,
            contact_person: data.contact_person,
            email: data.email,
            phone: data.phone,
            org_number: data.org_number || null,
            address: data.address || null,
            postal_code: data.postal_code || null,
            city: data.city || null,
            machine_name: data.machine_name,
            manufacturer: data.manufacturer || null,
            serial_number: data.serial_number || null,
            service_description: data.service_description,
            service_type: data.service_type || "BAS - Astomed 3.0",
            status: "new"
        });

        // Logga händelsen
        await base44.asServiceRole.functions.invoke('logAuditEntry', {
            action: 'create',
            entity_type: 'PublicServiceLead',
            entity_id: lead.id,
            entity_label: lead.company_name,
            user_email: data.email,
            user_name: data.contact_person,
            details: `Ny serviceförfrågan via publikt formulär för maskin: ${data.machine_name}`
        });

        // Skicka bekräftelsemail till kunden
        const emailBody = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f6f4;">
                <div style="background: linear-gradient(135deg, #1b3a3a 0%, #254f4f 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
                    <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69a9446fcb1cd4ab529479ba/bc2852de1_channels4_profile-2.jpg" alt="Astomed" style="width: 80px; height: 80px; border-radius: 12px; margin-bottom: 15px;" />
                    <h1 style="color: white; margin: 0; font-size: 24px;">Tack för din förfrågan!</h1>
                </div>
                
                <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px;">
                    <p style="color: #1b3a3a; font-size: 16px; line-height: 1.6;">
                        Hej ${data.contact_person},
                    </p>
                    
                    <p style="color: #1b3a3a; font-size: 16px; line-height: 1.6;">
                        Vi har tagit emot din förfrågan om kostnadsfri konsultation för serviceavtal och vill tacka för att du valt att kontakta Astomed.
                    </p>
                    
                    <div style="background: #e8f2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3a9e9e;">
                        <h3 style="color: #1b3a3a; margin-top: 0;">Dina uppgifter:</h3>
                        <p style="margin: 5px 0; color: #254f4f;"><strong>Företag:</strong> ${data.company_name}</p>
                        <p style="margin: 5px 0; color: #254f4f;"><strong>Maskin:</strong> ${data.machine_name}</p>
                        <p style="margin: 5px 0; color: #254f4f;"><strong>Telefon:</strong> ${data.phone}</p>
                    </div>
                    
                    <h3 style="color: #1b3a3a;">Vad händer nu?</h3>
                    <ul style="color: #254f4f; line-height: 1.8;">
                        <li>En av våra servicespecialister kommer att kontakta dig inom 1-2 arbetsdagar</li>
                        <li>Vi bokar in en kostnadsfri konsultation på telefon eller platsbesök</li>
                        <li>Vi går igenom era behov och tar fram ett skräddarsytt serviceavtal</li>
                        <li>Ni får full transparens kring priser och vad som ingår</li>
                    </ul>
                    
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 0; color: #6b8f8f; font-size: 14px;">
                            <strong>Har du frågor redan nu?</strong><br/>
                            Ring oss på 08-410 438 50 eller svara på detta mail.
                        </p>
                    </div>
                    
                    <p style="color: #1b3a3a; font-size: 16px; line-height: 1.6;">
                        Vi ser fram emot att hjälpa er att optimera er maskinpark!
                    </p>
                    
                    <p style="color: #1b3a3a; margin-top: 30px;">
                        Med vänliga hälsningar,<br/>
                        <strong>Astomed Service Team</strong>
                    </p>
                </div>
                
                <div style="text-align: center; padding: 20px; color: #8aabab; font-size: 12px;">
                    <p>Astomed AB | Isafjordsgatan 39B | 164 40 Kista</p>
                    <p>Tel: 08-410 438 50 | service@astomed.se</p>
                </div>
            </div>
        `;

        await base44.asServiceRole.integrations.Core.SendEmail({
            to: data.email,
            from_name: "Astomed Service",
            subject: "Bekräftelse - Din serviceförfrågan har mottagits",
            body: emailBody
        });

        return Response.json({ success: true, id: lead.id });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});