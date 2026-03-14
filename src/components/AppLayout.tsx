import { Outlet } from "react-router-dom";
import { AppSidebar } from "@/components/AppSidebar";
import { NavPanel } from "@/components/NavPanel";
import { TopBar } from "@/components/TopBar";

export default function AppLayout() {
  return (
    <div className="flex flex-col h-screen bg-page-bg overflow-hidden">
      {/* Row 1: Header — full width, sticky */}
      <TopBar />

      {/* Row 2: Sidebar + Content — fills remaining height */}
      <div className="flex flex-1 min-h-0 px-3 pb-3 gap-3">
        {/* Column 1: Floating black sidebar */}
        <AppSidebar />

        {/* Column 2+3: Joined container (nav panel + main content) */}
        <div className="flex flex-1 min-h-0 rounded-xl bg-background border border-stroke overflow-hidden">
          {/* Column 2: Nav panel */}
          <NavPanel />
          {/* 1px vertical divider */}
          <div className="w-px bg-stroke shrink-0" />
          {/* Column 3: Main content — internal scroll only */}
          <main className="flex-1 min-h-0 bg-background overflow-y-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
