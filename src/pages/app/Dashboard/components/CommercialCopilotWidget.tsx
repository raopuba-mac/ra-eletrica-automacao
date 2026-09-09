import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Bot,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Check,
  Send,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  ArrowRight,
  ShieldCheck,
  HelpCircle,
} from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import {
  DashboardLeadItem,
  DashboardQuoteItem,
  DashboardOrderItem,
  CommercialMetricsData,
  CommercialCopilotResult,
  CopilotPriority,
  CopilotSuggestedMessage,
} from '../types/dashboard.types';
import { fetchCommercialCopilotAnalysis } from '../services/commercialCopilotService';

interface CommercialCopilotWidgetProps {
  leads: DashboardLeadItem[];
  quotes: DashboardQuoteItem[];
  activeOrders: DashboardOrderItem[];
  metrics: CommercialMetricsData;
}

export const CommercialCopilotWidget: React.FC<CommercialCopilotWidgetProps> = ({
  leads,
  quotes,
  activeOrders,
  metrics,
}) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CommercialCopilotResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  const totalItems = leads.length + quotes.length + activeOrders.length;

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCommercialCopilotAnalysis({
        leads,
        quotes,
        activeOrders,
        metrics,
      });
      setResult(data);
      setIsExpanded(true);
    } catch (err: any) {
      console.error('Error running Commercial Copilot:', err);
      setError(
        err.message || 'Erro ao conectar ao Copiloto Comercial. Tente novamente em instantes.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => {
      setCopiedIndex(null);
    }, 2000);
  };

  const getWhatsAppUrl = (phone?: string, message?: string) => {
    const rawPhone = (phone || '').replace(/\D/g, '');
    const formattedPhone =
      rawPhone.length === 10 || rawPhone.length === 11 ? `55${rawPhone}` : rawPhone;
    if (!formattedPhone) return '#';
    return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message || '')}`;
  };

  const renderPriorityBadge = (level: string) => {
    switch (level.toLowerCase()) {
      case 'high':
      case 'alta':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-500/10 text-rose-700 border border-rose-300">
            <AlertTriangle className="w-3 h-3 text-rose-600" /> Prioridade Alta
          </span>
        );
      case 'medium':
      case 'media':
      case 'médias':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500/10 text-amber-800 border border-amber-300">
            Prioridade Média
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-slate-100 text-slate-700 border border-slate-300">
            Prioridade Baixa
          </span>
        );
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white rounded-3xl border border-slate-800 shadow-md p-6 md:p-8 space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-3 rounded-2xl bg-[#EAB308]/15 border border-[#EAB308]/30 text-[#EAB308] shrink-0">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-[#EAB308]/20 border border-[#EAB308]/30 text-[#EAB308] text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> IA Comercial Assistiva
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                Gemini 3.6 Flash
              </span>
            </div>
            <h3 className="text-xl md:text-2xl font-black text-white italic tracking-tight">
              Copiloto Comercial & Análise de Oportunidades
            </h3>
            <p className="text-xs text-slate-300 mt-1">
              Análise inteligente de Leads, Orçamentos e sugestão de mensagens de follow-up.
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
          <Button
            type="button"
            onClick={handleAnalyze}
            disabled={loading}
            className="bg-[#EAB308] hover:bg-amber-400 text-slate-950 font-black text-xs px-5 py-3 rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-70"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Analisando Oportunidades...</span>
              </>
            ) : result ? (
              <>
                <RefreshCw className="w-4 h-4" />
                <span>Atualizar Análise</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Analisar Meu Comercial</span>
              </>
            )}
          </Button>

          {result && (
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
              title={isExpanded ? 'Recolher Painel' : 'Expandir Painel'}
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Safety Notice Banner */}
      <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center gap-2 text-xs text-slate-300">
        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
        <span>
          <strong>Modo Seguro:</strong> A IA apenas analisa e sugere. Nenhuma ação no banco de dados ou envio automático é realizado sem sua autorização manual.
        </span>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-800 text-rose-200 text-xs flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          <div>
            <p className="font-bold">Aviso do Copiloto Comercial</p>
            <p className="text-rose-300">{error}</p>
          </div>
        </div>
      )}

      {/* Initial Prompt State when no analysis generated yet */}
      {!result && !loading && !error && (
        <div className="p-6 rounded-2xl bg-slate-800/40 border border-slate-800 text-center space-y-3">
          <Lightbulb className="w-8 h-8 text-[#EAB308] mx-auto opacity-80" />
          <p className="text-sm font-semibold text-slate-200">
            Você possui <span className="text-[#EAB308] font-black">{totalItems}</span> registros comerciais em andamento ({leads.length} Leads, {quotes.length} Orçamentos e {activeOrders.length} OS ativas).
          </p>
          <p className="text-xs text-slate-400 max-w-lg mx-auto">
            Clique no botão acima para que a inteligência artificial organize suas prioridades do dia e gere textos de follow-up prontos para envio no WhatsApp.
          </p>
        </div>
      )}

      {/* Analysis Results Display */}
      <AnimatePresence>
        {result && isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-6 pt-2 border-t border-slate-800"
          >
            {/* Executive Summary */}
            {result.summary && (
              <div className="p-5 rounded-2xl bg-slate-800/90 border border-slate-700/80 space-y-1">
                <span className="text-[10px] font-black uppercase text-[#EAB308] tracking-widest block">
                  Resumo Executivo do Comercial
                </span>
                <p className="text-sm font-medium text-slate-100 leading-relaxed">
                  {result.summary}
                </p>
              </div>
            )}

            {/* Priorities Grid */}
            {result.priorities && result.priorities.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-[#EAB308]" /> Prioridades Comerciais Recomendadas
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {result.priorities.map((item: CopilotPriority, idx: number) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/60 hover:border-slate-600 transition-colors space-y-2"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <span className="font-bold text-slate-100 text-sm">
                          {item.title}
                        </span>
                        {renderPriorityBadge(item.level)}
                      </div>
                      <p className="text-xs text-slate-300">
                        {item.reason}
                      </p>
                      {item.suggestedAction && (
                        <div className="pt-2 border-t border-slate-700/50 flex items-center gap-1.5 text-xs text-[#EAB308] font-semibold">
                          <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                          <span>{item.suggestedAction}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* WhatsApp Suggested Follow-up Messages */}
            {result.suggestedMessages && result.suggestedMessages.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Send className="w-4 h-4 text-emerald-400" /> Sugestões de Mensagem de Follow-up (WhatsApp)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {result.suggestedMessages.map((msg: CopilotSuggestedMessage, idx: number) => {
                    const waUrl = getWhatsAppUrl(msg.phone, msg.message);
                    const isCopied = copiedIndex === idx;

                    return (
                      <div
                        key={idx}
                        className="p-4 rounded-2xl bg-slate-950/80 border border-emerald-900/40 hover:border-emerald-700/60 transition-all flex flex-col justify-between gap-3"
                      >
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-bold text-emerald-300 text-sm">
                              {msg.targetName}
                            </span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/50 uppercase">
                              {msg.type === 'quote' ? 'Orçamento' : 'Lead'}
                            </span>
                          </div>

                          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-200 font-sans italic whitespace-pre-wrap leading-relaxed">
                            "{msg.message}"
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                          <button
                            type="button"
                            onClick={() => handleCopy(msg.message, idx)}
                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                          >
                            {isCopied ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-emerald-400">Copiado!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copiar</span>
                              </>
                            )}
                          </button>

                          {msg.phone && waUrl !== '#' && (
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors flex items-center gap-1.5 shadow-xs"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>Abrir WhatsApp</span>
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Opportunities & Next Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {result.opportunities && result.opportunities.length > 0 && (
                <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/50 space-y-2">
                  <h5 className="text-xs font-black uppercase tracking-wider text-[#EAB308] flex items-center gap-1.5">
                    <Lightbulb className="w-4 h-4" /> Oportunidades Mapeadas
                  </h5>
                  <ul className="space-y-2 text-xs text-slate-200">
                    {result.opportunities.map((opp, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#EAB308] shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-white block">{opp.title}</strong>
                          <span className="text-slate-300">{opp.description}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.nextActions && result.nextActions.length > 0 && (
                <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/50 space-y-2">
                  <h5 className="text-xs font-black uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                    <ArrowRight className="w-4 h-4" /> Próximos Passos
                  </h5>
                  <ul className="space-y-2 text-xs text-slate-200">
                    {result.nextActions.map((action, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                        <div>
                          <strong className="text-white block">{action.title}</strong>
                          <span className="text-slate-300">{action.description}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
