import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Send, X, RotateCcw, Sparkles, Phone, ArrowRight, Bot, User, Check } from 'lucide-react';
import { Button } from './ui/button';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

interface AIChatbotProps {
  phone?: string;
  companyName?: string;
}

export default function AIChatbot({ phone = '5534992609206', companyName = 'RA | Elétrica & Automação' }: AIChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: `Olá! Sou o assistente virtual da **${companyName}**. 

Estou aqui para fazer o seu primeiro atendimento e te ajudar a solicitar um orçamento para **Instalações Elétricas**, **Automação Residencial** ou **Segurança Eletrônica**.

Como posso te ajudar hoje?`,
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showTooltip, setShowTooltip] = useState(true);
  const [protocolData, setProtocolData] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  // Hide tooltip after a delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTooltip(false);
    }, 8000);
    return () => clearTimeout(timer);
  }, []);

  // Listen to open-chatbot event from other components
  useEffect(() => {
    const handleOpen = () => {
      setIsOpen(true);
      setShowTooltip(false);
    };
    window.addEventListener('open-chatbot', handleOpen);
    return () => window.removeEventListener('open-chatbot', handleOpen);
  }, []);

  // Detect when to show WhatsApp button and extract protocol info
  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (lastMsg && lastMsg.role === 'assistant' && !isGenerating) {
      if (lastMsg.text.includes('Protocolo') || lastMsg.text.includes('WhatsApp') || lastMsg.text.includes('visita técnica')) {
        // Strip out the greeting and system text if possible to isolate protocol, 
        // or just use the full last message as summary.
        setProtocolData(lastMsg.text);
      }
    }
  }, [messages, isGenerating]);

  // Focus input when opening
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    }
  }, [isOpen]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isGenerating) return;

    const userMsg: Message = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      text: textToSend,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsGenerating(true);

    const assistantMsgId = `msg-${Date.now()}-assistant`;
    let assistantText = '';

    // Set temporary assistant message to stream into
    setMessages((prev) => [
      ...prev,
      {
        id: assistantMsgId,
        role: 'assistant',
        text: '',
      },
    ]);

    try {
      // Build history for backend chat API
      // Exclude the first welcome message and map to simplified history format
      const history = messages
        .filter((m) => m.id !== 'welcome')
        .map((m) => ({
          role: m.role,
          text: m.text,
        }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: textToSend,
          history,
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('RATE_LIMIT_EXCEEDED');
        }
        throw new Error('Erro ao obter resposta do assistente.');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error('Não foi possível ler o fluxo de dados.');

      let finished = false;
      let partialChunk = '';

      while (!finished) {
        const { value, done } = await reader.read();
        if (done) {
          finished = true;
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        const lines = (partialChunk + chunk).split('\n');
        partialChunk = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          if (trimmed.startsWith('data: ')) {
            const dataStr = trimmed.slice(6);
            if (dataStr === '[DONE]') {
              finished = true;
              break;
            }

            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.text) {
                assistantText += parsed.text;
                setMessages((prev) =>
                  prev.map((m) => (m.id === assistantMsgId ? { ...m, text: assistantText } : m))
                );
              } else if (parsed.error) {
                throw new Error(parsed.error);
              }
            } catch (e: any) {
              if (e.message === 'RATE_LIMIT_EXCEEDED') {
                throw e;
              }
              // Ignore partial parse issues
            }
          }
        }
      }
    } catch (err: any) {
      console.error('Chat error:', err);
      const isRateLimit = err.message === 'RATE_LIMIT_EXCEEDED' || String(err).includes('RATE_LIMIT_EXCEEDED');
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId
            ? {
                ...m,
                text: isRateLimit
                  ? 'Olá! No momento o nosso assistente virtual está com uma demanda muito alta de atendimentos (limite de cota atingido).\n\nPara que você não precise esperar, você pode falar diretamente com o técnico Renan no WhatsApp clicando no botão verde abaixo!'
                  : 'Desculpe, tive um problema de conexão temporário. Por favor, tente novamente ou clique em Falar no WhatsApp.',
              }
            : m
        )
      );
      if (isRateLimit) {
        setProtocolData('Fale Conosco no WhatsApp - Alta Demanda do Assistente Virtual');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(inputValue);
  };

  const handleClearHistory = () => {
    if (window.confirm('Deseja reiniciar a conversa? Isso apagará o histórico atual.')) {
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          text: `Olá! Sou o assistente virtual da **${companyName}**. 

Estou aqui para fazer o seu primeiro atendimento e te ajudar a solicitar um orçamento para **Instalações Elétricas**, **Automação Residencial** ou **Segurança Eletrônica**.

Como posso te ajudar hoje?`,
        },
      ]);
      setProtocolData(null);
      setInputValue('');
      setIsGenerating(false);
    }
  };

  const handleWhatsAppRedirect = () => {
    let text = `Olá Renan! Quero solicitar um atendimento através do assistente virtual do site.\n\n`;
    
    if (protocolData) {
      // Format protocol data cleanly for WhatsApp
      // Remove Markdown bold indicators **
      const cleanProtocol = protocolData
        .replace(/\*\*/g, '')
        .replace(/Falar no WhatsApp/gi, '')
        .trim();
      text += `*Dados do Atendimento:*\n${cleanProtocol}`;
    } else {
      text += `Gostaria de solicitar um orçamento para serviços elétricos/automação.`;
    }

    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  const quickStarters = [
    { label: 'Instalação Elétrica ⚡', text: 'Preciso de um serviço de Instalação Elétrica' },
    { label: 'Automação Residencial 🏡', text: 'Gostaria de automatizar minha casa (iluminação/Alexa/portão)' },
    { label: 'Segurança e CFTV 📹', text: 'Quero instalar câmeras de segurança e alarmes' },
  ];

  // Helper component to render message text with clean custom formatting
  const FormatMessageText = ({ text }: { text: string }) => {
    if (!text && isGenerating) {
      return (
        <div className="flex items-center gap-1.5 py-1">
          <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      );
    }

    const lines = text.split('\n');
    return (
      <div className="space-y-1.5 text-slate-800 dark:text-slate-100 selection:bg-blue-500/20">
        {lines.map((line, idx) => {
          let cleanLine = line;
          
          // Check for bullet items starting with * or -
          const isBullet = line.trim().startsWith('* ') || line.trim().startsWith('- ');
          if (isBullet) {
            cleanLine = line.trim().substring(2);
          }

          // Parse **bold** syntax safely
          const parts = [];
          let temp = cleanLine;
          const boldRegex = /\*\*(.*?)\*\*/g;
          let match;
          let lastIndex = 0;

          while ((match = boldRegex.exec(temp)) !== null) {
            const matchIndex = match.index;
            if (matchIndex > lastIndex) {
              parts.push(temp.substring(lastIndex, matchIndex));
            }
            parts.push(
              <strong key={matchIndex} className="font-extrabold text-slate-950">
                {match[1]}
              </strong>
            );
            lastIndex = boldRegex.lastIndex;
          }
          if (lastIndex < temp.length) {
            parts.push(temp.substring(lastIndex));
          }

          if (isBullet) {
            return (
              <div key={idx} className="flex gap-2 pl-1.5">
                <span className="text-blue-500 font-bold shrink-0">•</span>
                <span className="text-[13px] md:text-sm">{parts.length > 0 ? parts : cleanLine}</span>
              </div>
            );
          }

          return (
            <p key={idx} className="text-[13px] md:text-sm min-h-[0.75rem]">
              {parts.length > 0 ? parts : cleanLine}
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Tooltip speech bubble */}
      <AnimatePresence>
        {showTooltip && !isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="mb-3 mr-1 bg-slate-900 text-white text-xs md:text-sm font-semibold py-2.5 px-4 rounded-2xl shadow-xl flex items-center gap-2 border border-slate-800 max-w-xs relative pointer-events-none"
          >
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Fale com nosso assistente virtual!</span>
            <div className="absolute right-6 -bottom-1.5 w-3 h-3 bg-slate-900 border-r border-b border-slate-800 rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Floating Trigger Button */}
      <motion.button
        id="chatbot-trigger-btn"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          setIsOpen(!isOpen);
          setShowTooltip(false);
        }}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all relative ${
          isOpen 
            ? 'bg-slate-900 text-white border border-slate-800 hover:bg-slate-800' 
            : 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white hover:shadow-blue-500/20 hover:from-blue-500 hover:to-indigo-600'
        }`}
        aria-label="Abrir assistente virtual"
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <>
            <MessageSquare className="w-6 h-6" />
            <span className="absolute top-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white animate-ping" />
            <span className="absolute top-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
          </>
        )}
      </motion.button>

      {/* Expandable Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="chatbot-panel"
            initial={{ opacity: 0, scale: 0.9, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 40 }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="absolute bottom-16 right-0 w-96 max-w-[calc(100vw-2rem)] h-[550px] max-h-[calc(100vh-8rem)] bg-white rounded-2xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 p-4 flex items-center justify-between text-white border-b border-slate-800 relative">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0 border border-blue-400/20 shadow-md">
                  <Bot className="w-5.5 h-5.5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm tracking-wide flex items-center gap-1.5">
                    Assistente Virtual
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  </h3>
                  <p className="text-[10px] text-slate-300 font-medium">RA | Elétrica & Automação</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleClearHistory}
                  className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/60 transition"
                  title="Reiniciar Conversa"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/60 transition"
                  title="Fechar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
              {messages.map((msg) => {
                const isUser = msg.role === 'user';
                return (
                  <div key={msg.id} className={`flex items-start gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}>
                    {!isUser && (
                      <div className="w-8 h-8 rounded-lg bg-blue-600/10 text-blue-600 flex items-center justify-center shrink-0 border border-blue-500/10 mt-1">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-sm ${
                        isUser
                          ? 'bg-blue-600 text-white rounded-tr-none'
                          : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'
                      }`}
                    >
                      {isUser ? (
                        <p className="text-[13px] md:text-sm whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                      ) : (
                        <FormatMessageText text={msg.text} />
                      )}
                    </div>
                    {isUser && (
                      <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-1">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                );
              })}

              {isGenerating && messages[messages.length - 1]?.role === 'user' && (
                <div className="flex items-start gap-2.5 justify-start">
                  <div className="w-8 h-8 rounded-lg bg-blue-600/10 text-blue-600 flex items-center justify-center shrink-0 border border-blue-500/10 mt-1">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm">
                    <FormatMessageText text="" />
                  </div>
                </div>
              )}

              {/* Smart Quick WhatsApp Action Button inside scroll view if protocol detected */}
              {protocolData && !isGenerating && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl space-y-2.5 animate-in fade-in slide-in-from-bottom-2 duration-300"
                >
                  <p className="text-xs text-emerald-800 font-semibold flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-emerald-600" />
                    Protocolo de orçamento gerado com sucesso!
                  </p>
                  <Button
                    onClick={handleWhatsAppRedirect}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl shadow-md shadow-emerald-600/10 transition flex items-center justify-center gap-2 text-xs md:text-sm"
                  >
                    <Phone className="w-4.5 h-4.5 fill-current" />
                    Enviar Orçamento para WhatsApp
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </motion.div>
              )}

              {/* Suggested conversation starters */}
              {messages.length === 1 && (
                <div className="space-y-2 pt-2">
                  <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider pl-1">Sugestões de Atendimento:</p>
                  <div className="flex flex-col gap-2">
                    {quickStarters.map((starter, i) => (
                      <button
                        key={i}
                        onClick={() => handleSendMessage(starter.text)}
                        className="text-left w-full p-3 text-xs md:text-sm font-semibold text-slate-700 bg-white hover:bg-blue-50 hover:text-blue-700 border border-slate-100 hover:border-blue-200 rounded-xl transition shadow-xs flex items-center justify-between group"
                      >
                        <span>{starter.label}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Box */}
            <form onSubmit={handleSubmit} className="p-3 border-t border-slate-100 bg-white flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={isGenerating ? "Aguarde o assistente responder..." : "Digite sua mensagem aqui..."}
                disabled={isGenerating}
                className="flex-1 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-blue-500 rounded-xl px-4 py-2.5 text-slate-800 text-xs md:text-sm outline-hidden transition focus:ring-2 focus:ring-blue-500/10 disabled:opacity-50"
              />
              <Button
                type="submit"
                size="icon"
                disabled={!inputValue.trim() || isGenerating}
                className="bg-blue-600 hover:bg-blue-500 text-white shrink-0 h-10 w-10 rounded-xl shadow-md shadow-blue-600/10 transition disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
