import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import { jsPDF } from 'npm:jspdf@4.0.0';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { machineId } = await req.json();

        if (!machineId) {
            return Response.json({ error: 'Machine ID is required' }, { status: 400 });
        }

        const machine = await base44.asServiceRole.entities.Machine.get(machineId);
        if (!machine) {
            return Response.json({ error: 'Machine not found' }, { status: 404 });
        }

        const customer = await base44.asServiceRole.entities.Customer.get(machine.customer_id);
        if (!customer) {
            return Response.json({ error: 'Customer not found' }, { status: 404 });
        }

        const doc = new jsPDF();

        // Header background
        doc.setFillColor(27, 58, 58);
        doc.rect(0, 0, 210, 45, 'F');

        // Fetch and add logo as base64
        try {
            const logoResponse = await fetch('https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69a9446fcb1cd4ab529479ba/0060a5b35_channels4_profile-2.jpg');
            const logoBlob = await logoResponse.arrayBuffer();
            const logoBase64 = btoa(String.fromCharCode(...new Uint8Array(logoBlob)));
            doc.addImage('data:image/jpeg;base64,' + logoBase64, 'JPEG', 15, 8, 25, 25);
        } catch (logoError) {
            console.log('Logo loading skipped');
        }

        // Title
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text('Serviceavtal', 50, 22);

        // Astomed details
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text('Astomed AB | Org.nr: 556709-9964 | Jägerhorns väg 5 | 141 75 Kungens kurva', 50, 30);

        // Reset color to black
        doc.setTextColor(0, 0, 0);

        // Divider line
        doc.setDrawColor(58, 158, 158);
        doc.line(20, 48, 190, 48);

        // Customer details
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(27, 58, 58);
        doc.text('KUNDUPPGIFTER', 20, 55);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.text('Företag: ' + (customer.company_name || ''), 20, 62);
        doc.text('Organisationsnummer: ' + (customer.org_number || ''), 20, 67);
        doc.text('Telefon: ' + (customer.phone || ''), 20, 72);
        doc.text('E-post: ' + (customer.email || ''), 20, 77);

        let instance = null;
        let allMachines = [machine];
        if (machine.service_agreement_instance_id) {
            instance = await base44.asServiceRole.entities.ServiceAgreementInstance.get(machine.service_agreement_instance_id);
            if (instance && instance.machine_ids) {
                const fetchedMachines = await Promise.all(instance.machine_ids.map(id => base44.asServiceRole.entities.Machine.get(id).catch(()=>null)));
                allMachines = fetchedMachines.filter(m => m);
            }
        }

        // Machine details
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(27, 58, 58);
        doc.text('MASKININFORMATION (' + allMachines.length + ' maskiner)', 20, 88);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        
        let mY = 95;
        for (const m of allMachines) {
            if (mY > 270) {
                doc.addPage();
                mY = 20;
            }
            doc.text(`- ${m.model || 'Okänd modell'} (SN: ${m.serial_number || 'Okänt'})`, 20, mY);
            mY += 5;
        }

        if (mY > 250) {
            doc.addPage();
            mY = 20;
        }

        const effectiveStartDate = instance?.start_date || machine.contract_start_date;
        const effectiveBinding = instance?.binding_months || machine.contract_binding_months;

        mY += 2;
        doc.text('Serviceavtal: ' + (machine.service_contract === 'basic' ? 'BAS - Astomed 3.0' : machine.service_contract || ''), 20, mY);
        mY += 5;
        
        if (effectiveStartDate) {
            const startDateObj = new Date(effectiveStartDate);
            doc.text('Startdatum: ' + startDateObj.toLocaleDateString('sv-SE'), 20, mY);

            const renewalDate = new Date(startDateObj);
            renewalDate.setMonth(renewalDate.getMonth() + (effectiveBinding || 12));
            doc.text('Förnyelsedatum: ' + renewalDate.toLocaleDateString('sv-SE'), 20, mY + 5);
        }
        
        if (effectiveBinding) {
            doc.text('Bindningstid: ' + effectiveBinding + ' månader', 20, mY + 10);
        }

        let yOffset = mY + 15;
        
        // Fetch all templates linked to this instance/machine
        // An instance may be linked to multiple ServiceAgreementInstances (one per template)
        // so we find all instances for this customer + same machine set and collect all templates
        let templates = [];
        if (instance) {
            // Find all instances for this customer with the same machine_ids
            const allInstances = await base44.asServiceRole.entities.ServiceAgreementInstance.filter({ customer_id: machine.customer_id });
            const sameMachineInstances = allInstances.filter(inst => {
                if (!inst.machine_ids || !instance.machine_ids) return false;
                const a = [...inst.machine_ids].sort();
                const b = [...instance.machine_ids].sort();
                if (JSON.stringify(a) !== JSON.stringify(b)) return false;

                // Group by similar creation time (within 1 minute) to ensure we get exactly the instances created together
                const t1 = new Date(inst.created_date || 0).getTime();
                const t2 = new Date(instance.created_date || 0).getTime();
                return Math.abs(t1 - t2) < 60000;
            });

            // Deduplicate: Keep only the latest instance per template ID
            const latestInstancesByTemplate = {};
            for (const inst of sameMachineInstances) {
                if (!inst.service_agreement_template_id) continue;
                
                const existing = latestInstancesByTemplate[inst.service_agreement_template_id];
                if (!existing) {
                    latestInstancesByTemplate[inst.service_agreement_template_id] = inst;
                } else {
                    const instDate = new Date(inst.created_date || 0);
                    const existingDate = new Date(existing.created_date || 0);
                    if (instDate > existingDate) {
                        latestInstancesByTemplate[inst.service_agreement_template_id] = inst;
                    }
                }
            }

            templates = await Promise.all(
                Object.values(latestInstancesByTemplate)
                    .map(async inst => {
                        const t = await base44.asServiceRole.entities.ServiceAgreementTemplate.get(inst.service_agreement_template_id).catch(() => null);
                        if (t) t.quantity = inst.quantity || 1;
                        return t;
                    })
            );
            templates = templates.filter(Boolean);
        }

        // Fallback: single template from machine
        if (templates.length === 0) {
            const templateId = machine.service_agreement_template_id;
            if (templateId) {
                const t = await base44.asServiceRole.entities.ServiceAgreementTemplate.get(templateId).catch(() => null);
                if (t) templates = [t];
            }
        }

        let totalBasePrice = templates.reduce((sum, t) => sum + (t?.price_per_month ? Number(t.price_per_month) * (t.quantity || 1) : 0), 0);
        let totalPrice = totalBasePrice;
        
        let discountInfo = "";
        if (instance && instance.discount) {
            if (instance.discount_type === 'percent') {
                discountInfo = ` (Inkl. ${instance.discount}% rabatt)`;
                totalPrice = totalPrice * (1 - (instance.discount / 100));
            } else {
                discountInfo = ` (Inkl. ${instance.discount} kr rabatt)`;
                totalPrice = totalPrice - instance.discount;
            }
        }
        totalPrice = Math.max(0, totalPrice);

        yOffset += 6;
        if (templates.length > 0) {
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(27, 58, 58);
            doc.text('AVTALSINNEHÅLL OCH PRIS', 20, yOffset);
            yOffset += 8;

            for (const template of templates) {
                const includedServices = template?.included_services || [];
                const templateName = template?.name || '';

                if (yOffset > 250) { doc.addPage(); yOffset = 20; }

                doc.setFontSize(10);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(27, 58, 58);
                doc.text('STANDARDSERVICE OCH UNDERHÅLL – ' + templateName.toUpperCase() + (template.quantity > 1 ? ` (${template.quantity} st)` : ''), 20, yOffset);
                
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(9);
                doc.setTextColor(0, 0, 0);
                yOffset += 6;
                
                for (let i = 0; i < includedServices.length; i++) {
                    if (yOffset > 270) {
                        doc.addPage();
                        yOffset = 20;
                    }
                    const lines = doc.splitTextToSize('• ' + includedServices[i], 170);
                    doc.text(lines, 20, yOffset);
                    yOffset += (lines.length * 5);
                }

                yOffset += 4;
            }
            
            if (totalBasePrice > 0) {
                yOffset += 5;
                if (yOffset > 250) { doc.addPage(); yOffset = 20; }
                
                doc.setDrawColor(220, 232, 232);
                doc.setFillColor(244, 246, 244);
                doc.roundedRect(20, yOffset, 170, 20, 2, 2, 'FD');
                
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(11);
                doc.setTextColor(27, 58, 58);
                doc.text(`Pris: ${Math.round(totalPrice)} kr/månad${discountInfo}`, 25, yOffset + 8);
                
                doc.setFont('helvetica', 'italic');
                doc.setFontSize(8);
                doc.setTextColor(100, 100, 100);
                doc.text('* Alla priser anges exklusive moms (25%).', 25, yOffset + 15);
                
                yOffset += 28;
            }
        }

        // New page for terms with header
        doc.addPage();

        // Header background on terms page
        doc.setFillColor(27, 58, 58);
        doc.rect(0, 0, 210, 45, 'F');

        try {
            const logoResponse2 = await fetch('https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69a9446fcb1cd4ab529479ba/0060a5b35_channels4_profile-2.jpg');
            const logoBlob2 = await logoResponse2.arrayBuffer();
            const logoBase642 = btoa(String.fromCharCode(...new Uint8Array(logoBlob2)));
            doc.addImage('data:image/jpeg;base64,' + logoBase642, 'JPEG', 15, 8, 25, 25);
        } catch (e) {
            console.log('Logo loading skipped on page 2');
        }

        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text('Avtalsvillkor', 50, 22);

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text('Astomed AB | Org.nr: 556709-9964 | Jägerhorns väg 5 | 141 75 Kungens kurva', 50, 30);

        doc.setTextColor(0, 0, 0);
        doc.setDrawColor(58, 158, 158);
        doc.line(20, 48, 190, 48);

        // Terms
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(27, 58, 58);
        doc.text('AVTALSVILLKOR', 20, 58);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(0, 0, 0);

        const terms = [
            '1. Avtalstid och Uppsägning\nServiceavtalet löper med en initial bindningstid om 12 månader från avtalets tecknande. Om uppsägning ej sker förlängs avtalet automatiskt med tolv (12) månader i taget.',
            '2. Betalningsvillkor\nBetalning sker månadsvis eller kvartalsvis i förskott via autogiro. Vid utebliven betalning förbehåller sig Astomed rätten att pausa servicetjänster samt debitera dröjsmålsränta enligt lag.',
            '3. Prisjusteringar\nAstomed äger rätt att årligen justera avgiften i enlighet med konsumentprisindex (KPI) eller vid betydande kostnadsökningar för reservdelar och logistik. Kunden ska meddelas om prisjustering senast 30 dagar innan de träder i kraft.',
            '4. Omfattning\nAvtalet omfattar ordinarie underhåll enligt specifikation för respektive maskin. Reparationer utöver standardservice samt reservdelar (som inte är förbrukningsvaror så som handenheter och lampor) debiteras enligt gällande prislista med avtalad rabatt om 20 % på reservdelar och resekostnader.',
            '5. Resekostnader\nMilersättning: En fast ersättning om 100 kr per mil (motsvarande 10 kr per kilometer) debiteras för den totala körsträckan fram och åter från Astomeds servicecenter.\nSamplanering för sänkta kostnader: Astomed strävar aktivt efter att samplanera servicebesök inom samma geografiska område för att minimera miljöpåverkan och sänka kundens omkostnader. Vid lyckad samplanering delas den totala resekostnaden och restidsarvodet proportionerligt mellan de berörda klinikerna.'
        ];

        let termsY = 66;
        for (let i = 0; i < terms.length; i++) {
            const lines = doc.splitTextToSize(terms[i], 170);
            doc.text(lines, 20, termsY);
            termsY += (lines.length * 5) + 4;
        }

        // Generate PDF
        const pdfBytes = doc.output('arraybuffer');

        return new Response(pdfBytes, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': 'attachment; filename="serviceavtal.pdf"'
            }
        });
    } catch (error) {
        console.error('PDF generation error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});