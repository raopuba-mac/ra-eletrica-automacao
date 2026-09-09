import React from 'react';
import { User, Edit, Trash2, Phone, Mail, MapPin, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { motion, AnimatePresence } from 'motion/react';
import { Client } from '../types/client.types';
import { ClientHistory } from './ClientHistory';

interface ClientCardProps {
  client: Client;
  index: number;
  userId: string;
  isExpanded: boolean;
  onEdit: (client: Client) => void;
  onDelete: (id: string) => void;
  onToggleExpand: (id: string) => void;
}

export const ClientCard: React.FC<ClientCardProps> = ({
  client,
  index,
  userId,
  isExpanded,
  onEdit,
  onDelete,
  onToggleExpand,
}) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.05 }}
      className="bg-[#1E293B] rounded-3xl shadow-xl border border-slate-800 group hover:border-[#EAB308]/40 transition-all overflow-hidden"
    >
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="h-12 w-12 rounded-2xl bg-[#0B0F19] border border-slate-800 text-[#EAB308] flex items-center justify-center">
            <User className="w-6 h-6" />
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 text-slate-400 hover:text-white hover:bg-[#0B0F19] border-slate-800 rounded-xl transition-all cursor-pointer flex items-center justify-center shrink-0 bg-[#0B0F19]"
              onClick={() => onEdit(client)}
              id={`edit-client-btn-${client.id}`}
              title="Editar Cliente"
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 border-slate-800 rounded-xl transition-all cursor-pointer flex items-center justify-center shrink-0 bg-[#0B0F19]"
              onClick={() => onDelete(client.id)}
              id={`delete-client-btn-${client.id}`}
              title="Excluir Cliente"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <h3 className="font-black text-white text-lg leading-tight mb-4">
          {client.name}
        </h3>

        <div className="space-y-3">
          {client.phone && (
            <div className="flex items-center gap-3 text-sm text-slate-300">
              <Phone className="w-4 h-4 text-slate-500" />{' '}
              <span className="font-medium">{client.phone}</span>
            </div>
          )}
          {client.email && (
            <div className="flex items-center gap-3 text-sm text-slate-300">
              <Mail className="w-4 h-4 text-slate-500" />{' '}
              <span className="font-medium truncate">{client.email}</span>
            </div>
          )}
          {client.address && (
            <div className="flex items-start gap-3 text-sm text-slate-300">
              <MapPin className="w-4 h-4 text-slate-500 mt-0.5" />{' '}
              <span className="font-medium">{client.address}</span>
            </div>
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-slate-800 flex justify-between items-center">
          <Button
            variant="ghost"
            size="sm"
            className="text-[#EAB308] hover:text-[#ca8a04] hover:bg-[#0B0F19] font-bold text-xs"
            onClick={() => onToggleExpand(client.id)}
          >
            {isExpanded ? (
              <>
                Ocultar Histórico <ChevronUp className="w-4 h-4 ml-1" />
              </>
            ) : (
              <>
                Ver Histórico <ChevronDown className="w-4 h-4 ml-1" />
              </>
            )}
          </Button>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <ClientHistory clientId={client.id} userId={userId} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
