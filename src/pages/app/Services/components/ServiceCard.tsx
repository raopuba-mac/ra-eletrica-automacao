import React from 'react';
import { Button } from '../../../../components/ui/button';
import { Edit, Trash2 } from 'lucide-react';
import { Service } from '../types/service.types';

interface ServiceCardProps {
  service: Service;
  onEdit: (service: Service) => void;
  onDelete: (id: string) => void;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({
  service,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-5 flex flex-col justify-between hover:border-[#EAB308] hover:shadow-md transition-all text-slate-900">
      <div>
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-black text-slate-900 text-lg tracking-tight">{service.name}</h3>
          <div className="flex space-x-1 -mt-1 -mr-1">
            <Button
              variant="ghost"
              size="sm"
              className="text-[#ca8a04] hover:text-slate-900 hover:bg-slate-100 rounded-lg"
              onClick={() => onEdit(service)}
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg"
              onClick={() => onDelete(service.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <p className="text-sm text-slate-500 font-medium mb-4 leading-relaxed">{service.description}</p>
      </div>
      {service.price !== undefined && service.price > 0 && (
        <div className="font-black text-[#ca8a04] text-base pt-3 border-t border-slate-100">
          A partir de R$ {service.price.toFixed(2).replace('.', ',')}
        </div>
      )}
    </div>
  );
};
