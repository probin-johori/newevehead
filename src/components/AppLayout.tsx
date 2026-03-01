import { Outlet } from "react-router-dom";
import { AppSidebar } from "@/components/AppSidebar";
import { NavPanel } from "@/components/NavPanel";
import { TopBar } from "@/components/TopBar";

export default function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <TopBar />
      <div className="flex flex-1">
        <AppSidebar />
        <NavPanel />
        <main className="flex-1 ml-[calc(64px+220px)] min-h-[calc(100vh-52px)] bg-background">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
