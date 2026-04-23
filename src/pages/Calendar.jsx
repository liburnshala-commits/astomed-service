import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameMonth, isSameDay, addMonths, subMonths, isToday } from "date-fns";
import { sv } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus, Inbox, Wrench, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import ServiceRecordForm from "@/components/service/ServiceRecordForm";
import BookingDialog from "@/components/calendar/BookingDialog";
import PendingQueue from "@/components/calendar/PendingQueue";

const statusColor = {
  pending: "bg-yellow-400",
  awaiting_approval: "bg-orange-400",
  in_progress: "bg-blue-500",
  completed: "bg-green-500",
  invoiced: "bg-purple-500",
};
const statusLabel = {
  pending: "Väntar", awaiting_approval: "Inv. godkänn.", in_progress: "Pågående", completed: "Slutförd", invoiced: "Fakturerad"
};

const getTechnicianColor = (name) => {
  if (!name) return "bg-white border-slate-200 hover:bg-slate-50";
  const colors = [
    "bg-red-50 border-red-200 hover:bg-red-100",
    "bg-orange-50 border-orange-200 hover:bg-orange-100",
    "bg-amber-50 border-amber-200 hover:bg-amber-100",
    "bg-green-50 border-green-200 hover:bg-green-100",
    "bg-emerald-50 border-emerald-200 hover:bg-emerald-100",
    "bg-teal-50 border-teal-200 hover:bg-teal-100",
    "bg-cyan-50 border-cyan-200 hover:bg-cyan-100",
    "bg-sky-50 border-sky-200 hover:bg-sky-100",
    "bg-blue-50 border-blue-200 hover:bg-blue-100",
    "bg-indigo-50 border-indigo-200 hover:bg-indigo-100",
    "bg-violet-50 border-violet-200 hover:bg-violet-100",
    "bg-purple-50 border-purple-200 hover:bg-purple-100",
    "bg-fuchsia-50 border-fuchsia-200 hover:bg-fuchsia-100",
    "bg-pink-50 border-pink-200 hover:bg-pink-100",
    "bg-rose-50 border-rose-200 hover:bg-rose-100",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export default function Calendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [records, setRecords] = useState([]);
  const [machines, setMachines] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [user, setUser] = useState(null);
  const [draggedRecord, setDraggedRecord] = useState(null);
  const [dragOverDate, setDragOverDate] = useState(null);
  const [bookingDialog, setBookingDialog] = useState(null); // { date, record? }
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [view, setView] = useState("calendar"); // "calendar" | "queue"

  const load = async () => {
    const u = await base44.auth.me();
    setUser(u);
    const [r, m, c] = await Promise.all([
      base44.entities.ServiceRecord.list("-service_date"),
      base44.entities.Machine.list(),
      base44.entities.Customer.list(),
    ]);
    setRecords(r);
    setMachines(m);
    setCustomers(c);
  };

  useEffect(() => { load(); }, []);

  const getMachine = (id) => machines.find(m => m.id === id);
  const getCustomer = (id) => customers.find(c => c.id === id);

  const calStart = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 });
  const calEnd = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const recordsByDate = {};
  records.forEach(r => {
    if (r.service_date) {
      const key = r.service_date.split("T")[0];
      if (!recordsByDate[key]) recordsByDate[key] = [];
      recordsByDate[key].push(r);
    }
  });

  const pendingRecords = records.filter(r => r.status === "pending");
  const myRecords = user?.full_name
    ? records.filter(r => r.technician_name === user.full_name && r.service_date)
    : records.filter(r => r.service_date);

  const handleDrop = async (date) => {
    if (!draggedRecord) return;
    const dateStr = format(date, "yyyy-MM-dd");
    await base44.entities.ServiceRecord.update(draggedRecord.id, {
      service_date: dateStr,
      status: draggedRecord.status === "pending" ? "in_progress" : draggedRecord.status,
    });
    setDraggedRecord(null);
    setDragOverDate(null);
    load();
  };

  const handleSave = async (data) => {
    if (editing) {
      await base44.entities.ServiceRecord.update(editing.id, data);
    } else {
      await base44.entities.ServiceRecord.create(data);
    }
    setShowForm(false);
    setEditing(null);
    load();
  };

  const handleBookingConfirm = async ({ record, date, technicianName }) => {
    if (record) {
      await base44.entities.ServiceRecord.update(record.id, {
        service_date: date,
        technician_name: technicianName || record.technician_name,
        status: record.status === "pending" ? "in_progress" : record.status,
      });
    }
    setBookingDialog(null);
    load();
  };

  return (
    <div className="flex h-[calc(100vh-57px)] overflow-hidden">
      {/* Sidebar: queue */}
      <aside className="w-72 border-r bg-white flex flex-col overflow-hidden hidden lg:flex">
        <div className="p-4 border-b">
          <div className="flex items-center gap-2 mb-1">
            <Inbox className="w-4 h-4 text-slate-500" />
            <span className="font-semibold text-slate-800 text-sm">Ärendekö</span>
            <Badge className="ml-auto bg-yellow-100 text-yellow-800 text-xs">{pendingRecords.length}</Badge>
          </div>
          <p className="text-xs text-slate-400">Dra ett ärende till ett datum för att boka in det</p>
        </div>
        <PendingQueue
          records={pendingRecords}
          machines={machines}
          customers={customers}
          onDragStart={setDraggedRecord}
          onBook={(r) => setBookingDialog({ record: r })}
        />
      </aside>

      {/* Main calendar */}
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
        {/* Header */}
        <div className="bg-white border-b px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CalendarDays className="w-5 h-5 text-slate-500" />
            <h1 className="text-lg font-bold text-slate-800">Servicekalender</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="font-semibold text-slate-700 w-36 text-center capitalize">
              {format(currentMonth, "MMMM yyyy", { locale: sv })}
            </span>
            <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(new Date())} className="text-xs text-slate-500">Idag</Button>
            <Button
              size="sm"
              className="bg-[#1b3a3a] hover:bg-[#254f4f] text-white ml-2"
              onClick={() => { setEditing(null); setShowForm(true); }}
            >
              <Plus className="w-3 h-3 mr-1" /> Nytt ärende
            </Button>
          </div>
        </div>

        {/* Mobile queue toggle */}
        <div className="lg:hidden px-4 pt-3 flex gap-2">
          <Button size="sm" variant={view === "calendar" ? "default" : "outline"} onClick={() => setView("calendar")}>
            Kalender
          </Button>
          <Button size="sm" variant={view === "queue" ? "default" : "outline"} onClick={() => setView("queue")}>
            Ärendekö <Badge className="ml-1 bg-yellow-100 text-yellow-800">{pendingRecords.length}</Badge>
          </Button>
        </div>

        {view === "queue" && (
          <div className="lg:hidden flex-1 overflow-auto bg-white">
            <PendingQueue
              records={pendingRecords}
              machines={machines}
              customers={customers}
              onDragStart={setDraggedRecord}
              onBook={(r) => setBookingDialog({ record: r })}
            />
          </div>
        )}

        {view === "calendar" && (
          <div className="flex-1 overflow-auto p-4">
            {/* Desktop Calendar View */}
            <div className="hidden md:block">
              {/* Weekday headers */}
              <div className="grid grid-cols-7 mb-1">
                {["Mån", "Tis", "Ons", "Tor", "Fre", "Lör", "Sön"].map(d => (
                  <div key={d} className="text-center text-xs font-semibold text-slate-400 py-2">{d}</div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1">
              {days.map(day => {
                const key = format(day, "yyyy-MM-dd");
                const dayRecords = recordsByDate[key] || [];
                const inMonth = isSameMonth(day, currentMonth);
                const isOver = dragOverDate && isSameDay(dragOverDate, day);
                const today = isToday(day);

                return (
                  <div
                    key={key}
                    className={cn(
                      "min-h-[160px] rounded-lg p-2 border transition-all cursor-pointer select-none flex flex-col",
                      inMonth ? "bg-white border-slate-200" : "bg-slate-50 border-transparent opacity-50",
                      today && "border-[#3a9e9e] ring-2 ring-[#3a9e9e]/40",
                      isOver && "bg-blue-50 border-blue-400 scale-[1.02]",
                    )}
                    onClick={() => setBookingDialog({ date: key })}
                    onDragOver={(e) => { e.preventDefault(); setDragOverDate(day); }}
                    onDragLeave={() => setDragOverDate(null)}
                    onDrop={(e) => { e.preventDefault(); handleDrop(day); }}
                  >
                    <div className={cn(
                      "text-xs font-semibold mb-1 w-6 h-6 rounded-full flex items-center justify-center",
                      today ? "bg-[#3a9e9e] text-white" : "text-slate-600"
                    )}>
                      {format(day, "d")}
                    </div>
                    <div className="space-y-1 mt-1 flex-1">
                      {dayRecords.slice(0, 4).map(r => {
                        const machine = getMachine(r.machine_id);
                        const customer = getCustomer(r.customer_id);
                        return (
                          <div
                            key={r.id}
                            draggable
                            onDragStart={(e) => { e.stopPropagation(); setDraggedRecord(r); }}
                            onClick={(e) => { e.stopPropagation(); setBookingDialog({ date: key, record: r }); }}
                            className={cn("flex flex-col px-2 py-1.5 rounded border cursor-grab active:cursor-grabbing overflow-hidden transition-colors shadow-sm", getTechnicianColor(r.technician_name))}
                            title={`${customer?.company_name || "Okänd kund"} (${customer?.contact_person || "Ingen kontakt"}) – ${machine?.model || "Maskin"} – ${r.technician_name || "Ingen tekniker"}`}
                          >
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className={cn("w-2 h-2 rounded-full flex-shrink-0", statusColor[r.status])}></span>
                              <span className="font-semibold text-xs truncate text-slate-900 leading-tight">{customer?.company_name || "Okänd kund"}</span>
                            </div>
                            {customer?.contact_person && (
                              <div className="truncate text-slate-500 text-[10px] pl-3.5 leading-tight mb-0.5">👤 {customer.contact_person}</div>
                            )}
                            <div className="truncate text-slate-600 text-[11px] pl-3.5 leading-tight">{machine?.model || "Okänd maskin"}</div>
                          </div>
                        );
                      })}
                      {dayRecords.length > 4 && (
                        <div 
                          className="text-xs font-medium text-slate-500 text-center bg-slate-50 rounded py-0.5 hover:bg-slate-100 cursor-pointer border border-transparent hover:border-slate-200" 
                          onClick={(e) => { e.stopPropagation(); setBookingDialog({ date: key }); }}
                        >
                          +{dayRecords.length - 4} fler
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

              {/* Legend */}
              <div className="mt-4 flex flex-col md:flex-row flex-wrap gap-4 justify-between bg-white p-3 rounded-lg border border-slate-200">
                <div className="flex flex-wrap gap-3 items-center">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Tekniker:</div>
                  {[...new Set(Object.values(recordsByDate).flat().map(r => r.technician_name).filter(Boolean))].map(tech => (
                    <div key={tech} className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
                      <span className={cn("w-3.5 h-3.5 rounded border", getTechnicianColor(tech))}></span>{tech}
                    </div>
                  ))}
                  {Object.values(recordsByDate).flat().some(r => !r.technician_name) && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
                      <span className={cn("w-3.5 h-3.5 rounded border", getTechnicianColor(null))}></span>Odelade
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-3 items-center">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Status:</div>
                  {Object.entries(statusLabel).map(([k, v]) => (
                    <div key={k} className="flex items-center gap-1.5 text-xs text-slate-600">
                      <span className={cn("w-2.5 h-2.5 rounded-full", statusColor[k])}></span>{v}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Mobile Agenda View */}
            <div className="md:hidden space-y-4 pb-4">
              {days.filter(day => isSameMonth(day, currentMonth) && (recordsByDate[format(day, "yyyy-MM-dd")] || []).length > 0).length === 0 ? (
                <div className="text-center py-12 text-slate-400 bg-white rounded-xl border border-slate-200">
                  <CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Inga inbokade ärenden denna månad</p>
                </div>
              ) : (
                days.filter(day => isSameMonth(day, currentMonth) && (recordsByDate[format(day, "yyyy-MM-dd")] || []).length > 0).map(day => {
                  const key = format(day, "yyyy-MM-dd");
                  const dayRecords = recordsByDate[key] || [];
                  const today = isToday(day);
                  
                  return (
                    <div key={key} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                      <div className={cn("px-4 py-2 border-b flex items-center justify-between", today ? "bg-[#3a9e9e]/10 border-[#3a9e9e]/20" : "bg-slate-50 border-slate-100")}>
                        <span className={cn("font-medium capitalize", today ? "text-[#1b3a3a]" : "text-slate-700")}>
                          {format(day, "EEEE d MMMM", { locale: sv })}
                        </span>
                        {today && <Badge variant="outline" className="bg-white text-[#3a9e9e] border-[#3a9e9e]">Idag</Badge>}
                      </div>
                      <div className="divide-y divide-slate-100">
                        {dayRecords.map(r => {
                          const machine = getMachine(r.machine_id);
                          const customer = getCustomer(r.customer_id);
                          return (
                            <div 
                              key={r.id} 
                              className={cn("p-4 cursor-pointer transition-colors border-b last:border-b-0", getTechnicianColor(r.technician_name))}
                              onClick={() => setBookingDialog({ date: key, record: r })}
                            >
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <div className="flex items-center gap-2 font-medium text-slate-900">
                                  <span className={cn("w-3 h-3 rounded-full flex-shrink-0", statusColor[r.status])}></span>
                                  <span className="truncate">{machine?.model || "Okänd maskin"}</span>
                                </div>
                                <Badge className="bg-slate-100 text-slate-600 hover:bg-slate-200 border-0 text-[10px] uppercase font-mono">{machine?.serial_number || "SN saknas"}</Badge>
                              </div>
                              <div className="text-sm text-slate-600 pl-5 space-y-1">
                                <div className="font-medium">
                                  {customer?.company_name || "Okänd kund"}
                                  {customer?.contact_person && <span className="font-normal text-slate-500 ml-1">({customer.contact_person})</span>}
                                </div>
                                <div className="text-xs text-slate-500">Tekniker: {r.technician_name || "Ej angiven"}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Booking dialog */}
      {bookingDialog && (
        <BookingDialog
          date={bookingDialog.date}
          record={bookingDialog.record}
          records={records}
          machines={machines}
          customers={customers}
          onConfirm={handleBookingConfirm}
          onUnschedule={async (r) => {
            await base44.entities.ServiceRecord.update(r.id, {
              service_date: "",
              technician_name: "",
              status: "pending"
            });
            setBookingDialog(null);
            load();
          }}
          onClose={() => setBookingDialog(null)}
          onEdit={(r) => { setBookingDialog(null); setEditing(r); setShowForm(true); }}
        />
      )}

      {/* New/edit form */}
      {showForm && (
        <ServiceRecordForm
          record={editing}
          machines={machines}
          customers={customers}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditing(null); }}
        />
      )}
    </div>
  );
}