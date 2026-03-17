import { Shield } from "lucide-react";

export default function PrivacyPolicyContent() {
  return (
    <>
      <div className="flex items-center gap-3 p-6 border-b border-slate-100 flex-shrink-0">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#e8f2f2" }}>
          <Shield className="w-5 h-5" style={{ color: "#1b3a3a" }} />
        </div>
        <div>
          <h2 className="text-lg font-bold" style={{ color: "#1b3a3a" }}>Integritetspolicy</h2>
          <p className="text-xs" style={{ color: "#6b8f8f" }}>Senast uppdaterad: 17 mars 2026</p>
        </div>
      </div>

      <div className="overflow-y-auto flex-1 p-6 text-sm leading-relaxed space-y-4" style={{ color: "#254f4f" }}>
        <p>Astomed AB driver denna webbplats, inklusive all relaterad information, allt innehåll, alla funktioner, verktyg, produkter och tjänster för att ge dig som kund en anpassad shoppingupplevelse ("Tjänsterna"). Serviceastomed.se drivs av Base44.com och Loopia.se, vilket gör det möjligt för oss att tillhandahålla tjänsterna till dig. Denna integritetspolicy beskriver hur vi samlar in, använder och avslöjar dina personuppgifter när du besöker, använder eller gör ett köp eller annan transaktion med hjälp av tjänsterna eller på annat sätt kommunicerar med oss.</p>

        <p>Läs denna integritetspolicy noggrant. Genom att använda och få tillgång till någon av tjänsterna bekräftar du att du har läst denna integritetspolicy och förstår hur dina uppgifter samlas in, används och lämnas ut enligt beskrivningen i denna integritetspolicy.</p>

        <h3 className="font-semibold text-base" style={{ color: "#1b3a3a" }}>Personuppgifter som vi samlar in eller behandlar</h3>
        <p>När vi använder termen "personuppgifter" avser vi information som identifierar eller rimligen kan kopplas till dig eller någon annan person. Vi kan samla in eller behandla följande kategorier av personuppgifter:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Kontaktuppgifter inklusive namn, adress, faktureringsadress, leveransadress, telefonnummer och e-postadress.</li>
          <li>Finansiell information inklusive kreditkortsnummer, betalkortsnummer och finansiella kontonummer.</li>
          <li>Kontoinformation inklusive användarnamn, lösenord, säkerhetsfrågor, preferenser och inställningar.</li>
          <li>Transaktionsinformation inklusive de artiklar du tittar på, lägger i varukorgen eller köper.</li>
          <li>Kommunikation med oss inklusive den information du lämnar i din kommunikation med oss.</li>
          <li>Enhetsinformation inklusive information om din enhet, webbläsare eller nätverksanslutning och din IP-adress.</li>
          <li>Användningsinformation inklusive information om din interaktion med tjänsterna.</li>
        </ul>

        <h3 className="font-semibold text-base" style={{ color: "#1b3a3a" }}>Hur vi använder dina personuppgifter</h3>
        <p>Vi kan använda personuppgifter för följande ändamål: tillhandahålla, anpassa och förbättra tjänsterna; marknadsföring och annonsering; säkerhet och förebyggande av bedrägerier; kommunikation med dig; samt juridiska orsaker.</p>

        <h3 className="font-semibold text-base" style={{ color: "#1b3a3a" }}>Hur vi lämnar ut personuppgifter</h3>
        <p>Vi kan lämna ut dina personuppgifter till Shopify, tjänsteleverantörer, affärs- och marknadsföringspartner, dotterbolag, samt i samband med affärstransaktioner eller för att uppfylla lagliga skyldigheter.</p>

        <h3 className="font-semibold text-base" style={{ color: "#1b3a3a" }}>Säkerhet och lagring av dina uppgifter</h3>
        <p>Vi kan inte garantera "perfekt säkerhet". Hur länge vi lagrar dina personuppgifter beror på olika faktorer, till exempel om vi behöver uppgifterna för att upprätthålla ditt konto, tillhandahålla tjänster eller uppfylla lagliga skyldigheter.</p>

        <h3 className="font-semibold text-base" style={{ color: "#1b3a3a" }}>Dina rättigheter och valmöjligheter</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>Rätt till åtkomst/information</li>
          <li>Rätt att radera</li>
          <li>Rätt till rättelse</li>
          <li>Rätt till överförbarhet</li>
          <li>Rätt att välja bort försäljning eller delning för riktad reklam</li>
        </ul>

        <h3 className="font-semibold text-base" style={{ color: "#1b3a3a" }}>Kontakt</h3>
        <p>Om du har några frågor om våra sekretessrutiner eller denna integritetspolicy, vänligen kontakta oss:</p>
        <div className="rounded-lg p-3 text-sm" style={{ background: "#e8f2f2" }}>
          <div className="font-medium" style={{ color: "#1b3a3a" }}>Astomed Service</div>
          <div>kontakt@astomed.se</div>
          <div>(+46) 08-410 77 900</div>
          <div>Jägerhorns väg 5, 141 75 Kungens kurva, Sverige</div>
        </div>
      </div>
    </>
  );
}