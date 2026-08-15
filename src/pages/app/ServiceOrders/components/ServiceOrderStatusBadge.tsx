import React from 'react';
import { ServiceOrderStatus } from '../types/serviceOrder.types';
import { statusColors, statusNames } from '../utils/serviceOrderUtils';

interface ServiceOrderStatusBadgeProps {
  status: ServiceOrderStatus;
  className?: string;
}

export const ServiceOrderStatusBadge: React.FC<ServiceOrderStatusBadgeProps> = ({ status, className = '' }) => {
  return (
    <div className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-full italic shadow-sm ${statusColors[status] || statusColors.scheduled} ${className}`}>
      {statusNames[status] || status}
    </div>
  );
};
