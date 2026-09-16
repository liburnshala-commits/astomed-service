import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';
import { waitUntil } from 'base44:runtime';

export default async function(req) {
    try {
        const payload = await req.json();
        const base44 = createClientFromRequest(req);
        
        // 1. Validate payload
        const clinicInfo = payload.clinic || {};
        const contactInfo = payload.contact || {};
        const machines = payload.machines || [];
        const insuranceInfo = payload.insurance || {};

        if (!clinicInfo.org_nr) {
            return Response.json({ error: "clinic.org_nr is required" }, { status: 400 });
        }

        // 2. Lookup existing clinic (Customer)
        const existingCustomers = await base44.asServiceRole.entities.Customer.filter({ org_number: clinicInfo.org_nr });
        let customer = existingCustomers.length > 0 ? existingCustomers[0] : null;

        const customerData = {
            company_name: clinicInfo.name || customer?.company_name || 'Okänt företag',
            org_number: clinicInfo.org_nr,
            address: clinicInfo.street_address || customer?.address,
            postal_code: clinicInfo.postal_code || customer?.postal_code,
            city: clinicInfo.city || customer?.city,
            contact_person: contactInfo.full_name || customer?.contact_person,
            email: contactInfo.email || customer?.email,
            phone: contactInfo.phone || customer?.phone,
            insurance_partner: insuranceInfo.partner || customer?.insurance_partner,
            insurance_policy_status: insuranceInfo.policy_status || customer?.insurance_policy_status,
            saker_klinik_enrolled: payload.saker_klinik_enrolled !== undefined ? payload.saker_klinik_enrolled : (customer?.saker_klinik_enrolled || true)
        };

        if (customer) {
            await base44.asServiceRole.entities.Customer.update(customer.id, customerData);
            customer = { ...customer, ...customerData };
        } else {
            customer = await base44.asServiceRole.entities.Customer.create(customerData);
        }

        // 3. Process declared machines
        for (const m of machines) {
            if (!m.serial_number || !m.model) continue;

            const existingMachines = await base44.asServiceRole.entities.Machine.filter({
                serial_number: m.serial_number,
                customer_id: customer.id
            });

            if (existingMachines.length === 0) {
                await base44.asServiceRole.entities.Machine.create({
                    customer_id: customer.id,
                    serial_number: m.serial_number,
                    model: m.model,
                    radiation_source_type: m.technology_type,
                    commissioning_date: m.year ? `${m.year}-01-01` : undefined,
                    status: 'inactive'
                });
            }
        }

        // 4. Eligibility Check
        const activeContracts = await base44.asServiceRole.entities.ServiceAgreementInstance.filter({
            customer_id: customer.id,
            status: 'active'
        });
        const hasActiveContract = activeContracts.length > 0;
        const isEligible = hasActiveContract || customer.saker_klinik_enrolled;

        let academySyncStatus = "Not eligible";

        if (isEligible) {
            const tier = 'Säker_Klinik_VIP';
            
            // Post-response dispatch to Academy
            waitUntil(
                fetch('https://astomedacademy.se/api/v1/users/provision', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: contactInfo.email,
                        full_name: contactInfo.full_name,
                        clinic_org_nr: clinicInfo.org_nr,
                        role: 'Free_Member_Saker_Klinik',
                        tier: tier,
                        auto_enroll: [
                            "Introduktion till Strålsäkerhet (SSMFS 2026:1)",
                            "Grundläggande Egenkontroll & Klinikrutiner"
                        ]
                    })
                })
                .then(async res => {
                    if (res.ok) {
                        await base44.asServiceRole.entities.Customer.update(customer.id, {
                            academy_access_granted: true,
                            academy_tier: tier,
                            academy_synced_at: new Date().toISOString()
                        });
                    } else {
                        console.error("Failed to sync with Academy, status:", res.status);
                    }
                })
                .catch(err => console.error("Failed to sync with Academy:", err))
            );
            academySyncStatus = "Sync started";
        }

        return Response.json({
            status: "success",
            customer_id: customer.id,
            eligibility: isEligible,
            academy_sync: academySyncStatus
        });
    } catch (error) {
        console.error("Ingest Error:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}