import React from 'react';
import { motion } from 'motion/react';
import { Clock, CheckCircle2, Repeat, Bell, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '../../../../components/ui/button';
import { AgendaEvent } from '../types/agenda.types';

interface AgendaEventCardProps {
  evt: AgendaEvent;
  index: number;
  onDeleteRequest: (evt: { id: string; title: string }) => void;
}

export const AgendaEventCard: React.FC<AgendaEventCardProps> = ({
  evt,
  index,
  onDeleteRequest,
}) => {
  const isPast = evt.date < Date.now();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.05 }}
      className={`group bg-[#1E293B] rounded-3xl shadow-xl border border-slate-800 overflow-hidden flex items-center justify-between p-5 md:p-6 hover:border-[#EAB308]/40 transition-all ${
        isPast ? 'opacity-65 grayscale-[0.3]' : ''
      }`}
    >
      <div className="flex items-center gap-4 md:gap-6">
        <div
          className={`p-4 rounded-2xl flex flex-col items-center justify-center min-w-[76px] transition-colors ${
            isPast
              ? 'bg-[#0B0F19] text-slate-500 border border-slate-800'
              : 'bg-[#0B0F19] text-[#EAB308] border border-slate-800'
          }`}
        >
          <span className="text-[10px] font-black uppercase tracking-widest">
            {format(evt.date, 'MMM', { locale: ptBR })}
          </span>
          <span className="text-2xl font-black leading-none">
            {format(evt.date, 'dd', { locale: ptBR })}
          </span>
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <h3
              className={`font-black text-lg md:text-xl tracking-tight leading-tight ${
                isPast ? 'line-through text-slate-500' : 'text-white'
              }`}
            >
              {evt.title}
            </h3>
            <span
              className={`text-[9px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-widest border ${
                evt.type === 'service'
                  ? 'bg-amber-950/80 text-amber-400 border-amber-800'
                  : evt.type === 'visit'
                  ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800'
                  : 'bg-purple-950/80 text-purple-400 border-purple-800'
              }`}
            >
              {evt.type === 'service'
                ? 'Serviço'
                : evt.type === 'visit'
                ? 'Visita'
                : 'Lembrete'}
            </span>
          </div>
          <div className="flex flex-wrap items-center text-xs font-bold text-slate-400 gap-y-1.5 gap-x-5">
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4 text-slate-500" />{' '}
              {format(evt.date, 'HH:mm')}
            </span>
            {evt.description && (
              <span className="flex items-center gap-1.5 max-w-[200px] md:max-w-md truncate text-slate-400 italic">
                <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" />{' '}
                {evt.description}
              </span>
            )}
          </div>

          {/* Badges for Recurrence and Notification Reminders */}
          <div className="flex flex-wrap items-center gap-2 mt-3">
            {evt.recurrence && evt.recurrence !== 'none' && (
              <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider bg-purple-950/80 text-purple-300 px-2.5 py-0.5 rounded-lg border border-purple-800">
                <Repeat className="w-3 h-3 text-purple-400" />
                Repete:{' '}
                {evt.recurrence === 'daily'
                  ? 'Diário'
                  : evt.recurrence === 'weekly'
                  ? 'Semanal'
                  : 'Mensal'}
              </span>
            )}
            {evt.notifyTime && evt.notifyTime !== 'none' && (
              <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider bg-emerald-950/80 text-emerald-300 px-2.5 py-0.5 rounded-lg border border-emerald-800">
                <Bell className="w-3 h-3 text-emerald-400 animate-swing" />
                Lembrete:{' '}
                {evt.notifyTime === 'at_event'
                  ? 'No Horário'
                  : evt.notifyTime === '15_min'
                  ? '15 Min Antes'
                  : evt.notifyTime === '1_hour'
                  ? '1 Hora Antes'
                  : '1 Dia Antes'}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-full"
          onClick={() => onDeleteRequest({ id: evt.id, title: evt.title })}
        >
          <Trash2 className="w-5 h-5" />
        </Button>
      </div>
    </motion.div>
  );
};
