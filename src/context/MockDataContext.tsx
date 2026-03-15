import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { useAuth, type AuthProfile } from "@/context/AuthContext";

export type Role = "sa" | "org" | "dept_head" | "dept_member";
export type Plan = "free" | "pro" | "business";
export type EventStatus = "planning" | "active" | "completed" | "archived";
export type TaskStatus = "not-started" | "in-progress" | "blocked" | "completed" | "backlog" | "in-review";
export type TaskPriority = "low" | "normal" | "high" | "urgent";
export type BillStatus = "pending" | "dept-verified" | "ca-approved" | "settled" | "rejected" | "on-hold";
export type AdvanceStatus = "not-given" | "advance-given" | "settled";
export type DocFolder = string;

export interface Profile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  avatar_color: string;
  dept_name?: string;
}

export interface Subscription {
  id: string;
  org_id: string;
  plan: Plan;
  slots_total: number;
  slots_used: number;
}

export interface Event {
  id: string;
  name: string;
  location: string;
  start_date: string;
  end_date: string;
  setup_date: string;
  teardown_date: string;
  estimated_budget: number;
  status: EventStatus;
  poc_id: string;
  created_by: string;
  image_url?: string;
}

export interface Department {
  id: string;
  event_id: string;
  name: string;
  head_id: string;
  allocated_budget: number;
  spent: number;
  notes: string;
  member_ids?: string[];
}

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
  assignee_id?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
}

export interface Task {
  id: string;
  event_id: string;
  dept_id: string;
  title: string;
  description: string;
  assignee_id: string;
  deadline: string;
  priority: TaskPriority;
  status: TaskStatus;
  subtasks: SubTask[];
  created_by: string;
  created_at: string;
  labels?: string[];
}

export interface TaskComment {
  id: string;
  task_id: string;
  author_id: string;
  body: string;
  created_at: string;
}

export interface BillEditLog {
  id: string;
  bill_id: string;
  user_id: string;
  field: string;
  old_value: string;
  new_value: string;
  created_at: string;
}

export interface Bill {
  id: string;
  event_id: string;
  dept_id: string;
  vendor_name: string;
  description: string;
  amount: number;
  advance_amount: number;
  bill_file_url: string;
  invoice_number: string;
  status: BillStatus;
  advance_status: AdvanceStatus;
  submitted_by: string;
  dept_verified_by: string | null;
  ca_approved_by: string | null;
  settled_by: string | null;
  submitted_at: string;
  dept_verified_at: string | null;
  ca_approved_at: string | null;
  settled_at: string | null;
  category?: string;
  due_date?: string;
  paid_date?: string;
  invoice_file?: string;
  invoice_files?: string[];
}

export interface Document {
  id: string;
  event_id: string;
  dept_id: string | null;
  name: string;
  folder: DocFolder;
  file_url: string;
  file_size: string;
  uploaded_by: string;
  uploaded_at: string;
  description?: string;
  visibility?: "internal" | "external";
  attachment_url?: string;
}

export interface Activity {
  id: string;
  event_id: string;
  user_id: string;
  description: string;
  link_text?: string;
  created_at: string;
  type?: "comment" | "reply" | "mention" | "edit" | "assign" | "deadline" | "status" | "billing" | "upload";
  target?: string;
}

export interface Notification {
  id: string;
  user_id: string;
  body: string;
  type: string;
  read: boolean;
  created_at: string;
  link_to?: string;
}

export interface DeptHealth {
  name: string;
  tasksDone: number;
  tasksTotal: number;
  budgetPct: number;
}

export interface Organisation {
  id: string;
  name: string;
  logo?: string;
  active: boolean;
}

export const formatINR = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;

export const formatINRShort = (amount: number): string => {
  if (amount >= 10000000) {
    const cr = amount / 10000000;
    return `₹${cr % 1 === 0 ? cr.toFixed(0) : cr.toFixed(1)}Cr`;
  }
  if (amount >= 100000) {
    const l = amount / 100000;
    return `₹${l % 1 === 0 ? l.toFixed(0) : l.toFixed(1)}L`;
  }
  if (amount >= 1000) {
    const k = amount / 1000;
    return `₹${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}K`;
  }
  return `₹${amount}`;
};

