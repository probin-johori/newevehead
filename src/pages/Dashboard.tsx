import { ChartBar } from "@phosphor-icons/react";

export default function DashboardPage() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-52px)]">
      <div className="text-center space-y-3">
        <ChartBar size={40} className="mx-auto text-muted-foreground/40" />
        <h2 className="text-lg font-semibold text-foreground">Dashboard coming soon</h2>
        <p className="text-sm text-muted-foreground">This page is under construction</p>
      </div>
    </div>
  );
}
