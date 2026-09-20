import React from 'react';
import { AlertTriangle, Radio, CheckCircle, ShieldAlert } from 'lucide-react';

interface BadgeProps {
  variant: 'cyan' | 'emerald' | 'amber' | 'red' | 'indigo' | 'muted' | 'simulated';
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ variant, children, icon, className = '' }) => {
  if (variant === 'simulated') {
    return (
      <span className={`badge-simulated ${className}`}>
        {icon || <AlertTriangle size={11} />}
        {children}
      </span>
    );
  }

  return (
    <span className={`badge badge-${variant} ${className}`}>
      {icon}
      {children}
    </span>
  );
};
