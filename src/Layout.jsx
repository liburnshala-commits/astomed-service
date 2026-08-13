import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import PrivacyPolicyModal from "@/components/PrivacyPolicyModal";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import MobileBottomNav from "@/components/layout/MobileBottomNav";

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [userLoaded, setUserLoaded] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [newServiceLeadsCount, setNewServiceLeadsCount] = useState(0);
  const [newServiceRecordsCount, setNewServiceRecordsCount] = useState(0);
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    let unsubscribe;
    let unsubscribeRecords;
    base44.auth.me().then(u => {
      setUser(u);
      if (u && !u.privacy_policy_accepted) {
        setShowPrivacyModal(true);
      }
      if (u && (u.role === 'admin' || u.role === 'technician')) {
        const loadLeads = () => base44.entities.PublicServiceLead.filter({ status: 'new' }).then(res => setNewServiceLeadsCount(res.length));
        loadLeads();
        unsubscribe = base44.entities.PublicServiceLead.subscribe(() => loadLeads());

        const loadRecords = () => base44.entities.ServiceRecord.filter({ status: 'pending' }).then(res => setNewServiceRecordsCount(res.length));
        loadRecords();
        unsubscribeRecords = base44.entities.ServiceRecord.subscribe(() => loadRecords());
      }
    }).catch(() => {
      base44.auth.redirectToLogin(window.location.href);
    }).finally(() => setUserLoaded(true));

    return () => {
      if (unsubscribe) unsubscribe();
      if (unsubscribeRecords) unsubscribeRecords();
    };
  }, []);

  if (currentPageName === "CustomerPortal") {
    return <>{children}</>;
  }

  if (showPrivacyModal) {
    return <PrivacyPolicyModal onAccepted={() => { setShowPrivacyModal(false); setUser(u => u ? { ...u, privacy_policy_accepted: true } : u); }} />;
  }

  const userRole = user?.role || "technician";
  const isRootScreen = ["Dashboard", "ServiceRecords", "Customers", "MobileMenu"].includes(currentPageName);

  const handleDeleteAccount = async () => {
    if (window.confirm("Är du säker på att du vill radera ditt konto? Denna åtgärd kan inte ångras.")) {
      try {
        await base44.entities.User.delete(user.id);
        base44.auth.logout();
      } catch (err) {
        alert("Kunde inte radera kontot. Du kanske saknar behörighet.");
      }
    }
  };

  return (
    <div className="min-h-screen flex bg-background pb-[calc(4rem+env(safe-area-inset-bottom))] lg:pb-0">
      <Sidebar 
        user={user}
        userLoaded={userLoaded}
        userRole={userRole}
        currentPageName={currentPageName}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        newServiceLeadsCount={newServiceLeadsCount}
        newServiceRecordsCount={newServiceRecordsCount}
        handleDeleteAccount={handleDeleteAccount}
        logoError={logoError}
        setLogoError={setLogoError}
      />

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col min-w-0 bg-background relative">
        <Header 
          user={user}
          isRootScreen={isRootScreen}
          setSidebarOpen={setSidebarOpen}
        />

        <main className="flex-1 overflow-x-hidden overflow-y-auto">
          {children}
        </main>
      </div>

      <MobileBottomNav user={user} currentPageName={currentPageName} />
    </div>
  );
}