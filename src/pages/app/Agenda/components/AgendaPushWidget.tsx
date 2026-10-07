import React from 'react';
import { Bell } from 'lucide-react';
import { Button } from '../../../../components/ui/button';

interface AgendaPushWidgetProps {
  notificationPermission: string;
  onRequestPermission: () => void;
  onTestPush: () => void;
  isIosNonPwa?: boolean;
  pushStatusMessage?: {
    type: 'success' | 'info' | 'warning' | 'error';
    text: string;
  } | null;
}

export const AgendaPushWidget: React.FC<AgendaPushWidgetProps> = ({
  notificationPermission,
  onRequestPermission,
  onTestPush,
  isIosNonPwa = false,
  pushStatusMessage = null,
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

        <div className="pt-2 border-t border-white/10 space-y-3">
          {notificationPermission === 'granted' ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs text-emerald-400 font-extrabold bg-emerald-500/15 p-2.5 rounded-xl border border-emerald-500/20 shadow-sm shadow-emerald-500/10">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
                <span>Alertas Ativos no Dispositivo</span>
              </div>
              <Button
                type="button"
                onClick={onTestPush}
                size="sm"
                variant="outline"
                className="w-full text-xs font-black border-white/15 text-white bg-white/5 hover:bg-white/15 hover:text-white rounded-xl uppercase tracking-wider italic cursor-pointer"
              >
                Simular Alerta de Teste
              </Button>
            </div>
          ) : notificationPermission === 'denied' ? (
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-xs text-rose-300 font-extrabold bg-rose-500/15 p-2.5 rounded-xl border border-rose-500/25">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400 shrink-0"></span>
                <span>Permissão Bloqueada no Navegador</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                As notificações foram bloqueadas para este site. Para reativar, libere a permissão de notificações nas configurações do seu navegador/dispositivo e recarregue a página.
              </p>
            </div>
          ) : notificationPermission === 'unsupported' ? (
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-xs text-amber-300 font-extrabold bg-amber-500/15 p-2.5 rounded-xl border border-amber-500/25">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0"></span>
                <span>{isIosNonPwa ? 'Requer App na Tela de Início' : 'Não Suportado neste Navegador'}</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                {isIosNonPwa
                  ? 'No iPad ou iPhone (Safari), toque em Compartilhar e selecione "Adicionar à Tela de Início" para habilitar notificações push no modo aplicativo (PWA).'
                  : 'Seu navegador ou modo de visualização atual não disponibiliza a API de notificações push.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <Button
                type="button"
                onClick={onRequestPermission}
                size="sm"
                className="w-full text-xs font-black bg-blue-600 hover:bg-blue-500 text-white rounded-xl uppercase tracking-wider italic py-4 cursor-pointer"
              >
                Permitir Alertas Push
              </Button>
              <p className="text-[10px] text-slate-400 text-center leading-normal">
                *Clique acima e autorize as notificações em seu dispositivo para usufruir do recurso.
              </p>
            </div>
          )}

          {pushStatusMessage && (
            <div
              className={`p-2.5 rounded-xl text-[11px] font-semibold leading-snug border ${
                pushStatusMessage.type === 'success'
                  ? 'bg-emerald-950/60 border-emerald-700/50 text-emerald-200'
                  : pushStatusMessage.type === 'warning'
                  ? 'bg-amber-950/60 border-amber-700/50 text-amber-200'
                  : pushStatusMessage.type === 'error'
                  ? 'bg-rose-950/60 border-rose-700/50 text-rose-200'
                  : 'bg-slate-900 border-slate-700 text-slate-200'
              }`}
            >
              {pushStatusMessage.text}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
