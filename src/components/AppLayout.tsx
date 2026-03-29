import { Outlet } from "react-router-dom";
import { AppSidebar } from "@/components/AppSidebar";
import { NavPanel } from "@/components/NavPanel";
import { TopBar } from "@/components/TopBar";

export default function AppLayout() {
  return (
    <div className="flex flex-col h-screen bg-page-bg overflow-hidden">
      <TopBar />
      <div className="flex flex-1 min-h-0 px-3 pb-3 gap-3">
        <AppSidebar />
        <div className="flex flex-1 min-h-0 rounded-xl bg-background border border-stroke overflow-hidden">
          <NavPanel />
          <div className="w-px bg-stroke shrink-0" />
          <main className="flex-1 min-h-0 bg-background overflow-y-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}