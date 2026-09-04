import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, User, Save, RefreshCw, Cpu, Monitor, Building2 } from "lucide-react";
import { getISOWeek, format, parseISO, startOfMonth, endOfMonth, addMonths, subMonths, isSameMonth, startOfWeek, endOfWeek } from "date-fns";
import { sv } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

export default function MonthlyPlanning() {
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const [loading, setLoading] = useState(true);
  const [planningData, setPlanningData] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  
  // Local state for inline edits before saving
  const [edits, setEdits] = useState({});

  const fetchData = async () => {
    setLoading(true);
    try {
      const [machines, records, users, customers] = await Promise.all([
        base44.entities.Machine.list(null, 1000),
        base44.entities.ServiceRecord.filter({
          status: { $in: ["planned", "pending"] }
        }, null, 1000),
        base44.entities.User.filter({ role: { $in: ["admin", "technician"] } }),
        base44.entities.Customer.list(null, 1000)
      ]);

      const customerMap = customers.reduce((acc, c) => ({ ...acc, [c.id]: c.company_name }), {});

      setTechnicians(users.map(u => ({ id: u.id, name: u.full_name || u.email })));

      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(currentMonth);

      const items = [];

      for (const machine of machines) {
        if (!machine.service_date || machine.service_date.trim() === "") continue;

        // Check if there's a pending/planned record for this machine
        const existingRecord = records.find(r => r.machine_id === machine.id);

        let plannedDate = null;
        let recordId = null;
        let assignedTech = "";
        let isProjection = false;

        if (existingRecord && existingRecord.service_date) {
          plannedDate = new Date(existingRecord.service_date);
          recordId = existingRecord.id;
          assignedTech = existingRecord.technician_name || "";
        } else {
          // Calculate projection: service_date + interval (default 12 months if missing)
          const interval = Number(machine.service_interval) || 12;
          const lastService = new Date(machine.service_date);
          plannedDate = new Date(lastService);
          plannedDate.setMonth(plannedDate.getMonth() + interval);
          isProjection = true;
        }

        // Only include if it falls in the current month
        if (plannedDate >= monthStart && plannedDate <= monthEnd) {
          items.push({
            id: recordId || `proj_${machine.id}`,
            machine_id: machine.id,
            record_id: recordId,
            customer_name: customerMap[machine.customer_id] || "Okänd kund",
            customer_id: machine.customer_id,
            machine_model: machine.model,
            serial_number: machine.serial_number,
            planned_date: plannedDate,
            assigned_tech: assignedTech,
            is_projection: isProjection,
            original_date: plannedDate
          });
        }
      }

      setPlanningData(items);
      setEdits({});
    } catch (err) {
      console.error(err);
      toast.error("Kunde inte hämta planeringsdata");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentMonth]);

  const handleMonthChange = (dir) => {
    setCurrentMonth(prev => dir === "next" ? addMonths(prev, 1) : subMonths(prev, 1));
  };

  const handleEdit = (id, field, value) => {
    setEdits(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value
      }
    }));
  };

  const saveItem = async (item) => {
    const edit = edits[item.id];
    if (!edit) return;

    try {
      const newDate = edit.planned_date || item.planned_date;
      const newTech = edit.assigned_tech !== undefined ? edit.assigned_tech : item.assigned_tech;

      if (item.is_projection) {
        // Create new record
        const newRecord = await base44.entities.ServiceRecord.create({
          machine_id: item.machine_id,
          customer_id: item.customer_id,
          service_type: "standard",
          service_date: format(newDate, "yyyy-MM-dd"),
          status: "planned",
          technician_name: newTech
        });
        
        // Update local state to reflect it's no longer a projection
        setPlanningData(prev => prev.map(p => p.id === item.id ? {
          ...p,
          id: newRecord.id,
          record_id: newRecord.id,
          planned_date: newDate,
          assigned_tech: newTech,
          is_projection: false
        } : p));
        toast.success("Service inplanerad");
      } else {
        // Update existing record
        await base44.entities.ServiceRecord.update(item.record_id, {
          service_date: format(newDate, "yyyy-MM-dd"),
          technician_name: newTech
        });
        setPlanningData(prev => prev.map(p => p.id === item.id ? {
          ...p,
          planned_date: newDate,
          assigned_tech: newTech
        } : p));
        toast.success("Ändringar sparade");
      }
      
      // Clear edit state for this item
      setEdits(prev => {
        const next = { ...prev };
        delete next[item.id];
        return next;
      });

    } catch (err) {
      toast.error("Kunde inte spara");
    }
  };

  // Apply edits to items for grouping/display
  const displayItems = planningData.map(item => {
    const edit = edits[item.id] || {};
    return {
      ...item,
      display_date: edit.planned_date || item.planned_date,
      display_tech: edit.assigned_tech !== undefined ? edit.assigned_tech : item.assigned_tech,
      has_edits: !!edits[item.id]
    };
  });

  // Re-filter if someone moved a date OUT of the current month?
  // We'll still show it in its calculated week, but it might jump to a week outside.
  // We'll let it be grouped by its new week.

  const grouped = displayItems.reduce((acc, item) => {
    const d = item.display_date;
    const weekNo = getISOWeek(d);
    if (!acc[weekNo]) {
      const wStart = startOfWeek(d, { weekStartsOn: 1 });
      const wEnd = endOfWeek(d, { weekStartsOn: 1 });
      acc[weekNo] = {
        week: weekNo,
        start: wStart,
        end: wEnd,
        items: []
      };
    }
    acc[weekNo].items.push(item);
    return acc;
  }, {});

  const sortedWeeks = Object.values(grouped).sort((a, b) => a.week - b.week);
  sortedWeeks.forEach(w => w.items.sort((a, b) => a.display_date - b.display_date));

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold astomed-title flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-slate-500" />
            Månadsplanering
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Översikt över kommande och projicerade servicar
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white rounded-lg p-1 border shadow-sm">
          <Button variant="ghost" size="icon" onClick={() => handleMonthChange("prev")}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="px-4 font-semibold min-w-[140px] text-center capitalize">
            {format(currentMonth, "MMMM yyyy", { locale: sv })}
          </div>
          <Button variant="ghost" size="icon" onClick={() => handleMonthChange("next")}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading} className="ml-2 gap-2">
            <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
            Uppdatera
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">Laddar planeringsunderlag...</div>
      ) : sortedWeeks.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed text-slate-500">
          <CalendarIcon className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p>Inga servicar infaller under {format(currentMonth, "MMMM", { locale: sv })}.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {sortedWeeks.map((weekGroup) => (
            <div key={weekGroup.week} className="bg-white rounded-xl border shadow-sm overflow-hidden">
              <div className="bg-slate-50 px-4 py-3 border-b flex justify-between items-center">
                <div className="font-semibold flex items-center gap-2">
                  <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded text-sm">V. {weekGroup.week}</span>
                  <span className="text-sm text-slate-500">
                    {format(weekGroup.start, "d MMM", { locale: sv })} - {format(weekGroup.end, "d MMM", { locale: sv })}
                  </span>
                </div>
                <Badge variant="outline" className="bg-white">{weekGroup.items.length} st</Badge>
              </div>

              <div className="divide-y">
                {weekGroup.items.map(item => (
                  <div key={item.id} className={cn("p-4 flex flex-col md:flex-row gap-4 items-start md:items-center transition-colors", item.is_projection ? "bg-white" : "bg-blue-50/30")}>
                    
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-slate-900 truncate">{item.customer_name}</span>
                        {item.is_projection && (
                          <Badge variant="secondary" className="text-[10px] bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200">Projicerad</Badge>
                        )}
                        {!item.is_projection && (
                          <Badge variant="secondary" className="text-[10px] bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200">Planerad</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-600">
                        <span className="flex items-center gap-1.5"><Cpu className="w-3.5 h-3.5 text-slate-400" /> {item.machine_model}</span>
                        <span className="flex items-center gap-1.5"><Monitor className="w-3.5 h-3.5 text-slate-400" /> {item.serial_number}</span>
                      </div>
                    </div>

                    {/* Edit Controls */}
                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                      
                      {/* Date Picker */}
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className={cn("w-[140px] justify-start text-left font-normal h-9", item.has_edits && edits[item.id]?.planned_date && "border-blue-300 bg-blue-50")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {item.display_date ? format(item.display_date, "d MMM yyyy", { locale: sv }) : "Välj datum"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                          <Calendar
                            mode="single"
                            selected={item.display_date}
                            onSelect={(d) => d && handleEdit(item.id, "planned_date", d)}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>

                      {/* Tech Select */}
                      <Select 
                        value={item.display_tech || "unassigned"} 
                        onValueChange={(v) => handleEdit(item.id, "assigned_tech", v === "unassigned" ? "" : v)}
                      >
                        <SelectTrigger className={cn("w-[160px] h-9", item.has_edits && edits[item.id]?.assigned_tech !== undefined && "border-blue-300 bg-blue-50")}>
                          <SelectValue placeholder="Välj tekniker" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unassigned" className="text-slate-400 italic">Otildeald</SelectItem>
                          {technicians.map(t => (
                            <SelectItem key={t.name} value={t.name}>{t.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {/* Save Button */}
                      <Button 
                        size="sm" 
                        onClick={() => saveItem(item)}
                        disabled={!item.has_edits}
                        className={cn("h-9 px-3 transition-opacity", item.has_edits ? "opacity-100" : "opacity-0 pointer-events-none")}
                      >
                        <Save className="w-4 h-4 mr-1.5" /> Spara
                      </Button>

                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}