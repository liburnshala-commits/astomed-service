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