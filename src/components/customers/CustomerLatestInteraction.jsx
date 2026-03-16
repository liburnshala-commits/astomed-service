import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Phone, Mail, Users, FileText, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { sv } from "date-fns/locale";

const interactionIcons = {
  phone: <Phone className="w-3.5 h-3.5 text-blue-500" />,
  email: <Mail className="w-3.5 h-3.5 text-emerald-500" />,
  meeting: <Users className="w-3.5 h-3.5 text-purple-500" />,
  other: <FileText className="w-3.5 h-3.5 text-slate-500" />
};

const interactionLabels = {
  phone: "Samtal",
  email: "E-post",
  meeting: "Möte",
  other: "Övrigt"
};

export default function CustomerLatestInteraction({ customerId }) {
  const [interaction, setInteraction] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLatest();
  }, [customerId]);

  const loadLatest = async () => {
    try {
      setLoading(true);
      const data = await base44.entities.CustomerInteraction.filter({ customer_id: customerId }, "-interaction_date", 1);
      setInteraction(data[0] || null);
    } catch (e) {
      console.error("Kunde inte ladda senaste händelse:", e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="mt-4 p-3 bg-slate-50 rounded-lg text-sm text-slate-500">
        Laddar händelser...
      </div>
    );
  }

  if (!interaction) {
    return (
      <div className="mt-4 p-3 bg-slate-50 rounded-lg text-sm text-slate-500 text-center">
        <MessageSquare className="w-4 h-4 mx-auto mb-1 opacity-50" />
        Inga händelser loggade än
      </div>
    );
  }

  return (
    <div className="mt-4 p-3 bg-slate-50 rounded-lg">
      <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
        <MessageSquare className="w-3 h-3" /> Senaste händelsen
      </div>
      <div className="flex items-start gap-2">
        <div className="p-1.5 bg-white rounded-md border border-slate-200 shadow-sm flex-shrink-0">
          {interactionIcons[interaction.interaction_type] || interactionIcons.other}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium text-xs text-slate-700">
              {interactionLabels[interaction.interaction_type] || "Övrigt"}
            </span>
            <span className="text-[10px] text-slate-400 whitespace-nowrap">
              {format(new Date(interaction.interaction_date), "d MMM yyyy", { locale: sv })}
            </span>
          </div>
          <p className="text-xs text-slate-600 truncate mt-0.5" title={interaction.notes}>
            {interaction.notes}
          </p>
        </div>
      </div>
    </div>
  );
}