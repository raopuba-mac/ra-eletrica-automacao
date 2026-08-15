import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar as CalendarIcon, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { DashboardUpcomingEvent } from '../types/dashboard.types';

interface DashboardAgendaProps {
  upcomingEvents: DashboardUpcomingEvent[];
}

export const DashboardAgenda: React.FC<DashboardAgendaProps> = ({ upcomingEvents }) => {
  return (
    <Card className="border border-slate-200 bg-white shadow-xs rounded-[2rem] overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 bg-slate-50/50 p-6 md:p-8">
        <CardTitle className="text-lg font-black tracking-tighter flex items-center gap-2 text-slate-900">
          <CalendarIcon className="w-5 h-5 text-[#ca8a04]" />
          PRÓXIMAS VISITAS
        </CardTitle>
        <Link to="/app/agenda" className="text-[10px] font-black uppercase tracking-widest text-[#ca8a04] hover:underline flex items-center bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full">
          Agenda completa <ArrowRight className="w-3 h-3 ml-2" />
        </Link>
      </CardHeader>
      <CardContent className="p-0 bg-white">
        {upcomingEvents.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm font-medium italic">
             Sua agenda está livre por enquanto.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {upcomingEvents.map((event) => (
              <div key={event.id} className="p-6 hover:bg-slate-50 transition-colors flex items-center justify-between group">
                <div className="flex items-center gap-6">
                  <div className="bg-slate-900 text-white p-4 rounded-2xl flex flex-col items-center justify-center min-w-[72px] shadow-xs group-hover:bg-[#EAB308] group-hover:text-slate-950 transition-colors">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#EAB308] group-hover:text-slate-950">
                      {format(new Date(event.date), 'MMM', { locale: ptBR })}
                    </span>
                    <span className="text-2xl font-black">{format(new Date(event.date), 'dd')}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                       <span className="text-[10px] font-black px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-slate-700 uppercase tracking-widest">{event.time}</span>
                       <span className="text-[10px] font-black px-2 py-0.5 bg-amber-50 border border-amber-200 rounded text-amber-800 uppercase tracking-widest">{event.type}</span>
                    </div>
                    <h4 className="font-black text-slate-900 tracking-tight text-lg">{event.title}</h4>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
