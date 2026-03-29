import { Outlet } from "react-router-dom";
import IconSidebar from "./IconSidebar";
import NavPanel from "./NavPanel";

const AppLayout = () => {
  return (
    <div className="flex h-screen w-full overflow-hidden">
      <IconSidebar />
      <NavPanel />
      <main className="flex-1 overflow-y-auto bg-page-bg p-6">
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;
