import { createContext, useContext, useState, useCallback, ReactNode } from "react";

export type Role = "sa" | "org" | "dept_head" | "dept_member";
export type Plan = "free" | "pro" | "business";
export type EventStatus = "planning" | "active" | "completed" | "archived";
export type TaskStatus = "not-started" | "in-progress" | "blocked" | "completed";
export type TaskPriority = "low" | "medium" | "high";
export type BillStatus = "pending" | "dept-verified" | "settled" | "rejected";
export type AdvanceStatus = "not-given" | "advance-given" | "settled";
export type DocFolder = "Contracts" | "Layouts" | "Permits" | "Other";

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
  description: string;
  assignee_id: string;
  deadline: string;
  priority: TaskPriority;
  status: TaskStatus;
  created_by: string;
  created_at: string;
}

export interface TaskComment {
  id: string;
  task_id: string;
  author_id: string;
  body: string;
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
  settled_by: string | null;
  submitted_at: string;
  dept_verified_at: string | null;
  settled_at: string | null;
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
  link_to?: string;
}

// --- SEED DATA ---
const profiles: Profile[] = [
  { id: "u1", name: "Arjun Mehta", email: "arjun@eventops.io", phone: "+91 98765 43210", role: "sa", avatar_color: "#1a3a0f", dept_name: "Administration" },
  { id: "u2", name: "Priya Sharma", email: "priya@eventops.io", phone: "+91 98765 43211", role: "org", avatar_color: "#4a8a28", dept_name: "Operations" },
  { id: "u3", name: "Rahul Patel", email: "rahul@eventops.io", phone: "+91 98765 43212", role: "dept_head", avatar_color: "#1e40af", dept_name: "Lighting & Sound" },
  { id: "u4", name: "Sneha Gupta", email: "sneha@eventops.io", phone: "+91 98765 43213", role: "dept_head", avatar_color: "#a16207", dept_name: "Catering & Logistics" },
  { id: "u5", name: "Vikram Singh", email: "vikram@eventops.io", phone: "+91 98765 43214", role: "dept_member", avatar_color: "#b91c1c", dept_name: "Lighting" },
  { id: "u6", name: "Ananya Das", email: "ananya@eventops.io", phone: "+91 98765 43215", role: "dept_member", avatar_color: "#6b21a8", dept_name: "Catering" },
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
  { id: "t1", event_id: "e1", dept_id: "d1", title: "Install main stage LED panels", description: "Set up 12 LED panels for the main stage area. Coordinate with venue electrician for power supply.", assignee_id: "u5", deadline: "2026-03-12", priority: "high", status: "in-progress", created_by: "u3", created_at: "2026-02-15T10:00:00Z" },
  { id: "t2", event_id: "e1", dept_id: "d2", title: "Confirm menu with vendor", description: "Finalize the vegetarian menu options with Spice Kitchen. Get tasting session confirmed.", assignee_id: "u6", deadline: "2026-02-25", priority: "high", status: "not-started", created_by: "u4", created_at: "2026-02-14T09:00:00Z" },
  { id: "t3", event_id: "e1", dept_id: "d3", title: "Test sound system", description: "Full sound check of JBL system at venue. Test microphones, monitors, and main speakers.", assignee_id: "u5", deadline: "2026-03-14", priority: "medium", status: "not-started", created_by: "u3", created_at: "2026-02-16T11:00:00Z" },
  { id: "t4", event_id: "e2", dept_id: "d4", title: "Arrange shuttle buses", description: "Book 5 shuttle buses for guest transport between hotel and venue. Route planning required.", assignee_id: "u6", deadline: "2026-04-05", priority: "medium", status: "in-progress", created_by: "u4", created_at: "2026-02-10T10:00:00Z" },
  { id: "t5", event_id: "e2", dept_id: "d5", title: "Finalize catering contract", description: "Get final contract signed with multi-cuisine catering vendor. Includes dietary options.", assignee_id: "u5", deadline: "2026-02-20", priority: "high", status: "blocked", created_by: "u4", created_at: "2026-02-08T10:00:00Z" },
  { id: "t6", event_id: "e2", dept_id: "d6", title: "Security briefing", description: "Conduct security briefing for all 40 guards. Share venue map and emergency protocols.", assignee_id: "u6", deadline: "2026-04-08", priority: "low", status: "not-started", created_by: "u3", created_at: "2026-02-12T10:00:00Z" },
  { id: "t7", event_id: "e1", dept_id: "d1", title: "Order spare bulbs", description: "Order 50 spare LED bulbs as backup. Contact LightPro India for bulk pricing.", assignee_id: "u5", deadline: "2026-03-10", priority: "low", status: "completed", created_by: "u3", created_at: "2026-02-13T10:00:00Z" },
];

