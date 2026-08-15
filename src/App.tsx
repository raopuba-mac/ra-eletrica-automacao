import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './components/AuthProvider';
import DashboardLayout from './pages/DashboardLayout';
import PublicLayout from './pages/PublicLayout';
import Home from './pages/public/Home';
import PortfolioPage from './pages/public/PortfolioPage';
import OSView from './pages/public/OSView';
import Login from './pages/Login';

// Lazy loading admin pages for bundle optimization & instant public page load
const Dashboard = lazy(() => import('./pages/app/Dashboard'));
const Clients = lazy(() => import('./pages/app/Clients'));
const Quotes = lazy(() => import('./pages/app/Quotes'));
const ServiceOrders = lazy(() => import('./pages/app/ServiceOrders'));
const Agenda = lazy(() => import('./pages/app/Agenda'));
const PortfolioAdmin = lazy(() => import('./pages/app/PortfolioAdmin'));
const ServicesAdmin = lazy(() => import('./pages/app/ServicesAdmin'));
const LeadsAdmin = lazy(() => import('./pages/app/LeadsAdmin'));
const Financial = lazy(() => import('./pages/app/Financial'));
const Settings = lazy(() => import('./pages/app/Settings'));

const AdminPageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh] p-8">
    <div className="flex flex-col items-center gap-4">
      <div className="w-10 h-10 border-4 border-[#EAB308]/20 border-t-[#EAB308] rounded-full animate-spin"></div>
      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Carregando Módulo...</span>
    </div>
  </div>
);

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-8 flex justify-center items-center h-screen bg-slate-900 text-white">Carregando...</div>;
  if (!user) return <Navigate to="/login" />;
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Website */}
        <Route path="/" element={<PublicLayout />}>
          <Route index element={<Home />} />
          <Route path="portfolio" element={<PortfolioPage />} />
          <Route path="os/:orderId" element={<OSView />} />
        </Route>

        <Route path="/login" element={<Login />} />

        {/* Admin App */}
        <Route path="/app" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route index element={<Suspense fallback={<AdminPageLoader />}><Dashboard /></Suspense>} />
          <Route path="clients" element={<Suspense fallback={<AdminPageLoader />}><Clients /></Suspense>} />
          <Route path="quotes" element={<Suspense fallback={<AdminPageLoader />}><Quotes /></Suspense>} />
          <Route path="orders" element={<Suspense fallback={<AdminPageLoader />}><ServiceOrders /></Suspense>} />
          <Route path="agenda" element={<Suspense fallback={<AdminPageLoader />}><Agenda /></Suspense>} />
          <Route path="portfolio" element={<Suspense fallback={<AdminPageLoader />}><PortfolioAdmin /></Suspense>} />
          <Route path="services" element={<Suspense fallback={<AdminPageLoader />}><ServicesAdmin /></Suspense>} />
          <Route path="leads" element={<Suspense fallback={<AdminPageLoader />}><LeadsAdmin /></Suspense>} />
          <Route path="financial" element={<Suspense fallback={<AdminPageLoader />}><Financial /></Suspense>} />
          <Route path="settings" element={<Suspense fallback={<AdminPageLoader />}><Settings /></Suspense>} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
