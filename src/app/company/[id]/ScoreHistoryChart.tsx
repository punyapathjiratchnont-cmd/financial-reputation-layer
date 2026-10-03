'use client';

import { useId } from 'react';
import { ScoreHistoryItem } from '@/lib/types';
import { ScoreHistoryPoint } from '@/lib/reputationEngine';

interface ScoreHistoryChartProps {
  history: (ScoreHistoryItem | ScoreHistoryPoint)[];
}

export function ScoreHistoryChart({ history }: ScoreHistoryChartProps) {
  const gradientId = useId();

  if (!history || history.length === 0) {
    return (
      <div className="p-6 text-center text-xs text-slate-500 italic bg-black/20 rounded-xl border border-white/5">
        No score history records available yet.
      </div>
    );
  }

  if (history.length === 1) {
    const pt = history[0];
    return (
      <div className="p-5 rounded-2xl bg-black/20 border border-white/5 flex items-center justify-between">
        <div>
          <span className="text-[10px] text-slate-500 font-mono block">Initial Evaluation</span>
          <span className="text-xl font-bold text-slate-200">{pt.score}</span>
        </div>
        <span className="text-xs text-slate-400">Ongoing updates will draw historical trend lines.</span>
      </div>
    );
  }

  // Normalize scores for SVG viewBox (width: 400, height: 120)
  const minScore = 300;
  const maxScore = 850;
  const width = 500;
  const height = 140;
  const paddingX = 40;
  const paddingY = 25;

  const points = history.map((item, idx) => {
    const x = paddingX + (idx / (history.length - 1)) * (width - paddingX * 2);
    const normalizedScore = (item.score - minScore) / (maxScore - minScore);
    const y = height - paddingY - normalizedScore * (height - paddingY * 2);
    const dateLabel = 'date' in item ? item.date : (item as ScoreHistoryItem).calculatedAt?.split('T')[0] || '';
    return { x, y, score: item.score, date: dateLabel };
  });

  const pathD = points.reduce((acc, pt, i) => {
    return i === 0 ? `M ${pt.x},${pt.y}` : `${acc} L ${pt.x},${pt.y}`;
  }, '');

  const areaD = `${pathD} L ${points[points.length - 1].x},${height - 10} L ${points[0].x},${height - 10} Z`;

  const lastPt = history[history.length - 1];
  const prevPt = history[history.length - 2];
  const delta = lastPt.score - prevPt.score;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-400 font-medium">Historical Score Trajectory</span>
        <span
          className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${
            delta >= 0
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
          }`}
        >
          {delta >= 0 ? `+${delta}` : delta} pts from previous update
        </span>
      </div>

      <div className="w-full overflow-x-auto bg-black/30 p-4 rounded-2xl border border-white/5">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto max-h-[160px] overflow-visible">
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Background Grid Lines */}
          <line x1={paddingX} y1={paddingY} x2={width - paddingX} y2={paddingY} stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
          <line x1={paddingX} y1={height / 2} x2={width - paddingX} y2={height / 2} stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
          <line x1={paddingX} y1={height - paddingY} x2={width - paddingX} y2={height - paddingY} stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />

          {/* Area Fill */}
          <path d={areaD} fill={`url(#${gradientId})`} />

          {/* Line Path */}
          <path d={pathD} fill="none" stroke="#818cf8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* Points & Labels */}
          {points.map((pt, idx) => (
            <g key={idx}>
              <circle cx={pt.x} cy={pt.y} r="4.5" fill="#6366f1" stroke="#ffffff" strokeWidth="2" />
              <text x={pt.x} y={pt.y - 10} textAnchor="middle" fill="#f8fafc" fontSize="10" fontWeight="bold">
                {pt.score}
              </text>
              <text x={pt.x} y={height - 2} textAnchor="middle" fill="#64748b" fontSize="9" fontFamily="monospace">
                {pt.date}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}
