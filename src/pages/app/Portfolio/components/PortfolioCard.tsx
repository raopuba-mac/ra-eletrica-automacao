import React from 'react';
import { motion } from 'motion/react';
import {
  Camera,
  Edit,
  Eye,
  EyeOff,
  Trash2,
  Image as ImageIcon,
  ExternalLink,
} from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { PortfolioItem } from '../types/portfolio.types';

interface PortfolioCardProps {
  item: PortfolioItem;
  idx: number;
  onEdit: (item: PortfolioItem) => void;
  onToggleVisibility: (id: string, isPublic: boolean) => void;
  onDelete: (id: string) => void;
}

export const PortfolioCard: React.FC<PortfolioCardProps> = ({
  item,
  idx,
  onEdit,
  onToggleVisibility,
  onDelete,
}) => {
  const [imgError, setImgError] = React.useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ delay: idx * 0.05 }}
      className="group bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden hover:border-[#EAB308] hover:shadow-md transition-all text-slate-900"
    >
      <div className="aspect-[4/3] w-full bg-slate-100 relative overflow-hidden">
        {!imgError && item.photoUrl ? (
          <img
            src={item.photoUrl}
            alt={item.title}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
            onError={() => setImgError(true)}
          />
        ) : !imgError && item.mediaUrls && item.mediaUrls.length > 0 ? (
          <img
            src={item.mediaUrls[0]}
            alt={item.title}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full text-slate-400 bg-slate-100">
            <ImageIcon className="w-12 h-12" />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent pointer-events-none" />

        <div className="absolute top-3 right-3 flex gap-2 z-10">
          <Button
            variant="secondary"
            size="icon"
            className="h-9 w-9 bg-white/90 border border-slate-200 text-slate-800 rounded-xl shadow-xs hover:bg-slate-50 hover:scale-105 transition-all"
            onClick={() => onEdit(item)}
          >
            <Edit className="w-4 h-4 text-[#ca8a04]" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className={`h-9 w-9 bg-white/90 border border-slate-200 rounded-xl shadow-xs hover:bg-slate-50 hover:scale-105 transition-all ${
              item.isPublic ? 'text-emerald-600' : 'text-slate-400'
            }`}
            onClick={() => onToggleVisibility(item.id, item.isPublic)}
          >
            {item.isPublic ? (
              <Eye className="w-4 h-4" />
            ) : (
              <EyeOff className="w-4 h-4" />
            )}
          </Button>
          <Button
            variant="destructive"
            size="icon"
            className="h-9 w-9 rounded-xl shadow-xs hover:scale-105 transition-all bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100"
            onClick={() => onDelete(item.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        {item.mediaUrls && item.mediaUrls.length > 0 && (
          <div className="absolute bottom-3 left-3 bg-white/90 border border-slate-200 backdrop-blur-md text-[#ca8a04] text-[10px] uppercase font-black px-3 py-1 rounded-full flex items-center gap-1.5 shadow-xs">
            <Camera className="w-3 h-3" /> +{item.mediaUrls.length} Mídias
          </div>
        )}
      </div>
      <div className="p-5">
        <div className="text-[10px] font-black text-[#ca8a04] uppercase tracking-widest mb-1.5">
          {item.category || 'Sem Categoria'}
        </div>
        <h3 className="font-black text-slate-900 text-lg mb-2 leading-tight group-hover:text-[#ca8a04] transition-colors">
          {item.title}
        </h3>
        <p className="text-slate-500 text-sm line-clamp-2 font-medium mb-1">
          {item.description}
        </p>

        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => onToggleVisibility(item.id, item.isPublic)}
              className={`text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 py-1 px-2.5 rounded-full border transition-all ${
                item.isPublic
                  ? 'text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
                  : 'text-slate-500 bg-slate-50 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  item.isPublic ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                }`}
              />
              {item.isPublic ? 'Público no Site' : 'Oculto / Rascunho'}
            </button>
            <span className="text-[9px] text-slate-400 font-mono">
              ID: {item.id.slice(0, 5)}
            </span>
          </div>

          <div className="flex gap-2 pt-1">
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 h-9 text-[11px] font-black uppercase tracking-tight text-[#ca8a04] hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl"
              onClick={() => window.open('/portfolio', '_blank')}
            >
              <ExternalLink className="w-3.5 h-3.5 mr-1 shrink-0" /> Ver Site
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="flex-1 h-9 text-[11px] font-black uppercase tracking-tight text-[#ca8a04] hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl"
              onClick={() => onEdit(item)}
            >
              <Edit className="w-3.5 h-3.5 mr-1 shrink-0" /> Editar
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="flex-1 h-9 text-[11px] font-black uppercase tracking-tight text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl"
              onClick={() => onDelete(item.id)}
            >
              <Trash2 className="w-3.5 h-3.5 mr-1 shrink-0" /> Excluir
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
