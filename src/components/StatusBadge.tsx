import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusStyles: Record<string, string> = {
  planning: "bg-blue-50 text-blue-700",
  active: "bg-emerald-50 text-emerald-700",
  completed: "bg-gray-100 text-gray-600",
  archived: "bg-gray-50 text-gray-500",
  urgent: "bg-red-50 text-red-700",
  high: "bg-amber-50 text-amber-700",
  normal: "bg-blue-50 text-blue-700",
  low: "bg-gray-100 text-gray-600",
  "not-started": "bg-gray-100 text-gray-600",
  "in-progress": "bg-blue-50 text-blue-700",
  "in-review": "bg-purple-50 text-purple-700",
  backlog: "bg-gray-50 text-gray-500",
  blocked: "bg-orange-50 text-orange-700",
  pending: "bg-amber-50 text-amber-700",
  "dept-verified": "bg-blue-50 text-blue-700",
  "ca-approved": "bg-emerald-50 text-emerald-700",
  settled: "bg-emerald-50 text-emerald-700",
  paid: "bg-emerald-50 text-emerald-700",
  overdue: "bg-red-50 text-red-700",
  "on-hold": "bg-gray-100 text-gray-600",
  rejected: "bg-red-50 text-red-700",
  "not-given": "bg-gray-100 text-gray-600",
  "advance-given": "bg-blue-50 text-blue-700",
};

const statusLabels: Record<string, string> = {
  "not-started": "Not Started",
  "in-progress": "In Progress",
  "in-review": "In Review",
  "dept-verified": "Dept Verified",
  "ca-approved": "CA Approved",
  "not-given": "Not Given",
  "advance-given": "Advance Given",
  "on-hold": "On Hold",
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const style = statusStyles[status] || "bg-gray-100 text-gray-600";
  const label = statusLabels[status] || status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap", style, className)}>
      {label}
    </span>
  );
}
