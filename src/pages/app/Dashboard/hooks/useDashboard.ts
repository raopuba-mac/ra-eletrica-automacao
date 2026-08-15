import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../components/AuthProvider';
import { dashboardService } from '../services/dashboardService';
import { leadService } from '../../Leads/services/leadService';
import { buildWhatsAppShareUrl } from '../utils/dashboardUtils';
import { calculateConversionRate } from '../utils/commercialUtils';
import {
  DashboardStatsData,
  CommercialMetricsData,
  DashboardUpcomingEvent,
  DashboardFinishedOrder,
  DashboardClient,
  DashboardLeadItem,
  DashboardQuoteItem,
  DashboardOrderItem,
} from '../types/dashboard.types';

export function useDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState<DashboardStatsData>({
    clients: 0,
    orders: 0,
    leads: 0,
    quotes: 0,
  });
  const [upcomingEvents, setUpcomingEvents] = useState<DashboardUpcomingEvent[]>([]);
  const [finishedOrders, setFinishedOrders] = useState<DashboardFinishedOrder[]>([]);
  const [clients, setClients] = useState<DashboardClient[]>([]);
  const [allLeads, setAllLeads] = useState<DashboardLeadItem[]>([]);
  const [allQuotes, setAllQuotes] = useState<DashboardQuoteItem[]>([]);
  const [activeOrdersList, setActiveOrdersList] = useState<DashboardOrderItem[]>([]);

  // PWA & Quick Intake Mobile States
  const [showPwaGuide, setShowPwaGuide] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  const [quickClientName, setQuickClientName] = useState('');
  const [quickClientPhone, setQuickClientPhone] = useState('');
  const [quickClientAddress, setQuickClientAddress] = useState('');
  const [quickDescription, setQuickDescription] = useState('');
  const [quickType, setQuickType] = useState<'os' | 'quote'>('os');
  const [isQuickSubmitting, setIsQuickSubmitting] = useState(false);
  const [quickSuccess, setQuickSuccess] = useState(false);

  useEffect(() => {
    // Detect if running as installed standalone app (PWA)
    const mql = window.matchMedia('(display-mode: standalone)');
    setIsStandalone(mql.matches);

    // Auto-expand PWA install instructions on mobile browsers (not installed yet)
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
    if (isMobile && !mql.matches) {
      setShowPwaGuide(true);
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    const unsubClients = dashboardService.subscribeToClients(
      user.uid,
      (clientData, count) => {
        setClients(clientData);
        setStats((s) => ({ ...s, clients: count }));
      }
    );

    const unsubOrdersCount = dashboardService.subscribeToOrdersCount(
      user.uid,
      (count) => {
        setStats((s) => ({ ...s, orders: count }));
      }
    );

    const unsubFinished = dashboardService.subscribeToFinishedOrders(
      user.uid,
      (orders) => {
        setFinishedOrders(orders);
      }
    );

    const unsubAllLeads = dashboardService.subscribeToAllLeads(
      user.uid,
      (leads) => {
        setAllLeads(leads);
      }
    );

    const unsubAllQuotes = dashboardService.subscribeToAllQuotes(
      user.uid,
      (quotes) => {
        setAllQuotes(quotes);
      }
    );

    const unsubEvents = dashboardService.subscribeToUpcomingEvents(
      user.uid,
      (events) => {
        setUpcomingEvents(events);
      }
    );

    const unsubActiveOrdersList = dashboardService.subscribeToActiveOrdersList(
      user.uid,
      (orders) => {
        setActiveOrdersList(orders);
      }
    );

    return () => {
      unsubClients();
      unsubOrdersCount();
      unsubFinished();
      unsubAllLeads();
      unsubAllQuotes();
      unsubEvents();
      unsubActiveOrdersList();
    };
  }, [user]);

  const commercialMetrics: CommercialMetricsData = useMemo(() => {
    const leadsNew = allLeads.filter((l) => l.status === 'new').length;
    const leadsContacted = allLeads.filter((l) => l.status === 'contacted').length;
    const leadsConverted = allLeads.filter((l) => l.status === 'converted').length;
    const leadsTotal = allLeads.length;

    const quotesPending = allQuotes.filter((q) => q.status === 'pending').length;
    const quotesApproved = allQuotes.filter((q) => q.status === 'approved').length;
    const quotesRejected = allQuotes.filter((q) => q.status === 'rejected').length;
    const quotesTotal = allQuotes.length;

    const inNegotiationValue = allQuotes
      .filter((q) => q.status === 'pending')
      .reduce((sum, q) => sum + (Number(q.totalAmount) || 0), 0);

    const conversionRate = calculateConversionRate(quotesApproved, quotesRejected);

    return {
      leadsNew,
      leadsContacted,
      leadsConverted,
      leadsTotal,
      quotesPending,
      quotesApproved,
      quotesRejected,
      quotesTotal,
      inNegotiationValue,
      conversionRate,
    };
  }, [allLeads, allQuotes]);

  useEffect(() => {
    setStats((s) => ({
      ...s,
      leads: commercialMetrics.leadsNew,
      quotes: commercialMetrics.quotesPending,
    }));
  }, [commercialMetrics.leadsNew, commercialMetrics.quotesPending]);

  const pendingLeads = useMemo(() => {
    return allLeads
      .filter((l) => l.status === 'new' || l.status === 'contacted')
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }, [allLeads]);

  const pendingQuotesList = useMemo(() => {
    return allQuotes
      .filter((q) => q.status === 'pending')
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }, [allQuotes]);

  const handleUpdateLeadStatus = async (id: string, status: string) => {
    await leadService.updateLeadStatus(id, status);
  };

  const handleConvertLeadToClient = async (lead: any) => {
    if (!user) return;
    await leadService.convertLeadToClient(user.uid, lead);
  };

  const handleQuickSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!quickClientName.trim() || !quickDescription.trim()) {
      alert('Por favor, preencha o Nome do Cliente e a Descrição do Serviço.');
      return;
    }

    setIsQuickSubmitting(true);
    try {
      const result = await dashboardService.createQuickIntake(user.uid, {
        quickClientName,
        quickClientPhone,
        quickClientAddress,
        quickDescription,
        quickType,
      });

      setQuickSuccess(true);
      setTimeout(() => {
        setQuickSuccess(false);
        setQuickClientName('');
        setQuickClientPhone('');
        setQuickClientAddress('');
        setQuickDescription('');
        if (result.type === 'os') {
          navigate('/app/orders');
        } else {
          navigate('/app/quotes');
        }
      }, 1500);
    } catch (err) {
      console.error(err);
      alert('Erro ao registrar atendimento rápido: ' + (err as Error).message);
    } finally {
      setIsQuickSubmitting(false);
    }
  };

  const shareWhatsApp = (order: DashboardFinishedOrder) => {
    const client = clients.find((c) => c.id === order.clientId);
    const url = buildWhatsAppShareUrl(order, client);
    if (!url) {
      alert('Cliente não encontrado ou sem telefone cadastrado.');
      return;
    }
    window.open(url, '_blank');
  };

  return {
    user,
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
    isStandalone,
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
  };
}
