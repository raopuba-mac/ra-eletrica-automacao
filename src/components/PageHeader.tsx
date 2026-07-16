import React from 'react';
import { motion } from 'motion/react';

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8"
    >
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{title}</h1>
        {description && <p className="text-slate-500 mt-1 text-sm md:text-base">{description}</p>}
      </div>
      {action && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          {action}
        </motion.div>
      )}
    </motion.div>
  );
}
