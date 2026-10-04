'use client';

import { useId } from 'react';
import { ScoreHistoryItem } from '@/lib/types';
import { ScoreHistoryPoint } from '@/lib/reputationEngine';
import { Badge } from '@/components/ui';

interface ScoreHistoryChartProps {
  history: (ScoreHistoryItem | ScoreHistoryPoint)[];
}

/**
 * Score history — UI Phase 7.
 *
 * Draws only what the engine recorded. There is no interpolation across gaps
 * and no invented starting point: the path visits exactly the points that were
 * saved, and an empty history says so rather than rendering a flat line that
 * would read as "stable at zero".
 */
export function ScoreHistoryChart({ history }: ScoreHistoryChartProps) {
  const gradientId = useId();

  if (!history || history.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-white/10 bg-white/[0.02] p-6 text-center">
        <p className="text-body-sm text-fg-muted">No score history has been recorded yet.</p>
        <p className="mx-auto mt-1 max-w-sm text-caption leading-relaxed text-fg-subtle">
          FRL stores a point each time the engine recalculates. Nothing is drawn before the first
          real one exists.
        </p>
      </div>
    );
  }

  if (history.length === 1) {
    const pt = history[0];
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-white/[0.08] bg-white/[0.02] p-4">
        <div>
          <span className="block text-label text-fg-subtle">First recorded score</span>
          <span className="mt-1 block text-h3 text-slate-100">{pt.score}</span>
        </div>
        <p className="max-w-[16rem] text-caption leading-relaxed text-fg-muted">
          One evaluation on record. A trend line appears once a second point exists.
        </p>
      </div>
    );
  }

  // Normalize scores for SVG viewBox
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
    const dateLabel =
      'date' in item ? item.date : (item as ScoreHistoryItem).calculatedAt?.split('T')[0] || '';
    return { x, y, score: item.score, date: dateLabel };
  });

  const pathD = points.reduce((acc, pt, i) => {
    return i === 0 ? `M ${pt.x},${pt.y}` : `${acc} L ${pt.x},${pt.y}`;
  }, '');

  const areaD = `${pathD} L ${points[points.length - 1].x},${height - 10} L ${points[0].x},${height - 10} Z`;

  const lastPt = history[history.length - 1];
  const prevPt = history[history.length - 2];
  const delta = lastPt.score - prevPt.score;

  const first = points[0];
  const last = points[points.length - 1];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-label text-fg-subtle">Recorded score over time</span>
        <Badge tone={delta >= 0 ? 'success' : 'danger'} size="sm">
          {delta >= 0 ? `+${delta}` : delta} pts vs previous
        </Badge>
      </div>

      <div className="overflow-hidden rounded-md border border-white/[0.08] bg-white/[0.02] p-3">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-auto w-full max-h-[160px] overflow-visible"
          role="img"
          aria-label={`Reputation score history. ${points.length} recorded points from ${first.score} to ${last.score}. Latest score ${last.score} on ${last.date || 'an undated record'}.`}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Background grid */}
          <line
            x1={paddingX}
            y1={paddingY}
            x2={width - paddingX}
            y2={paddingY}
            stroke="rgba(255,255,255,0.06)"
            strokeDasharray="3 3"
          />
          <line
            x1={paddingX}
            y1={height / 2}
            x2={width - paddingX}
            y2={height / 2}
            stroke="rgba(255,255,255,0.06)"
            strokeDasharray="3 3"
          />
          <line
            x1={paddingX}
            y1={height - paddingY}
            x2={width - paddingX}
            y2={height - paddingY}
            stroke="rgba(255,255,255,0.06)"
            strokeDasharray="3 3"
          />

          <path d={areaD} fill={`url(#${gradientId})`} />
          <path
            d={pathD}
            fill="none"
            stroke="#818cf8"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {points.map((pt) => (
            <g key={`${pt.date}-${pt.score}`}>
              <circle cx={pt.x} cy={pt.y} r="4.5" fill="#6366f1" stroke="#ffffff" strokeWidth="2" />
              <text
                x={pt.x}
                y={pt.y - 10}
                textAnchor="middle"
                fill="#f8fafc"
                fontSize="10"
                fontWeight="bold"
              >
                {pt.score}
              </text>
              <text
                x={pt.x}
                y={height - 2}
                textAnchor="middle"
                fill="#64748b"
                fontSize="9"
                fontFamily="monospace"
              >
                {pt.date}
              </text>
            </g>
          ))}
        </svg>
      </div>

      <p className="text-caption leading-relaxed text-fg-subtle">
        Each point is an engine recalculation. A gap means no score was computed in that period, not
        that the score was unchanged.
      </p>
    </div>
  );
}