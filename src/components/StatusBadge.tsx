import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  planning: "bg-blue-100 text-blue-700",
  active: "bg-emerald-100 text-emerald-700",
  completed: "bg-muted text-muted-foreground",
  archived: "bg-muted text-muted-foreground",
  pending: "bg-amber-100 text-amber-700",
  "in-progress": "bg-blue-100 text-blue-700",
  "dept-verified": "bg-purple-100 text-purple-700",
  "ca-approved": "bg-teal-100 text-teal-700",
  settled: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
  todo: "bg-muted text-muted-foreground",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const label = status.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium", statusStyles[status] || "bg-muted text-muted-foreground", className)}>
      {label}
    </span>
  );
}
