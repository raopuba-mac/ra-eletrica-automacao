import React from 'react';
import { Link } from 'react-router-dom';
import { FileText } from 'lucide-react';
import { Card, CardContent } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';

interface DashboardPendingQuotesAlertProps {
  quotesCount: number;
}

export const DashboardPendingQuotesAlert: React.FC<DashboardPendingQuotesAlertProps> = ({ quotesCount }) => {
  if (quotesCount <= 0) return null;

  return (
    <div className="grid grid-cols-1 gap-4">
      <Card className="border border-purple-200 bg-purple-50 shadow-xs overflow-hidden relative">
        <div className="absolute top-0 right-0 p-2 opacity-10">
          <FileText className="w-12 h-12 text-purple-600" />
        </div>
        <CardContent className="p-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-2xl border border-purple-200">
              <FileText className="w-6 h-6 text-purple-700" />
            </div>
            <div>
              <h3 className="text-purple-900 font-black tracking-tight text-sm uppercase">Orçamentos Pendentes</h3>
              <p className="text-purple-700 font-bold text-xs">{quotesCount} aguardando revisão</p>
            </div>
          </div>
          <Link to="/app/quotes">
            <Button size="sm" variant="ghost" className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl h-8 px-4 font-black text-[10px] uppercase shadow-sm">
              Revisar
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
};
