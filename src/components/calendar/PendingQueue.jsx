import { Inbox, GripVertical, CalendarPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const typeColor = { standard: "bg-slate-100 text-slate-700", advanced: "bg-indigo-100 text-indigo-700" };
const typeLabel = { standard: "Standard", advanced: "Avancerad" };

export default function PendingQueue({ records, machines, customers, onDragStart, onBook }) {
  const getMachine = (id) => machines.find(m => m.id === id);
  const getCustomer = (id) => customers.find(c => c.id === id);

  if (records.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-400">
        <Inbox className="w-10 h-10 mb-2 opacity-30" />
        <p className="text-sm">Inga väntande ärenden</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-2">
      {records.map(r => {
        const machine = getMachine(r.machine_id);
        const customer = getCustomer(r.customer_id);
        return (
          <div
            key={r.id}
            draggable
            onDragStart={() => onDragStart(r)}
            className="bg-white border border-slate-200 rounded-lg p-3 cursor-grab active:cursor-grabbing hover:border-[#3a9e9e] hover:shadow-sm transition-all"
          >
            <div className="flex items-start gap-2">
              <GripVertical className="w-4 h-4 text-slate-300 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-slate-800 truncate">{machine?.model || "Okänd maskin"}</div>
                <div className="text-xs text-slate-400 font-mono">SN: {machine?.serial_number || "–"}</div>
                <div className="text-xs text-slate-500 mt-1 truncate">{customer?.company_name || "Okänd kund"}</div>
                <div className="flex items-center gap-1.5 mt-2">
                  <Badge className={`text-xs ${typeColor[r.service_type]}`}>{typeLabel[r.service_type]}</Badge>
                  {r.technician_name && (
                    <span className="text-xs text-slate-400">{r.technician_name.split(" ")[0]}</span>
                  )}
                </div>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="w-full mt-2 text-xs h-7 text-[#1b3a3a] border-[#dce8e8] hover:bg-[#e8f2f2]"
              onClick={() => onBook(r)}
            >
              <CalendarPlus className="w-3 h-3 mr-1" /> Boka in
            </Button>
          </div>
        );
      })}
    </div>
  );
}