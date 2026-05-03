'use client';

import { cn } from '@/lib/utils';

interface ScoreRingProps {
  score: number;
  status?: 'Stable' | 'Needs Attention' | 'Red Zone';
  size?: number | 'sm' | 'md' | 'lg';
  strokeWidth?: number;
}

export function ScoreRing({ score, status, size = 'md', strokeWidth }: ScoreRingProps) {
  // Handle numeric size
  const numericSize = typeof size === 'number' ? size : 
    size === 'sm' ? 80 : size === 'md' ? 120 : 160;
  
  const defaultStrokeWidth = typeof size === 'number' ? (strokeWidth || 6) :
    size === 'sm' ? 6 : size === 'md' ? 8 : 10;
  
  const stroke = strokeWidth || defaultStrokeWidth;
  
  // Determine status from score if not provided
  const computedStatus = status || (score >= 70 ? 'Stable' : score >= 40 ? 'Needs Attention' : 'Red Zone');
  
  const radius = (numericSize - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;

  const getColor = () => {
    if (computedStatus === 'Stable') return 'text-success';
    if (computedStatus === 'Needs Attention') return 'text-warning';
    return 'text-destructive';
  };

  const getStrokeColor = () => {
    if (computedStatus === 'Stable') return 'stroke-success';
    if (computedStatus === 'Needs Attention') return 'stroke-warning';
    return 'stroke-destructive';
  };

  // Dynamic text size based on ring size
  const textSize = numericSize < 60 ? 'text-sm' : numericSize < 100 ? 'text-xl' : numericSize < 140 ? 'text-3xl' : 'text-4xl';
  const labelSize = numericSize < 60 ? 'text-[8px]' : numericSize < 100 ? 'text-xs' : 'text-sm';

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={numericSize} height={numericSize} className="-rotate-90">
        {/* Background circle */}
        <circle
          cx={numericSize / 2}
          cy={numericSize / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-muted/30"
        />
        {/* Progress circle */}
        <circle
          cx={numericSize / 2}
          cy={numericSize / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          className={cn('transition-all duration-1000 ease-out', getStrokeColor())}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn('font-bold', textSize, getColor())}>{score}</span>
        {numericSize >= 50 && (
          <span className={cn('text-muted-foreground', labelSize)}>/ 100</span>
        )}
      </div>
    </div>
  );
}
