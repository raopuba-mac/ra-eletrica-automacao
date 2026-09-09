import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import {
  MessageSquare,
  FileText,
  Zap,
  PhoneCall,
  UserCheck,
  ArrowUpRight,
  Sparkles,
  Clock,
  PlusCircle,
  ExternalLink,
  DollarSign,
} from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import {
  DashboardLeadItem,
  DashboardQuoteItem,
  DashboardOrderItem,
  DashboardClient,
  CommercialMetricsData,
} from '../types/dashboard.types';
import { CommercialMetrics } from './CommercialMetrics';
import { CommercialFunnel } from './CommercialFunnel';
import { CommercialFollowUp } from './CommercialFollowUp';
import { CommercialCopilotWidget } from './CommercialCopilotWidget';
import { getLeadWhatsAppUrl } from '../utils/commercialUtils';

interface DashboardCommercialHubProps {
  commercialMetrics: CommercialMetricsData;
  pendingLeads: DashboardLeadItem[];
  allLeads: DashboardLeadItem[];
  pendingQuotes: DashboardQuoteItem[];
  allQuotes: DashboardQuoteItem[];
  activeOrders: DashboardOrderItem[];
  clients: DashboardClient[];
  onUpdateLeadStatus: (id: string, status: string) => Promise<void>;
  onConvertLead: (lead: DashboardLeadItem) => Promise<void>;
}

