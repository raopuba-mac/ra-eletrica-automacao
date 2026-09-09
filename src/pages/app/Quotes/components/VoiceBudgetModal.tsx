import React from 'react';
import { Button } from '../../../../components/ui/button';
import { Mic, Square, Keyboard, Sparkles, Loader2 } from 'lucide-react';

interface VoiceBudgetModalProps {
  isListening: boolean;
  toggleListening: () => void;
  isManualInputOpen: boolean;
  setIsManualInputOpen: (open: boolean) => void;
  transcriptionText: string;
  setTranscriptionText: React.Dispatch<React.SetStateAction<string>>;
  voiceLoading: boolean;
  processVoiceData: () => Promise<void>;
}

export const VoiceBudgetModal: React.FC<VoiceBudgetModalProps> = ({
  isListening,
  toggleListening,
  isManualInputOpen,
  setIsManualInputOpen,
  transcriptionText,
  setTranscriptionText,
  voiceLoading,
  processVoiceData
}) => {
  return (
    <div className="p-4 bg-[#0B0F19] border border-slate-800 rounded-2xl space-y-3 shadow-inner">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Mic className={`w-4 h-4 ${isListening ? 'text-rose-500 animate-pulse' : 'text-[#EAB308]'}`} />
          <span className="text-xs font-black text-white uppercase tracking-wider">Assistente de Voz IA</span>
        </div>
        <span className="text-[10px] bg-[#EAB308]/15 text-[#EAB308] border border-[#EAB308]/30 px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider">IA Ativa</span>
      </div>
      
      <p className="text-[11px] text-slate-300 leading-normal font-medium">
        Fale os detalhes do serviço (ex: "Puxar fiação nova, instalar 2 chuveiros a 150 reais cada, com material incluso, desconto de 20 reais e observação trazer escada") e a IA preencherá tudo!
      </p>

      <div className="flex gap-2">
        <Button
          type="button"
          onClick={toggleListening}
          variant={isListening ? "destructive" : "default"}
          className={`flex-1 h-11 text-xs font-black uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all ${
            isListening 
              ? "bg-rose-600 hover:bg-rose-700 text-white" 
              : "bg-[#EAB308] hover:bg-[#ca8a04] text-[#0B0F19]"
          }`}
        >
          {isListening ? (
            <>
              <Square className="w-3.5 h-3.5 mr-1" />
              Parar de Ouvir
            </>
          ) : (
            <>
              <Mic className="w-3.5 h-3.5 mr-1 animate-bounce" />
              Falar Comando
            </>
          )}
        </Button>
        
        <Button
          type="button"
          onClick={() => setIsManualInputOpen(!isManualInputOpen)}
          variant="outline"
          className="h-11 px-3 rounded-xl border-slate-700 bg-[#1E293B] text-slate-200 hover:bg-slate-800 hover:text-white text-xs font-bold transition-colors"
          title="Digitar ou colar notas"
        >
          <Keyboard className="w-4 h-4" />
        </Button>
      </div>

      {(transcriptionText || isManualInputOpen || voiceLoading) && (
        <div className="space-y-2 pt-2 border-t border-slate-800">
          {isManualInputOpen ? (
            <div className="space-y-2">
              <textarea
                value={transcriptionText}
                onChange={(e) => setTranscriptionText(e.target.value)}
                placeholder="Digite ou cole as anotações do serviço aqui..."
                className="w-full h-20 p-2.5 text-xs border border-slate-700 bg-[#1E293B] text-white placeholder:text-slate-500 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#EAB308] font-medium"
              />
            </div>
          ) : (
            transcriptionText && (
              <div className="p-2.5 bg-[#1E293B] border border-slate-700 rounded-xl text-xs text-slate-200 font-medium italic min-h-[40px]">
                {isListening && <span className="inline-block w-2 h-2 bg-rose-500 rounded-full animate-ping mr-1.5" />}
                {transcriptionText}
              </div>
            )
          )}

          {transcriptionText && !isListening && (
            <Button
              type="button"
              disabled={voiceLoading}
              onClick={processVoiceData}
              className="w-full h-10 text-xs font-black uppercase tracking-wider bg-slate-800 hover:bg-slate-700 text-white rounded-xl flex items-center justify-center gap-2 border border-slate-700 transition-colors"
            >
              {voiceLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#EAB308]" />
                  Processando com IA...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-[#EAB308]" />
                  Preencher com IA
                </>
              )}
            </Button>
          )}
          
          {voiceLoading && !transcriptionText && (
            <div className="flex items-center justify-center gap-2 py-3 text-xs font-semibold text-slate-300">
              <Loader2 className="w-4 h-4 animate-spin text-[#EAB308]" />
              Enviando transcrição para a IA...
            </div>
          )}
        </div>
      )}
    </div>
  );
};
