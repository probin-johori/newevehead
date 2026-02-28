import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusStyles: Record<string, string> = {
  planning: "bg-blue-100 text-blue-800",
  active: "bg-emerald-100 text-emerald-800",
  completed: "bg-gray-200 text-gray-700",
  archived: "bg-gray-100 text-gray-500",
  high: "bg-red-100 text-red-800",
  medium: "bg-amber-100 text-amber-800",
  low: "bg-emerald-100 text-emerald-800",
  "not-started": "bg-gray-200 text-gray-700",
  "in-progress": "bg-blue-100 text-blue-800",
  blocked: "bg-orange-100 text-orange-800",
  pending: "bg-amber-100 text-amber-800",
  "dept-approved": "bg-blue-100 text-blue-800",
  "ca-approved": "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-800",
  "not-paid": "bg-gray-200 text-gray-700",
  "advance-paid": "bg-blue-100 text-blue-800",
  paid: "bg-emerald-100 text-emerald-800",
};

const statusLabels: Record<string, string> = {
  "not-started": "Not Started",
  "in-progress": "In Progress",
  "dept-approved": "Dept Approved",
  "ca-approved": "CA Approved",
  "not-paid": "Not Paid",
  "advance-paid": "Advance Paid",
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const style = statusStyles[status] || "bg-gray-200 text-gray-700";
  const label = statusLabels[status] || status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize", style, className)}>
      {label}
    </span>
  );
}
