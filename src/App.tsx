import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './components/AuthProvider';
import DashboardLayout from './pages/DashboardLayout';
import PublicLayout from './pages/PublicLayout';
import Home from './pages/public/Home';
import PortfolioPage from './pages/public/PortfolioPage';
import Dashboard from './pages/app/Dashboard';
import Clients from './pages/app/Clients';
import Quotes from './pages/app/Quotes';
import ServiceOrders from './pages/app/ServiceOrders';
import Agenda from './pages/app/Agenda';
import PortfolioAdmin from './pages/app/PortfolioAdmin';
import ServicesAdmin from './pages/app/ServicesAdmin';
import LeadsAdmin from './pages/app/LeadsAdmin';
import Settings from './pages/app/Settings';
import Login from './pages/Login';

import OSView from './pages/public/OSView';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-8 flex justify-center items-center h-screen">Carregando...</div>;
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
          <Route index element={<Dashboard />} />
          <Route path="clients" element={<Clients />} />
          <Route path="quotes" element={<Quotes />} />
          <Route path="orders" element={<ServiceOrders />} />
          <Route path="agenda" element={<Agenda />} />
          <Route path="portfolio" element={<PortfolioAdmin />} />
          <Route path="services" element={<ServicesAdmin />} />
          <Route path="leads" element={<LeadsAdmin />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
