import { Lock } from "lucide-react";

export function FeatureLockBanner() {
  return (
    <div className="rounded-lg border border-accent-mid/30 bg-accent-light p-4 flex items-center gap-3">
      <Lock className="h-5 w-5 text-accent-mid shrink-0" />
      <div>
        <p className="text-sm font-medium text-foreground">
          This feature is not available on your current plan.
        </p>
        <p className="text-sm text-muted-foreground">
          Upgrade to Pro to unlock this feature.
        </p>
      </div>
    </div>
  );
}
