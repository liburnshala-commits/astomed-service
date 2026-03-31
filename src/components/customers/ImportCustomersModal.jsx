import { useState } from "react";
import { X, Upload, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { base44 } from "@/api/base44Client";

export default function ImportCustomersModal({ onClose, onImported }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleImport = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);

    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    const res = await base44.functions.invoke('importCustomersAndMachines', { fileUrl: file_url });
    const data = res.data;

    if (data.success) {
      setResult(data);
      onImported();
    } else {
      setError(data.error || 'Okänt fel');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-bold text-slate-900">Importera kunder & maskiner</h2>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
        </div>

        <div className="p-6 space-y-4">
          {!result ? (
            <>
              <div className="text-sm text-slate-500 bg-slate-50 rounded-lg p-3 space-y-1">
                <p className="font-medium text-slate-700">CSV-format (kolumner):</p>
                <p className="font-mono text-xs break-all">company_name, org_number, address, postal_code, city, contact_person, email, phone, notes, machine_model, serial_number, latest_service_date</p>
              </div>

              <div className="space-y-1">
                <Label>Välj CSV-fil</Label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={e => setFile(e.target.files[0])}
                  className="block w-full text-sm text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 rounded-lg p-3">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}
            </>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-green-700 font-semibold">
                <CheckCircle2 className="w-5 h-5" />
                Import klar!
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-sm space-y-1 text-slate-700">
                <p>✅ Nya kunder skapade: <strong>{result.created_customers}</strong></p>
                <p>⏭️ Befintliga kunder hoppade över: <strong>{result.skipped_customers}</strong></p>
                <p>⚠️ Rader ignorerades: <strong>{result.skipped_rows}</strong></p>
                <p>🖥️ Maskiner skapade: <strong>{result.created_machines}</strong></p>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 p-6 border-t bg-slate-50 rounded-b-2xl">
          <Button variant="outline" onClick={onClose}>
            {result ? "Stäng" : "Avbryt"}
          </Button>
          {!result && (
            <Button onClick={handleImport} disabled={!file || loading} className="bg-blue-600 hover:bg-blue-700">
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
              {loading ? "Importerar..." : "Importera"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}