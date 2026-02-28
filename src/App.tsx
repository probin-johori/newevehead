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
import ReimbursementsPage from "@/pages/Reimbursements";
import BudgetPage from "@/pages/Budget";
import DocumentsPage from "@/pages/Documents";
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
      <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" /> : <LoginPage />} />
      <Route path="/signup" element={isAuthenticated ? <Navigate to="/dashboard" /> : <SignupPage />} />
      <Route path="/onboarding/role" element={<RoleSelectionPage />} />
      <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="events" element={<EventsPage />} />
        <Route path="events/:id" element={<EventDetailPage />} />
        <Route path="tasks" element={<TasksPage />} />
        <Route path="reimbursements" element={<ReimbursementsPage />} />
        <Route path="budget" element={<BudgetPage />} />
        <Route path="documents" element={<DocumentsPage />} />
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
