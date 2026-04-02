import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { CheckCircle2, Circle, Clock, Building2, User, UserCheck } from "lucide-react";
import { format, isPast, isToday, isTomorrow } from "date-fns";
import { sv } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [customers, setCustomers] = useState({});
  const [leads, setLeads] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [t, cList, lList] = await Promise.all([
        base44.entities.Task.list(),
        base44.entities.Customer.list(),
        base44.entities.ServiceContractLead.list()
      ]);
      
      const cMap = {};
      cList.forEach(c => cMap[c.id] = c);
      setCustomers(cMap);

      const lMap = {};
      lList.forEach(l => lMap[l.id] = l);
      setLeads(lMap);

      const sortedTasks = t.sort((a, b) => {
        if (a.status === "pending" && b.status === "pending") {
          return new Date(a.due_date || a.created_date).getTime() - new Date(b.due_date || b.created_date).getTime();
        }
        if (a.status === "completed" && b.status === "completed") {
          return new Date(b.updated_date || b.created_date).getTime() - new Date(a.updated_date || a.created_date).getTime();
        }
        return a.status === "pending" ? -1 : 1;
      });

      setTasks(sortedTasks);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleStatus = async (task) => {
    const newStatus = task.status === "completed" ? "pending" : "completed";
    await base44.entities.Task.update(task.id, { status: newStatus });
    fetchData();
  };

  const filteredTasks = tasks.filter(t => filter === "all" || t.status === filter);

  const getDueDateLabel = (dateStr) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    
    // Check if it's today, tomorrow, or past using date parts (ignoring time)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    
    if (d.getTime() === today.getTime()) {
      return <Badge variant="destructive" className="bg-amber-500 hover:bg-amber-500 border-0">Idag</Badge>;
    }
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (d.getTime() === tomorrow.getTime()) {
      return <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-0">Imorgon</Badge>;
    }
    
    if (d.getTime() < today.getTime()) {
      return <Badge variant="destructive" className="bg-red-500 hover:bg-red-600 border-0">Försenad</Badge>;
    }
    
    return <span className="text-sm text-slate-500">{format(date, "d MMM yyyy", { locale: sv })}</span>;
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Uppföljningar (To-Do)</h1>
          <p className="text-slate-500 text-sm">Hantera dina uppföljningar och aktiviteter</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[200px] bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">⏳ Aktuella uppgifter</SelectItem>
              <SelectItem value="completed">✅ Slutförda</SelectItem>
              <SelectItem value="all">📋 Alla uppgifter</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">Laddar uppgifter...</div>
      ) : filteredTasks.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
          <CheckCircle2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-slate-900">Inga uppgifter</h3>
          <p className="text-slate-500 mt-1">Du har inga {filter === "pending" ? "aktuella" : ""} uppföljningar för tillfället.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 divide-y divide-slate-100">
          {filteredTasks.map(task => {
            const customer = task.customer_id ? customers[task.customer_id] : null;
            const lead = task.lead_id ? leads[task.lead_id] : null;
            const isCompleted = task.status === "completed";

            return (
              <div key={task.id} className={`p-4 flex gap-4 transition-colors hover:bg-slate-50 ${isCompleted ? "opacity-60 bg-slate-50/50" : ""}`}>
                <button 
                  onClick={() => handleToggleStatus(task)}
                  className="mt-1 flex-shrink-0 text-slate-400 hover:text-emerald-600 transition-colors"
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                  ) : (
                    <Circle className="w-6 h-6" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                    <h3 className={`font-semibold text-base ${isCompleted ? "line-through text-slate-500" : "text-slate-900"}`}>
                      {task.title}
                    </h3>
                    {!isCompleted && (
                      <div className="flex items-center gap-2">
                        {getDueDateLabel(task.due_date)}
                      </div>
                    )}
                  </div>
                  
                  {task.description && (
                    <p className="text-sm text-slate-600 mb-3 whitespace-pre-wrap break-words max-w-3xl">
                      {task.description}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    {customer && (
                      <Link to={createPageUrl(`CustomerDetails?id=${customer.id}`)} className="flex items-center gap-1 hover:text-blue-600">
                        <Building2 className="w-3.5 h-3.5" />
                        {customer.company_name}
                      </Link>
                    )}
                    {lead && !customer && (
                      <Link to={createPageUrl(`ServiceContractLeads?status=all`)} className="flex items-center gap-1 hover:text-indigo-600">
                        <User className="w-3.5 h-3.5" />
                        Prospekt: {lead.company_name || lead.contact_person || lead.email}
                      </Link>
                    )}
                    {task.assigned_to && (
                      <div className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                        <UserCheck className="w-3 h-3" />
                        {task.assigned_to}
                      </div>
                    )}
                    {isCompleted && task.updated_date && (
                      <div className="flex items-center gap-1 text-emerald-600 font-medium">
                        Slutförd {format(new Date(task.updated_date), "d MMM yyyy", { locale: sv })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}