import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, AlertTriangle, Wrench } from "lucide-react";
import { format } from "date-fns";
import { sv } from "date-fns/locale";

const formatSEK = (v) =>
  new Intl.NumberFormat("sv-SE", { style: "currency", currency: "SEK", maximumFractionDigits: 0 }).format(v || 0);

export default function QuoteApprovalCard({ record, machine, onUpdated }) {
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const respond = async (answer) => {
    setLoading(true);
    await base44.entities.ServiceRecord.update(record.id, {
      quote_approved: answer,
      quote_note: note,
      status: answer === "approved" ? "in_progress" : "pending",
    });
    setDone(true);
    setLoading(false);
    onUpdated?.();
  };

  if (done) {
    return (
      <Card className="border-2 border-green-300 bg-green-50">
        <CardContent className="p-5 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <p className="text-sm text-green-800 font-medium">Ditt svar har skickats. Vi återkommer inom kort.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 astomed-card" style={{ borderColor: "#f59e0b" }}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#fef3c7" }}>
            <AlertTriangle className="w-4 h-4" style={{ color: "#d97706" }} />
          </div>
          <div>
            <CardTitle className="text-base astomed-title">Kostnadsförslag – godkännande krävs</CardTitle>
            <p className="text-xs astomed-muted">Teknikern har skickat ett kostnadsförslag för ditt ärende</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 rounded-xl space-y-2" style={{ background: "#f4f9f9" }}>
          <div className="flex items-center gap-2 mb-1">
            <Wrench className="w-4 h-4 astomed-muted" />
            <span className="text-sm font-semibold astomed-title">{machine?.model || "Okänd maskin"}</span>
            {machine?.serial_number && <span className="text-xs astomed-muted">SN: {machine.serial_number}</span>}
          </div>
          {record.description && (
            <p className="text-sm astomed-subtitle">{record.description}</p>
          )}
          <div className="pt-2 border-t" style={{ borderColor: "#dce8e8" }}>
            {record.parts_used?.length > 0 && (
              <div className="mb-2">
                <p className="text-xs font-semibold astomed-label mb-1">Reservdelar:</p>
                {record.parts_used.map((p, i) => (
                  <div key={i} className="flex justify-between text-xs astomed-subtitle">
                    <span>{p.part_name} × {p.quantity}</span>
                    <span>{formatSEK((p.unit_price || 0) * (p.quantity || 1))}</span>
                  </div>
                ))}
              </div>
            )}
            {record.labor_hours && (
              <div className="flex justify-between text-xs astomed-subtitle mb-1">
                <span>Arbetstimmar ({record.labor_hours} tim)</span>
                <span>{formatSEK(record.labor_cost)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold astomed-title border-t pt-2" style={{ borderColor: "#dce8e8" }}>
              <span>Totalt kostnadsförslag</span>
              <span style={{ color: "#1b3a3a" }}>{formatSEK(record.total_cost)}</span>
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-xs astomed-muted">Valfritt meddelande till teknikern:</p>
          <Textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="T.ex. kommentarer eller frågor..."
            rows={2}
            className="text-sm"
          />
        </div>

        <div className="flex gap-3">
          <Button
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            onClick={() => respond("approved")}
            disabled={loading}
          >
            <CheckCircle className="w-4 h-4 mr-1.5" />
            Godkänn kostnadsförslag
          </Button>
          <Button
            variant="outline"
            className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
            onClick={() => respond("rejected")}
            disabled={loading}
          >
            <XCircle className="w-4 h-4 mr-1.5" />
            Avvisa
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}