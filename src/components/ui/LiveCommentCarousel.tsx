import React, { useState, useEffect } from 'react';

interface LiveCommentCarouselProps {
  scores: any[];
  rank?: number;
}

export const LiveCommentCarousel: React.FC<LiveCommentCarouselProps> = ({ scores, rank }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Filter for valid, non-empty comments
  const validScores = (scores || []).filter(s => s.comment && s.comment.trim() !== '');

  useEffect(() => {
    if (validScores.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % validScores.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [validScores.length]);

  return (
    <div className={`h-[60px] mt-5 overflow-hidden bg-transparent ${rank ? 'ml-6 md:ml-10' : ''}`}>
      {validScores.length > 0 && (
        <div 
          className="transition-transform duration-700 ease-in-out flex flex-col w-full"
          style={{ transform: `translateY(-${currentIndex * 60}px)` }}
        >
          {validScores.map((score, index) => {
            const cleanText = score.comment.replace(/^"+|"+$/g, '');
            return (
              <div key={score.id || index} className="h-[60px] flex flex-col justify-start w-full pt-1">
                <div className="flex items-center justify-between w-full px-0.5 mb-1">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider line-clamp-1">{score.people?.name || 'Unknown'}</span>
                  <span className="text-[11px] font-semibold text-amber-500/70 whitespace-nowrap">
                    ★ {typeof score.score === 'number' ? score.score.toFixed(1) : score.score}
                  </span>
                </div>
                <p className="text-[12px] text-gray-300 font-normal italic line-clamp-2 leading-relaxed px-0.5">
                  "{cleanText}"
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
