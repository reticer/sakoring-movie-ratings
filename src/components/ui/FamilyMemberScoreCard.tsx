import React from 'react';
import { Star } from 'lucide-react';

interface FamilyMemberScoreCardProps {
  name: string;
  score: number;
}

export const FamilyMemberScoreCard: React.FC<FamilyMemberScoreCardProps> = ({ name, score }) => {
  const initial = name.substring(0, 2).toUpperCase();

  // Color logic based on score
  let borderColor = 'border-amber-400';
  let textColor = 'text-amber-400';
  let bgColor = 'bg-amber-400/10';

  if (score < 5) {
    borderColor = 'border-red-500';
    textColor = 'text-red-500';
    bgColor = 'bg-red-500/10';
  } else if (score < 8) {
    borderColor = 'border-slate-300';
    textColor = 'text-slate-300';
    bgColor = 'bg-slate-300/10';
  } else {
    borderColor = 'border-green-500';
    textColor = 'text-green-500';
    bgColor = 'bg-green-500/10';
  }

  return (
    <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl p-4 flex flex-col items-center justify-center border border-slate-800/80 hover:border-slate-700/80 transition-all duration-300 ease-out shadow-xl shadow-black/50 hover:-translate-y-1 group">
      <div className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-black mb-3 border-2 shadow-inner ${borderColor} ${textColor} ${bgColor}`}>
        {initial}
      </div>
      <span className="text-slate-200 font-medium text-sm md:text-base text-center line-clamp-1 mb-2 w-full">{name}</span>
      <div className={`flex items-center gap-1 font-bold text-lg ${textColor}`}>
        <Star size={18} className="fill-current drop-shadow-sm" />
        {score.toFixed(1)}
      </div>
    </div>
  );
};