const taskComments: TaskComment[] = [
  { id: "tc1", task_id: "t1", author_id: "u3", body: "LED panels have been shipped. ETA March 10th. Make sure the venue loading dock is accessible.", created_at: "2026-02-18T14:00:00Z" },
  { id: "tc2", task_id: "t1", author_id: "u5", body: "Confirmed with venue. Loading dock available from 8 AM on March 10th. Will need 4 crew members for unloading.", created_at: "2026-02-19T09:30:00Z" },
  { id: "tc3", task_id: "t1", author_id: "u1", body: "Great progress. Make sure we have insurance for the panels during transport.", created_at: "2026-02-20T11:00:00Z" },
  { id: "tc4", task_id: "t5", author_id: "u4", body: "Vendor is asking for 50% advance. Need SA approval on this.", created_at: "2026-02-19T10:00:00Z" },
  { id: "tc5", task_id: "t5", author_id: "u1", body: "Approved. Process the advance through the billing system.", created_at: "2026-02-19T15:00:00Z" },
  { id: "tc6", task_id: "t2", author_id: "u4", body: "Tasting session scheduled for Feb 23rd at their kitchen.", created_at: "2026-02-17T10:00:00Z" },
  { id: "tc7", task_id: "t4", author_id: "u6", body: "Got quotes from 3 bus companies. City Transport Co. is the best option at ₹7000 per bus per day.", created_at: "2026-02-15T14:00:00Z" },
];

