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
        try {
            await base44.asServiceRole.functions.invoke('logAuditEntry', {
                action: 'create',
                entity_type: 'PublicServiceLead',
                entity_id: lead.id,
                entity_label: lead.company_name,
                user_email: data.email,
                user_name: data.contact_person,
                details: `Ny serviceförfrågan via publikt formulär för maskin: ${data.machine_name}`
            });
        } catch (e) {
            console.error('Kunde inte logga audit entry:', e);
        }

        // Hämta maskinens servicebeskrivning
        const machineServiceDetails = {
            "Aldix Smart Laser": { title: "Standardservice och underhåll – Aldix Smart Laser", details: ["Byte av pneumatisk avjoniseringsfilter A", "Byte av pneumatisk avjoniseringsfilter B", "Byte av snabbkopplingar till filter", "Påfyllning av destillerat avjoniserat kylvätska", "Spolning av pneumatisk krets", "Läckagekontroll", "Kontroll av luftintagsfilter", "Lasereffektmätning", "Rengöring av värmeväxlare", "Rengörning av Switchade nätaggret", "Kontroll av nödstopp och interlock", "Upprättande av serviceprotokoll", "Serviceuppmärkning av utrustning", "Kontroll av säkerhetsrem", "20 % på arbetstid för övriga reparationer", "20 % på resekostnader"] },
            "Elysion": { title: "Standardservice och underhåll – Elysion", details: ["Byte av mekanisk vattenfilter", "Påfyllning av destillerat avjoniserat kylvätska med glykolblandning", "Spolning av pneumatisk krets", "Läckagekontroll", "Kontroll av luftintagsfilter", "Lasereffektmätning", "Rengöring av värmeväxlare", "Rengörning av Switchade nätaggret", "Kontroll av nödstopp och interlock", "Upprättande av serviceprotokoll", "Serviceuppmärkning av utrustning", "Kontroll av säkerhetsrem", "20 % på arbetstid för övriga reparationer", "20 % på resekostnader"] },
            "Helios": { title: "Standardservice och underhåll – Helios", details: ["Byte av vattenfiltersystem", "Påfyllning av destillerat avjoniserat kylvätska", "Spolning av pneumatisk krets", "Läckagekontroll", "Kontroll av luftintagsfilter", "Lasereffektmätning", "Rengöring av värmeväxlare", "Rengörning av Switchade nätaggret", "Kontroll av nödstopp och interlock", "Upprättande av serviceprotokoll", "Serviceuppmärkning av utrustning", "Kontroll av säkerhetsrem", "Kontroll av possitionering av ledljus", "Kontroll av träffbildsmönster", "Kontroll av alla handneheters linser", "20 % på arbetstid för övriga reparationer", "20 % på resekostnader"] },
            "Pento": { title: "Standardservice och underhåll – Pento", details: ["Byte av avjoniserande DI-filter", "Rengöring av värmeväxlare", "Kontroll av optiska linser", "Påfyllning av destillerat avjoniserat kylvätska", "Spolning av pneumatisk krets", "Läckagekontroll", "Lasereffektmätning", "Rengörning av Switchade nätaggret", "Kontroll av nödstopp och interlock", "Upprättande av serviceprotokoll", "Serviceuppmärkning av utrustning", "Kontroll av säkerhetsrem", "Kontroll av träffbildsmönster", "Kontroll av alla handneheters linser", "20 % på arbetstid för övriga reparationer", "20 % på resekostnader"] },
            "PicoLo": { title: "Standardservice och underhåll – PicoLo", details: ["Byte av vattenfiltersystem", "Påfyllning av destillerat avjoniserat kylvätska", "Spolning av pneumatisk krets", "Läckagekontroll", "Kontroll av luftintagsfilter", "Lasereffektmätning", "Rengöring av värmeväxlare", "Rengörning av Switchade nätaggret", "Kontroll av nödstopp och interlock", "Upprättande av serviceprotokoll", "Serviceuppmärkning av utrustning", "Kontroll av säkerhetsrem", "Kontroll av possitionering av ledljus", "Kontroll av träffbildsmönster", "Kontroll av alla handneheters linser", "20 % på arbetstid för övriga reparationer", "20 % på resekostnader"] },
            "PrimeLase": { title: "Standardservice och underhåll – PrimeLase", details: ["Byte av vattenfilter för intern vattenkrets", "Byte av vattenfilter för tip-kylningssystem", "Byte av vattenfilter för diodkylningssystem", "Påfyllning av destillerat avjoniserat kylvätska med glykolblandning", "Spolning av pneumatisk krets", "Läckagekontroll", "Kontroll av luftintagsfilter", "Lasereffektmätning", "Rengöring av värmeväxlare", "Rengörning av Switchade nätaggret", "Kontroll av nödstopp och interlock", "Upprättande av serviceprotokoll", "Serviceuppmärkning av utrustning", "Kontroll av säkerhetsrem", "20 % på arbetstid för övriga reparationer", "20 % på resekostnader"] },
            "Soprano ICE Platinum": { title: "Standardservice och underhåll – Soprano ICE Platinum / Titanium", details: ["Byte av Avjoniseringsfilter", "Byte av mekaniskpartikelfilter", "Byte av steriliserande UV-lampa", "Byte av CPC-kopplingar till filter", "Påfyllning av destillerat avjoniserat kylvätska", "Spolning av pneumatisk krets", "Läckagekontroll", "Kontroll av luftintagsfilter", "Lasereffektmätning", "Rengöring av värmeväxlare", "Rengörning av Switchade nätaggret", "Kontroll av nödstopp och interlock", "Upprättande av serviceprotokoll", "Serviceuppmärkning av utrustning", "Kontroll av säkerhetsrem", "20 % på arbetstid för övriga reparationer", "20 % på resekostnader"] },
            "Soprano Titanium": { title: "Standardservice och underhåll – Soprano ICE Platinum / Titanium", details: ["Byte av Avjoniseringsfilter", "Byte av mekaniskpartikelfilter", "Byte av steriliserande UV-lampa", "Byte av CPC-kopplingar till filter", "Påfyllning av destillerat avjoniserat kylvätska", "Spolning av pneumatisk krets", "Läckagekontroll", "Kontroll av luftintagsfilter", "Lasereffektmätning", "Rengöring av värmeväxlare", "Rengörning av Switchade nätaggret", "Kontroll av nödstopp och interlock", "Upprättande av serviceprotokoll", "Serviceuppmärkning av utrustning", "Kontroll av säkerhetsrem", "20 % på arbetstid för övriga reparationer", "20 % på resekostnader"] },
            "Splendor": { title: "Standardservice och underhåll – Splendor", details: ["Byte av avjoniserande DI-filter", "Byte av Smoke Evacuation-filter", "Rengöring av värmeväxlare i kylsystemet", "Rengöring av värmeväxlare i Splendor", "Kontroll av optiska linser", "Påfyllning av destillerat avjoniserat kylvätska", "Spolning av pneumatisk krets", "Läckagekontroll", "Lasereffektmätning", "Rengörning av Switchade nätaggret", "Kontroll av nödstopp och interlock", "Upprättande av serviceprotokoll", "Serviceuppmärkning av utrustning", "Kontroll av säkerhetsrem", "Kontroll av träffbildsmönster", "Kontroll av alla handneheters linser", "20 % på arbetstid för övriga reparationer", "20 % på resekostnader"] },
            "Triodus": { title: "Standardservice och underhåll – Triodus", details: ["Byte av pneumatisk avjoniseringsfilter A", "Byte av pneumatisk avjoniseringsfilter B", "Byte av snabbkopplingar till filter", "Påfyllning av destillerat avjoniserat kylvätska", "Spolning av pneumatisk krets", "Läckagekontroll", "Kontroll av luftintagsfilter", "Lasereffektmätning", "Rengöring av värmeväxlare", "Rengörning av Switchade nätaggret", "Kontroll av nödstopp och interlock", "Upprättande av serviceprotokoll", "Serviceuppmärkning av utrustning", "Kontroll av säkerhetsrem", "20 % på arbetstid för övriga reparationer", "20 % på resekostnader"] },
            "Alma Harmony": { title: "Standardservice och underhåll – Alma Harmony", details: ["Byte av Avjoniseringsfilter", "Byte av mekaniskpartikelfilter", "Byte av CPC-kopplingar till filter", "Påfyllning av destillerat avjoniserat kylvätska", "Spolning av pneumatisk krets", "Läckagekontroll", "Kontroll av luftintagsfilter", "Lasereffektmätning", "Rengöring av värmeväxlare", "Rengörning av Switchade nätaggret", "Kontroll av nödstopp och interlock", "Upprättande av serviceprotokoll", "Serviceuppmärkning av utrustning", "Kontroll av säkerhetsrem", "20 % på arbetstid för övriga reparationer", "20 % på resekostnader"] },
            "Fraction CO2": { title: "Standardservice och underhåll – Fraction CO2", details: ["Kontroll av luftintagsfilter", "Lasereffektmätning", "Rengöring av kylflänsar", "Rengöring av till-luftsfläktar", "Rengöring av från-luftsfläktar", "Rengörning av Switchade nätaggret", "Kontroll av nödstopp och interlock", "Upprättande av serviceprotokoll", "Serviceuppmärkning av utrustning", "Kontroll av säkerhetsrem", "Kontroll av possitionering av ledljus", "Kontroll av träffbildsmönster", "Kontroll av alla handenheters linser", "20 % på arbetstid för övriga reparationer", "20 % på resekostnader"] },
            "Annan": { title: "Maskin som ej finns i listan", details: ["Vi återkommer till dig angående om vi kan serva just din maskin"] }
        };

        machineServiceDetails["Helios III"] = machineServiceDetails["Helios"];
        machineServiceDetails["Helius"] = machineServiceDetails["Helios"];
        machineServiceDetails["Picolo"] = machineServiceDetails["PicoLo"];
        machineServiceDetails["Pento 9900"] = machineServiceDetails["Pento"];
        machineServiceDetails["Splendor X"] = machineServiceDetails["Splendor"];
        machineServiceDetails["Cocoon Elysion"] = machineServiceDetails["Elysion"];
        machineServiceDetails["Aldix (Triodus)"] = machineServiceDetails["Triodus"];
        machineServiceDetails["PrimeLase HR"] = machineServiceDetails["PrimeLase"];
        machineServiceDetails["PrimeLase Excel"] = machineServiceDetails["PrimeLase"];
        machineServiceDetails["PrimeLase Excel HR"] = machineServiceDetails["PrimeLase"];
        machineServiceDetails["Soprano Platinum"] = machineServiceDetails["Soprano ICE Platinum"];
        machineServiceDetails["Soprano Titanium Special Edition"] = machineServiceDetails["Soprano Titanium"];

        let serviceDetailsHtml = '';
        const machineKey = Object.keys(machineServiceDetails).find(k => data.machine_name.startsWith(k)) || "Annan";
        const serviceInfo = machineServiceDetails[machineKey];

        if (serviceInfo && serviceInfo.details.length > 0) {
            serviceDetailsHtml = `
            <div style="background: #ffffff; padding: 20px; border-radius: 8px; margin: 25px 0; border: 1px solid #dce8e8;">
                <h3 style="color: #1b3a3a; margin-top: 0; margin-bottom: 15px; font-size: 16px;">Följande ingår i ${serviceInfo.title}:</h3>
                <ul style="color: #254f4f; font-size: 14px; line-height: 1.6; margin: 0; padding-left: 20px;">
                    ${serviceInfo.details.map(detail => `<li style="margin-bottom: 5px;">${detail}</li>`).join('')}
                </ul>
            </div>`;
        }

        // Skicka bekräftelsemejl till kunden
        try {
            const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f6f4;">
                <div style="background: white; padding: 30px; border-radius: 12px; border-top: 4px solid #3a9e9e; box-shadow: 0 4px 16px rgba(27,58,58,0.05);">
                    <div style="text-align: center; margin-bottom: 25px;">
                        <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69a9446fcb1cd4ab529479ba/bc2852de1_channels4_profile-2.jpg" alt="Astomed Logo" style="height: 60px; border-radius: 8px;">
                    </div>
                    <h1 style="color: #1b3a3a; margin-top: 0; font-size: 24px;">Vi har mottagit din serviceförfrågan</h1>
                    <p style="color: #254f4f; font-size: 16px; line-height: 1.6;">
                        Hej ${data.contact_person},
                    </p>
                    <p style="color: #254f4f; font-size: 16px; line-height: 1.6;">
                        Tack för din serviceförfrågan angående din maskin <strong>${data.machine_name}</strong>. Vi har nu tagit emot ditt ärende och kommer att återkoppla till dig så snart som möjligt för att boka in en tid eller ge dig mer information.
                    </p>
                    
                    <div style="background: #e8f2f2; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #3a9e9e;">
                        <h3 style="color: #1b3a3a; margin-top: 0; margin-bottom: 15px; font-size: 18px;">Sammanfattning av ditt ärende</h3>
                        <p style="margin: 8px 0; color: #254f4f;"><strong>Maskin:</strong> ${data.machine_name}</p>
                        <p style="margin: 8px 0; color: #254f4f;"><strong>Serienummer:</strong> ${data.serial_number || 'Ej angivet'}</p>
                        <p style="margin: 8px 0; color: #254f4f;"><strong>Beskrivning:</strong><br/> ${data.service_description}</p>
                    </div>

                    ${serviceDetailsHtml}

                    <p style="color: #254f4f; font-size: 16px; line-height: 1.6;">
                        Har du några kompletterande uppgifter kan du svara direkt på detta mejl eller kontakta oss.
                    </p>
                    
                    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dce8e8;">
                        <p style="color: #1b3a3a; font-weight: bold; margin: 0;">Vänliga hälsningar,</p>
                        <p style="color: #3a9e9e; margin: 5px 0 0 0;">Astomed Service Team</p>
                        <p style="color: #8aabab; font-size: 12px; margin: 15px 0 0 0;">Astomed AB | Org.nr: 556709-9964 | Jägerhorns väg 5, 141 75 Kungens kurva</p>
                    </div>
                </div>
            </div>
            `;

            await base44.asServiceRole.integrations.Core.SendEmail({
                to: data.email,
                from_name: "Astomed Service",
                subject: "Bekräftelse: Vi har mottagit din serviceförfrågan",
                body: emailHtml
            });
        } catch (emailError) {
            console.error("Kunde inte skicka bekräftelsemejl:", emailError);
            // Vi fortsätter ändå, leadet är skapat
        }

        return Response.json({ success: true, id: lead.id });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});