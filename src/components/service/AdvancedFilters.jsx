import { useState, useEffect } from "react";
import { Filter, Save, Trash2, ChevronDown, ChevronUp, BookmarkCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

const STORAGE_KEY = "servicerecords_saved_filters";

function loadSavedFilters() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
}
function saveSavedFilters(filters) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
}

export default function AdvancedFilters({ filters, onChange, customers, machines, technicians }) {
  const [open, setOpen] = useState(false);
  const [savedFilters, setSavedFilters] = useState(loadSavedFilters);
  const [saveLabel, setSaveLabel] = useState("");
  const [showSaveInput, setShowSaveInput] = useState(false);

  const currentYear = new Date().getFullYear();
  const availableYears = [...new Set(
    machines.flatMap ? [] : []
  )];

  // Count active filters (non-default)
  const activeCount = [
    filters.status !== "all",
    filters.type !== "all",
    filters.customer !== "all",
    filters.machine !== "all",
    filters.technician !== "all",
    filters.dateFrom !== "",
    filters.dateTo !== "",
    filters.minCost !== "",
    filters.maxCost !== "",
    filters.sortBy !== "date_desc",
  ].filter(Boolean).length;

  function applyFilter(f) {
    onChange({ ...filters, ...f });
  }

  function resetAll() {
    onChange({
      status: "all",
      type: "all",
      customer: "all",
      machine: "all",
      technician: "all",
      dateFrom: "",
      dateTo: "",
      minCost: "",
      maxCost: "",
      sortBy: "date_desc",
    });
  }

  function handleSave() {
    if (!saveLabel.trim()) return;
    const updated = [...savedFilters, { label: saveLabel.trim(), filters: { ...filters } }];
    setSavedFilters(updated);
    saveSavedFilters(updated);
    setSaveLabel("");
    setShowSaveInput(false);
  }

  function handleDeleteSaved(idx) {
    const updated = savedFilters.filter((_, i) => i !== idx);
    setSavedFilters(updated);
    saveSavedFilters(updated);
  }

  const customerMachines = filters.customer !== "all"
    ? machines.filter(m => m.customer_id === filters.customer)
    : machines;

  return (
    <div className="space-y-2">
      {/* Saved filters row */}
      {savedFilters.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-slate-400 flex items-center gap-1"><BookmarkCheck className="w-3 h-3" /> Sparade:</span>
          {savedFilters.map((sf, i) => (
            <div key={i} className="flex items-center gap-0.5">
              <button
                onClick={() => onChange({ ...filters, ...sf.filters })}
                className="text-xs px-2 py-1 rounded-l-md bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200 border-r-0 transition-colors"
              >
                {sf.label}
              </button>
              <button
                onClick={() => handleDeleteSaved(i)}
                className="text-xs px-1.5 py-1 rounded-r-md bg-teal-50 text-teal-400 hover:bg-red-50 hover:text-red-500 border border-teal-200 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Filter toggle bar */}
      <div className="flex flex-wrap gap-2 items-center">
        <button
          onClick={() => setOpen(o => !o)}
          className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors text-slate-600"
        >
          <Filter className="w-4 h-4" />
          Avancerade filter
          {activeCount > 0 && (
            <span className="ml-1 bg-teal-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">{activeCount}</span>
          )}
          {open ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
        </button>

        {activeCount > 0 && (
          <button onClick={resetAll} className="text-xs text-slate-400 hover:text-red-500 flex items-center gap-1 transition-colors">
            <X className="w-3 h-3" /> Rensa filter
          </button>
        )}

        {/* Sort - always visible */}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-slate-400">Sortera:</span>
          <Select value={filters.sortBy} onValueChange={v => applyFilter({ sortBy: v })}>
            <SelectTrigger className="h-8 text-sm w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date_desc">Datum (nyast först)</SelectItem>
              <SelectItem value="date_asc">Datum (äldst först)</SelectItem>
              <SelectItem value="cost_desc">Kostnad (högst först)</SelectItem>
              <SelectItem value="cost_asc">Kostnad (lägst först)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Expanded filters */}
      {open && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Status */}
            <div>
              <div className="text-xs text-slate-400 mb-1">Status</div>
              <Select value={filters.status} onValueChange={v => applyFilter({ status: v })}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alla statuser</SelectItem>
                  <SelectItem value="pending">Väntar</SelectItem>
                  <SelectItem value="awaiting_approval">Inväntar godkännande</SelectItem>
                  <SelectItem value="in_progress">Pågående</SelectItem>
                  <SelectItem value="completed">Slutförd</SelectItem>
                  <SelectItem value="invoiced">Fakturerad</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Type */}
            <div>
              <div className="text-xs text-slate-400 mb-1">Servicetyp</div>
              <Select value={filters.type} onValueChange={v => applyFilter({ type: v })}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alla typer</SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="advanced">Avancerad</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Customer */}
            <div>
              <div className="text-xs text-slate-400 mb-1">Kund</div>
              <Select value={filters.customer} onValueChange={v => applyFilter({ customer: v, machine: "all" })}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alla kunder</SelectItem>
                  {customers.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Machine */}
            <div>
              <div className="text-xs text-slate-400 mb-1">Maskin</div>
              <Select value={filters.machine} onValueChange={v => applyFilter({ machine: v })}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alla maskiner</SelectItem>
                  {customerMachines.map(m => (
                    <SelectItem key={m.id} value={m.id}>{m.model} · {m.serial_number}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Technician */}
            <div>
              <div className="text-xs text-slate-400 mb-1">Tekniker</div>
              <Select value={filters.technician} onValueChange={v => applyFilter({ technician: v })}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alla tekniker</SelectItem>
                  {technicians.map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date from */}
            <div>
              <div className="text-xs text-slate-400 mb-1">Servicedatum från</div>
              <input
                type="date"
                className="h-8 text-sm w-full border border-input rounded-md px-2 bg-background"
                value={filters.dateFrom}
                onChange={e => applyFilter({ dateFrom: e.target.value })}
              />
            </div>

            {/* Date to */}
            <div>
              <div className="text-xs text-slate-400 mb-1">Servicedatum till</div>
              <input
                type="date"
                className="h-8 text-sm w-full border border-input rounded-md px-2 bg-background"
                value={filters.dateTo}
                onChange={e => applyFilter({ dateTo: e.target.value })}
              />
            </div>

            {/* Cost range */}
            <div>
              <div className="text-xs text-slate-400 mb-1">Kostnad (kr)</div>
              <div className="flex gap-1">
                <input
                  type="number"
                  placeholder="Min"
                  className="h-8 text-sm w-full border border-input rounded-md px-2 bg-background"
                  value={filters.minCost}
                  onChange={e => applyFilter({ minCost: e.target.value })}
                />
                <input
                  type="number"
                  placeholder="Max"
                  className="h-8 text-sm w-full border border-input rounded-md px-2 bg-background"
                  value={filters.maxCost}
                  onChange={e => applyFilter({ maxCost: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Save filter */}
          <div className="border-t border-slate-100 pt-3 flex items-center gap-2">
            {!showSaveInput ? (
              <button
                onClick={() => setShowSaveInput(true)}
                className="text-xs text-teal-600 hover:text-teal-800 flex items-center gap-1 transition-colors"
              >
                <Save className="w-3 h-3" /> Spara denna filterkombination
              </button>
            ) : (
              <>
                <Input
                  className="h-7 text-sm w-48"
                  placeholder="Namn på filter..."
                  value={saveLabel}
                  onChange={e => setSaveLabel(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSave()}
                  autoFocus
                />
                <Button size="sm" className="h-7 text-xs astomed-btn-primary" onClick={handleSave} disabled={!saveLabel.trim()}>
                  Spara
                </Button>
                <button onClick={() => { setShowSaveInput(false); setSaveLabel(""); }} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}