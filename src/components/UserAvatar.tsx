import { cn } from "@/lib/utils";

interface UserAvatarProps {
  name?: string;
  avatarUrl?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = { sm: "h-6 w-6 text-[10px]", md: "h-8 w-8 text-xs", lg: "h-10 w-10 text-sm" };

export function UserAvatar({ name = "U", avatarUrl, size = "md", className }: UserAvatarProps) {
  const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  if (avatarUrl) {
    return <img src={avatarUrl} alt={name} className={cn("rounded-full object-cover", sizeMap[size], className)} />;
  }

  return (
    <div className={cn("flex items-center justify-center rounded-full bg-muted font-medium text-muted-foreground", sizeMap[size], className)}>
      {initials}
    </div>
  );
}
