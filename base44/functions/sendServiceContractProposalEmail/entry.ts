import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);

        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { to } = await req.json();

        if (!to) {
            return Response.json({ error: 'Missing recipient email' }, { status: 400 });
        }

        const subject = "Serviceavtal på din maskin: 600-850kr i månaden";
        const body = `Hej,

Jag hoppas att allt är bra med dig och kliniken!
Som du säkert känner till införs skärpta krav och ett nytt regelverk från Strålsäkerhetsmyndigheten (SSM) den 4:e maj 2026.

Detta innebär bland annat skärpta krav på teknisk dokumentation och regelbunden kontroll av din utrustning.

Vi vill gärna hjälpa dig att ligga steget före så att du kan fokusera helt på dina patienter och erbjuder nu abonnemang på serviceavtal för just din maskin.

Mer information hittar du på www.astomed.se/service och vill du skicka en förfrågan på serviceavtal till Astomed.

Vad tror du om att jag försöker ringa dig i veckan, eller så kan du ringa mig? På Astomed jobbar jag som produktspecialist och är ansvarig för serviceavtalen på Astomed.


Med vänlig hälsning,

Liburn Shala
Mobil: 0705357774
Mail: Liburn@astomed.se

Astomed AB
Jägerhorns väg 5
141 75 Kungens Kurva`;

        await base44.functions.invoke('sendSmtpEmail', {
            from_name: "Astomed Service",
            to: to,
            subject: subject,
            body: body
        });

        return Response.json({ success: true });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});