export const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  if (d.getTime() === today.getTime()) return "Today";
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.getTime() === yesterday.getTime()) return "Yesterday";
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export const formatTimeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
};

// --- SEED DATA (minimal - 2 default events) ---
const defaultProfiles: Profile[] = [
  { id: "u_default", name: "You", email: "you@example.com", phone: "", role: "sa", avatar_color: "#4338ca", dept_name: "Administration" },
];

const defaultSubscription: Subscription = {
  id: "sub1", org_id: "u_default", plan: "pro", slots_total: 10, slots_used: 2,
};

const defaultOrganisations: Organisation[] = [
  { id: "org1", name: "My Organisation", active: true },
];

const defaultEvents: Event[] = [
  {
    id: "e1", name: "Annual Corporate Summit",
    location: "Grand Hyatt, Mumbai",
    start_date: "2026-04-15", end_date: "2026-04-17",
    setup_date: "2026-04-13", teardown_date: "2026-04-18",
    estimated_budget: 2500000, status: "active",
    poc_id: "u_default", created_by: "u_default",
    image_url: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&q=80",
  },
  {
    id: "e2", name: "Product Launch 2026",
    location: "Taj Lands End, Mumbai",
    start_date: "2026-05-10", end_date: "2026-05-11",
    setup_date: "2026-05-08", teardown_date: "2026-05-12",
    estimated_budget: 1800000, status: "planning",
    poc_id: "u_default", created_by: "u_default",
    image_url: "https://images.unsplash.com/photo-1505236858219-8359eb29e329?w=600&q=80",
  },
];

const defaultDepartments: Department[] = [
  { id: "d1", event_id: "e1", name: "Stage & AV", head_id: "u_default", allocated_budget: 300000, spent: 120000, notes: "Main stage setup & sound" },
  { id: "d2", event_id: "e1", name: "Catering", head_id: "u_default", allocated_budget: 600000, spent: 80000, notes: "500 pax multi-cuisine" },
  { id: "d3", event_id: "e1", name: "Logistics", head_id: "u_default", allocated_budget: 350000, spent: 45000, notes: "Transport & venue prep" },
  { id: "d4", event_id: "e2", name: "Stage & AV", head_id: "u_default", allocated_budget: 200000, spent: 0, notes: "Product demo stage" },
  { id: "d5", event_id: "e2", name: "Marketing", head_id: "u_default", allocated_budget: 400000, spent: 150000, notes: "Social media, branding" },
];

const defaultTasks: Task[] = [
  {
    id: "t1", event_id: "e1", dept_id: "d1", title: "Set up main stage truss",
    description: "Install front truss rigging for main stage lighting.",
    assignee_id: "u_default", deadline: "2026-04-10", priority: "high", status: "in-progress",
    created_by: "u_default", created_at: "2026-03-01T10:00:00Z", labels: ["stage"],
    subtasks: [
      { id: "st1", title: "Source truss hardware", completed: true, priority: "high", status: "completed" },
      { id: "st2", title: "Transport to venue", completed: false, priority: "normal", status: "not-started" },
      { id: "st3", title: "Safety inspection", completed: false, priority: "urgent", status: "not-started" },
    ],
  },
  {
    id: "t2", event_id: "e1", dept_id: "d2", title: "Finalize catering menu",
    description: "Confirm final menu with caterer for 500 guests.",
    assignee_id: "u_default", deadline: "2026-04-05", priority: "normal", status: "not-started",
    created_by: "u_default", created_at: "2026-03-05T10:00:00Z", labels: ["catering"],
    subtasks: [
      { id: "st4", title: "Review menu options", completed: true, priority: "normal", status: "completed" },
      { id: "st5", title: "Tasting session", completed: false, priority: "normal", status: "not-started" },
    ],
  },
  {
    id: "t3", event_id: "e1", dept_id: "d3", title: "Arrange transport vehicles",
    description: "Book transport for equipment and staff.",
    assignee_id: "u_default", deadline: "2026-04-12", priority: "high", status: "blocked",
    created_by: "u_default", created_at: "2026-03-02T10:00:00Z",
    subtasks: [],
  },
  {
    id: "t4", event_id: "e2", dept_id: "d4", title: "Product demo stage setup",
    description: "Setup demo area with screens and microphones.",
    assignee_id: "u_default", deadline: "2026-05-08", priority: "normal", status: "not-started",
    created_by: "u_default", created_at: "2026-03-10T10:00:00Z",
    subtasks: [],
  },
];

