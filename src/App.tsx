import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import EventDetail from "./pages/EventDetail";
import Tasks from "./pages/Tasks";
import Billing from "./pages/Billing";
import Documents from "./pages/Documents";
import Teams from "./pages/Teams";
import Settings from "./pages/Settings";
import PastEvents from "./pages/PastEvents";
import JoinOrg from "./pages/JoinOrg";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/events" element={<Navigate to="/dashboard" replace />} />
            <Route path="/events/:id" element={<EventDetail />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/billing" element={<Billing />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/teams" element={<Teams />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/past-events" element={<PastEvents />} />
            <Route path="/join/:token" element={<JoinOrg />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
