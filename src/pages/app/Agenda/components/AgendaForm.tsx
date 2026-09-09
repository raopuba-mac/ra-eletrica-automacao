import React from 'react';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import { AgendaEventFormData } from '../types/agenda.types';

interface AgendaFormProps {
  form: AgendaEventFormData;
  setForm: React.Dispatch<React.SetStateAction<AgendaEventFormData>>;
  onSubmit: (e: React.FormEvent) => void;
}

export const AgendaForm: React.FC<AgendaFormProps> = ({ form, setForm, onSubmit }) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4 pt-2">
      <div className="space-y-1.5">
        <Label className="text-xs font-black uppercase tracking-widest text-slate-500">
          Título do Evento *
        </Label>
        <Input
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="Ex: Manutenção Elétrica ou Visita Técnica Intelbras"
          required
          className="rounded-xl border-slate-250 py-5 focus-visible:ring-blue-600"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs font-black uppercase tracking-widest text-slate-500">
          Data e Hora *
        </Label>
        <Input
          type="datetime-local"
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
          required
          className="rounded-xl border-slate-250 py-5 focus-visible:ring-blue-600"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-black uppercase tracking-widest text-slate-500">
          Tipo de Compromisso
        </Label>
        <Select
          onValueChange={(val) => setForm({ ...form, type: val })}
          value={form.type}
        >
          <SelectTrigger className="w-full rounded-xl py-5 border-slate-250 focus:ring-blue-600">
            <SelectValue placeholder="Selecione o tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="service">🔧 Execução de Serviço</SelectItem>
            <SelectItem value="visit">📋 Visita Técnica</SelectItem>
            <SelectItem value="reminder">🔔 Lembrete</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-black uppercase tracking-widest text-slate-500">
            Recorrência
          </Label>
          <Select
            onValueChange={(val) => setForm({ ...form, recurrence: val })}
            value={form.recurrence}
          >
            <SelectTrigger className="w-full rounded-xl py-5 border-slate-250">
              <SelectValue placeholder="Se repete?" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">🔁 Único</SelectItem>
              <SelectItem value="daily">🔁 Diário</SelectItem>
              <SelectItem value="weekly">🔁 Semanal</SelectItem>
              <SelectItem value="monthly">🔁 Mensal</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-black uppercase tracking-widest text-slate-500">
            Notificação Push
          </Label>
          <Select
            onValueChange={(val) => setForm({ ...form, notifyTime: val })}
            value={form.notifyTime}
          >
            <SelectTrigger className="w-full rounded-xl py-5 border-slate-250">
              <SelectValue placeholder="Lembrar quando?" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">🔕 Desativada</SelectItem>
              <SelectItem value="at_event">⏰ No horário</SelectItem>
              <SelectItem value="15_min">⏱️ 15 min antes</SelectItem>
              <SelectItem value="1_hour">⏱️ 1 hora antes</SelectItem>
              <SelectItem value="24_hours">⏱️ 1 dia antes</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-black uppercase tracking-widest text-slate-500">
          Descrição (Opcional)
        </Label>
        <Input
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Detalhes adicionais ou telefone do cliente..."
          className="rounded-xl border-slate-250 py-5"
        />
      </div>
      <Button
        type="submit"
        size="lg"
        className="w-full mt-2 font-black italic uppercase italic h-14 rounded-2xl shadow-xl shadow-blue-600/10 bg-primary hover:bg-primary/95 text-white transition-all transform hover:scale-[1.01]"
      >
        Confirmar Agendamento
      </Button>
    </form>
  );
};