const defaultTaskComments: TaskComment[] = [];
const defaultBillEditLogs: BillEditLog[] = [];

const defaultBills: Bill[] = [
  {
    id: "b1", event_id: "e1", dept_id: "d1", vendor_name: "AV Rentals India",
    description: "LED panel rental for main stage",
    amount: 95000, advance_amount: 40000, bill_file_url: "", invoice_number: "AVR-2026-001",
    status: "pending", advance_status: "advance-given", category: "Equipment",
    submitted_by: "u_default", dept_verified_by: null, ca_approved_by: null, settled_by: null,
    submitted_at: "2026-03-01T10:00:00Z", dept_verified_at: null, ca_approved_at: null, settled_at: null,
    due_date: "2026-04-01",
  },
];

const defaultDocuments: Document[] = [
  {
    id: "doc1", event_id: "e1", dept_id: "d1", name: "Stage Layout v1.pdf",
    folder: "Layouts", file_url: "", file_size: "2.1 MB",
    uploaded_by: "u_default", uploaded_at: "2026-03-01T10:00:00Z",
    description: "Initial stage layout design",
  },
];

const defaultActivities: Activity[] = [];
const defaultDeptHealth: DeptHealth[] = [];
const defaultNotifications: Notification[] = [];

interface MockDataContextType {
  currentUser: Profile;
  setCurrentUser: (user: Profile) => void;
  isAuthenticated: boolean;
  setIsAuthenticated: (v: boolean) => void;
  hasSelectedRole: boolean;
  setHasSelectedRole: (v: boolean) => void;
  profiles: Profile[];
  setProfiles: (p: Profile[]) => void;
  subscription: Subscription;
  events: Event[];
  setEvents: (e: Event[]) => void;
  departments: Department[];
  setDepartments: (d: Department[]) => void;
  tasks: Task[];
  taskComments: TaskComment[];
  bills: Bill[];
  billEditLogs: BillEditLog[];
  documents: Document[];
  setDocuments: (d: Document[]) => void;
  activities: Activity[];
  deptHealth: DeptHealth[];
  notifications: Notification[];
  organisations: Organisation[];
  setOrganisations: (o: Organisation[]) => void;
  setNotifications: (n: Notification[]) => void;
  setTasks: (t: Task[]) => void;
  setBills: (b: Bill[]) => void;
  setBillEditLogs: (l: BillEditLog[]) => void;
  setTaskComments: (c: TaskComment[]) => void;
  login: (email: string, password: string) => boolean;
  signup: (name: string, email: string, password: string) => boolean;
  logout: () => void;
  selectRole: (role: Role) => void;
  getProfile: (id: string) => Profile | undefined;
  getEvent: (id: string) => Event | undefined;
  getDepartment: (id: string) => Department | undefined;
  getDeptsByEvent: (eventId: string) => Department[];
  getTasksByEvent: (eventId: string) => Task[];
  getTasksByDept: (deptId: string) => Task[];
  getCommentsByTask: (taskId: string) => TaskComment[];
  getBillsByEvent: (eventId: string) => Bill[];
  getBillEditLogs: (billId: string) => BillEditLog[];
  getDocsByEvent: (eventId: string) => Document[];
  getActivitiesByEvent: (eventId: string) => Activity[];
  getUserNotifications: () => Notification[];
  isFreePlan: boolean;
}

const MockDataContext = createContext<MockDataContextType | null>(null);

