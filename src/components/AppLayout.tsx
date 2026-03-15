import { Outlet } from "react-router-dom";
import { AppSidebar } from "@/components/AppSidebar";
import { NavPanel } from "@/components/NavPanel";
import { TopBar } from "@/components/TopBar";
import { MobileBottomNav } from "@/components/MobileBottomNav";

export default function AppLayout() {
  return (
    <div className="flex flex-col h-screen bg-page-bg overflow-hidden">
      {/* Header */}
      <TopBar />

      {/* Row 2: Sidebar + Content */}
      <div className="flex flex-1 min-h-0 px-0 pb-0 gap-0 md:px-3 md:pb-3 md:gap-3">
        {/* Sidebar — hidden on mobile */}
        <div className="hidden md:block">
          <AppSidebar />
        </div>

        {/* Nav panel + main content */}
        <div className="flex flex-1 min-h-0 md:rounded-xl bg-background md:border md:border-stroke overflow-hidden">
          {/* Nav panel — hidden on mobile */}
          <div className="hidden md:block">
            <NavPanel />
          </div>
          <div className="hidden md:block w-px bg-stroke shrink-0" />
          {/* Main content */}
          <main className="flex-1 min-h-0 bg-background overflow-y-auto pb-16 md:pb-0">
            <Outlet />
          </main>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <MobileBottomNav />
    </div>
  );
}
