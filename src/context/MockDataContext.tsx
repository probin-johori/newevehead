import { createContext, useContext, useState, useCallback, ReactNode } from "react";

export type Role = "sa" | "org" | "dept_head" | "dept_member";
export type Plan = "free" | "pro" | "business";
export type EventStatus = "planning" | "active" | "completed" | "archived";
export type TaskStatus = "not-started" | "in-progress" | "blocked" | "completed";
export type TaskPriority = "low" | "medium" | "high";
export type ReimbursementStatus = "pending" | "dept-approved" | "ca-approved" | "rejected";
export type PayStatus = "not-paid" | "advance-paid" | "paid";
export type DocFolder = "Contracts" | "Layouts" | "Permits" | "Other";

export interface Profile {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar_color: string;
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
}

export interface Department {
  id: string;
  event_id: string;
  name: string;
  head_id: string;
  allocated_budget: number;
  notes: string;
}

export interface DepartmentMember {
  dept_id: string;
  user_id: string;
}

export interface Task {
  id: string;
  event_id: string;
  dept_id: string;
  title: string;
  assignee_id: string;
  deadline: string;
  priority: TaskPriority;
  status: TaskStatus;
  created_by: string;
}

export interface TaskComment {
  id: string;
  task_id: string;
  author_id: string;
  body: string;
  created_at: string;
}

export interface Reimbursement {
  id: string;
  event_id: string;
  dept_id: string;
  vendor_name: string;
  description: string;
  amount: number;
  bill_file_url: string;
  status: ReimbursementStatus;
  pay_status: PayStatus;
  submitted_by: string;
  dept_approved_by: string | null;
  ca_approved_by: string | null;
  submitted_at: string;
  dept_approved_at: string | null;
  ca_approved_at: string | null;
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
}

export interface Notification {
  id: string;
  user_id: string;
  body: string;
  type: string;
  read: boolean;
  created_at: string;
}

// --- SEED DATA ---
const profiles: Profile[] = [
  { id: "u1", name: "Arjun Mehta", email: "arjun@eventops.io", role: "sa", avatar_color: "#1a3a0f" },
  { id: "u2", name: "Priya Sharma", email: "priya@eventops.io", role: "org", avatar_color: "#4a8a28" },
  { id: "u3", name: "Rahul Patel", email: "rahul@eventops.io", role: "dept_head", avatar_color: "#1e40af" },
  { id: "u4", name: "Sneha Gupta", email: "sneha@eventops.io", role: "dept_head", avatar_color: "#a16207" },
  { id: "u5", name: "Vikram Singh", email: "vikram@eventops.io", role: "dept_member", avatar_color: "#b91c1c" },
  { id: "u6", name: "Ananya Das", email: "ananya@eventops.io", role: "dept_member", avatar_color: "#6b21a8" },
];

const subscription: Subscription = {
  id: "sub1", org_id: "u1", plan: "pro", slots_total: 4, slots_used: 3,
};

const events: Event[] = [
  { id: "e1", name: "Diwali Grand Gala", location: "Mumbai Convention Center", start_date: "2026-03-15", end_date: "2026-03-17", setup_date: "2026-03-13", teardown_date: "2026-03-18", estimated_budget: 500000, status: "active", poc_id: "u2", created_by: "u1" },
  { id: "e2", name: "Tech Summit 2026", location: "Bangalore Tech Park", start_date: "2026-04-10", end_date: "2026-04-12", setup_date: "2026-04-08", teardown_date: "2026-04-13", estimated_budget: 800000, status: "active", poc_id: "u2", created_by: "u1" },
  { id: "e3", name: "Spring Music Festival", location: "Delhi Open Grounds", start_date: "2026-05-01", end_date: "2026-05-03", setup_date: "2026-04-29", teardown_date: "2026-05-04", estimated_budget: 300000, status: "planning", poc_id: "u2", created_by: "u1" },
  { id: "e4", name: "Annual Awards Night", location: "Hyderabad Grand Hall", start_date: "2026-01-10", end_date: "2026-01-10", setup_date: "2026-01-09", teardown_date: "2026-01-11", estimated_budget: 250000, status: "completed", poc_id: "u2", created_by: "u1" },
];

