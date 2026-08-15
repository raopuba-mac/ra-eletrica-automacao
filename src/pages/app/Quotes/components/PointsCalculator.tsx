import React from 'react';
import { Button } from '../../../../components/ui/button';
import { Label } from '../../../../components/ui/label';
import { Zap } from 'lucide-react';
import { CalculatorPointsMap, CalculatorPoint, PresetType } from '../types/quote.types';

interface PointsCalculatorProps {
  calculatorPoints: CalculatorPointsMap;
  setCalculatorPoints: React.Dispatch<React.SetStateAction<CalculatorPointsMap>>;
  calculatorPreset: PresetType;
  handlePresetChange: (preset: PresetType) => void;
  handleApplyCalculator: () => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export const PointsCalculator: React.FC<PointsCalculatorProps> = ({
  calculatorPoints,
  setCalculatorPoints,
  calculatorPreset,
  handlePresetChange,
  handleApplyCalculator,
  showToast
}) => {
  const categories = ['Chuveiros', 'Tomadas', 'Interruptores', 'Iluminação', 'QDC', 'Outros'];

  return (
    <div className="w-full md:w-[480px] bg-slate-50 overflow-y-auto p-6 border-t md:border-t-0 border-slate-100 flex flex-col justify-between min-h-0">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-500 fill-current" /> Calculadora por Pontos
            </h3>
            <p className="text-[10px] text-slate-400 font-medium">Calcule de forma rápida e profissional</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setCalculatorPoints(prev => {
                const updated = { ...prev };
                Object.keys(updated).forEach(key => {
                  updated[key] = { ...updated[key], qty: 0 };
                });
                return updated;
              });
              showToast("Calculadora resetada.", "success");
            }}
            className="text-[10px] font-black uppercase text-rose-500 hover:text-rose-600 hover:bg-rose-50 px-2.5 h-8 rounded-lg"
          >
            Limpar Tudo
          </Button>
        </div>

        {/* Preset pricing selector */}
        <div className="space-y-2 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Tabela de Preços (Preset)</Label>
          <div className="grid grid-cols-3 gap-2">
            {(['economic', 'standard', 'premium'] as const).map(preset => (
              <Button
                key={preset}
                type="button"
                variant={calculatorPreset === preset ? 'default' : 'outline'}
                onClick={() => handlePresetChange(preset)}
                className={`h-9 text-[9px] font-black uppercase tracking-wider rounded-xl ${
                  calculatorPreset === preset
                    ? 'bg-primary text-white shadow-md shadow-primary/20'
                    : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                }`}
              >
                {preset === 'economic' && 'Econômico'}
                {preset === 'standard' && 'Padrão'}
                {preset === 'premium' && 'Premium'}
              </Button>
            ))}
          </div>
          <p className="text-[9px] text-slate-400 italic mt-1 leading-relaxed">
            {calculatorPreset === 'economic' && '* Preço acessível para serviços mais simples ou volume maior.'}
            {calculatorPreset === 'standard' && '* Tabela de preço padrão da RA Elétrica e Automação.'}
            {calculatorPreset === 'premium' && '* Tabela premium de alta complexidade ou ambientes industriais.'}
          </p>
        </div>

        {/* Point inputs grouped by categories */}
        <div className="space-y-5 max-h-[440px] overflow-y-auto pr-1">
          {categories.map(category => {
            const pointsInCategory = Object.entries(calculatorPoints).filter(
              ([_, p]: [string, CalculatorPoint]) => p.category === category
            );
            if (pointsInCategory.length === 0) return null;

            return (
              <div key={category} className="space-y-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 block border-l-2 border-primary/40 pl-2">
                  {category}
                </span>
                <div className="grid grid-cols-1 gap-2">
                  {pointsInCategory.map(([pointKey, item]: [string, CalculatorPoint]) => (
                    <div
                      key={pointKey}
                      className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                        item.qty > 0
                          ? 'bg-white border-primary/30 shadow-md shadow-primary/5'
                          : 'bg-white border-slate-100 shadow-sm hover:border-slate-200'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-black text-slate-800 block truncate" title={item.label}>
                          {item.label}
                        </span>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-[9px] font-bold text-slate-400 uppercase">Unitário:</span>
                          <div className="flex items-center bg-slate-50 border border-slate-200/60 rounded-lg px-2 py-0.5 w-20">
                            <span className="text-[9px] font-bold text-slate-400 mr-0.5">R$</span>
                            <input
                              type="number"
                              className="w-full bg-transparent border-0 p-0 text-[10px] font-black text-slate-700 focus:outline-none text-center font-mono"
                              value={item.price}
                              onChange={(e) => {
                                const val = Number(e.target.value) || 0;
                                setCalculatorPoints(prev => ({
                                  ...prev,
                                  [pointKey]: { ...prev[pointKey], price: val }
                                }));
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="w-7 h-7 rounded-lg border-slate-200 text-slate-500 hover:bg-slate-100 font-bold"
                          onClick={() => {
                            setCalculatorPoints(prev => ({
                              ...prev,
                              [pointKey]: { ...prev[pointKey], qty: Math.max(0, prev[pointKey].qty - 1) }
                            }));
                          }}
                        >
                          -
                        </Button>

                        <input
                          type="number"
                          className="w-9 h-7 border border-slate-200 rounded-lg text-center text-xs font-black bg-slate-50 text-slate-800 focus:ring-primary focus:outline-none font-mono"
                          value={item.qty || ''}
                          onChange={(e) => {
                            const val = Math.max(0, Number(e.target.value) || 0);
                            setCalculatorPoints(prev => ({
                              ...prev,
                              [pointKey]: { ...prev[pointKey], qty: val }
                            }));
                          }}
                        />

                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="w-7 h-7 rounded-lg border-slate-200 text-slate-500 hover:bg-slate-100 font-bold"
                          onClick={() => {
                            setCalculatorPoints(prev => ({
                              ...prev,
                              [pointKey]: { ...prev[pointKey], qty: prev[pointKey].qty + 1 }
                            }));
                          }}
                        >
                          +
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-slate-200 bg-slate-50 space-y-3 shrink-0">
        <div className="flex justify-between items-center bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total dos Pontos</span>
            <span className="text-[10px] text-slate-500 font-bold font-mono">
              {(Object.values(calculatorPoints) as CalculatorPoint[]).reduce<number>((acc, p) => acc + p.qty, 0)} pontos selecionados
            </span>
          </div>
          <span className="text-lg font-black text-slate-900 font-mono">
            R$ {(Object.values(calculatorPoints) as CalculatorPoint[]).reduce<number>((acc, p) => acc + (p.qty * p.price), 0).toFixed(2).replace('.', ',')}
          </span>
        </div>

        <Button
          type="button"
          size="lg"
          onClick={handleApplyCalculator}
          className="w-full font-black italic uppercase h-12 rounded-xl text-xs bg-primary hover:bg-primary/90 text-white transition-all shadow-md shadow-primary/10 flex items-center justify-center gap-1.5"
        >
          <Zap className="w-4 h-4 fill-current animate-pulse text-amber-300" />
          Preencher Orçamento
        </Button>
      </div>
    </div>
  );
};
