import React from 'react';
import { Bell } from 'lucide-react';
import { Button } from '../../../../components/ui/button';

interface AgendaPushWidgetProps {
  notificationPermission: string;
  onRequestPermission: () => void;
  onTestPush: () => void;
}

export const AgendaPushWidget: React.FC<AgendaPushWidgetProps> = ({
  notificationPermission,
  onRequestPermission,
  onTestPush,
}) => {
  return (
    <div className="bg-slate-950 text-white rounded-[2rem] p-6 relative overflow-hidden border border-white/5 shadow-2xl">
      <div className="absolute inset-0 bg-dot-pattern opacity-15"></div>
      <div className="absolute -top-12 -right-12 w-[180px] h-[180px] bg-primary/10 blur-[50px] rounded-full"></div>

      <div className="relative z-10 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 text-primary rounded-2xl border border-primary/20">
            <Bell className="w-5 h-5 text-blue-400 animate-swing" />
          </div>
          <div>
            <h4 className="font-extrabold text-sm tracking-tight text-white uppercase italic">
              Central Push
            </h4>
            <span className="text-[9px] text-blue-400 font-extrabold tracking-widest uppercase">
              Tecnologia Smart
            </span>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed font-medium">
          Ative avisos instantâneos com tecnologia de som e vibração para que você nunca perca vistorias elétricas importantes.
        </p>

        <div className="pt-2 border-t border-white/10">
          {notificationPermission === 'granted' ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs text-emerald-400 font-extrabold bg-emerald-500/15 p-2 rounded-xl border border-emerald-500/20 shadow-sm shadow-emerald-500/10">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Alertas Ativos no Dispositivo
              </div>
              <Button
                onClick={onTestPush}
                size="sm"
                variant="outline"
                className="w-full text-xs font-black border-white/15 text-white bg-white/5 hover:bg-white/15 hover:text-white rounded-xl uppercase tracking-wider italic"
              >
                Simular Alerta de Teste
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <Button
                onClick={onRequestPermission}
                size="sm"
                className="w-full text-xs font-black bg-blue-600 hover:bg-blue-500 text-white rounded-xl uppercase tracking-wider italic py-4"
              >
                Permitir Alertas Push
              </Button>
              <p className="text-[10px] text-slate-400 text-center leading-normal">
                *Clique acima e autorize as notificações em seu dispositivo para usufruir do recurso.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