const departments: Department[] = [
  { id: "d1", event_id: "e1", name: "Lighting", head_id: "u3", allocated_budget: 120000, notes: "LED setup for main stage" },
  { id: "d2", event_id: "e1", name: "Catering", head_id: "u4", allocated_budget: 200000, notes: "500 pax vegetarian menu" },
  { id: "d3", event_id: "e1", name: "Stage & Sound", head_id: "u3", allocated_budget: 150000, notes: "JBL sound system rental" },
  { id: "d4", event_id: "e2", name: "Logistics", head_id: "u4", allocated_budget: 180000, notes: "Transport & venue prep" },
  { id: "d5", event_id: "e2", name: "Catering", head_id: "u4", allocated_budget: 250000, notes: "800 pax multi-cuisine" },
  { id: "d6", event_id: "e2", name: "Security", head_id: "u3", allocated_budget: 100000, notes: "40 guards, 3 shifts" },
  { id: "d7", event_id: "e3", name: "Stage & Sound", head_id: "u3", allocated_budget: 100000, notes: "" },
  { id: "d8", event_id: "e3", name: "Lighting", head_id: "u3", allocated_budget: 80000, notes: "" },
  { id: "d9", event_id: "e4", name: "Catering", head_id: "u4", allocated_budget: 100000, notes: "" },
  { id: "d10", event_id: "e4", name: "Stage & Sound", head_id: "u3", allocated_budget: 80000, notes: "" },
  { id: "d11", event_id: "e4", name: "Logistics", head_id: "u4", allocated_budget: 70000, notes: "" },
];

const departmentMembers: DepartmentMember[] = [
  { dept_id: "d1", user_id: "u5" }, { dept_id: "d2", user_id: "u6" },
  { dept_id: "d3", user_id: "u5" }, { dept_id: "d4", user_id: "u6" },
  { dept_id: "d5", user_id: "u5" }, { dept_id: "d6", user_id: "u6" },
];

const tasks: Task[] = [
  { id: "t1", event_id: "e1", dept_id: "d1", title: "Install main stage LED panels", assignee_id: "u5", deadline: "2026-03-12", priority: "high", status: "in-progress", created_by: "u3" },
  { id: "t2", event_id: "e1", dept_id: "d2", title: "Confirm menu with vendor", assignee_id: "u6", deadline: "2026-02-25", priority: "high", status: "not-started", created_by: "u4" },
  { id: "t3", event_id: "e1", dept_id: "d3", title: "Test sound system", assignee_id: "u5", deadline: "2026-03-14", priority: "medium", status: "not-started", created_by: "u3" },
  { id: "t4", event_id: "e2", dept_id: "d4", title: "Arrange shuttle buses", assignee_id: "u6", deadline: "2026-04-05", priority: "medium", status: "in-progress", created_by: "u4" },
  { id: "t5", event_id: "e2", dept_id: "d5", title: "Finalize catering contract", assignee_id: "u5", deadline: "2026-02-20", priority: "high", status: "blocked", created_by: "u4" },
  { id: "t6", event_id: "e2", dept_id: "d6", title: "Security briefing", assignee_id: "u6", deadline: "2026-04-08", priority: "low", status: "not-started", created_by: "u3" },
  { id: "t7", event_id: "e1", dept_id: "d1", title: "Order spare bulbs", assignee_id: "u5", deadline: "2026-03-10", priority: "low", status: "completed", created_by: "u3" },
];