export const DashboardCommercialHub: React.FC<DashboardCommercialHubProps> = ({
  commercialMetrics,
  pendingLeads,
  pendingQuotes,
  activeOrders,
  clients,
  onUpdateLeadStatus,
  onConvertLead,
}) => {
  const [activeTab, setActiveTab] = useState<'leads' | 'quotes' | 'orders' | 'quick'>('leads');
  const [actingLeadId, setActingLeadId] = useState<string | null>(null);

  const getOrderWhatsAppUrl = (order: DashboardOrderItem) => {
    const client = clients.find((c) => c.id === order.clientId);
    const phone = client?.phone || '';
    const digits = phone.replace(/\D/g, '');
    const number = digits.length === 10 || digits.length === 11 ? `55${digits}` : digits;
    if (!number) return '#';
    const clientName = client?.name || 'Cliente';
    const text = `Olá, ${clientName}! Tudo bem?\n\nPassando para dar um retorno sobre a sua Ordem de Serviço (${
      order.description || 'Atendimento'
    }). Estamos à disposição!`;
    return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
  };

  const handleStatusChange = async (id: string, status: string) => {
    setActingLeadId(id);
    try {
      await onUpdateLeadStatus(id, status);
    } catch (e) {
      console.error(e);
    } finally {
      setActingLeadId(null);
    }
  };

  const handleConvert = async (lead: DashboardLeadItem) => {
    setActingLeadId(lead.id);
    try {
      await onConvertLead(lead);
    } catch (e) {
      console.error(e);
    } finally {
      setActingLeadId(null);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden space-y-0">
      {/* Header & Overall Metrics */}
      <div className="p-6 md:p-8 bg-slate-900 text-white space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EAB308]/20 border border-[#EAB308]/30 text-[#EAB308] text-[10px] font-black uppercase tracking-widest mb-3">
              <Sparkles className="w-3.5 h-3.5" /> Central Comercial & CRM RA ERP 5.0
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight italic">
              Gestão Comercial & Atendimento
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Visão consolidada do funil de vendas, relatórios de propostas e relacionamento com clientes.
            </p>
          </div>

          {/* Tab Selection */}
          <div className="flex flex-wrap gap-2 bg-slate-800/80 p-1.5 rounded-2xl border border-slate-700/50 self-start md:self-auto">
            <button
              type="button"
              onClick={() => setActiveTab('leads')}
              className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'leads'
                  ? 'bg-[#EAB308] text-slate-950 shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Leads</span>
              {pendingLeads.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-slate-950 text-[#EAB308]">
                  {pendingLeads.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('quotes')}
              className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'quotes'
                  ? 'bg-[#EAB308] text-slate-950 shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Follow-up Orçamentos</span>
              {pendingQuotes.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-purple-950 text-purple-300">
                  {pendingQuotes.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('orders')}
              className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'orders'
                  ? 'bg-[#EAB308] text-slate-950 shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>OS Ativas</span>
              {activeOrders.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-amber-950 text-amber-300">
                  {activeOrders.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('quick')}
              className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'quick'
                  ? 'bg-[#EAB308] text-slate-950 shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              <span>Ações Rápidas</span>
            </button>
          </div>
        </div>

        {/* Commercial Metrics Grid */}
        <CommercialMetrics metrics={commercialMetrics} />

        {/* Commercial Funnel */}
        <CommercialFunnel metrics={commercialMetrics} activeOrdersCount={activeOrders.length} />

        {/* Gemini Commercial Copilot */}
        <CommercialCopilotWidget
          leads={pendingLeads}
          quotes={pendingQuotes}
          activeOrders={activeOrders}
          metrics={commercialMetrics}
        />
      </div>

      {/* Content Area */}
      <div className="p-6 md:p-8 bg-white">
        <AnimatePresence mode="wait">
          {/* LEADS TAB */}
          {activeTab === 'leads' && (
            <motion.div
              key="leads"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="flex justify-between items-center mb-2">
                <div>
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-[#ca8a04]" /> Leads e Oportunidades no Site
                  </h3>
                  <p className="text-xs text-slate-500">
                    Atenda contatos recentes ou converta em cadastros oficiais de clientes
                  </p>
                </div>
                <Link
                  to="/app/leads"
                  className="text-xs font-bold text-[#ca8a04] hover:underline flex items-center gap-1"
                >
                  Ver Todos os Leads <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {pendingLeads.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pendingLeads.map((lead) => {
                    const waUrl = getLeadWhatsAppUrl(lead);
                    const isLoading = actingLeadId === lead.id;

                    return (
                      <div
                        key={lead.id}
                        className="bg-slate-50 border border-slate-200 rounded-2xl p-5 hover:border-[#EAB308] transition-all flex flex-col justify-between gap-4"
                      >
                        <div>
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-black text-slate-900 text-lg">{lead.name}</span>
                            <span
                              className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${
                                lead.status === 'new'
                                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                  : 'bg-blue-100 text-blue-800 border border-blue-200'
                              }`}
                            >
                              {lead.status === 'new' ? 'Novo' : 'Em Atendimento'}
                            </span>
                          </div>

                          <div className="space-y-1 text-xs text-slate-600">
                            {lead.serviceType && (
                              <p className="font-semibold text-slate-800">
                                🛠 Serviço: <span className="font-bold text-slate-900">{lead.serviceType}</span>
                              </p>
                            )}
                            {lead.phone && <p>📱 {lead.phone}</p>}
                            {lead.email && <p>✉️ {lead.email}</p>}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-200">
                          {lead.phone && (
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-xs"
                            >
                              <PhoneCall className="w-3.5 h-3.5" /> WhatsApp
                            </a>
                          )}

                          {lead.status === 'new' && (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={isLoading}
                              onClick={() => handleStatusChange(lead.id, 'contacted')}
                              className="text-xs font-bold border-slate-300 hover:bg-slate-100"
                            >
                              Marcar Lido
                            </Button>
                          )}

                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isLoading}
                            onClick={() => handleConvert(lead)}
                            className="text-xs font-bold bg-white text-slate-900 border-slate-300 hover:bg-amber-50 hover:border-amber-300"
                          >
                            <UserCheck className="w-3.5 h-3.5 mr-1 text-[#ca8a04]" /> Virou Cliente
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 border-2 border-dashed border-slate-200 rounded-3xl text-center bg-slate-50">
                  <MessageSquare className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                  <p className="font-black text-slate-800 uppercase italic">Nenhum Lead Pendente</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Todos os contatos recebidos já foram atendidos ou convertidos.
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {/* QUOTES TAB (FOLLOW-UP) */}
          {activeTab === 'quotes' && (
            <motion.div
              key="quotes"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <CommercialFollowUp quotes={pendingQuotes} clients={clients} />
            </motion.div>
          )}

          {/* ORDERS TAB */}
          {activeTab === 'orders' && (
            <motion.div
              key="orders"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-500" /> Ordens de Serviço em Execução
                </h3>
                <Link
                  to="/app/orders"
                  className="text-xs font-bold text-[#ca8a04] hover:underline flex items-center gap-1"
                >
                  Ver Gestão de OS <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {activeOrders.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeOrders.map((order) => {
                    const client = clients.find((c) => c.id === order.clientId);
                    const clientName = client?.name || 'Cliente';
                    const waUrl = getOrderWhatsAppUrl(order);

                    return (
                      <div
                        key={order.id}
                        className="bg-slate-50 border border-slate-200 rounded-2xl p-5 hover:border-amber-300 transition-all flex flex-col justify-between gap-4"
                      >
                        <div>
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <span className="font-black text-slate-900 text-lg leading-tight block">
                                {clientName}
                              </span>
                              <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                                {order.description || 'Atendimento técnico'}
                              </p>
                            </div>
                            <span
                              className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${
                                order.status === 'completed'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {order.status === 'completed' ? 'Concluída' : 'Agendada'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-3 border-t border-slate-200">
                          {client?.phone && (
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-xs"
                            >
                              <PhoneCall className="w-3.5 h-3.5" /> Contatar
                            </a>
                          )}
                          <Link
                            to="/app/orders"
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" /> Gerenciar OS
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 border-2 border-dashed border-slate-200 rounded-3xl text-center bg-slate-50">
                  <Zap className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                  <p className="font-black text-slate-800 uppercase italic">Nenhuma OS Ativa</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Não há Ordens de Serviço agendadas ou em andamento no momento.
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {/* QUICK ACTIONS TAB */}
          {activeTab === 'quick' && (
            <motion.div
              key="quick"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4"
            >
              <Link
                to="/app/clients"
                className="p-5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-[#EAB308] transition-all group flex flex-col justify-between h-36"
              >
                <div>
                  <UserCheck className="w-6 h-6 text-[#ca8a04] mb-2 group-hover:scale-110 transition-transform" />
                  <span className="font-black text-slate-900 text-base block">Novo Cliente</span>
                  <p className="text-xs text-slate-500">Cadastrar novo cliente diretamente na base</p>
                </div>
                <div className="text-xs font-bold text-[#ca8a04] flex items-center gap-1">
                  Acessar <ArrowUpRight className="w-3.5 h-3.5" />
                </div>
              </Link>

              <Link
                to="/app/quotes"
                className="p-5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-purple-300 transition-all group flex flex-col justify-between h-36"
              >
                <div>
                  <FileText className="w-6 h-6 text-purple-600 mb-2 group-hover:scale-110 transition-transform" />
                  <span className="font-black text-slate-900 text-base block">Novo Orçamento</span>
                  <p className="text-xs text-slate-500">Criar proposta técnica com calculadora ou IA</p>
                </div>
                <div className="text-xs font-bold text-purple-600 flex items-center gap-1">
                  Acessar <ArrowUpRight className="w-3.5 h-3.5" />
                </div>
              </Link>

              <Link
                to="/app/orders"
                className="p-5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-amber-300 transition-all group flex flex-col justify-between h-36"
              >
                <div>
                  <Zap className="w-6 h-6 text-amber-500 mb-2 group-hover:scale-110 transition-transform" />
                  <span className="font-black text-slate-900 text-base block">Nova OS</span>
                  <p className="text-xs text-slate-500">Emitir Ordem de Serviço agendada</p>
                </div>
                <div className="text-xs font-bold text-amber-600 flex items-center gap-1">
                  Acessar <ArrowUpRight className="w-3.5 h-3.5" />
                </div>
              </Link>

              <Link
                to="/app/agenda"
                className="p-5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-blue-300 transition-all group flex flex-col justify-between h-36"
              >
                <div>
                  <Clock className="w-6 h-6 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
                  <span className="font-black text-slate-900 text-base block">Novo Compromisso</span>
                  <p className="text-xs text-slate-500">Agendar visita técnica ou reunião</p>
                </div>
                <div className="text-xs font-bold text-blue-600 flex items-center gap-1">
                  Acessar <ArrowUpRight className="w-3.5 h-3.5" />
                </div>
              </Link>

              <Link
                to="/app/financial"
                className="p-5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-emerald-300 transition-all group flex flex-col justify-between h-36"
              >
                <div>
                  <DollarSign className="w-6 h-6 text-emerald-600 mb-2 group-hover:scale-110 transition-transform" />
                  <span className="font-black text-slate-900 text-base block">Módulo Financeiro</span>
                  <p className="text-xs text-slate-500">Contas a receber, lançamentos e cobranças</p>
                </div>
                <div className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                  Acessar <ArrowUpRight className="w-3.5 h-3.5" />
                </div>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
