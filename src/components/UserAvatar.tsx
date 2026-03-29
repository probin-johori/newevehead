import { cn } from "@/lib/utils";

interface UserAvatarProps {
  name: string;
  color: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function UserAvatar({ name, color, size = "md", className }: UserAvatarProps) {
  const initials = name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  const sizeClasses = {
    sm: "h-6 w-6 text-[10px]",
    md: "h-8 w-8 text-xs",
    lg: "h-10 w-10 text-sm",
  };

  return (
    <div
      className={cn("rounded-full flex items-center justify-center font-semibold text-white shrink-0", sizeClasses[size], className)}
      style={{ backgroundColor: color }}
    >
      {initials}
    </div>
  );
}