const reimbursements: Reimbursement[] = [
  { id: "r1", event_id: "e1", dept_id: "d1", vendor_name: "LightPro India", description: "LED panel rental deposit", amount: 45000, bill_file_url: "", status: "pending", pay_status: "not-paid", submitted_by: "u5", dept_approved_by: null, ca_approved_by: null, submitted_at: "2026-02-20T10:00:00Z", dept_approved_at: null, ca_approved_at: null },
  { id: "r2", event_id: "e1", dept_id: "d2", vendor_name: "Spice Kitchen", description: "Advance for catering supplies", amount: 80000, bill_file_url: "", status: "dept-approved", pay_status: "not-paid", submitted_by: "u6", dept_approved_by: "u4", ca_approved_by: null, submitted_at: "2026-02-18T09:00:00Z", dept_approved_at: "2026-02-19T14:00:00Z", ca_approved_at: null },
  { id: "r3", event_id: "e2", dept_id: "d4", vendor_name: "City Transport Co.", description: "Shuttle bus booking", amount: 35000, bill_file_url: "", status: "ca-approved", pay_status: "advance-paid", submitted_by: "u6", dept_approved_by: "u4", ca_approved_by: "u1", submitted_at: "2026-02-15T11:00:00Z", dept_approved_at: "2026-02-16T10:00:00Z", ca_approved_at: "2026-02-17T09:00:00Z" },
  { id: "r4", event_id: "e4", dept_id: "d9", vendor_name: "Royal Caterers", description: "Final catering payment", amount: 95000, bill_file_url: "", status: "ca-approved", pay_status: "paid", submitted_by: "u6", dept_approved_by: "u4", ca_approved_by: "u1", submitted_at: "2026-01-08T10:00:00Z", dept_approved_at: "2026-01-08T15:00:00Z", ca_approved_at: "2026-01-09T10:00:00Z" },
];

const documents: Document[] = [
  { id: "doc1", event_id: "e1", dept_id: null, name: "Venue Contract.pdf", folder: "Contracts", file_url: "", file_size: "2.4 MB", uploaded_by: "u2", uploaded_at: "2026-02-10T10:00:00Z" },
  { id: "doc2", event_id: "e1", dept_id: "d1", name: "Stage Layout v2.png", folder: "Layouts", file_url: "", file_size: "1.8 MB", uploaded_by: "u3", uploaded_at: "2026-02-12T14:00:00Z" },
  { id: "doc3", event_id: "e2", dept_id: null, name: "Fire Safety Permit.pdf", folder: "Permits", file_url: "", file_size: "540 KB", uploaded_by: "u2", uploaded_at: "2026-02-14T09:00:00Z" },
  { id: "doc4", event_id: "e2", dept_id: "d5", name: "Catering Menu Options.docx", folder: "Other", file_url: "", file_size: "320 KB", uploaded_by: "u4", uploaded_at: "2026-02-15T11:00:00Z" },
  { id: "doc5", event_id: "e1", dept_id: "d2", name: "Catering Agreement.pdf", folder: "Contracts", file_url: "", file_size: "1.1 MB", uploaded_by: "u4", uploaded_at: "2026-02-16T08:00:00Z" },
  { id: "doc6", event_id: "e4", dept_id: null, name: "Post-event Report.pdf", folder: "Other", file_url: "", file_size: "3.2 MB", uploaded_by: "u2", uploaded_at: "2026-01-15T10:00:00Z" },
];

const notifications: Notification[] = [
  { id: "n1", user_id: "u1", body: "Reimbursement submitted by Vikram for LightPro India (₹45,000)", type: "reimbursement_submitted", read: false, created_at: "2026-02-20T10:05:00Z" },
  { id: "n2", user_id: "u1", body: "Spice Kitchen reimbursement approved by Dept Head Sneha", type: "reimbursement_dept_approved", read: false, created_at: "2026-02-19T14:05:00Z" },
  { id: "n3", user_id: "u3", body: "Task 'Finalize catering contract' is overdue", type: "task_overdue", read: false, created_at: "2026-02-21T08:00:00Z" },
  { id: "n4", user_id: "u5", body: "You've been assigned: Install main stage LED panels", type: "task_assigned", read: true, created_at: "2026-02-18T10:00:00Z" },
  { id: "n5", user_id: "u6", body: "City Transport Co. reimbursement has been CA approved", type: "reimbursement_ca_approved", read: true, created_at: "2026-02-17T09:05:00Z" },
];

