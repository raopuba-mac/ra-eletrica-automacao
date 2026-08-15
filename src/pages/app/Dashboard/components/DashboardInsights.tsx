import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Zap, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';

export const DashboardInsights: React.FC = () => {
  return (
    <Card className="border border-slate-200 bg-white text-slate-900 rounded-[2rem] overflow-hidden relative group h-full shadow-xs">
      <CardHeader className="relative z-10 p-8 border-b border-slate-100 bg-slate-50/50">
        <CardTitle className="text-xl font-black tracking-tighter flex items-center gap-3 text-slate-900">
          <div className="p-2 bg-amber-100 rounded-xl border border-amber-200">
            <Zap className="w-5 h-5 text-[#ca8a04] fill-current" />
          </div>
          INSIGHTS TÉCNICOS
        </CardTitle>
      </CardHeader>
      <CardContent className="p-8 relative z-10 space-y-8 bg-white">
        <div className="space-y-4">
          <p className="text-slate-600 text-sm leading-relaxed font-medium">
            "Mantenha seu portfólio web atualizado com fotos de <strong className="text-[#ca8a04]">antes e depois</strong>. Isso transmite transparência e organização, gerando confiança imediata nos novos clientes."
          </p>
          <Link to="/app/portfolio">
            <Button variant="secondary" size="sm" className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl h-10 px-6 border border-slate-200">
              Atualizar Portfólio <ArrowRight className="w-4 h-4 ml-2 text-[#ca8a04]" />
            </Button>
          </Link>
        </div>

        <div className="pt-8 border-t border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase">Performance Mensal</span>
            <span className="text-[#ca8a04] font-black text-sm">84%</span>
          </div>
          <div className="w-full h-2 bg-slate-100 border border-slate-200 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "84%" }}
              transition={{ duration: 1, delay: 0.5 }}
              className="h-full bg-[#EAB308]"
            />
          </div>
          <p className="text-[10px] text-slate-500 mt-4 leading-relaxed uppercase font-bold">
            Meta de fechar 10 novos contratos este mês. <br/> Falta pouco, Renan!
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
