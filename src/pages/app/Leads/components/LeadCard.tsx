import React from 'react';
import { motion } from 'motion/react';
import {
  User,
  Calendar,
  MessageCircle,
  Phone,
  Mail,
  MapPin,
  CheckCheck,
  Plus,
  Edit,
  Trash2,
} from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Lead } from '../types/lead.types';
import { formatLeadDate, cleanPhoneForWhatsApp } from '../utils/leadUtils';
import { LeadStatusBadge } from './LeadStatusBadge';

interface LeadCardProps {
  lead: Lead;
  idx: number;
  onUpdateStatus: (id: string, status: string) => void;
  onConvertToClient: (lead: Lead) => void;
  onEdit: (lead: Lead) => void;
  onDelete: (id: string) => void;
}

export const LeadCard: React.FC<LeadCardProps> = ({
  lead,
  idx,
  onUpdateStatus,
  onConvertToClient,
  onEdit,
  onDelete,
}) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ delay: idx * 0.05 }}
      className={`bg-white rounded-2xl shadow-xs border overflow-hidden flex flex-col group transition-all hover:border-[#EAB308] hover:shadow-md ${
        lead.status === 'new' ? 'ring-2 ring-[#EAB308] border-slate-200' : 'border-slate-200'
      }`}
    >
      <div className="p-6 flex-1 text-slate-900">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-3">
            <div
              className={`h-12 w-12 rounded-xl flex items-center justify-center ${
                lead.status === 'new'
                  ? 'bg-[#EAB308] text-slate-950 shadow-md font-black'
                  : 'bg-slate-100 text-slate-500 border border-slate-200'
              }`}
            >
              <User className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-lg leading-tight">{lead.name}</h3>
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1 mt-1">
                <Calendar className="w-3 h-3 text-[#ca8a04]" /> {formatLeadDate(lead.createdAt)}
              </div>
            </div>
          </div>
          <LeadStatusBadge status={lead.status} />
        </div>

        <div className="space-y-3 mb-6">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start gap-3">
            <MessageCircle className="w-5 h-5 text-[#ca8a04] mt-0.5 shrink-0" />
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
                Serviço Solicitado
              </p>
              <p className="font-bold text-slate-900">{lead.serviceType || 'Não especificado'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <a
              href={`https://wa.me/55${cleanPhoneForWhatsApp(lead.phone)}?text=${encodeURIComponent(
                `Olá, ${lead.name}! Recebemos sua mensagem no site referente a ${
                  lead.serviceType || 'serviços elétricos e automação'
                }. Como posso te ajudar hoje?`
              )}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 transition-all group/link"
            >
              <Phone className="w-4 h-4 text-emerald-600 group-hover/link:animate-bounce" />
              <span className="text-sm font-bold text-slate-800 group-hover/link:text-emerald-700">
                {lead.phone}
              </span>
            </a>

            {lead.email && (
              <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50">
                <Mail className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-medium text-slate-700 truncate">{lead.email}</span>
              </div>
            )}
          </div>

          {lead.address && (
            <div className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50">
              <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
              <span className="text-sm font-medium text-slate-700 leading-relaxed">
                {lead.address}
              </span>
            </div>
          )}
        </div>
      </div>
      <div className="bg-slate-50 p-4 px-6 border-t border-slate-200 flex items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {lead.status === 'new' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onUpdateStatus(lead.id, 'contacted')}
              className="bg-white border-slate-200 hover:bg-slate-100 text-slate-900 font-bold text-xs h-8"
            >
              <CheckCheck className="w-3 h-3 mr-1 text-emerald-600" /> Marcar como Lido
            </Button>
          )}
          {lead.status === 'contacted' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onConvertToClient(lead)}
              className="bg-white border-slate-200 hover:bg-slate-100 text-slate-900 font-bold text-xs h-8"
            >
              <Plus className="w-3 h-3 mr-1 text-[#ca8a04]" /> Virou Cliente
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-600 hover:text-[#ca8a04] h-8 font-bold text-xs"
            onClick={() => onEdit(lead)}
          >
            <Edit className="w-3.5 h-3.5 mr-1" /> Editar
          </Button>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="text-slate-400 hover:text-rose-600 transition-colors h-8 w-8"
          onClick={() => onDelete(lead.id)}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
};
