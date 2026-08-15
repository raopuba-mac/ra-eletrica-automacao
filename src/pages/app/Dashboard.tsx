import React from 'react';
import { useDashboard } from './Dashboard/hooks/useDashboard';
import { DashboardWelcome } from './Dashboard/components/DashboardWelcome';
import { DashboardPwaGuide } from './Dashboard/components/DashboardPwaGuide';
import { DashboardQuickIntake } from './Dashboard/components/DashboardQuickIntake';
import { DashboardLeadAlert } from './Dashboard/components/DashboardLeadAlert';
import { DashboardStats } from './Dashboard/components/DashboardStats';
import { DashboardPendingQuotesAlert } from './Dashboard/components/DashboardPendingQuotesAlert';
import { DashboardAgenda } from './Dashboard/components/DashboardAgenda';
import { DashboardFinishedOrders } from './Dashboard/components/DashboardFinishedOrders';
import { DashboardInsights } from './Dashboard/components/DashboardInsights';
import { DashboardCommercialHub } from './Dashboard/components/DashboardCommercialHub';

export function Dashboard() {
  const {
    stats,
    commercialMetrics,
    upcomingEvents,
    finishedOrders,
    clients,
    allLeads,
    allQuotes,
    pendingLeads,
    pendingQuotesList,
    activeOrdersList,
    handleUpdateLeadStatus,
    handleConvertLeadToClient,
    showPwaGuide,
    setShowPwaGuide,
    quickClientName,
    setQuickClientName,
    quickClientPhone,
    setQuickClientPhone,
    quickClientAddress,
    setQuickClientAddress,
    quickDescription,
    setQuickDescription,
    quickType,
    setQuickType,
    isQuickSubmitting,
    quickSuccess,
    handleQuickSubmit,
    shareWhatsApp,
  } = useDashboard();

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Welcome & Quick Action Header */}
      <DashboardWelcome />

      {/* PWA Mobile Installation Guide */}
      <DashboardPwaGuide
        showPwaGuide={showPwaGuide}
        onClose={() => setShowPwaGuide(false)}
      />

      {/* Quick Intake Form (On-site) */}
      <DashboardQuickIntake
        quickClientName={quickClientName}
        setQuickClientName={setQuickClientName}
        quickClientPhone={quickClientPhone}
        setQuickClientPhone={setQuickClientPhone}
        quickClientAddress={quickClientAddress}
        setQuickClientAddress={setQuickClientAddress}
        quickDescription={quickDescription}
        setQuickDescription={setQuickDescription}
        quickType={quickType}
        setQuickType={setQuickType}
        isQuickSubmitting={isQuickSubmitting}
        quickSuccess={quickSuccess}
        onSubmit={handleQuickSubmit}
      />

      {/* Central de Atendimento & Inteligência Comercial */}
      <DashboardCommercialHub
        commercialMetrics={commercialMetrics}
        pendingLeads={pendingLeads}
        allLeads={allLeads}
        pendingQuotes={pendingQuotesList}
        allQuotes={allQuotes}
        activeOrders={activeOrdersList}
        clients={clients}
        onUpdateLeadStatus={handleUpdateLeadStatus}
        onConvertLead={handleConvertLeadToClient}
      />

      {/* Prominent Lead Banner */}
      <DashboardLeadAlert leadsCount={stats.leads} />

      {/* Key Metrics Grid */}
      <DashboardStats stats={stats} />

      {/* Alert Card for Pending Quotes */}
      <DashboardPendingQuotesAlert quotesCount={stats.quotes} />

      {/* Main Grid: Agenda & Finished Services */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Upcoming Events / Visits */}
          <DashboardAgenda upcomingEvents={upcomingEvents} />

          {/* Finished Services List */}
          <DashboardFinishedOrders
            finishedOrders={finishedOrders}
            clients={clients}
            onShareWhatsApp={shareWhatsApp}
          />
        </div>

        {/* Right Column: Tips & Performance */}
        <div className="space-y-8">
          <DashboardInsights />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
