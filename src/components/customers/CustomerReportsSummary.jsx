import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { FileText, Download, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function CustomerReportsSummary({ customerId }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, [customerId]);

  const loadReports = async () => {
    try {
      setLoading(true);
      const records = await base44.entities.ServiceRecord.filter({ customer_id: customerId }, "-service_date", 100);
      // Filter only completed/invoiced records that have reports
      const withReports = records.filter(r => r.report_url && (r.status === "completed" || r.status === "invoiced"));
      setReports(withReports);
    } catch (e) {
      console.error("Kunde inte ladda rapporter:", e);
    } finally {
      setLoading(false);
    }
  };

  const statusLabel = {
    completed: "Slutförd",
    invoiced: "Fakturerad"
  };

  const statusColor = {
    completed: "bg-blue-100 text-blue-800",
    invoiced: "bg-green-100 text-green-800"
  };

  if (loading) {
    return (
      <div className="mt-4 p-3 bg-slate-50 rounded-lg text-sm text-slate-500">
        Laddar rapporter...
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="mt-4 p-3 bg-slate-50 rounded-lg text-sm text-slate-500 text-center">
        <FileText className="w-4 h-4 mx-auto mb-1 opacity-50" />
        Inga rapporter skickade än
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-2">
      <div className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Rapporter skickade</div>
      <div className="space-y-1.5 max-h-40 overflow-y-auto">
        {reports.map((report) => (
          <div key={report.id} className="flex items-center justify-between gap-2 p-2 bg-slate-50 rounded-lg text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <FileText className="w-3 h-3 text-slate-400 flex-shrink-0" />
              <div className="min-w-0">
                <div className="truncate font-medium text-slate-700">
                  {report.service_date}
                </div>
                <div className="text-slate-500 truncate">{report.description?.substring(0, 30)}...</div>
              </div>
            </div>
            <Badge className={statusColor[report.status] || "bg-slate-100 text-slate-700"}>
              {statusLabel[report.status] || report.status}
            </Badge>
          </div>
        ))}
      </div>
      {reports.length > 0 && (
        <div className="text-xs text-slate-500 text-center pt-1">
          {reports.length} rapport{reports.length !== 1 ? "er" : ""}
        </div>
      )}
    </div>
  );
}