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
  high: "bg-red-50 text-red-700",
  medium: "bg-amber-50 text-amber-700",
  low: "bg-emerald-50 text-emerald-700",
  "not-started": "bg-gray-100 text-gray-600",
  "in-progress": "bg-blue-50 text-blue-700",
  blocked: "bg-orange-50 text-orange-700",
  pending: "bg-amber-50 text-amber-700",
  "dept-verified": "bg-blue-50 text-blue-700",
  "dept-approved": "bg-blue-50 text-blue-700",
  "ca-approved": "bg-emerald-50 text-emerald-700",
  settled: "bg-emerald-50 text-emerald-700",
  rejected: "bg-red-50 text-red-700",
  "not-paid": "bg-gray-100 text-gray-600",
  "advance-paid": "bg-blue-50 text-blue-700",
  "advance-given": "bg-blue-50 text-blue-700",
  paid: "bg-emerald-50 text-emerald-700",
  "not-given": "bg-gray-100 text-gray-600",
};

const statusLabels: Record<string, string> = {
  "not-started": "Not Started",
  "in-progress": "In Progress",
  "dept-verified": "Dept Verified",
  "dept-approved": "Dept Approved",
  "ca-approved": "CA Approved",
  "not-paid": "Not Paid",
  "advance-paid": "Advance Paid",
  "advance-given": "Advance Given",
  "not-given": "Not Given",
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const style = statusStyles[status] || "bg-gray-100 text-gray-600";
  const label = statusLabels[status] || status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium", style, className)}>
      {label}
    </span>
  );
}
