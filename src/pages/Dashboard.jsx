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
import StatCard from "@/components/dashboard/StatCard";

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

  const contractedMachines = machines.filter(m => m.service_contract && m.service_contract !== 'none');
  const activeContractsCount = contractedMachines.filter(m => !m.contract_status || m.contract_status === 'active').length;
  const signedCustomersCount = new Set(contractedMachines.filter(m => !m.contract_status || m.contract_status === 'active').map(m => m.customer_id)).size;
  const pendingContractsCount = contractedMachines.filter(m => m.contract_status === 'pending_signature').length;
  const inactiveContractsCount = contractedMachines.filter(m => m.contract_status === 'inactive').length;
  const rejectedContractsCount = contractedMachines.filter(m => m.contract_status === 'rejected').length;

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
        <StatCard to="Machines" title="Maskiner" value={machines.length} icon={Monitor} />
        <StatCard to="Customers" title="Kunder" value={customers.length} icon={Users} />
        <StatCard to="Customers?filter=signed" bg="#f0fdf4" title="Signerade Kunder" value={signedCustomersCount} icon={CheckCircle} iconBg="#dcfce7" iconColor="#166534" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard to="ServiceContracts?status=active" title="Maskiner med avtal" value={activeContractsCount} icon={Monitor} />
        <StatCard to="ServiceContracts?status=pending_signature" bg="#fffaf0" title="Under signering" value={pendingContractsCount} icon={Clock} iconColor="#e6a817" />
        <StatCard to="ServiceContracts?status=inactive" bg="#f1f5f9" title="Inaktiva avtal" value={inactiveContractsCount} icon={Monitor} iconBg="#e2e8f0" iconColor="#64748b" />
        <StatCard to="ServiceContracts?status=rejected" bg="#fef2f2" title="Avvisade avtal" value={rejectedContractsCount} icon={Monitor} iconBg="#fee2e2" iconColor="#ef4444" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatCard hFull to="ServiceContracts?status=active" title="Avtalsintäkt (Aktiva)" value={`${estimatedActiveRevenue.toLocaleString("sv-SE")} kr`} icon={CheckCircle} />
        <StatCard hFull to="ServiceContracts?status=pending_signature" bg="#fffaf0" title="Förväntad intäkt (Signering)" value={`${estimatedPendingRevenue.toLocaleString("sv-SE")} kr`} icon={Clock} iconBg="#fef3c7" iconColor="#e6a817" />
      </div>

      {userRole !== "customer" && (
        <>
          <h2 className="text-lg font-bold astomed-title mt-8 mb-4">Serviceärenden</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <StatCard hFull to="ServiceRecords?status=completed" bg="#f0fdf4" title="Genomförda" value={completedServices} icon={CheckCircle} iconBg="#dcfce7" iconColor="#166534" />
            <StatCard hFull to="ServiceRecords?status=planned" bg="#fffaf0" title="Bokade/Planerade" value={plannedServices} icon={Clock} iconBg="#fef3c7" iconColor="#d97706" />
            <StatCard hFull to="ServiceRecords?status=in_progress" bg="#eff6ff" title="Pågående" value={inProgressServices} icon={Wrench} iconBg="#dbeafe" iconColor="#1d4ed8" />
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