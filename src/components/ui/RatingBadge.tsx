import React from 'react';
import { Star } from 'lucide-react';

interface RatingBadgeProps {
  score?: number | null;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const RatingBadge: React.FC<RatingBadgeProps> = ({ score, className = '', size = 'md' }) => {
  if (score === undefined || score === null) return null;

  let styleClasses = 'from-amber-400/20 to-amber-600/20 border-amber-400/30 text-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.1)]';
  
  if (score < 5) {
    styleClasses = 'from-red-500/20 to-red-700/20 border-red-500/30 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.1)]';
  } else if (score < 8) {
    styleClasses = 'from-slate-300/20 to-slate-500/20 border-slate-300/30 text-slate-300 shadow-[0_0_15px_rgba(212,212,216,0.1)]';
  }
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-1 gap-1',
    md: 'text-sm px-3 py-1.5 gap-1.5',
    lg: 'text-lg px-4 py-2 gap-2 font-black'
  };

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 18
  };

  return (
    <div className={`flex items-center backdrop-blur-md bg-slate-900/60 bg-gradient-to-br border rounded-2xl font-bold transition-all duration-300 ease-out ${styleClasses} ${sizeClasses[size]} ${className}`}>
      <Star size={iconSizes[size]} className="fill-current drop-shadow-md" />
      <span>{score.toFixed(1)}</span>
    </div>
  );
};
