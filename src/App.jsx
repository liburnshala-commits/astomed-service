import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from 'next-themes';
import { AnimatePresence, motion } from 'framer-motion';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import PublicServiceRequest from './pages/PublicServiceRequest';
import { useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import ServiceAgreementTemplates from './pages/ServiceAgreementTemplates';
import CustomerDetails from './pages/CustomerDetails';
import ServiceContractLeads from './pages/ServiceContractLeads';
import ClosedLeads from './pages/ClosedLeads';
import DeletedMachines from './pages/DeletedMachines';
import ChatSupport from './pages/ChatSupport';
import MobileMenu from './pages/MobileMenu';
import ClinicDevelopment from './pages/ClinicDevelopment';
import Products from './pages/Products';
import DeliveryControls from './pages/DeliveryControls';
import DeliveryControlForm from './pages/DeliveryControlForm';
import FunctionControls from './pages/FunctionControls';
import FunctionControlForm from './pages/FunctionControlForm';
import RadiationSafety from './pages/RadiationSafety';
import NewCustomers from './pages/NewCustomers';
import PendingApproval from './pages/PendingApproval';
import Calculator from './pages/Calculator';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const AuthenticatedApp = () => {
  const { user, isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();
  const location = useLocation();
  const currentPath = location.pathname;

  useEffect(() => {
    if (user && user.role === 'customer') {
      let timeoutId;
      const resetTimer = () => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          base44.auth.logout();
        }, 20 * 60 * 1000); // 20 minutes
      };
      
      resetTimer();
      const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
      events.forEach(e => window.addEventListener(e, resetTimer));
      
      return () => {
        clearTimeout(timeoutId);
        events.forEach(e => window.removeEventListener(e, resetTimer));
      };
    }
  }, [user]);

  // Public routes that don't require authentication
  const isPublicRoute = currentPath === '/' || currentPath === '/PublicServiceRequest' || currentPath === '/Calculator';

  // Show loading spinner while checking app public settings or auth (skip for public routes)
  if (!isPublicRoute && (isLoadingPublicSettings || isLoadingAuth)) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors (skip for public routes)
  if (!isPublicRoute && authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Strict routing for pending customers
  if (user && user.role === 'pending_customer' && !isPublicRoute) {
    if (currentPath !== '/PendingApproval') {
      return <Navigate to="/PendingApproval" replace />;
    }
  }

  // Strict routing for customers
  if (user && user.role === 'customer' && !isPublicRoute) {
    const allowedCustomerPaths = ['/CustomerDashboard', '/ClinicDevelopment', '/ServiceRecords', '/Machines', '/DeliveryControls', '/DeliveryControlForm', '/FunctionControls', '/FunctionControlForm', '/RadiationSafety'];
    if (!allowedCustomerPaths.includes(currentPath)) {
      return <Navigate to="/CustomerDashboard" replace />;
    }
  }

  // Render the main app

  const AnimatedPage = ({ children }) => (
    <motion.div
      initial={{ x: 15, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -15, opacity: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="h-full"
    >
      {children}
    </motion.div>
  );

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<AnimatedPage><PublicServiceRequest /></AnimatedPage>} />
        <Route path="/PublicServiceRequest" element={<AnimatedPage><PublicServiceRequest /></AnimatedPage>} />
        <Route path="/ServiceAgreementTemplates" element={<AnimatedPage><LayoutWrapper currentPageName="ServiceAgreementTemplates"><ServiceAgreementTemplates /></LayoutWrapper></AnimatedPage>} />
        <Route path="/CustomerDetails" element={<AnimatedPage><LayoutWrapper currentPageName="CustomerDetails"><CustomerDetails /></LayoutWrapper></AnimatedPage>} />
        <Route path="/ServiceContractLeads" element={<AnimatedPage><LayoutWrapper currentPageName="ServiceContractLeads"><ServiceContractLeads /></LayoutWrapper></AnimatedPage>} />
        <Route path="/ClosedLeads" element={<AnimatedPage><LayoutWrapper currentPageName="ClosedLeads"><ClosedLeads /></LayoutWrapper></AnimatedPage>} />
        <Route path="/DeletedMachines" element={<AnimatedPage><LayoutWrapper currentPageName="Machines"><DeletedMachines /></LayoutWrapper></AnimatedPage>} />
        <Route path="/ChatSupport" element={<AnimatedPage><LayoutWrapper currentPageName="ChatSupport"><ChatSupport /></LayoutWrapper></AnimatedPage>} />
        <Route path="/MobileMenu" element={<AnimatedPage><LayoutWrapper currentPageName="MobileMenu"><MobileMenu /></LayoutWrapper></AnimatedPage>} />
        <Route path="/ClinicDevelopment" element={<AnimatedPage><LayoutWrapper currentPageName="ClinicDevelopment"><ClinicDevelopment /></LayoutWrapper></AnimatedPage>} />
        <Route path="/Products" element={<AnimatedPage><LayoutWrapper currentPageName="Products"><Products /></LayoutWrapper></AnimatedPage>} />
        <Route path="/DeliveryControls" element={<AnimatedPage><LayoutWrapper currentPageName="DeliveryControls"><DeliveryControls /></LayoutWrapper></AnimatedPage>} />
        <Route path="/DeliveryControlForm" element={<AnimatedPage><DeliveryControlForm /></AnimatedPage>} />
        <Route path="/FunctionControls" element={<AnimatedPage><LayoutWrapper currentPageName="FunctionControls"><FunctionControls /></LayoutWrapper></AnimatedPage>} />
        <Route path="/FunctionControlForm" element={<AnimatedPage><FunctionControlForm /></AnimatedPage>} />
        <Route path="/RadiationSafety" element={<AnimatedPage><LayoutWrapper currentPageName="RadiationSafety"><RadiationSafety /></LayoutWrapper></AnimatedPage>} />
        <Route path="/NewCustomers" element={<AnimatedPage><LayoutWrapper currentPageName="NewCustomers"><NewCustomers /></LayoutWrapper></AnimatedPage>} />
        <Route path="/PendingApproval" element={<AnimatedPage><LayoutWrapper currentPageName="PendingApproval"><PendingApproval /></LayoutWrapper></AnimatedPage>} />
        <Route path="/Calculator" element={<AnimatedPage><Calculator /></AnimatedPage>} />
        {Object.entries(Pages).map(([path, Page]) => (
          <Route
            key={path}
            path={`/${path}`}
            element={
              <AnimatedPage>
                <LayoutWrapper currentPageName={path}>
                  <Page />
                </LayoutWrapper>
              </AnimatedPage>
            }
          />
        ))}
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </AnimatePresence>
  );
};


function App() {

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <AuthenticatedApp />
          </Router>
          <Toaster />
        </QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App