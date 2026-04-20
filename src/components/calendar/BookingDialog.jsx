import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Wrench, CalendarDays, User, Clock, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { base44 } from "@/api/base44Client";

const statusColor = {
  pending: "bg-yellow-100 text-yellow-800",
  awaiting_approval: "bg-orange-100 text-orange-800",
  in_progress: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  invoiced: "bg-purple-100 text-purple-800",
};
const statusLabel = {
  pending: "Väntar", awaiting_approval: "Inv. godkänn.", in_progress: "Pågående", completed: "Slutförd", invoiced: "Fakturerad"
};

export default function BookingDialog({ date, record, records, machines, customers, onConfirm, onUnschedule, onClose, onEdit }) {
  const getMachine = (id) => machines.find(m => m.id === id);
  const getCustomer = (id) => customers.find(c => c.id === id);

  const [selectedDate, setSelectedDate] = useState(date || record?.service_date || "");
  const [selectedTechnician, setSelectedTechnician] = useState(record?.technician_name || "");
  const [loading, setLoading] = useState(false);
  const [technicians, setTechnicians] = useState([]);

  useEffect(() => {
    base44.entities.User.filter({ role: "technician" }).then(users => {
      setTechnicians(users.map(u => u.full_name || u.email));
    });
  }, []);

  // If no specific record, show what's already on this date
  const dayRecords = date
    ? records.filter(r => r.service_date?.startsWith(date))
    : [];

  const isBooking = !!record; // booking a specific record

  const handleConfirm = async () => {
    if (!selectedDate) return;
    setLoading(true);
    await onConfirm({ record, date: selectedDate, technicianName: selectedTechnician });
    setLoading(false);
  };

  const formattedDate = selectedDate
    ? format(new Date(selectedDate), "EEEE d MMMM yyyy", { locale: sv })
    : "Välj datum";

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center bg-black/40 p-4 sm:p-6 py-10">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-full flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b shrink-0">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-[#3a9e9e]" />
            <h2 className="font-bold text-slate-800">
              {isBooking ? "Boka serviceärende" : "Dag – " + (date ? format(new Date(date), "d MMM", { locale: sv }) : "")}
            </h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Show record info if booking specific record */}
          {isBooking && (
            <div className="bg-[#f4f9f9] border border-[#dce8e8] rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#e8f2f2] flex items-center justify-center flex-shrink-0">
                  <Wrench className="w-4 h-4 text-[#1b3a3a]" />
                </div>
                <div className="min-w-0 w-full pr-2">
                  <div className="font-semibold text-slate-800">{getMachine(record.machine_id)?.model || "Okänd maskin"}</div>
                  <div className="text-xs text-slate-400 font-mono mb-2">SN: {getMachine(record.machine_id)?.serial_number || "–"}</div>
                  
                  <div className="bg-white border rounded p-2 text-[10px] space-y-1 mb-2">
                     <div className="flex justify-between">
                       <span className="text-slate-400">Senaste service:</span>
                       <span className="font-medium text-slate-700">{getMachine(record.machine_id)?.service_date || "Ingen"}</span>
                     </div>
                     <div className="flex justify-between">
                       <span className="text-slate-400">Avtal:</span>
                       <span className="font-medium text-slate-700">
                         {getMachine(record.machine_id)?.service_contract === "none" ? "Inget" : (getMachine(record.machine_id)?.service_contract === "basic" ? "Basic" : getMachine(record.machine_id)?.service_contract || "Inget")}
                       </span>
                     </div>
                     <div className="flex justify-between">
                       <span className="text-slate-400">Ort:</span>
                       <span className="font-medium text-slate-700">{getCustomer(record.customer_id)?.city || "Ej angiven"}</span>
                     </div>
                  </div>

                  <div className="text-sm text-slate-500 mt-0.5">{getCustomer(record.customer_id)?.company_name || "Okänd kund"}</div>
                  <Badge className={`mt-1 text-xs ${statusColor[record.status]}`}>{statusLabel[record.status]}</Badge>
                </div>
              </div>
            </div>
          )}

          {/* Date picker */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5"><CalendarDays className="w-3.5 h-3.5" />Servicedatum</Label>
            <Input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="text-sm"
            />
            {selectedDate && (
              <p className="text-xs text-slate-400 capitalize">{formattedDate}</p>
            )}
          </div>

          {/* Technician selector */}
          {isBooking && (
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" />Tekniker</Label>
              <Select value={selectedTechnician} onValueChange={setSelectedTechnician}>
                <SelectTrigger><SelectValue placeholder="Välj tekniker" /></SelectTrigger>
                <SelectContent>
                  {technicians.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Day overview when clicking a date (not booking specific record) */}
          {!isBooking && dayRecords.length > 0 && (
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />Bokade ärenden denna dag</Label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {dayRecords.map(r => {
                  const machine = getMachine(r.machine_id);
                  const customer = getCustomer(r.customer_id);
                  return (
                    <div key={r.id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-slate-700 truncate">{machine?.model || "Okänd maskin"}</div>
                        <div className="text-xs text-slate-400">{customer?.company_name} · {r.technician_name || "Ingen tekniker"}</div>
                      </div>
                      <div className="flex items-center gap-1.5 ml-2">
                        <Badge className={`text-xs flex-shrink-0 ${statusColor[r.status]}`}>{statusLabel[r.status]}</Badge>
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => onEdit(r)}>
                          <Pencil className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {!isBooking && dayRecords.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-3">Inga ärenden inbokade denna dag</p>
          )}
        </div>

        <div className="flex flex-col gap-3 px-5 pb-5">
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onClose}>Stäng</Button>
            {isBooking && (
              <Button
                className="flex-1 bg-[#1b3a3a] hover:bg-[#254f4f] text-white"
                onClick={handleConfirm}
                disabled={!selectedDate || loading}
              >
                {loading ? "Bokar..." : "Bekräfta bokning"}
              </Button>
            )}
          </div>
          {isBooking && onUnschedule && record.service_date && (
            <Button 
              variant="ghost" 
              className="w-full text-red-500 hover:text-red-700 hover:bg-red-50 text-sm h-8"
              onClick={async () => {
                setLoading(true);
                await onUnschedule(record);
                setLoading(false);
              }}
              disabled={loading}
            >
              Avboka och lägg tillbaka i kön
            </Button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}