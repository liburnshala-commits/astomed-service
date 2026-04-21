import { useState, useEffect, useRef } from "react";
import { Search, Monitor, Building2, Archive, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

const CLOSED_STATUSES = [
  "sold_machines", "rejected", "no_contract_wanted", 
  "not_interested", "other_service_contract", 
  "wrong_phone", "wrong_email"
];

export default function GlobalSearch() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState({ machines: [], activeLeads: [], closedLeads: [] });
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchTerm.length < 2) {
      setResults({ machines: [], activeLeads: [], closedLeads: [] });
      setIsOpen(false);
      return;
    }

    const searchData = async () => {
      setLoading(true);
      setIsOpen(true);
      try {
        const [machines, leads] = await Promise.all([
          base44.entities.Machine.list(),
          base44.entities.ServiceContractLead.list()
        ]);

        const s = searchTerm.toLowerCase();

        const filteredMachines = machines.filter(m => 
          m.serial_number?.toLowerCase().includes(s) || 
          m.model?.toLowerCase().includes(s)
        );

        const filteredLeads = leads.filter(lead => {
          const machineMatch = lead.proposed_machines?.some(m => 
            m.model?.toLowerCase().includes(s) || 
            m.serial_number?.toLowerCase().includes(s)
          ) || false;

          const linkedMachineMatch = lead.machine_ids?.some(id => {
            const m = machines.find(mac => mac.id === id);
            return m?.serial_number?.toLowerCase().includes(s) || m?.model?.toLowerCase().includes(s);
          }) || false;

          return (
            lead.company_name?.toLowerCase().includes(s) ||
            lead.org_number?.toLowerCase().includes(s) ||
            machineMatch ||
            linkedMachineMatch
          );
        });

        const activeLeads = filteredLeads.filter(l => !CLOSED_STATUSES.includes(l.status));
        const closedLeads = filteredLeads.filter(l => CLOSED_STATUSES.includes(l.status));

        setResults({ machines: filteredMachines, activeLeads, closedLeads });
      } catch (err) {
        console.error("Search error", err);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(searchData, 300);
    return () => clearTimeout(debounce);
  }, [searchTerm]);

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input 
          placeholder="Sök serienummer..." 
          className="pl-9 h-9 bg-slate-50/50 border-slate-200 focus-visible:ring-1 focus-visible:ring-[#3a9e9e] text-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => { if (searchTerm.length >= 2) setIsOpen(true); }}
        />
        {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 animate-spin" />}
      </div>

      {isOpen && (
        <div className="absolute top-full mt-2 w-[300px] sm:w-[400px] right-0 sm:right-auto bg-white rounded-lg shadow-xl border border-slate-100 max-h-96 overflow-y-auto z-[100]">
          {results.machines.length === 0 && results.activeLeads.length === 0 && results.closedLeads.length === 0 && !loading ? (
            <div className="p-4 text-center text-sm text-slate-500">Inga träffar hittades för "{searchTerm}".</div>
          ) : (
            <div className="py-2">
              {results.machines.length > 0 && (
                <div className="mb-2">
                  <div className="px-3 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50">Maskiner</div>
                  {results.machines.map(m => (
                    <button 
                      key={m.id}
                      className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-start gap-3 transition-colors"
                      onClick={() => { setIsOpen(false); navigate(createPageUrl(`Machines?search=${encodeURIComponent(searchTerm)}`)); }}
                    >
                      <Monitor className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-sm font-medium text-slate-900">{m.model}</div>
                        <div className="text-xs text-slate-500 font-mono">SN: {m.serial_number || 'Saknas'}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {results.activeLeads.length > 0 && (
                <div className="mb-2">
                  <div className="px-3 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-indigo-50 text-indigo-700">Avtalsprospekt</div>
                  {results.activeLeads.map(l => (
                    <button 
                      key={l.id}
                      className="w-full text-left px-4 py-2 hover:bg-indigo-50/50 flex items-start gap-3 transition-colors"
                      onClick={() => { setIsOpen(false); navigate(createPageUrl(`ServiceContractLeads?search=${encodeURIComponent(searchTerm)}`)); }}
                    >
                      <Building2 className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-sm font-medium text-slate-900">{l.company_name || 'Okänt'}</div>
                        <div className="text-xs text-slate-500">
                           {l.proposed_machines?.map(m=>m.serial_number).filter(Boolean).join(', ') || 'Inget SN kopplat'}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {results.closedLeads.length > 0 && (
                <div>
                  <div className="px-3 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-100">Avslutade prospekt</div>
                  {results.closedLeads.map(l => (
                    <button 
                      key={l.id}
                      className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-start gap-3 transition-colors"
                      onClick={() => { setIsOpen(false); navigate(createPageUrl(`ClosedLeads?search=${encodeURIComponent(searchTerm)}`)); }}
                    >
                      <Archive className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-sm font-medium text-slate-900">{l.company_name || 'Okänt'}</div>
                        <div className="text-xs text-slate-500">
                          {l.proposed_machines?.map(m=>m.serial_number).filter(Boolean).join(', ') || 'Inget SN kopplat'}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}