export function MockDataProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
  
  // Build currentUser from auth profile
  const buildCurrentUser = (): Profile => {
    if (auth.profile) {
      return {
        id: auth.profile.id,
        name: auth.profile.name || "User",
        email: auth.profile.email,
        phone: auth.profile.phone || "",
        role: (auth.role as Role) || "sa",
        avatar_color: auth.profile.avatar_color || "#4338ca",
        dept_name: auth.profile.dept_name || "Administration",
      };
    }
    return defaultProfiles[0];
  };

  const [currentUser, setCurrentUser] = useState<Profile>(buildCurrentUser);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasSelectedRole, setHasSelectedRole] = useState(true);
  const [profileList, setProfiles] = useState<Profile[]>(defaultProfiles);
  const [notifs, setNotifications] = useState(defaultNotifications);
  const [taskList, setTasks] = useState(defaultTasks);
  const [commentList, setTaskComments] = useState(defaultTaskComments);
  const [billList, setBills] = useState(defaultBills);
  const [eventList, setEvents] = useState(defaultEvents);
  const [deptList, setDepartments] = useState(defaultDepartments);
  const [docList, setDocuments] = useState(defaultDocuments);
  const [editLogs, setBillEditLogs] = useState(defaultBillEditLogs);
  const [orgList, setOrganisations] = useState(defaultOrganisations);

  // Sync currentUser with auth profile whenever it changes
  useState(() => {
    if (auth.profile) {
      const u = buildCurrentUser();
      setCurrentUser(u);
      // Update profile list to include the logged-in user
      setProfiles(prev => {
        const exists = prev.find(p => p.id === u.id);
        if (!exists) return [u, ...prev.filter(p => p.id !== "u_default")];
        return prev.map(p => p.id === u.id ? u : p);
      });
    }
  });

  const login = useCallback((_email: string, _password: string) => {
    setIsAuthenticated(true);
    setHasSelectedRole(true);
    return true;
  }, []);

  const signup = useCallback((_name: string, _email: string, _password: string) => {
    setIsAuthenticated(true);
    setHasSelectedRole(false);
    return true;
  }, []);

  const logout = useCallback(() => { setIsAuthenticated(false); }, []);
  const selectRole = useCallback((role: Role) => {
    setCurrentUser(prev => ({ ...prev, role }));
    setHasSelectedRole(true);
  }, []);

  const getProfile = (id: string) => profileList.find(p => p.id === id) || (id === currentUser.id ? currentUser : undefined);
  const getEvent = (id: string) => eventList.find(e => e.id === id);
  const getDepartment = (id: string) => deptList.find(d => d.id === id);
  const getDeptsByEvent = (eventId: string) => deptList.filter(d => d.event_id === eventId);
  const getTasksByEvent = (eventId: string) => taskList.filter(t => t.event_id === eventId);
  const getTasksByDept = (deptId: string) => taskList.filter(t => t.dept_id === deptId);
  const getCommentsByTask = (taskId: string) => commentList.filter(c => c.task_id === taskId);
  const getBillsByEvent = (eventId: string) => billList.filter(b => b.event_id === eventId);
  const getBillEditLogs = (billId: string) => editLogs.filter(l => l.bill_id === billId);
  const getDocsByEvent = (eventId: string) => docList.filter(d => d.event_id === eventId);
  const getActivitiesByEvent = (eventId: string) => defaultActivities.filter(a => a.event_id === eventId);
  const getUserNotifications = () => notifs.filter(n => n.user_id === currentUser.id);

  return (
    <MockDataContext.Provider value={{
      currentUser, setCurrentUser, isAuthenticated, setIsAuthenticated,
      hasSelectedRole, setHasSelectedRole,
      profiles: profileList, setProfiles, subscription: defaultSubscription,
      events: eventList, setEvents, departments: deptList, setDepartments,
      tasks: taskList, taskComments: commentList, bills: billList, billEditLogs: editLogs,
      documents: docList, setDocuments, activities: defaultActivities,
      deptHealth: defaultDeptHealth, notifications: notifs,
      organisations: orgList, setOrganisations,
      setNotifications, setTasks, setBills, setBillEditLogs, setTaskComments,
      login, signup, logout, selectRole,
      getProfile, getEvent, getDepartment, getDeptsByEvent, getTasksByEvent, getTasksByDept,
      getCommentsByTask, getBillsByEvent, getBillEditLogs, getDocsByEvent, getActivitiesByEvent, getUserNotifications,
      isFreePlan: defaultSubscription.plan === "free",
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
