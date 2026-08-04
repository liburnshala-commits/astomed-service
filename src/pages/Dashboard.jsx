import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { Monitor, Users, Wrench, CheckCircle, Clock, Phone, Mail, FileText, Star, ThumbsUp, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import TechnicianDashboard from "@/components/dashboard/TechnicianDashboard";
import ContractsPieChart from "@/components/dashboard/ContractsPieChart";
import UpcomingServiceReminders from "@/components/dashboard/UpcomingServiceReminders";
import ServiceRecordsChart from "@/components/dashboard/ServiceRecordsChart";

export default function Dashboard() {
  const navigate = useNavigate();
  const dashboardRef = useRef(null);
  const [machines, setMachines] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [records, setRecords] = useState([]);
  const [leads, setLeads] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const currentUser = await base44.auth.me();
      setUserRole(currentUser?.role);
      if (currentUser?.role === "customer") {
        const ownCustomers = await base44.entities.Customer.filter({ email: currentUser.email });
        const cust = ownCustomers[0];
        setCustomers(cust && !cust.is_deleted ? [cust] : []);
        if (cust && !cust.is_deleted) {
          const [m, r, t] = await Promise.all([
            base44.entities.Machine.filter({ customer_id: cust.id }),
            base44.entities.ServiceRecord.filter({ customer_id: cust.id }, "-service_date", 500),
            base44.entities.ServiceAgreementTemplate.list()
          ]);
          setMachines(m.filter(x => !x.is_deleted));
          setRecords(r);
          setLeads([]);
          setTemplates(t);
        }
      } else {
        const [m, c, r, l, t] = await Promise.all([
          base44.entities.Machine.list("-created_date"),
          base44.entities.Customer.list("-created_date"),
          base44.entities.ServiceRecord.list("-created_date", 500),
          base44.entities.ServiceContractLead.list(),
          base44.entities.ServiceAgreementTemplate.list()
        ]);
        setMachines(m.filter(x => !x.is_deleted));
        setCustomers(c.filter(x => !x.is_deleted));
        setRecords(r);
        setLeads(l);
        setTemplates(t);
      }
      setLoading(false);
    };
    loadData();

    const unsubM = base44.entities.Machine.subscribe(() => loadData());
    const unsubC = base44.entities.Customer.subscribe(() => loadData());
    const unsubR = base44.entities.ServiceRecord.subscribe(() => loadData());
    const unsubL = base44.entities.ServiceContractLead.subscribe(() => loadData());
    const unsubT = base44.entities.ServiceAgreementTemplate.subscribe(() => loadData());

    return () => {
      unsubM();
      unsubC();
      unsubR();
      unsubL();
      unsubT();
    };
  }, []);

  const statusColor = {
    pending: "bg-yellow-100 text-yellow-800",
    in_progress: "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800",
    invoiced: "bg-purple-100 text-purple-800"
  };

  const statusLabel = {
    pending: "Väntar",
    in_progress: "Pågående",
    completed: "Slutförd",
    invoiced: "Fakturerad"
  };

  const activeContractsCount = machines.filter(m => m.service_contract && m.service_contract !== 'none' && (!m.contract_status || m.contract_status === 'active')).length;
  const signedCustomersCount = new Set(machines.filter(m => m.service_contract && m.service_contract !== 'none' && (!m.contract_status || m.contract_status === 'active')).map(m => m.customer_id)).size;
  const pendingContractsCount = machines.filter(m => m.service_contract && m.service_contract !== 'none' && m.contract_status === 'pending_signature').length;
  const inactiveContractsCount = machines.filter(m => m.service_contract && m.service_contract !== 'none' && m.contract_status === 'inactive').length;
  const rejectedContractsCount = machines.filter(m => m.service_contract && m.service_contract !== 'none' && m.contract_status === 'rejected').length;

  const estimatedActiveRevenue = activeContractsCount * 600;
  const estimatedPendingRevenue = pendingContractsCount * 600;

  const completedServices = records.filter(r => r.status === "completed" || r.status === "invoiced").length;
  const plannedServices = records.filter(r => r.status === "planned" || r.status === "pending" || r.status === "awaiting_approval").length;
  const inProgressServices = records.filter(r => r.status === "in_progress").length;

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
      pdf.save("dashboard.pdf");
    } catch (error) {
      console.error("Fel vid PDF-export:", error);
      alert("Det gick inte att exportera till PDF.");
    }
  };

  if (userRole === "technician") {
    return (
      <div className="p-6 space-y-6" ref={dashboardRef}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold astomed-title">Teknikeröversikt</h1>
            <p className="astomed-subtitle text-sm">Din dagliga serviceöversikt</p>
          </div>
          <Button onClick={exportToPDF} variant="outline" className="gap-2 bg-white">
            <Download className="w-4 h-4" /> Exportera PDF
          </Button>
        </div>
        <TechnicianDashboard machines={machines} customers={customers} records={records} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" ref={dashboardRef}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold astomed-title">Dashboard</h1>
          <p className="astomed-subtitle text-sm">Översikt av serviceverksamheten</p>
        </div>
        <Button onClick={exportToPDF} variant="outline" className="gap-2 bg-white flex">
          <Download className="w-4 h-4" /> Exportera PDF
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <Link to={createPageUrl("Machines")} className="block">
          <Card className="astomed-card cursor-pointer" style={{ background: "#f4f9f9" }}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs astomed-muted font-medium uppercase tracking-wide">Maskiner</p>
                  <p className="text-3xl font-bold astomed-title mt-1">{machines.length}</p>
                </div>
                <div className="w-10 h-10 astomed-icon-box" style={{ width: 40, height: 40 }}>
                  <Monitor className="w-5 h-5" style={{ color: "#1b3a3a" }} />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link to={createPageUrl("Customers")} className="block">
          <Card className="astomed-card cursor-pointer" style={{ background: "#f4f9f9" }}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs astomed-muted font-medium uppercase tracking-wide">Kunder</p>
                  <p className="text-3xl font-bold astomed-title mt-1">{customers.length}</p>
                </div>
                <div className="w-10 h-10 astomed-icon-box" style={{ width: 40, height: 40 }}>
                  <Users className="w-5 h-5" style={{ color: "#1b3a3a" }} />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link to={createPageUrl("Customers") + "?filter=signed"} className="block">
          <Card className="astomed-card cursor-pointer" style={{ background: "#f0fdf4" }}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs astomed-muted font-medium uppercase tracking-wide">Signerade Kunder</p>
                  <p className="text-3xl font-bold astomed-title mt-1">{signedCustomersCount}</p>
                </div>
                <div className="w-10 h-10 astomed-icon-box" style={{ width: 40, height: 40, background: "#dcfce7" }}>
                  <CheckCircle className="w-5 h-5" style={{ color: "#166534" }} />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to={createPageUrl("ServiceContracts") + "?status=active"} className="block">
          <Card className="astomed-card cursor-pointer" style={{ background: "#f4f9f9" }}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs astomed-muted font-medium uppercase tracking-wide">Maskiner med avtal</p>
                  <p className="text-3xl font-bold astomed-title mt-1">{activeContractsCount}</p>
                </div>
                <div className="w-10 h-10 astomed-icon-box" style={{ width: 40, height: 40 }}>
                  <Monitor className="w-5 h-5" style={{ color: "#1b3a3a" }} />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link to={createPageUrl("ServiceContracts") + "?status=pending_signature"} className="block">
          <Card className="astomed-card cursor-pointer" style={{ background: "#fffaf0" }}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs astomed-muted font-medium uppercase tracking-wide">Under signering</p>
                  <p className="text-3xl font-bold astomed-title mt-1">{pendingContractsCount}</p>
                </div>
                <div className="w-10 h-10 astomed-icon-box" style={{ width: 40, height: 40 }}>
                  <Clock className="w-5 h-5" style={{ color: "#e6a817" }} />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link to={createPageUrl("ServiceContracts") + "?status=inactive"} className="block">
          <Card className="astomed-card cursor-pointer" style={{ background: "#f1f5f9" }}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs astomed-muted font-medium uppercase tracking-wide">Inaktiva avtal</p>
                  <p className="text-3xl font-bold astomed-title mt-1">{inactiveContractsCount}</p>
                </div>
                <div className="w-10 h-10 astomed-icon-box" style={{ width: 40, height: 40, background: "#e2e8f0" }}>
                  <Monitor className="w-5 h-5" style={{ color: "#64748b" }} />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link to={createPageUrl("ServiceContracts") + "?status=rejected"} className="block">
          <Card className="astomed-card cursor-pointer" style={{ background: "#fef2f2" }}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs astomed-muted font-medium uppercase tracking-wide">Avvisade avtal</p>
                  <p className="text-3xl font-bold astomed-title mt-1">{rejectedContractsCount}</p>
                </div>
                <div className="w-10 h-10 astomed-icon-box" style={{ width: 40, height: 40, background: "#fee2e2" }}>
                  <Monitor className="w-5 h-5" style={{ color: "#ef4444" }} />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link to={createPageUrl("ServiceContracts") + "?status=active"} className="block h-full">
          <Card className="astomed-card cursor-pointer h-full" style={{ background: "#f4f9f9" }}>
            <CardContent className="p-5 h-full flex flex-col justify-center">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs astomed-muted font-medium uppercase tracking-wide">Avtalsintäkt (Aktiva)</p>
                  <p className="text-3xl font-bold astomed-title mt-1">{estimatedActiveRevenue.toLocaleString("sv-SE")} kr</p>
                </div>
                <div className="w-10 h-10 astomed-icon-box" style={{ width: 40, height: 40 }}>
                  <CheckCircle className="w-5 h-5" style={{ color: "#1b3a3a" }} />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link to={createPageUrl("ServiceContracts") + "?status=pending_signature"} className="block h-full">
          <Card className="astomed-card cursor-pointer h-full" style={{ background: "#fffaf0" }}>
            <CardContent className="p-5 h-full flex flex-col justify-center">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs astomed-muted font-medium uppercase tracking-wide">Förväntad intäkt (Signering)</p>
                  <p className="text-3xl font-bold astomed-title mt-1">{estimatedPendingRevenue.toLocaleString("sv-SE")} kr</p>
                </div>
                <div className="w-10 h-10 astomed-icon-box" style={{ width: 40, height: 40, background: "#fef3c7" }}>
                  <Clock className="w-5 h-5" style={{ color: "#e6a817" }} />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {userRole !== "customer" && (
        <>
          <h2 className="text-lg font-bold astomed-title mt-8 mb-4">Serviceärenden</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <Link to={createPageUrl("ServiceRecords") + "?status=completed"} className="block">
                <Card className="astomed-card cursor-pointer h-full" style={{ background: "#f0fdf4" }}>
                  <CardContent className="p-5 h-full flex flex-col justify-center">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs astomed-muted font-medium uppercase tracking-wide">Genomförda</p>
                        <p className="text-3xl font-bold astomed-title mt-1">{completedServices}</p>
                      </div>
                      <div className="w-10 h-10 astomed-icon-box" style={{ width: 40, height: 40, background: "#dcfce7" }}>
                        <CheckCircle className="w-5 h-5" style={{ color: "#166534" }} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
              <Link to={createPageUrl("ServiceRecords") + "?status=planned"} className="block">
                <Card className="astomed-card cursor-pointer h-full" style={{ background: "#fffaf0" }}>
                  <CardContent className="p-5 h-full flex flex-col justify-center">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs astomed-muted font-medium uppercase tracking-wide">Bokade/Planerade</p>
                        <p className="text-3xl font-bold astomed-title mt-1">{plannedServices}</p>
                      </div>
                      <div className="w-10 h-10 astomed-icon-box" style={{ width: 40, height: 40, background: "#fef3c7" }}>
                        <Clock className="w-5 h-5" style={{ color: "#d97706" }} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
              <Link to={createPageUrl("ServiceRecords") + "?status=in_progress"} className="block">
                <Card className="astomed-card cursor-pointer h-full" style={{ background: "#eff6ff" }}>
                  <CardContent className="p-5 h-full flex flex-col justify-center">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs astomed-muted font-medium uppercase tracking-wide">Pågående</p>
                        <p className="text-3xl font-bold astomed-title mt-1">{inProgressServices}</p>
                      </div>
                      <div className="w-10 h-10 astomed-icon-box" style={{ width: 40, height: 40, background: "#dbeafe" }}>
                        <Wrench className="w-5 h-5" style={{ color: "#1d4ed8" }} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="min-h-[300px]">
               <UpcomingServiceReminders machines={machines} customers={customers} />
            </div>
            <div className="min-h-[300px]">
               <ContractsPieChart machines={machines} templates={templates} />
            </div>
          </div>
          <div className="min-h-[300px] mt-4">
             <ServiceRecordsChart records={records} />
          </div>
        </>
      )}


    </div>
  );
}