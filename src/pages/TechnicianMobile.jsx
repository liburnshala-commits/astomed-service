import { useState, useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import {
  Wrench, CheckCircle, Clock, ArrowRight, Search, RefreshCw,
  WifiOff, Wifi, ChevronDown, ChevronUp, Camera, FileText,
  MapPin, Phone, User, Monitor, AlertCircle, Plus, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import MobileTechnicianCard from "../components/service/MobileTechnicianCard.jsx";
import PullToRefresh from "@/components/ui/pull-to-refresh.jsx";

const statusColor = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  awaiting_approval: "bg-orange-100 text-orange-800 border-orange-200",
  in_progress: "bg-blue-100 text-blue-800 border-blue-200",
  completed: "bg-green-100 text-green-800 border-green-200",
  invoiced: "bg-purple-100 text-purple-800 border-purple-200",
};
const statusLabel = {
  pending: "Väntar",
  awaiting_approval: "Inv. godkänn.",
  in_progress: "Pågående",
  completed: "Slutförd",
  invoiced: "Fakturerad",
};

const OFFLINE_KEY = "techapp_offline_updates";

function loadOfflineQueue() {
  try { return JSON.parse(localStorage.getItem(OFFLINE_KEY) || "[]"); } catch { return []; }
}
function saveOfflineQueue(q) {
  localStorage.setItem(OFFLINE_KEY, JSON.stringify(q));
}

export default function TechnicianMobile() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("active");
  const [online, setOnline] = useState(navigator.onLine);
  const [offlineQueue, setOfflineQueue] = useState(loadOfflineQueue);
  const [syncing, setSyncing] = useState(false);

  // Online/offline detection
  useEffect(() => {
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    return () => { window.removeEventListener("online", up); window.removeEventListener("offline", down); };
  }, []);

  const { data: user } = useQuery({
    queryKey: ["me"],
    queryFn: () => base44.auth.me(),
    staleTime: 5 * 60 * 1000,
    retry: 3,
  });

  const { data: rawData, isLoading: loading, dataUpdatedAt } = useQuery({
    queryKey: ["technicianData"],
    queryFn: async () => {
      if (!navigator.onLine) {
        try {
          const cached = JSON.parse(localStorage.getItem("techapp_cache") || "null");
          if (cached) return cached;
        } catch {}
        return { records: [], machines: [], customers: [] };
      }
      const u = user || await base44.auth.me();
      const [r, m, c] = await Promise.all([
        base44.entities.ServiceRecord.list("-service_date", 200),
        base44.entities.Machine.list(),
        base44.entities.Customer.list(),
      ]);
      const myRecords = u?.role === "technician"
        ? r.filter(rec => rec.technician_name === u.full_name || rec.created_by === u.email)
        : r;
      const result = { records: myRecords, machines: m, customers: c, user: u };
      localStorage.setItem("techapp_cache", JSON.stringify(result));
      return result;
    },
    enabled: !!user,
    staleTime: 30 * 1000,
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
    placeholderData: () => {
      try {
        return JSON.parse(localStorage.getItem("techapp_cache") || "null");
      } catch { return null; }
    },
  });

  const records = rawData?.records || [];
  const machines = rawData?.machines || [];
  const customers = rawData?.customers || [];
  const lastSync = dataUpdatedAt ? new Date(dataUpdatedAt) : null;

  const load = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["technicianData"] });
  }, [queryClient]);

  // Sync offline queue when coming back online
  useEffect(() => {
    if (online && offlineQueue.length > 0) {
      syncOfflineQueue();
    }
  }, [online]);

  async function syncOfflineQueue() {
    if (offlineQueue.length === 0) return;
    setSyncing(true);
    const remaining = [];
    for (const item of offlineQueue) {
      try {
        await base44.entities.ServiceRecord.update(item.id, item.data);
      } catch {
        remaining.push(item);
      }
    }
    setOfflineQueue(remaining);
    saveOfflineQueue(remaining);
    setSyncing(false);
    if (remaining.length === 0) await load();
  }

  async function handleStatusUpdate(record, newStatus) {
    const update = { status: newStatus };
    // Optimistic update in cache
    queryClient.setQueryData(["technicianData"], (old) => {
      if (!old) return old;
      return { ...old, records: old.records.map(r => r.id === record.id ? { ...r, status: newStatus } : r) };
    });
    if (navigator.onLine) {
      await base44.entities.ServiceRecord.update(record.id, update);
    } else {
      // Queue for later
      const queue = [...offlineQueue.filter(q => q.id !== record.id), { id: record.id, data: update }];
      setOfflineQueue(queue);
      saveOfflineQueue(queue);
    }
  }

  const getMachine = id => machines.find(m => m.id === id);
  const getCustomer = id => customers.find(c => c.id === id);

  const filtered = records.filter(r => {
    const machine = getMachine(r.machine_id);
    const customer = getCustomer(r.customer_id);
    const q = search.toLowerCase();
    if (q && !(
      machine?.model?.toLowerCase().includes(q) ||
      machine?.serial_number?.toLowerCase().includes(q) ||
      customer?.company_name?.toLowerCase().includes(q) ||
      r.description?.toLowerCase().includes(q)
    )) return false;
    if (filterStatus === "active") return ["pending", "in_progress", "awaiting_approval"].includes(r.status);
    if (filterStatus !== "all") return r.status === filterStatus;
    return true;
  });

  return (
    <PullToRefresh onRefresh={load}>
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-lg font-bold text-slate-900">Mina ärenden</h1>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                {online ? (
                  <><Wifi className="w-3 h-3 text-green-500" /> Online{lastSync && ` · Synkad ${format(lastSync, "HH:mm")}`}</>
                ) : (
                  <><WifiOff className="w-3 h-3 text-orange-500 animate-pulse" /> Offline-läge</>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {offlineQueue.length > 0 && (
                <button
                  onClick={syncOfflineQueue}
                  disabled={!online || syncing}
                  className="flex items-center gap-1 text-xs bg-orange-50 text-orange-600 border border-orange-200 rounded-lg px-2 py-1.5"
                >
                  <RefreshCw className={`w-3 h-3 ${syncing ? "animate-spin" : ""}`} />
                  {offlineQueue.length} väntar
                </button>
              )}
              <button
                onClick={load}
                disabled={!online || loading}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="search"
              placeholder="Sök maskin, kund, serienummer..."
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-100 rounded-xl border-0 focus:outline-none focus:ring-2 focus:ring-teal-400"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Status tabs */}
          <div className="flex gap-1">
            {[
              { value: "active", label: "Aktiva" },
              { value: "completed", label: "Slutförda" },
              { value: "all", label: "Alla" },
            ].map(tab => (
              <button
                key={tab.value}
                onClick={() => setFilterStatus(tab.value)}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  filterStatus === tab.value
                    ? "bg-teal-700 text-white"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                }`}
              >
                {tab.label}
                {tab.value === "active" && records.filter(r => ["pending", "in_progress", "awaiting_approval"].includes(r.status)).length > 0 && (
                  <span className="ml-1 bg-white/30 rounded-full text-xs px-1">
                    {records.filter(r => ["pending", "in_progress", "awaiting_approval"].includes(r.status)).length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-3 space-y-3">
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin mb-3" />
            <p className="text-sm">Laddar ärenden...</p>
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Wrench className="w-10 h-10 mb-3 opacity-40" />
            <p className="text-sm font-medium">Inga ärenden hittades</p>
          </div>
        )}

        {!loading && filtered.map(record => (
          <MobileTechnicianCard
            key={record.id}
            record={record}
            machine={getMachine(record.machine_id)}
            customer={getCustomer(record.customer_id)}
            onStatusUpdate={handleStatusUpdate}
            isOfflinePending={offlineQueue.some(q => q.id === record.id)}
            onReload={load}
          />
        ))}
      </div>

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-200 flex">
        <a href={createPageUrl("ServiceRecords")} className="flex-1 flex flex-col items-center py-3 text-slate-400 hover:text-teal-700 transition-colors">
          <FileText className="w-5 h-5 mb-0.5" />
          <span className="text-xs">Alla ärenden</span>
        </a>
        <div className="flex-1 flex flex-col items-center py-3 text-teal-700">
          <Wrench className="w-5 h-5 mb-0.5" />
          <span className="text-xs font-semibold">Mina ärenden</span>
        </div>
        <a href={createPageUrl("Dashboard")} className="flex-1 flex flex-col items-center py-3 text-slate-400 hover:text-teal-700 transition-colors">
          <Monitor className="w-5 h-5 mb-0.5" />
          <span className="text-xs">Dashboard</span>
        </a>
      </div>
    </div>
    </PullToRefresh>
  );
}