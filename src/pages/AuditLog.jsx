import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Shield, Trash2, Edit, Plus, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { sv } from "date-fns/locale";

const actionConfig = {
  create: { label: "Skapades", color: "bg-green-100 text-green-800", icon: Plus },
  update: { label: "Ändrades", color: "bg-blue-100 text-blue-800", icon: Edit },
  delete: { label: "Raderades", color: "bg-red-100 text-red-800", icon: Trash2 },
};

export default function AuditLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      if (u?.role === "admin") {
        base44.entities.AuditLog.list("-created_date", 200).then(data => {
          setLogs(data);
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    }).catch(() => setLoading(false));
  }, []);

  const filtered = logs.filter(l =>
    l.entity_label?.toLowerCase().includes(search.toLowerCase()) ||
    l.user_email?.toLowerCase().includes(search.toLowerCase()) ||
    l.user_name?.toLowerCase().includes(search.toLowerCase()) ||
    l.entity_type?.toLowerCase().includes(search.toLowerCase())
  );

  if (!loading && user?.role !== "admin") {
    return (
      <div className="p-6 flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <Shield className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-slate-700">Åtkomst nekad</h2>
          <p className="text-slate-400 text-sm mt-1">Enbart administratörer kan se audit log.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
          <Shield className="w-5 h-5 text-slate-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Audit Log (GDPR)</h1>
          <p className="text-slate-500 text-sm">Logg över alla ändringar i systemet</p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
        <strong>Dataskyddsinformation:</strong> Systemet lagrar personuppgifter (företagsnamn, kontaktpersoner, e-post, telefon) i enlighet med GDPR.
        Data används enbart för servicehantering. Varje ändring loggas här för spårbarhet.
        Kunder har rätt att begära radering av sina uppgifter via kundhanteringssidan.
      </div>

      {/* Full consent text for admin */}
      <details className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <summary className="cursor-pointer px-5 py-4 font-semibold text-slate-800 flex items-center gap-2 select-none hover:bg-slate-50 transition-colors">
          <Shield className="w-4 h-4 text-teal-700 flex-shrink-0" />
          Fullständig samtyckestext (Integritetspolicy – version 2025-10-20)
        </summary>
        <div className="px-6 pb-6 pt-2 text-sm leading-relaxed space-y-4 text-slate-700 border-t border-slate-100">
          <p>Astomed AB driver denna butik och webbplats, inklusive all relaterad information, allt innehåll, alla funktioner, verktyg, produkter och tjänster för att ge dig som kund en anpassad shoppingupplevelse ("Tjänsterna"). Astomed AB drivs av Shopify, vilket gör det möjligt för oss att tillhandahålla tjänsterna till dig. Denna integritetspolicy beskriver hur vi samlar in, använder och avslöjar dina personuppgifter när du besöker, använder eller gör ett köp eller annan transaktion med hjälp av tjänsterna eller på annat sätt kommunicerar med oss.</p>
          <p>Läs denna integritetspolicy noggrant. Genom att använda och få tillgång till någon av tjänsterna bekräftar du att du har läst denna integritetspolicy och förstår hur dina uppgifter samlas in, används och lämnas ut enligt beskrivningen i denna integritetspolicy.</p>

          <h3 className="font-semibold text-base text-slate-900">Personuppgifter som vi samlar in eller behandlar</h3>
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

          <h3 className="font-semibold text-base text-slate-900">Hur vi använder dina personuppgifter</h3>
          <p>Vi kan använda personuppgifter för följande ändamål: tillhandahålla, anpassa och förbättra tjänsterna; marknadsföring och annonsering; säkerhet och förebyggande av bedrägerier; kommunikation med dig; samt juridiska orsaker.</p>

          <h3 className="font-semibold text-base text-slate-900">Hur vi lämnar ut personuppgifter</h3>
          <p>Vi kan lämna ut dina personuppgifter till Shopify, tjänsteleverantörer, affärs- och marknadsföringspartner, dotterbolag, samt i samband med affärstransaktioner eller för att uppfylla lagliga skyldigheter.</p>

          <h3 className="font-semibold text-base text-slate-900">Säkerhet och lagring av dina uppgifter</h3>
          <p>Vi kan inte garantera "perfekt säkerhet". Hur länge vi lagrar dina personuppgifter beror på olika faktorer, till exempel om vi behöver uppgifterna för att upprätthålla ditt konto, tillhandahålla tjänster eller uppfylla lagliga skyldigheter.</p>

          <h3 className="font-semibold text-base text-slate-900">Dina rättigheter och valmöjligheter</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>Rätt till åtkomst/information</li>
            <li>Rätt att radera</li>
            <li>Rätt till rättelse</li>
            <li>Rätt till överförbarhet</li>
            <li>Rätt att välja bort försäljning eller delning för riktad reklam</li>
          </ul>

          <h3 className="font-semibold text-base text-slate-900">Kontakt</h3>
          <p>Om du har några frågor om våra sekretessrutiner eller denna integritetspolicy, vänligen kontakta oss:</p>
          <div className="rounded-lg p-3 text-sm bg-slate-50 border border-slate-200">
            <div className="font-medium text-slate-900">Astomed Service</div>
            <div>kontakt@astomed.se</div>
            <div>(+46) 08-410 77 900</div>
            <div>Jägerhorns väg 5, 141 75 Kungens kurva, Sverige</div>
          </div>

          <div className="rounded-lg p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs mt-4">
            <strong>Samtyckestext som visas för användaren:</strong> "Jag har läst och är införstådd med integritetspolicyn och godkänner hur Astomed hanterar mina personuppgifter."
          </div>
        </div>
      </details>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input placeholder="Sök i loggen..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">{filtered.length} händelser</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1,2,3,4,5].map(i => <div key={i} className="h-12 bg-slate-100 rounded animate-pulse" />)}
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-8">Inga händelser loggade ännu</p>
          ) : (
            <div className="space-y-2">
              {filtered.map(log => {
                const cfg = actionConfig[log.action] || actionConfig.update;
                const Icon = cfg.icon;
                return (
                  <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all">
                    <div className="w-7 h-7 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Icon className="w-3.5 h-3.5 text-slate-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={cfg.color}>{cfg.label}</Badge>
                        <span className="text-sm font-medium text-slate-800">{log.entity_type}</span>
                        {log.entity_label && <span className="text-sm text-slate-600">– {log.entity_label}</span>}
                      </div>
                      {log.details && <p className="text-xs text-slate-500 mt-0.5">{log.details}</p>}
                      <p className="text-xs text-slate-400 mt-0.5">
                        {log.user_name || log.user_email} · {log.created_date ? format(new Date(log.created_date), "d MMM yyyy HH:mm", { locale: sv }) : ""}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}