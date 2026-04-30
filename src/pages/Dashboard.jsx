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

export default function Dashboard() {
  const navigate = useNavigate();
  const dashboardRef = useRef(null);
  const [machines, setMachines] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [records, setRecords] = useState([]);
  const [leads, setLeads] = useState([]);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const currentUser = await base44.auth.me();
      setUserRole(currentUser?.role);
      if (currentUser?.role === "customer") {
        const ownCustomers = await base44.entities.Customer.filter({ email: currentUser.email });
        const cust = ownCustomers[0];
        setCustomers(cust ? [cust] : []);
        if (cust) {
          const [m, r] = await Promise.all([
            base44.entities.Machine.filter({ customer_id: cust.id }),
            base44.entities.ServiceRecord.filter({ customer_id: cust.id }, "-service_date", 50)
          ]);
          setMachines(m);
          setRecords(r);
          setLeads([]);
        }
      } else {
        const [m, c, r, l] = await Promise.all([
          base44.entities.Machine.list("-created_date"),
          base44.entities.Customer.list("-created_date"),
          base44.entities.ServiceRecord.list("-created_date", 50),
          base44.entities.ServiceContractLead.list()
        ]);
        setMachines(m);
        setCustomers(c);
        setRecords(r);
        setLeads(l);
      }
      setLoading(false);
    };
    loadData();
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

  const contactedLeads = leads.filter(l => l.status === "sold_machines").length;
  const calledLeads = leads.filter(l => l.status === "called").length;
  const newLeads = leads.filter(l => l.status === "new").length;
  const interestedLeads = leads.filter(l => l.status === "interested").length;
  const proposalSentLeads = leads.filter(l => l.status === "proposal_sent").length;

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
                  <p className="text-xs astomed-muted font-medium uppercase tracking-wide">Aktiva avtal</p>
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
        <Link to={createPageUrl("ServiceContracts") + "?status=active"} className="block">
          <Card className="astomed-card cursor-pointer" style={{ background: "#f4f9f9" }}>
            <CardContent className="p-5">
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
        <Link to={createPageUrl("ServiceContracts") + "?status=pending_signature"} className="block">
          <Card className="astomed-card cursor-pointer" style={{ background: "#fffaf0" }}>
            <CardContent className="p-5">
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
          <h2 className="text-lg font-bold astomed-title mt-8 mb-4">Prospektbearbetning</h2>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <Link to={createPageUrl("ServiceContractLeads") + "?status=new"} className="block">
              <Card className="astomed-card cursor-pointer" style={{ background: "#f8fafc" }}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs astomed-muted font-medium uppercase tracking-wide">Nya prospekt</p>
                      <p className="text-3xl font-bold astomed-title mt-1">{newLeads}</p>
                    </div>
                    <div className="w-10 h-10 astomed-icon-box" style={{ width: 40, height: 40, background: "#e2e8f0" }}>
                      <Star className="w-5 h-5" style={{ color: "#475569" }} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link to={createPageUrl("ServiceContractLeads") + "?status=sold_machines"} className="block">
              <Card className="astomed-card cursor-pointer" style={{ background: "#fffbeb" }}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs astomed-muted font-medium uppercase tracking-wide">Sålt maskiner</p>
                      <p className="text-3xl font-bold astomed-title mt-1">{contactedLeads}</p>
                    </div>
                    <div className="w-10 h-10 astomed-icon-box" style={{ width: 40, height: 40, background: "#fef3c7" }}>
                      <Mail className="w-5 h-5" style={{ color: "#d97706" }} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link to={createPageUrl("ServiceContractLeads") + "?status=called"} className="block">
              <Card className="astomed-card cursor-pointer" style={{ background: "#f0fdfa" }}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs astomed-muted font-medium uppercase tracking-wide">Ringda</p>
                      <p className="text-3xl font-bold astomed-title mt-1">{calledLeads}</p>
                    </div>
                    <div className="w-10 h-10 astomed-icon-box" style={{ width: 40, height: 40, background: "#ccfbf1" }}>
                      <Phone className="w-5 h-5" style={{ color: "#0f766e" }} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link to={createPageUrl("ServiceContractLeads") + "?status=interested"} className="block">
              <Card className="astomed-card cursor-pointer" style={{ background: "#f0fdf4" }}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs astomed-muted font-medium uppercase tracking-wide">Intresserade</p>
                      <p className="text-3xl font-bold astomed-title mt-1">{interestedLeads}</p>
                    </div>
                    <div className="w-10 h-10 astomed-icon-box" style={{ width: 40, height: 40, background: "#ccfbf1" }}>
                      <ThumbsUp className="w-5 h-5" style={{ color: "#14b8a6" }} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link to={createPageUrl("ServiceContractLeads") + "?status=proposal_sent"} className="block">
              <Card className="astomed-card cursor-pointer" style={{ background: "#faf5ff" }}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs astomed-muted font-medium uppercase tracking-wide">Offert skickad</p>
                      <p className="text-3xl font-bold astomed-title mt-1">{proposalSentLeads}</p>
                    </div>
                    <div className="w-10 h-10 astomed-icon-box" style={{ width: 40, height: 40, background: "#f3e8ff" }}>
                      <FileText className="w-5 h-5" style={{ color: "#a855f7" }} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </>
      )}


    </div>
  );
}