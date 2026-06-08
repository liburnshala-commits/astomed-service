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
        doc.text(`Utrustning:`, 20, y); doc.text(`${Math.round(calculated.totalStartupCost - formData.municipalityFee - formData.interiorCost - formData.otherStartup).toLocaleString()} kr`, 150, y, {align: 'right'}); y += 8;
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
        doc.text(`Behandlingar/vecka: ${formData.treatmentsPerWeek} st á ${formData.pricePerTreatment} kr (inkl ev moms)`, 20, y); y += 8;
        doc.text(`Momsbelagt: ${formData.isAesthetic ? 'Ja (Estetisk 25%)' : 'Nej (Medicinsk 0%)'}`, 20, y); y += 12;

        doc.text(`Månadsomsättning (exkl moms):`, 20, y); doc.text(`${Math.round(calculated.monthlyRevenueExVat).toLocaleString()} kr`, 150, y, {align: 'right'}); y += 8;
        doc.text(`Hyra:`, 20, y); doc.text(`- ${Math.round(formData.rent).toLocaleString()} kr`, 150, y, {align: 'right'}); y += 8;
        doc.text(`Lön & Soc. avgifter:`, 20, y); doc.text(`- ${Math.round(formData.salary * 1.3142).toLocaleString()} kr`, 150, y, {align: 'right'}); y += 8;
        doc.text(`Bokningssystem m.m:`, 20, y); doc.text(`- ${Math.round(formData.bookingSystem).toLocaleString()} kr`, 150, y, {align: 'right'}); y += 8;
        doc.text(`Försäkring & Marknadsföring:`, 20, y); doc.text(`- ${Math.round(formData.insuranceAndOther).toLocaleString()} kr`, 150, y, {align: 'right'}); y += 12;

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
        
        // Regelverk
        doc.setFontSize(14);
        doc.setTextColor(27, 58, 58);
        doc.text('4. Checklista Regelverk & Lagar', 20, y); y += 10;
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
        const emailBody = `Hej ${formData.fullName.split(' ')[0]},\n\nTack för att du använde Astomeds klinikkalkylator!\n\nBifogat finner du din skräddarsydda affärsplan och kalkyl för uppstart av din klinikverksamhet baserat på dina angivna siffror.\n\nKalkylen inkluderar uppstartskostnader, löpande kostnader, vinstberäkning efter skatt och en uppskattning på break-even.\n\nDu kan ladda ner din affärsplan (PDF) här: ${file_url}\n\nTveka inte att höra av dig till oss på Astomed om du har frågor om utrustning eller nästa steg!\n\nVänliga hälsningar,\nAstomed Pro`;

        await base44.asServiceRole.integrations.Core.SendEmail({
            to: formData.email,
            subject: "Din affärsplan och kalkyl från Astomed",
            body: emailBody,
            from_name: "Astomed Pro"
        });
        
        // 4. Register Lead in system
        await base44.asServiceRole.entities.PublicServiceLead.create({
            company_name: formData.company || formData.fullName,
            contact_person: formData.fullName,
            email: formData.email,
            phone: formData.phone,
            description: `Lead från Klinikkalkylatorn. Valt utrustning: ${machineName}. Beräknad break-even: ${calculated.breakEvenMonths} månader.`,
            status: "new"
        });

        return Response.json({ success: true, file_url });
    } catch (error) {
        console.error(error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});