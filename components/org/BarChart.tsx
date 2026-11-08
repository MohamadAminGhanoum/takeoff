import type { Bucket } from "@/lib/org/stats";

/** A plain bar chart in SVG. Server-rendered, no script, one colour. */
export default function BarChart({
  data,
  label,
  height = 88,
}: {
  data: Bucket[];
  label: string;
  height?: number;
}) {
  const n = data.length;
  const step = 28;
  const w = n * step;
  const max = Math.max(1, ...data.map((d) => d.value));
  const total = data.reduce((a, d) => a + d.value, 0);
  const labelEvery = n > 10 ? 3 : 2;

  return (
    <svg
      viewBox={`0 0 ${w} ${height + 30}`}
      role="img"
      aria-label={`${label}: ${total} total. ${data.map((d) => `${d.label} ${d.value}`).join(", ")}`}
      className="h-auto w-full text-slate-500"
    >
      <line x1="0" x2={w} y1={height + 0.5} y2={height + 0.5} stroke="currentColor" strokeOpacity="0.4" />
      {data.map((d, i) => {
        const h = d.value === 0 ? 0 : Math.max(2, (d.value / max) * (height - 14));
        const x = i * step + 5;
        return (
          <g key={i}>
            <rect x={x} y={height - h} width={step - 10} height={h} fill="currentColor" />
            {d.value > 0 && (
              <text x={x + (step - 10) / 2} y={height - h - 3} textAnchor="middle" fontSize="9" className="fill-slate-300">
                {d.value}
              </text>
            )}
            {(i % labelEvery === 0 || i === n - 1) && (
              <text x={x + (step - 10) / 2} y={height + 12} textAnchor="middle" fontSize="8" className="fill-slate-500">
                {d.label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
