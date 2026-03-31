import { useState, useEffect, useRef } from "react";
import { X, Upload, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { base44 } from "@/api/base44Client";

export default function ImportCustomersModal({ onClose, onImported }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("");
  const progressRef = useRef(null);

  useEffect(() => {
    return () => { if (progressRef.current) clearInterval(progressRef.current); };
  }, []);

  const startProgressSimulation = (estimatedRows) => {
    // Estimate ~200ms per row (150ms sleep + overhead)
    const totalMs = estimatedRows * 200;
    const intervalMs = 500;
    const steps = totalMs / intervalMs;
    let current = 0;

    progressRef.current = setInterval(() => {
      current++;
      const pct = Math.min(95, Math.round((current / steps) * 100));
      setProgress(pct);
      if (pct < 30) setStatusText("Laddar upp och analyserar fil...");
      else if (pct < 60) setStatusText("Skapar kunder och maskiner...");
      else if (pct < 85) setStatusText("Nästan klar, kontrollerar dubbletter...");
      else setStatusText("Avslutar import...");
    }, intervalMs);
  };

  const handleImport = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setProgress(5);
    setStatusText("Laddar upp fil...");

    // Estimate rows from file size (~50 bytes per row roughly)
    const estimatedRows = Math.max(10, Math.round(file.size / 100));
    
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setProgress(10);
    setStatusText("Fil uppladdad, startar import...");
    startProgressSimulation(estimatedRows);

    const res = await base44.functions.invoke('importCustomersAndMachines', { fileUrl: file_url });
    
    clearInterval(progressRef.current);
    setProgress(100);
    setStatusText("Import klar!");

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
              {!loading && (
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
                </>
              )}

              {loading && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600 font-medium">{statusText}</span>
                    <span className="text-slate-500 font-mono">{progress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                    <div
                      className="h-3 rounded-full transition-all duration-500"
                      style={{ width: `${progress}%`, background: "linear-gradient(90deg, #1b3a3a, #3a9e9e)" }}
                    />
                  </div>
                  <p className="text-xs text-slate-400 text-center">Stäng inte fönstret under pågående import</p>
                </div>
              )}

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
                <p>⏭️ Befintliga maskiner hoppade över: <strong>{result.skipped_machines}</strong></p>
              </div>
              {result.errors?.length > 0 && (
                <div className="bg-red-50 rounded-lg p-3 space-y-1">
                  <p className="text-sm font-medium text-red-700">⚠️ {result.errors.length} fel uppstod:</p>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {result.errors.map((e, i) => (
                      <p key={i} className="text-xs text-red-600">• {e}</p>
                    ))}
                  </div>
                </div>
              )}
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