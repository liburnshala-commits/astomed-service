import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { Phone, Mail, Users, FileText, Plus, MessageSquare } from "lucide-react";

const interactionIcons = {
  phone: <Phone className="w-4 h-4 text-blue-500" />,
  email: <Mail className="w-4 h-4 text-emerald-500" />,
  meeting: <Users className="w-4 h-4 text-purple-500" />,
  other: <FileText className="w-4 h-4 text-slate-500" />
};

const interactionLabels = {
  phone: "Samtal",
  email: "E-post",
  meeting: "Möte",
  other: "Övrigt"
};

export default function CustomerInteractions({ customerId }) {
  const [interactions, setInteractions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState("phone");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const data = await base44.entities.CustomerInteraction.filter({ customer_id: customerId }, "-interaction_date");
    setInteractions(data);
  };

  useEffect(() => {
    if (customerId) load();
  }, [customerId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!notes.trim()) return;
    setLoading(true);
    try {
      const user = await base44.auth.me();
      await base44.entities.CustomerInteraction.create({
        customer_id: customerId,
        interaction_type: type,
        interaction_date: new Date().toISOString(),
        notes: notes,
        logged_by: user?.full_name || user?.email || "Okänd"
      });
      setNotes("");
      setShowForm(false);
      load();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="astomed-card border-0 shadow-sm h-full">
      <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
        <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-800">
          <MessageSquare className="w-4 h-4 text-slate-500" />
          Loggade händelser
        </CardTitle>
        {!showForm && (
          <Button size="sm" variant="outline" className="h-8" onClick={() => setShowForm(true)}>
            <Plus className="w-3.5 h-3.5 mr-1" /> Logga händelse
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-0">
        {showForm && (
          <div className="p-4 bg-slate-50 border-b border-slate-100">
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="flex gap-3">
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger className="w-40 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="phone">📞 Samtal</SelectItem>
                    <SelectItem value="email">✉️ E-post</SelectItem>
                    <SelectItem value="meeting">🤝 Möte</SelectItem>
                    <SelectItem value="other">📝 Övrigt</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Textarea 
                placeholder="Anteckningar från samtalet/mötet..." 
                className="bg-white min-h-[100px] resize-none"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>
                  Avbryt
                </Button>
                <Button type="submit" size="sm" className="astomed-btn-primary" disabled={loading || !notes.trim()}>
                  {loading ? "Sparar..." : "Spara händelse"}
                </Button>
              </div>
            </form>
          </div>
        )}

        <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
          {interactions.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-400">
              Inga händelser loggade ännu.
            </div>
          ) : (
            interactions.map(item => (
              <div key={item.id} className="p-4 hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-white rounded-md border shadow-sm flex-shrink-0">
                    {interactionIcons[item.interaction_type] || interactionIcons.other}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm text-slate-700">
                        {interactionLabels[item.interaction_type] || "Övrigt"}
                      </span>
                      <span className="text-xs text-slate-400">
                        {format(new Date(item.interaction_date), "d MMM yyyy HH:mm", { locale: sv })}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500">Loggat av: {item.logged_by}</div>
                  </div>
                </div>
                <div className="text-sm text-slate-600 pl-9 whitespace-pre-wrap break-words">
                  {item.notes}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}