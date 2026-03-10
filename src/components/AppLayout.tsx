import { Outlet } from "react-router-dom";
import { AppSidebar } from "@/components/AppSidebar";
import { NavPanel } from "@/components/NavPanel";
import { TopBar } from "@/components/TopBar";

export default function AppLayout() {
  return (
    <div className="flex min-h-screen">
      {/* Column 1: Floating black sidebar */}
      <AppSidebar />

      {/* Column 2 + 3 share a container */}
      <div className="flex flex-1 flex-col ml-[70px]">
        <TopBar />
        <div className="flex flex-1 min-h-0">
          {/* Column 2: Nav panel */}
          <NavPanel />
          {/* Divider between nav panel and content */}
          <div className="w-px bg-stroke shrink-0" />
          {/* Column 3: Main content */}
          <main className="flex-1 min-h-[calc(100vh-52px)] bg-background overflow-y-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