const bills: Bill[] = [
  { id: "b1", event_id: "e1", dept_id: "d1", vendor_name: "LightPro India", description: "LED panel rental deposit", amount: 45000, advance_amount: 20000, bill_file_url: "invoice_lightpro_001.pdf", invoice_number: "LP-2026-001", status: "pending", advance_status: "advance-given", submitted_by: "u5", dept_verified_by: null, settled_by: null, submitted_at: "2026-02-20T10:00:00Z", dept_verified_at: null, settled_at: null },
  { id: "b2", event_id: "e1", dept_id: "d2", vendor_name: "Spice Kitchen", description: "Advance for catering supplies – raw materials", amount: 80000, advance_amount: 40000, bill_file_url: "invoice_spicekitchen_045.pdf", invoice_number: "SK-2026-045", status: "dept-verified", advance_status: "advance-given", submitted_by: "u6", dept_verified_by: "u4", settled_by: null, submitted_at: "2026-02-18T09:00:00Z", dept_verified_at: "2026-02-19T14:00:00Z", settled_at: null },
  { id: "b3", event_id: "e2", dept_id: "d4", vendor_name: "City Transport Co.", description: "Shuttle bus booking – 5 buses for 3 days", amount: 105000, advance_amount: 50000, bill_file_url: "invoice_citytransport_112.pdf", invoice_number: "CT-2026-112", status: "settled", advance_status: "settled", submitted_by: "u6", dept_verified_by: "u4", settled_by: "u1", submitted_at: "2026-02-15T11:00:00Z", dept_verified_at: "2026-02-16T10:00:00Z", settled_at: "2026-02-17T09:00:00Z" },
  { id: "b4", event_id: "e4", dept_id: "d9", vendor_name: "Royal Caterers", description: "Final catering payment – awards night", amount: 95000, advance_amount: 45000, bill_file_url: "invoice_royal_089.pdf", invoice_number: "RC-2026-089", status: "settled", advance_status: "settled", submitted_by: "u6", dept_verified_by: "u4", settled_by: "u1", submitted_at: "2026-01-08T10:00:00Z", dept_verified_at: "2026-01-08T15:00:00Z", settled_at: "2026-01-09T10:00:00Z" },
  { id: "b5", event_id: "e2", dept_id: "d5", vendor_name: "Fresh Foods Ltd", description: "Catering supplies – fresh vegetables & fruits", amount: 32000, advance_amount: 15000, bill_file_url: "invoice_freshfoods_023.pdf", invoice_number: "FF-2026-023", status: "pending", advance_status: "advance-given", submitted_by: "u5", dept_verified_by: null, settled_by: null, submitted_at: "2026-02-22T09:00:00Z", dept_verified_at: null, settled_at: null },
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
  { id: "n1", user_id: "u1", body: "New bill submitted by Vikram for LightPro India (₹45,000)", type: "bill_submitted", read: false, created_at: "2026-02-20T10:05:00Z", link_to: "/billing" },
  { id: "n2", user_id: "u1", body: "Spice Kitchen bill verified by Dept Head Sneha", type: "bill_verified", read: false, created_at: "2026-02-19T14:05:00Z", link_to: "/billing" },
  { id: "n3", user_id: "u3", body: "Task 'Finalize catering contract' is overdue", type: "task_overdue", read: false, created_at: "2026-02-21T08:00:00Z", link_to: "/tasks/t5" },
  { id: "n4", user_id: "u5", body: "You've been assigned: Install main stage LED panels", type: "task_assigned", read: true, created_at: "2026-02-18T10:00:00Z", link_to: "/tasks/t1" },
  { id: "n5", user_id: "u6", body: "City Transport Co. bill has been settled by Finance", type: "bill_settled", read: true, created_at: "2026-02-17T09:05:00Z", link_to: "/billing" },
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
  taskComments: TaskComment[];
  bills: Bill[];
  documents: Document[];
  notifications: Notification[];
  setNotifications: (n: Notification[]) => void;
  setTasks: (t: Task[]) => void;
  setBills: (b: Bill[]) => void;
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
  const [commentList, setTaskComments] = useState(taskComments);
  const [billList, setBills] = useState(bills);

  const login = useCallback((email: string, _password: string) => {
    const found = profiles.find(p => p.email === email);
    if (found) {
      setCurrentUser(found);
      setIsAuthenticated(true);
      setHasSelectedRole(true);
      return true;
    }
    setCurrentUser(profiles[0]);
    setIsAuthenticated(true);
    setHasSelectedRole(true);
    return true;
  }, []);

  const signup = useCallback((name: string, email: string, _password: string) => {
    const newUser: Profile = { id: "u_new", name, email, phone: "", role: "dept_member", avatar_color: "#6b21a8" };
    setCurrentUser(newUser);
    setIsAuthenticated(true);
    setHasSelectedRole(false);
    return true;
  }, []);

  const logout = useCallback(() => { setIsAuthenticated(false); }, []);
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
  const getCommentsByTask = (taskId: string) => commentList.filter(c => c.task_id === taskId);
  const getBillsByEvent = (eventId: string) => billList.filter(b => b.event_id === eventId);
  const getDocsByEvent = (eventId: string) => documents.filter(d => d.event_id === eventId);
  const getUserNotifications = () => notifs.filter(n => n.user_id === currentUser.id);

  return (
    <MockDataContext.Provider value={{
      currentUser, setCurrentUser, isAuthenticated, setIsAuthenticated,
      hasSelectedRole, setHasSelectedRole,
      profiles, subscription, events, departments, departmentMembers,
      tasks: taskList, taskComments: commentList, bills: billList, documents, notifications: notifs,
      setNotifications, setTasks, setBills, setTaskComments,
      login, signup, logout, selectRole,
      getProfile, getEvent, getDepartment, getDeptsByEvent,
      getTasksByEvent, getTasksByDept, getCommentsByTask, getBillsByEvent,
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
