import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { MockDataProvider } from "@/context/MockDataContext";
import AppLayout from "@/components/AppLayout";
import LoginPage from "@/pages/Login";
import SignupPage from "@/pages/Signup";
import OnboardingPage from "@/pages/Onboarding";
import RoleSelectionPage from "@/pages/RoleSelection";
import DashboardPage from "@/pages/Dashboard";
import EventsPage from "@/pages/Events";
import EventDetailPage from "@/pages/EventDetail";
import TasksPage from "@/pages/Tasks";
import BillingPage from "@/pages/Billing";
import DocumentsPage from "@/pages/Documents";
import TeamsPage from "@/pages/Teams";
import SettingsPage from "@/pages/Settings";
import DepartmentsPage from "@/pages/Departments";
import DeptEventDetailPage from "@/pages/DeptEventDetail";
import NotificationsPage from "@/pages/Notifications";
import PastEventsPage from "@/pages/PastEvents";
import NotFound from "@/pages/NotFound";
import JoinOrgPage from "@/pages/JoinOrg";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading, user } = useAuth();
  const [hasOrg, setHasOrg] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) { setHasOrg(null); return; }
    supabase
      .from("team_members")
      .select("id")
      .eq("user_id", user.id)
      .limit(1)
      .then(({ data }) => setHasOrg(!!(data && data.length > 0)));
  }, [user]);

  if (loading || (isAuthenticated && hasOrg === null)) {
    return <div className="flex min-h-screen items-center justify-center"><p className="text-muted-foreground">Loading…</p></div>;
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (hasOrg === false) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { isAuthenticated, loading, user } = useAuth();
  const [hasOrg, setHasOrg] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) { setHasOrg(null); return; }
    supabase
      .from("team_members")
      .select("id")
      .eq("user_id", user.id)
      .limit(1)
      .then(({ data }) => setHasOrg(!!(data && data.length > 0)));
  }, [user]);

  if (loading) return <div className="flex min-h-screen items-center justify-center"><p className="text-muted-foreground">Loading…</p></div>;

  const authRedirect = isAuthenticated
    ? (hasOrg === false ? "/onboarding" : "/dashboard")
    : undefined;

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to={authRedirect || "/dashboard"} /> : <LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/onboarding" element={isAuthenticated ? (hasOrg === false ? <OnboardingPage /> : <Navigate to="/dashboard" />) : <Navigate to="/login" replace />} />
      <Route path="/onboarding/role" element={isAuthenticated ? <RoleSelectionPage /> : <Navigate to="/login" replace />} />
      <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="events" element={<EventsPage />} />
        <Route path="events/:id" element={<EventDetailPage />} />
        <Route path="tasks" element={<TasksPage />} />
        <Route path="billing" element={<BillingPage />} />
        <Route path="documents" element={<DocumentsPage />} />
        <Route path="teams" element={<TeamsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="departments" element={<DepartmentsPage />} />
        <Route path="departments/:name" element={<DepartmentsPage />} />
        <Route path="departments/:deptName/events/:eventId" element={<DeptEventDetailPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="past-events" element={<PastEventsPage />} />
      </Route>
      <Route path="/join/:token" element={<JoinOrgPage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <MockDataProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </MockDataProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
