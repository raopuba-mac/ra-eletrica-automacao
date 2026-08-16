import React, { useState } from 'react';
import { Button } from '../../../../components/ui/button';
import { Palette, Sparkles, ShieldCheck, Zap } from 'lucide-react';
import { LOGO_IMG_PATH } from '../utils/settingsUtils';

interface SettingsVisualIdentityProps {
  onDownloadLogo: () => void;
}

export const SettingsVisualIdentity: React.FC<SettingsVisualIdentityProps> = ({
  onDownloadLogo,
}) => {
  const [logoSrc, setLogoSrc] = useState(LOGO_IMG_PATH);
  const [logoError, setLogoError] = useState(false);

  const handleLogoError = () => {
    if (logoSrc === LOGO_IMG_PATH) {
      setLogoSrc('/logo.jpg');
    } else {
      setLogoError(true);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
      <div className="flex items-center gap-3 border-b pb-4">
        <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl" aria-hidden="true">
          <Palette className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight italic">
            Identidade Visual & Logomarca
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Nova identidade visual premium integrada ao seu aplicativo e website.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-lg bg-slate-50 p-6 flex flex-col items-center justify-center relative">
          <div className="absolute top-3 right-3 bg-blue-100 text-blue-700 text-[10px] font-black px-2.5 py-1 rounded-full border border-blue-200 tracking-wider uppercase">
            Design Profissional
          </div>
          <div className="w-48 h-48 rounded-2xl overflow-hidden shadow-md border border-slate-200 shrink-0 bg-slate-900 mb-4 mt-2 flex items-center justify-center">
            {!logoError ? (
              <img
                src={logoSrc}
                alt="RA Logo Premium"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                onError={handleLogoError}
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-4 text-center">
                <Zap className="w-12 h-12 text-[#EAB308] fill-[#EAB308]/20 mb-2" />
                <span className="text-white font-black text-xs uppercase tracking-wider">RA Elétrica</span>
              </div>
            )}
          </div>
          <span className="text-slate-900 font-black tracking-widest text-sm uppercase">
            RA | Elétrica e Automação
          </span>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
            Selo de Qualidade Técnica
          </span>
        </div>

        <div className="space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" /> Paleta de Cores Oficial
            </h3>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-[#0f172a] p-3 rounded-xl border border-slate-800 text-center shadow-sm">
                <div className="w-full h-6 rounded bg-slate-900 border border-slate-800 mb-1.5" />
                <span className="text-[10px] font-bold text-slate-400 block">
                  Slate Dark
                </span>
                <code className="text-[9px] font-mono text-slate-500">
                  #0F172A
                </code>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-100 text-center shadow-sm">
                <div className="w-full h-6 rounded bg-blue-600 mb-1.5" />
                <span className="text-[10px] font-bold text-slate-600 block">
                  Electric Blue
                </span>
                <code className="text-[9px] font-mono text-slate-400">
                  #2563EB
                </code>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-100 text-center shadow-sm">
                <div className="w-full h-6 rounded bg-amber-500 mb-1.5" />
                <span className="text-[10px] font-bold text-slate-600 block">
                  Power Amber
                </span>
                <code className="text-[9px] font-mono text-slate-400">
                  #F59E0B
                </code>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-green-500" /> Conceito Clean & Premium
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Esta nova identidade visual é clara, moderna e profissional. Ela integra harmoniosamente as iniciais <strong>RA (Renan Augusto)</strong> com um design minimalista, trazendo foco e legibilidade perfeita em qualquer plataforma (web, app ou documentos de orçamento). O fundo claro confere uma presença corporativa sólida, higiênica e de alto padrão técnico.
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full font-bold uppercase tracking-wider text-[11px] h-11 rounded-xl bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
            onClick={onDownloadLogo}
          >
            Baixar Logo em Alta Resolução
          </Button>
        </div>
      </div>
    </div>
  );
};
