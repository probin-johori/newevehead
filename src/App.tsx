import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { MockDataProvider, useMockData } from "@/context/MockDataContext";
import AppLayout from "@/components/AppLayout";
import LoginPage from "@/pages/Login";
import SignupPage from "@/pages/Signup";
import RoleSelectionPage from "@/pages/RoleSelection";
import DashboardPage from "@/pages/Dashboard";
import EventsPage from "@/pages/Events";
import EventDetailPage from "@/pages/EventDetail";
import TasksPage from "@/pages/Tasks";
import BillingPage from "@/pages/Billing";
import DocumentsPage from "@/pages/Documents";
import TeamsPage from "@/pages/Teams";
import SettingsPage from "@/pages/Settings";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, hasSelectedRole } = useMockData();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!hasSelectedRole) return <Navigate to="/onboarding/role" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { isAuthenticated } = useMockData();

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/events/e1" /> : <LoginPage />} />
      <Route path="/signup" element={isAuthenticated ? <Navigate to="/events/e1" /> : <SignupPage />} />
      <Route path="/onboarding/role" element={<RoleSelectionPage />} />
      <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/events/e1" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="events" element={<EventsPage />} />
        <Route path="events/:id" element={<EventDetailPage />} />
        <Route path="tasks" element={<TasksPage />} />
        <Route path="billing" element={<BillingPage />} />
        <Route path="documents" element={<DocumentsPage />} />
        <Route path="teams" element={<TeamsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <MockDataProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </MockDataProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
