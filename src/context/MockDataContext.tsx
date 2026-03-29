import { createContext, useContext, useState, ReactNode, useCallback } from "react";

// Types
export interface EventItem {
  id: string;
  name: string;
  location: string;
  start_date: string;
  end_date: string;
  setup_date: string;
  teardown_date: string;
  estimated_budget: number;
  status: "planning" | "active" | "completed" | "archived";
  poc_id: string;
  created_by: string;
  image_url?: string;
}

export interface Department {
  id: string;
  event_id: string;
  name: string;
  allocated_budget: number;
}

export interface Task {
  id: string;
  event_id: string;
  title: string;
  status: "todo" | "in-progress" | "completed";
  assignee_id: string;
  deadline?: string;
  created_at: string;
}

export interface Bill {
  id: string;
  event_id: string;
  title: string;
  amount: number;
  status: "pending" | "dept-verified" | "ca-approved" | "settled" | "rejected";
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
}

export interface Profile {
  id: string;
  full_name: string;
  avatar_url?: string;
}

interface MockDataContextType {
  events: EventItem[];
  departments: Department[];
  tasks: Task[];
  bills: Bill[];
  teamMembers: TeamMember[];
  currentUser: { id: string; name: string; email: string };
  orgId: string;
  getTasksByEvent: (eventId: string) => Task[];
  getProfile: (id: string) => Profile | undefined;
  addEvent: (data: Omit<EventItem, "id">) => Promise<EventItem>;
  formatINRShort: (n: number) => string;
  formatDate: (d: string) => string;
  formatTimeAgo: (d: string) => string;
}

const MockDataContext = createContext<MockDataContextType | undefined>(undefined);

// Helpers
export function formatINRShort(n: number): string {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n}`;
}

export function formatDate(d: string): string {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function formatTimeAgo(d: string): string {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function MockDataProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [departments] = useState<Department[]>([]);
  const [tasks] = useState<Task[]>([]);
  const [bills] = useState<Bill[]>([]);
  const [teamMembers] = useState<TeamMember[]>([]);

  const currentUser = { id: "current-user", name: "You", email: "you@example.com" };
  const orgId = "org-1";

  const getTasksByEvent = useCallback((eventId: string) => tasks.filter(t => t.event_id === eventId), [tasks]);
  const getProfile = useCallback((_id: string): Profile | undefined => undefined, []);

  const addEvent = useCallback(async (data: Omit<EventItem, "id">): Promise<EventItem> => {
    const newEvent: EventItem = { ...data, id: crypto.randomUUID() };
    setEvents(prev => [...prev, newEvent]);
    return newEvent;
  }, []);

  return (
    <MockDataContext.Provider value={{
      events, departments, tasks, bills, teamMembers,
      currentUser, orgId, getTasksByEvent, getProfile, addEvent,
      formatINRShort, formatDate, formatTimeAgo,
    }}>
      {children}
    </MockDataContext.Provider>
  );
}

export function useMockData() {
  const ctx = useContext(MockDataContext);
  if (!ctx) throw new Error("useMockData must be used within MockDataProvider");
  return ctx;
}
