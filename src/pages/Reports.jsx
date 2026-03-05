import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { FileText, Download, Search, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import ServiceReportModal from "@/components/service/ServiceReportModal.jsx";

const statusColor = {
  pending: "bg-yellow-100 text-yellow-800",
  in_progress: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  invoiced: "bg-purple-100 text-purple-800"
};
const statusLabel = { pending: "Väntar", in_progress: "Pågående", completed: "Slutförd", invoiced: "Fakturerad" };

export default function Reports() {
  const [records, setRecords] = useState([]);
  const [machines, setMachines] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedRecord, setSelectedRecord] = useState(null);

  useEffect(() => {
    Promise.all([
      base44.entities.ServiceRecord.list("-service_date"),
      base44.entities.Machine.list(),
      base44.entities.Customer.list()
    ]).then(([r, m, c]) => { setRecords(r); setMachines(m); setCustomers(c); });
  }, []);

  const getMachine = (id) => machines.find(m => m.id === id);
  const getCustomer = (id) => customers.find(c => c.id === id);

  const completedRecords = records.filter(r => r.status === "completed" || r.status === "invoiced");

  const filtered = completedRecords.filter(r => {
    const machine = getMachine(r.machine_id);
    const customer = getCustomer(r.customer_id);
    return machine?.model?.toLowerCase().includes(search.toLowerCase()) ||
      customer?.company_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.technician_name?.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Rapporter</h1>
        <p className="text-slate-500 text-sm">Generera och visa servicerapporter för slutförda ärenden</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input placeholder="Sök kund, maskin eller tekniker..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="space-y-3">
        {filtered.map(record => {
          const machine = getMachine(record.machine_id);
          const customer = getCustomer(record.customer_id);
          return (
            <Card key={record.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-slate-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-semibold text-slate-900">{machine?.model || "Okänd maskin"}</span>
                      <Badge className={statusColor[record.status]}>{statusLabel[record.status]}</Badge>
                    </div>
                    <div className="text-sm text-slate-500">
                      {customer?.company_name} · {r => r}{record.service_date ? format(new Date(record.service_date), "d MMM yyyy", { locale: sv }) : ""} · {record.technician_name}
                    </div>
                    {record.total_cost > 0 && <div className="text-sm font-semibold text-slate-700 mt-0.5">{record.total_cost.toLocaleString("sv-SE")} kr</div>}
                  </div>
                  <Button size="sm" onClick={() => setSelectedRecord({ record, machine, customer })} className="flex-shrink-0">
                    <Eye className="w-4 h-4 mr-1" /> Visa rapport
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Inga slutförda ärenden hittades</p>
          </div>
        )}
      </div>

      {selectedRecord && (
        <ServiceReportModal
          record={selectedRecord.record}
          machine={selectedRecord.machine}
          customer={selectedRecord.customer}
          onClose={() => setSelectedRecord(null)}
        />
      )}
    </div>
  );
}