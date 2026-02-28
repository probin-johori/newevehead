interface ProgressBarProps {
  value: number;
  max: number;
  className?: string;
}

export function ProgressBar({ value, max, className }: ProgressBarProps) {
  const pct = max > 0 ? Math.min((value / max) * 100, 150) : 0;
  const color = pct > 100 ? "bg-destructive" : pct > 70 ? "bg-warning" : "bg-accent-mid";

  return (
    <div className={`h-1.5 w-full rounded-full bg-secondary ${className || ""}`}>
      <div
        className={`h-full rounded-full transition-all ${color}`}
        style={{ width: `${Math.min(pct, 100)}%` }}
      />
    </div>
  );
}
