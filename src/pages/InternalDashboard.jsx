import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Monitor, FileText, Banknote, Calendar, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import moment from "moment";
import { useRef } from "react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

export default function InternalDashboard() {
  const dashboardRef = useRef(null);
  const [data, setData] = useState({
    machinesCount: 0,
    contractsCount: 0,
    monthlyBilling: 0,
    upcomingCasesCount: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [machines, records] = await Promise.all([
          base44.entities.Machine.list(),
          base44.entities.ServiceRecord.list()
        ]);

        const validMachines = machines.filter(m => !m.is_deleted);
        const machinesCount = validMachines.length;

        const contractedMachines = validMachines.filter(m => m.service_contract && m.service_contract !== 'none');
        const activeContractsCount = contractedMachines.filter(m => !m.contract_status || m.contract_status === 'active').length;
        
        const monthlyBilling = activeContractsCount * 600;

        const now = moment();
        const upcomingCasesCount = records.filter(r => {
          if (!r.service_date) return false;
          const date = moment(r.service_date);
          return date.isAfter(now) && r.status !== "completed" && r.status !== "invoiced";
        }).length;

        setData({
          machinesCount,
          contractsCount: activeContractsCount,
          monthlyBilling,
          upcomingCasesCount
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  const exportToPDF = async () => {
    if (!dashboardRef.current) return;
    try {
      const canvas = await html2canvas(dashboardRef.current, { 
        scale: 2,
        useCORS: true,
        logging: false
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save("intern-kpi-dashboard.pdf");
    } catch (error) {
      console.error("Fel vid PDF-export:", error);
      alert("Det gick inte att exportera till PDF.");
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Laddar dashboard...</div>;
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Intern KPI Dashboard</h1>
          <p className="text-muted-foreground mt-2">Översikt för delning med kollegor</p>
        </div>
        <Button onClick={exportToPDF} variant="outline" className="gap-2 bg-white flex">
          <Download className="w-4 h-4" /> Exportera PDF
        </Button>
      </div>

      <div ref={dashboardRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-4 -m-4 bg-background">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Antal maskiner</CardTitle>
            <Monitor className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.machinesCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Totalt registrerade</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Antal kontrakt</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.contractsCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Aktiva serviceavtal</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Fakturering / Månad</CardTitle>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.monthlyBilling.toLocaleString("sv-SE")} kr</div>
            <p className="text-xs text-muted-foreground mt-1">Estimerad avtalsintäkt</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Kommande ärenden</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.upcomingCasesCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Planerade framåt i tiden</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}