interface MockDataContextType {
  currentUser: Profile;
  setCurrentUser: (user: Profile) => void;
  isAuthenticated: boolean;
  setIsAuthenticated: (v: boolean) => void;
  hasSelectedRole: boolean;
  setHasSelectedRole: (v: boolean) => void;
  profiles: Profile[];
  subscription: Subscription;
  events: Event[];
  departments: Department[];
  departmentMembers: DepartmentMember[];
  tasks: Task[];
  reimbursements: Reimbursement[];
  documents: Document[];
  notifications: Notification[];
  setNotifications: (n: Notification[]) => void;
  setTasks: (t: Task[]) => void;
  setReimbursements: (r: Reimbursement[]) => void;
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
  getReimbursementsByEvent: (eventId: string) => Reimbursement[];
  getDocsByEvent: (eventId: string) => Document[];
  getUserNotifications: () => Notification[];
  isFreePlan: boolean;
}

const MockDataContext = createContext<MockDataContextType | null>(null);

export function MockDataProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<Profile>(profiles[0]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasSelectedRole, setHasSelectedRole] = useState(true);
  const [notifs, setNotifications] = useState(notifications);
  const [taskList, setTasks] = useState(tasks);
  const [reimbList, setReimbursements] = useState(reimbursements);

  const login = useCallback((email: string, _password: string) => {
    const found = profiles.find(p => p.email === email);
    if (found) {
      setCurrentUser(found);
      setIsAuthenticated(true);
      setHasSelectedRole(true);
      return true;
    }
    // Default to SA for demo
    setCurrentUser(profiles[0]);
    setIsAuthenticated(true);
    setHasSelectedRole(true);
    return true;
  }, []);

  const signup = useCallback((name: string, email: string, _password: string) => {
    const newUser: Profile = { id: "u_new", name, email, role: "dept_member", avatar_color: "#6b21a8" };
    setCurrentUser(newUser);
    setIsAuthenticated(true);
    setHasSelectedRole(false);
    return true;
  }, []);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
  }, []);

  const selectRole = useCallback((role: Role) => {
    setCurrentUser(prev => ({ ...prev, role }));
    setHasSelectedRole(true);
  }, []);

  const getProfile = (id: string) => profiles.find(p => p.id === id);
  const getEvent = (id: string) => events.find(e => e.id === id);
  const getDepartment = (id: string) => departments.find(d => d.id === id);
  const getDeptsByEvent = (eventId: string) => departments.filter(d => d.event_id === eventId);
  const getTasksByEvent = (eventId: string) => taskList.filter(t => t.event_id === eventId);
  const getTasksByDept = (deptId: string) => taskList.filter(t => t.dept_id === deptId);
  const getReimbursementsByEvent = (eventId: string) => reimbList.filter(r => r.event_id === eventId);
  const getDocsByEvent = (eventId: string) => documents.filter(d => d.event_id === eventId);
  const getUserNotifications = () => notifs.filter(n => n.user_id === currentUser.id);

  return (
    <MockDataContext.Provider value={{
      currentUser, setCurrentUser, isAuthenticated, setIsAuthenticated,
      hasSelectedRole, setHasSelectedRole,
      profiles, subscription, events, departments, departmentMembers,
      tasks: taskList, reimbursements: reimbList, documents, notifications: notifs,
      setNotifications, setTasks, setReimbursements,
      login, signup, logout, selectRole,
      getProfile, getEvent, getDepartment, getDeptsByEvent,
      getTasksByEvent, getTasksByDept, getReimbursementsByEvent,
      getDocsByEvent, getUserNotifications,
      isFreePlan: subscription.plan === "free",
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
