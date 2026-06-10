import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { jsPDF } from 'npm:jspdf@4.0.0';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { formData, calculated, machineName } = await req.json();

        // 1. Generate PDF
        const doc = new jsPDF();
        
        doc.setFontSize(22);
        doc.setTextColor(27, 58, 58); // Astomed dark green
        doc.text('Affärsplan: Din Klinikutveckling', 20, 20);

        doc.setFontSize(11);
        doc.setTextColor(100, 100, 100);
        doc.text(`Skapad för: ${formData.fullName} ${formData.company ? `(${formData.company})` : ''}`, 20, 30);
        doc.text(`Utrustning: ${machineName}`, 20, 36);
        doc.text(`Datum: ${new Date().toLocaleDateString()}`, 20, 42);

        doc.setLineWidth(0.5);
        doc.setDrawColor(200, 200, 200);
        doc.line(20, 48, 190, 48);

        // Uppstartskostnader
        doc.setFontSize(14);
        doc.setTextColor(27, 58, 58);
        doc.text('1. Uppstartsinvesteringar', 20, 60);

        doc.setFontSize(11);
        doc.setTextColor(50, 50, 50);
        let y = 70;
        doc.text(`Utrustning:`, 20, y); doc.text(`${Math.round(calculated.machinePrice).toLocaleString()} kr`, 150, y, {align: 'right'}); y += 8;
        if (calculated.trainingCost > 0) {
            doc.text(`Utbildning(ar):`, 20, y); doc.text(`${Math.round(calculated.trainingCost).toLocaleString()} kr`, 150, y, {align: 'right'}); y += 8;
        }
        doc.text(`Anmälan kommun:`, 20, y); doc.text(`${Math.round(formData.municipalityFee).toLocaleString()} kr`, 150, y, {align: 'right'}); y += 8;
        doc.text(`Inredning & stol:`, 20, y); doc.text(`${Math.round(formData.interiorCost).toLocaleString()} kr`, 150, y, {align: 'right'}); y += 8;
        doc.text(`Övrigt (Registrering etc):`, 20, y); doc.text(`${Math.round(formData.otherStartup).toLocaleString()} kr`, 150, y, {align: 'right'}); y += 12;
        
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text(`Totalt uppstart:`, 20, y); doc.text(`${Math.round(calculated.totalStartupCost).toLocaleString()} kr`, 150, y, {align: 'right'});
        doc.setFont(undefined, 'normal');
        y += 20;

        // Löpande Intäkter & Kostnader
        doc.setFontSize(14);
        doc.setTextColor(27, 58, 58);
        doc.text('2. Månatlig Omsättning & Driftskostnader', 20, y); y += 10;
        
        doc.setFontSize(11);
        doc.setTextColor(50, 50, 50);
        const totalSalaryPerMonth = (formData.salaryPerEmployee || formData.salary || 0) * (formData.employeeCount || 1) * (1 + 0.3142 + 0.12 + 0.10);
        const treatmentsPerWeek = formData.treatmentsPerWeek || 0;

        doc.text(`Behandlingar/vecka: ${treatmentsPerWeek} st`, 20, y); y += 8;
        doc.text(`Momsbelagt: ${formData.isAesthetic ? 'Ja (Estetisk 25%)' : 'Nej (Medicinsk 0%)'}`, 20, y); y += 12;

        doc.text(`Månadsomsättning (exkl moms):`, 20, y); doc.text(`${Math.round(calculated.monthlyRevenueExVat).toLocaleString()} kr`, 150, y, {align: 'right'}); y += 8;
        doc.text(`Hyra:`, 20, y); doc.text(`- ${Math.round(formData.rent).toLocaleString()} kr`, 150, y, {align: 'right'}); y += 8;
        if (calculated.monthlyLeasingCost > 0) {
            doc.text(`Leasing utrustning (${formData.leasingMonths} mån):`, 20, y); doc.text(`- ${Math.round(calculated.monthlyLeasingCost).toLocaleString()} kr`, 150, y, {align: 'right'}); y += 8;
        }
        doc.text(`Lön inkl. avg., semester & försäkring:`, 20, y); doc.text(`- ${Math.round(totalSalaryPerMonth).toLocaleString()} kr`, 150, y, {align: 'right'}); y += 8;
        doc.text(`Bokningssystem m.m:`, 20, y); doc.text(`- ${Math.round(formData.bookingSystem).toLocaleString()} kr`, 150, y, {align: 'right'}); y += 8;
        doc.text(`Försäkring & Marknadsföring:`, 20, y); doc.text(`- ${Math.round(formData.insuranceAndOther).toLocaleString()} kr`, 150, y, {align: 'right'}); y += 8;
        doc.text(`Material & Förbrukning (100 kr/kund):`, 20, y); doc.text(`- ${Math.round(treatmentsPerWeek * 4 * 100).toLocaleString()} kr`, 150, y, {align: 'right'}); y += 12;

        doc.setFont(undefined, 'bold');
        doc.text(`Vinst före skatt:`, 20, y); doc.text(`${Math.round(calculated.monthlyRevenueExVat - calculated.monthlyCost).toLocaleString()} kr`, 150, y, {align: 'right'}); y += 8;
        doc.setFont(undefined, 'normal');
        doc.text(`Bolagsskatt (20.6%):`, 20, y); doc.text(`- ${Math.round(calculated.corporateTax).toLocaleString()} kr`, 150, y, {align: 'right'}); y += 12;

        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text(`Vinst efter skatt per månad:`, 20, y); doc.text(`${Math.round(calculated.monthlyProfitAfterTax).toLocaleString()} kr`, 150, y, {align: 'right'});
        doc.setFont(undefined, 'normal');
        y += 20;

        // ROI
        doc.setFontSize(14);
        doc.setTextColor(27, 58, 58);
        doc.text('3. Resultat & Break-even', 20, y); y += 10;
        doc.setFontSize(11);
        doc.setTextColor(50, 50, 50);
        doc.text(`Beräknad tid till break-even (återbetald uppstart):`, 20, y); 
        doc.setFont(undefined, 'bold');
        doc.text(`${calculated.breakEvenMonths} månader`, 150, y, {align: 'right'});
        doc.setFont(undefined, 'normal');
        
        y += 20;
        if (y > 250) { doc.addPage(); y = 20; }
        
        // Prognos 6 & 12 månader
        doc.setFontSize(14);
        doc.setTextColor(27, 58, 58);
        doc.text('4. Affärsplan Prognos (6 & 12 månader)', 20, y); y += 10;
        
        doc.setFontSize(11);
        doc.setTextColor(50, 50, 50);
        
        // 6 Månader
        doc.setFont(undefined, 'bold');
        doc.text(`6 Månader`, 20, y); y += 8;
        doc.setFont(undefined, 'normal');
        doc.text(`Omsättning (exkl moms):`, 20, y); doc.text(`${Math.round(calculated.revenue6Months).toLocaleString()} kr`, 150, y, {align: 'right'}); y += 6;
        doc.text(`Hyra:`, 20, y); doc.text(`- ${Math.round(formData.rent * 6).toLocaleString()} kr`, 150, y, {align: 'right'}); y += 6;
        if (calculated.monthlyLeasingCost > 0) {
            doc.text(`Leasing utrustning:`, 20, y); doc.text(`- ${Math.round(calculated.monthlyLeasingCost * 6).toLocaleString()} kr`, 150, y, {align: 'right'}); y += 6;
        }
        doc.text(`Lön inkl. avg., semester & försäkring:`, 20, y); doc.text(`- ${Math.round(totalSalaryPerMonth * 6).toLocaleString()} kr`, 150, y, {align: 'right'}); y += 6;
        doc.text(`Bokningssystem m.m:`, 20, y); doc.text(`- ${Math.round(formData.bookingSystem * 6).toLocaleString()} kr`, 150, y, {align: 'right'}); y += 6;
        doc.text(`Försäkring & Marknadsföring:`, 20, y); doc.text(`- ${Math.round(formData.insuranceAndOther * 6).toLocaleString()} kr`, 150, y, {align: 'right'}); y += 6;
        doc.text(`Material & Förbrukning:`, 20, y); doc.text(`- ${Math.round(treatmentsPerWeek * 4 * 100 * 6).toLocaleString()} kr`, 150, y, {align: 'right'}); y += 6;
        
        doc.setFont(undefined, 'bold');
        doc.text(`Vinst före skatt:`, 20, y); doc.text(`${Math.round(calculated.revenue6Months - calculated.cost6Months).toLocaleString()} kr`, 150, y, {align: 'right'}); y += 6;
        doc.setFont(undefined, 'normal');
        doc.text(`Bolagsskatt (20.6%):`, 20, y); doc.text(`- ${Math.round(calculated.corporateTax * 6).toLocaleString()} kr`, 150, y, {align: 'right'}); y += 8;
        
        doc.setFont(undefined, 'bold');
        doc.text(`Vinst (efter skatt):`, 20, y); doc.text(`${Math.round(calculated.profit6Months).toLocaleString()} kr`, 150, y, {align: 'right'}); y += 14;
        doc.setFont(undefined, 'normal');

        if (y > 200) { doc.addPage(); y = 20; }

        // 12 Månader
        doc.setFont(undefined, 'bold');
        doc.text(`12 Månader`, 20, y); y += 8;
        doc.setFont(undefined, 'normal');
        doc.text(`Omsättning (exkl moms):`, 20, y); doc.text(`${Math.round(calculated.revenue12Months).toLocaleString()} kr`, 150, y, {align: 'right'}); y += 6;
        doc.text(`Hyra:`, 20, y); doc.text(`- ${Math.round(formData.rent * 12).toLocaleString()} kr`, 150, y, {align: 'right'}); y += 6;
        if (calculated.monthlyLeasingCost > 0) {
            doc.text(`Leasing utrustning:`, 20, y); doc.text(`- ${Math.round(calculated.monthlyLeasingCost * 12).toLocaleString()} kr`, 150, y, {align: 'right'}); y += 6;
        }
        doc.text(`Lön inkl. avg., semester & försäkring:`, 20, y); doc.text(`- ${Math.round(totalSalaryPerMonth * 12).toLocaleString()} kr`, 150, y, {align: 'right'}); y += 6;
        doc.text(`Bokningssystem m.m:`, 20, y); doc.text(`- ${Math.round(formData.bookingSystem * 12).toLocaleString()} kr`, 150, y, {align: 'right'}); y += 6;
        doc.text(`Försäkring & Marknadsföring:`, 20, y); doc.text(`- ${Math.round(formData.insuranceAndOther * 12).toLocaleString()} kr`, 150, y, {align: 'right'}); y += 6;
        doc.text(`Material & Förbrukning:`, 20, y); doc.text(`- ${Math.round(treatmentsPerWeek * 4 * 100 * 12).toLocaleString()} kr`, 150, y, {align: 'right'}); y += 6;
        
        doc.setFont(undefined, 'bold');
        doc.text(`Vinst före skatt:`, 20, y); doc.text(`${Math.round(calculated.revenue12Months - calculated.cost12Months).toLocaleString()} kr`, 150, y, {align: 'right'}); y += 6;
        doc.setFont(undefined, 'normal');
        doc.text(`Bolagsskatt (20.6%):`, 20, y); doc.text(`- ${Math.round(calculated.corporateTax * 12).toLocaleString()} kr`, 150, y, {align: 'right'}); y += 8;

        doc.setFont(undefined, 'bold');
        doc.text(`Vinst (efter skatt):`, 20, y); doc.text(`${Math.round(calculated.profit12Months).toLocaleString()} kr`, 150, y, {align: 'right'}); y += 12;
        doc.setFont(undefined, 'normal');

        y += 10;
        if (y > 250) { doc.addPage(); y = 20; }
        
        // Regelverk
        doc.setFontSize(14);
        doc.setTextColor(27, 58, 58);
        doc.text('5. Checklista Regelverk & Lagar', 20, y); y += 10;
        doc.setFontSize(10);
        doc.setTextColor(80, 80, 80);
        const rules = [
            "Anmälan till Miljö- och hälsoskyddsnämnden (Senast 6 veckor innan start).",
            "Följa Miljöbalken och bedriva Egenkontroll.",
            "Uppfylla Strålsäkerhetsmyndighetens föreskrifter (SSMFS) vid användning av Laser/IPL.",
            "Om estetiska injektioner ska utföras gäller Injektionslagen (Kräver legitimation).",
            "Skyltning, skyddsglasögon och rutiner enligt metodbeskrivning ska vara på plats.",
            "Lämplig patientförsäkring/företagsförsäkring är nödvändig."
        ];
        rules.forEach(rule => {
            doc.text(`- ${rule}`, 20, y);
            y += 7;
        });

        // Convert PDF to File object
        const pdfArrayBuffer = doc.output('arraybuffer');
        const pdfFile = new File([pdfArrayBuffer], "Affarsplan_Astomed.pdf", { type: "application/pdf" });
        
        // 2. Upload PDF to Base44
        const { file_url } = await base44.asServiceRole.integrations.Core.UploadFile({
            file: pdfFile
        });

        // 3. Send email to customer
        const emailBody = `
<div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333333; max-width: 600px; margin: 0 auto;">
    <!-- Header -->
    <div style="background-color: #1b3a3a; padding: 30px 20px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 28px; font-weight: bold; letter-spacing: 0.5px;">ASTOMED</h1>
        <p style="margin: 5px 0 0 0; font-size: 14px; letter-spacing: 1px;">PROFESSIONELL UTRUSTNING</p>
    </div>
    
    <!-- Divider line -->
    <div style="height: 3px; background-color: #3a9e9e;"></div>
    
    <!-- Content -->
    <div style="padding: 40px 30px; background-color: #ffffff;">
        <p style="font-size: 15px; line-height: 1.8; color: #333333; margin-top: 0;">Hej ${formData.fullName.split(' ')[0]},</p>
        
        <p style="font-size: 15px; line-height: 1.8; color: #333333;">Tack för att du använde Astomeds klinikkalkylator! Din skräddarsydda affärsplan och kalkyl för uppstart av din klinikverksamhet är nu klar och väntande på att ladda ner.</p>
        
        <!-- CTA Button -->
        <div style="margin: 35px 0; text-align: center;">
            <a href="${file_url}" style="display: inline-block; background-color: #1b3a3a; color: #ffffff; text-decoration: none; padding: 16px 40px; font-size: 16px; font-weight: bold; letter-spacing: 0.5px; border: 1px solid #1b3a3a;">LADDA NER AFFÄRSPLAN</a>
        </div>
        
        <!-- Section divider -->
        <div style="border-top: 2px solid #3a9e9e; margin: 35px 0;"></div>
        
        <h2 style="font-size: 18px; font-weight: bold; color: #1b3a3a; margin: 25px 0 15px 0; letter-spacing: 0.5px;">VAD VI HJÄLPER DIG MED</h2>
        
        <p style="font-size: 14px; line-height: 1.8; color: #333333; margin: 0 0 20px 0;">Vi på Astomed är inte bara en maskinleverantör – vi är din partner genom hela din kliniks utveckling. Utöver världsklass-utrustning hjälper vi dig med:</p>
        
        <ul style="list-style: none; padding: 0; margin: 0 0 20px 0;">
            <li style="font-size: 14px; line-height: 1.8; color: #333333; margin-bottom: 15px; padding-left: 25px; position: relative;">
                <span style="position: absolute; left: 0; color: #3a9e9e; font-weight: bold;">▸</span>
                <strong>Service & Support:</strong> Trygga serviceavtal, årliga funktionskontroller och snabb teknisk support för att minimera driftstopp.
            </li>
            <li style="font-size: 14px; line-height: 1.8; color: #333333; margin-bottom: 15px; padding-left: 25px; position: relative;">
                <span style="position: absolute; left: 0; color: #3a9e9e; font-weight: bold;">▸</span>
                <strong>Utbildning & Kompetens:</strong> Certifierande utbildningar inom Laser, IPL, injektioner och resultatinriktad hudvård.
            </li>
            <li style="font-size: 14px; line-height: 1.8; color: #333333; margin-bottom: 15px; padding-left: 25px; position: relative;">
                <span style="position: absolute; left: 0; color: #3a9e9e; font-weight: bold;">▸</span>
                <strong>Regelverk & Lagar:</strong> Kostnadsfri guidning vid anmälan till kommunen, mallar för egenkontroll och strålsäkerhet (SSMFS 2026:1).
            </li>
            <li style="font-size: 14px; line-height: 1.8; color: #333333; padding-left: 25px; position: relative;">
                <span style="position: absolute; left: 0; color: #3a9e9e; font-weight: bold;">▸</span>
                <strong>Affärsutveckling:</strong> Professionella hudvårdsprodukter, förbrukningsmaterial och strategisk rådgivning för hållbar lönsamhet.
            </li>
        </ul>
        
        <!-- Section divider -->
        <div style="border-top: 1px solid #e0e0e0; margin: 35px 0;"></div>
        
        <p style="font-size: 14px; line-height: 1.8; color: #333333;">Har du frågor om din kalkyl, våra maskiner eller nästa steg? Tveka inte att svara på detta mail eller kontakta oss direkt. Vi är här för att stötta dig!</p>
        
        <p style="margin-top: 30px; margin-bottom: 0; font-size: 14px; color: #333333;">Vänliga hälsningar,</p>
        <p style="margin: 5px 0 0 0; font-weight: bold; color: #1b3a3a; font-size: 16px;">Astomed Pro</p>
    </div>
    
    <!-- Footer -->
    <div style="background-color: #f5f5f5; padding: 20px 30px; text-align: center; border-top: 1px solid #e0e0e0; font-size: 12px; color: #666666;">
        <p style="margin: 0 0 5px 0;">Astomed Sverige AB | Jägerhorns väg 5 | 141 75 Kungens Kurva</p>
        <p style="margin: 0;">Org.nr: 556709-9964</p>
    </div>
</div>
`;

        try {
            await base44.asServiceRole.integrations.Core.SendEmail({
                to: formData.email,
                subject: "Din affärsplan och kalkyl från Astomed",
                body: emailBody,
                from_name: "Astomed Pro"
            });
        } catch (emailError) {
            console.warn("Kunde inte skicka e-post (oftast sandbox-begränsning):", emailError.message);
        }
        
        // 4. Register Lead in system
        await base44.asServiceRole.entities.PublicServiceLead.create({
            company_name: formData.company || formData.fullName,
            contact_person: formData.fullName,
            email: formData.email,
            phone: formData.phone,
            notes: `Lead från Klinikkalkylatorn. Valt utrustning: ${machineName}. Beräknad break-even: ${calculated.breakEvenMonths} månader.`,
            status: "new",
            service_description: "Klinikkalkylator - Intresseanmälan",
            machine_name: machineName || "Okänd maskin"
        });

        return Response.json({ success: true, file_url });
    } catch (error) {
        console.error(error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});