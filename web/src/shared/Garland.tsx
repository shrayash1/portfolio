import type { CSSProperties } from "react";

// Prayer flags (lungta) in their five colours, hung along a sagging string.
const COLORS = ["#1e5bb8", "#f5f1e6", "#d8262e", "#2f9e44", "#f4c20d"];

export function Garland({ n, sag = 26, className = "garland" }: { n: number; sag?: number; className?: string }) {
  const flags = Array.from({ length: n }, (_, i) => {
    const t = (i + 0.5) / n;
    // point on the quadratic string, in viewBox units (40 units = 80px)
    const y = (1 - t) * (1 - t) * 2 + 2 * (1 - t) * t * sag + t * t * 2;
    const style = {
      left: `${(t * 100).toFixed(2)}%`,
      top: `${(y * 2).toFixed(1)}px`,
      "--c": COLORS[i % 5],
      "--rot": `${((1 - 2 * t) * 9).toFixed(1)}deg`,
      "--d": `${(-(i % 6) * 0.35).toFixed(2)}s`,
    } as CSSProperties;
    return <span key={i} className="flag" style={style} />;
  });
  return (
    <div className={className} aria-hidden="true">
      <svg viewBox="0 0 100 40" preserveAspectRatio="none">
        <path d={`M0,2 Q50,${sag} 100,2`} fill="none" stroke="rgba(255,236,214,.75)" strokeWidth={1.2} vectorEffect="non-scaling-stroke" />
      </svg>
      {flags}
    </div>
  );
}

export const NARROW = innerWidth < 700;
