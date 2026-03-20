import { createContext, useContext, useState, useCallback, useEffect, ReactNode, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
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
  org_id?: string;
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
  task_id?: string;
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
  related_event_id?: string;
  related_task_id?: string;
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

export interface TeamMember {
  id: string;
  org_id: string;
  user_id: string;
  invited_by: string | null;
  role: string;
  created_at: string;
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

const defaultSubscription: Subscription = {
  id: "sub1", org_id: "", plan: "pro", slots_total: 10, slots_used: 2,
};

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
  setEvents: (e: Event[] | ((prev: Event[]) => Event[])) => void;
  departments: Department[];
  setDepartments: (d: Department[] | ((prev: Department[]) => Department[])) => void;
  tasks: Task[];
  taskComments: TaskComment[];
  bills: Bill[];
  billEditLogs: BillEditLog[];
  documents: Document[];
  setDocuments: (d: Document[] | ((prev: Document[]) => Document[])) => void;
  activities: Activity[];
  deptHealth: DeptHealth[];
  notifications: Notification[];
  organisations: Organisation[];
  setOrganisations: (o: Organisation[]) => void;
  setNotifications: (n: Notification[] | ((prev: Notification[]) => Notification[])) => void;
  setTasks: (t: Task[] | ((prev: Task[]) => Task[])) => void;
  setBills: (b: Bill[] | ((prev: Bill[]) => Bill[])) => void;
  setBillEditLogs: (l: BillEditLog[]) => void;
  setTaskComments: (c: TaskComment[] | ((prev: TaskComment[]) => TaskComment[])) => void;
  teamMembers: TeamMember[];
  teamProfiles: Profile[];
  refreshTeamMembers: () => Promise<void>;
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
  // DB operations
  addEvent: (event: Omit<Event, "id">) => Promise<Event | null>;
  updateEvent: (id: string, updates: Partial<Event>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  addOrganisation: (name: string) => Promise<Organisation | null>;
  updateOrganisation: (id: string, updates: Partial<Organisation>) => Promise<void>;
  switchOrganisation: (orgId: string) => void;
  addDepartment: (dept: Omit<Department, "id">) => Promise<Department | null>;
  updateDepartment: (id: string, updates: Partial<Department>) => Promise<void>;
  deleteDepartment: (id: string) => Promise<void>;
  addTask: (task: Omit<Task, "id" | "subtasks" | "created_at">) => Promise<Task | null>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  addBill: (bill: Partial<Bill>) => Promise<Bill | null>;
  updateBill: (id: string, updates: Partial<Bill>) => Promise<void>;
  deleteBill: (id: string) => Promise<void>;
  addDocument: (doc: Partial<Document>) => Promise<Document | null>;
  deleteDocument: (id: string) => Promise<void>;
  addComment: (comment: Omit<TaskComment, "id" | "created_at">) => Promise<void>;
  addActivity: (activity: Omit<Activity, "id" | "created_at">) => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  orgId: string | null;
}

const MockDataContext = createContext<MockDataContextType | null>(null);

// Helper to map DB row to our interfaces
function mapEvent(row: any): Event {
  return {
    id: row.id,
    org_id: row.org_id,
    name: row.name,
    location: row.location || "",
    start_date: row.start_date,
    end_date: row.end_date,
    setup_date: row.setup_date || row.start_date,
    teardown_date: row.teardown_date || row.end_date,
    estimated_budget: Number(row.estimated_budget) || 0,
    status: row.status as EventStatus,
    poc_id: row.poc_id || "",
    created_by: row.created_by || "",
    image_url: row.image_url || undefined,
  };
}

function mapDepartment(row: any): Department {
  return {
    id: row.id,
    event_id: row.event_id,
    name: row.name,
    head_id: row.head_id || "",
    allocated_budget: Number(row.allocated_budget) || 0,
    spent: Number(row.spent) || 0,
    notes: row.notes || "",
    member_ids: row.member_ids || [],
  };
}

function mapTask(row: any, subtasks: SubTask[] = []): Task {
  return {
    id: row.id,
    event_id: row.event_id,
    dept_id: row.dept_id || "",
    title: row.title,
    description: row.description || "",
    assignee_id: row.assignee_id || "",
    deadline: row.deadline || "",
    priority: (row.priority || "normal") as TaskPriority,
    status: (row.status || "not-started") as TaskStatus,
    subtasks,
    created_by: row.created_by || "",
    created_at: row.created_at,
    labels: row.labels || [],
  };
}

function mapBill(row: any): Bill {
  return {
    id: row.id,
    event_id: row.event_id,
    dept_id: row.dept_id || "",
    vendor_name: row.vendor_name || "",
    description: row.description || "",
    amount: Number(row.amount) || 0,
    advance_amount: Number(row.advance_amount) || 0,
    bill_file_url: row.bill_file_url || "",
    invoice_number: row.invoice_number || "",
    status: (row.status || "pending") as BillStatus,
    advance_status: (row.advance_status || "not-given") as AdvanceStatus,
    submitted_by: row.submitted_by || "",
    dept_verified_by: row.dept_verified_by,
    ca_approved_by: row.ca_approved_by,
    settled_by: row.settled_by,
    submitted_at: row.submitted_at,
    dept_verified_at: row.dept_verified_at,
    ca_approved_at: row.ca_approved_at,
    settled_at: row.settled_at,
    category: row.category,
    due_date: row.due_date,
    paid_date: row.paid_date,
    invoice_file: row.invoice_file,
    invoice_files: row.invoice_files || [],
  };
}

function mapDocument(row: any): Document {
  return {
    id: row.id,
    event_id: row.event_id,
    dept_id: row.dept_id,
    name: row.name,
    folder: row.folder || "",
    file_url: row.file_url || "",
    file_size: row.file_size || "",
    uploaded_by: row.uploaded_by || "",
    uploaded_at: row.uploaded_at,
    description: row.description,
    visibility: row.visibility as any,
  };
}

function mapNotification(row: any): Notification {
  return {
    id: row.id,
    user_id: row.user_id,
    body: row.message,
    type: row.type || "general",
    read: row.read,
    created_at: row.created_at,
    link_to: row.link_to,
    related_event_id: row.related_event_id,
    related_task_id: row.related_task_id,
  };
}

export function MockDataProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();

  const buildCurrentUser = (): Profile => {
    if (auth.profile) {
      return {
        id: auth.profile.id,
        name: auth.profile.name || "User",
        email: auth.profile.email,
        phone: auth.profile.phone || "",
        role: (auth.role as Role) || "sa",
        avatar_color: auth.profile.avatar_color || "#4338ca",
        dept_name: auth.profile.dept_name || undefined,
      };
    }
    return { id: "", name: "User", email: "", phone: "", role: "sa", avatar_color: "#4338ca" };
  };

  const [currentUser, setCurrentUser] = useState<Profile>(buildCurrentUser);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasSelectedRole, setHasSelectedRole] = useState(true);
  const [profileList, setProfiles] = useState<Profile[]>([]);
  const [notifs, setNotifications] = useState<Notification[]>([]);
  const [taskList, setTasks] = useState<Task[]>([]);
  const [commentList, setTaskComments] = useState<TaskComment[]>([]);
  const [billList, setBills] = useState<Bill[]>([]);
  const [eventList, setEvents] = useState<Event[]>([]);
  const [deptList, setDepartments] = useState<Department[]>([]);
  const [docList, setDocuments] = useState<Document[]>([]);
  const [editLogs, setBillEditLogs] = useState<BillEditLog[]>([]);
  const [orgList, setOrganisations] = useState<Organisation[]>([]);
  const [teamMembersList, setTeamMembers] = useState<TeamMember[]>([]);
  const [teamProfilesList, setTeamProfiles] = useState<Profile[]>([]);
  const [activityList, setActivities] = useState<Activity[]>([]);
  const [subtaskMap, setSubtaskMap] = useState<Record<string, SubTask[]>>({});
  const [orgId, setOrgId] = useState<string | null>(null);
  const initialLoadDone = useRef(false);

  // Fetch org_id for current user
  useEffect(() => {
    if (!auth.user) return;
    supabase.from("team_members").select("org_id").eq("user_id", auth.user.id).limit(1).single()
      .then(({ data }) => {
        if (data) setOrgId(data.org_id);
      });
  }, [auth.user?.id]);

  // Fetch all data once org_id is known
  const fetchAllData = useCallback(async () => {
    if (!auth.user || !orgId) return;

    const [eventsRes, deptsRes, tasksRes, subtasksRes, billsRes, docsRes, commentsRes, activitiesRes, notifsRes, billLogsRes] = await Promise.all([
      supabase.from("events").select("*").eq("org_id", orgId),
      supabase.from("departments").select("*"),
      supabase.from("tasks").select("*"),
      supabase.from("subtasks").select("*"),
      supabase.from("bills").select("*"),
      supabase.from("documents").select("*"),
      supabase.from("task_comments").select("*"),
      supabase.from("activities").select("*").order("created_at", { ascending: false }),
      supabase.from("notifications").select("*").eq("user_id", auth.user.id).order("created_at", { ascending: false }),
      supabase.from("bill_edit_logs").select("*"),
    ]);

    // Build subtask map
    const stMap: Record<string, SubTask[]> = {};
    if (subtasksRes.data) {
      for (const st of subtasksRes.data) {
        if (!stMap[st.task_id]) stMap[st.task_id] = [];
        stMap[st.task_id].push({
          id: st.id, title: st.title, completed: st.completed,
          assignee_id: st.assignee_id || undefined,
          priority: st.priority as TaskPriority || undefined,
          status: st.status as TaskStatus || undefined,
          task_id: st.task_id,
        });
      }
    }
    setSubtaskMap(stMap);

    if (eventsRes.data) setEvents(eventsRes.data.map(mapEvent));
    if (deptsRes.data) setDepartments(deptsRes.data.map(mapDepartment));
    if (tasksRes.data) setTasks(tasksRes.data.map(r => mapTask(r, stMap[r.id] || [])));
    if (billsRes.data) setBills(billsRes.data.map(mapBill));
    if (docsRes.data) setDocuments(docsRes.data.map(mapDocument));
    if (commentsRes.data) setTaskComments(commentsRes.data.map((c: any) => ({
      id: c.id, task_id: c.task_id, author_id: c.author_id || "", body: c.body, created_at: c.created_at,
    })));
    if (activitiesRes.data) setActivities(activitiesRes.data.map((a: any) => ({
      id: a.id, event_id: a.event_id, user_id: a.user_id || "", description: a.description,
      link_text: a.link_text, created_at: a.created_at, type: a.type, target: a.target,
    })));
    if (notifsRes.data) setNotifications(notifsRes.data.map(mapNotification));
    if (billLogsRes.data) setBillEditLogs(billLogsRes.data.map((l: any) => ({
      id: l.id, bill_id: l.bill_id, user_id: l.user_id || "", field: l.field,
      old_value: l.old_value, new_value: l.new_value, created_at: l.created_at,
    })));

    initialLoadDone.current = true;
  }, [auth.user?.id, orgId]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Real-time subscriptions
  useEffect(() => {
    if (!auth.user || !orgId) return;

    const channel = supabase
      .channel('db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const ev = mapEvent(payload.new);
          if (ev.org_id === orgId) setEvents(prev => [...prev, ev]);
        } else if (payload.eventType === 'UPDATE') {
          setEvents(prev => prev.map(e => e.id === payload.new.id ? mapEvent(payload.new) : e));
        } else if (payload.eventType === 'DELETE') {
          setEvents(prev => prev.filter(e => e.id !== payload.old.id));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'departments' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setDepartments(prev => [...prev, mapDepartment(payload.new)]);
        } else if (payload.eventType === 'UPDATE') {
          setDepartments(prev => prev.map(d => d.id === payload.new.id ? mapDepartment(payload.new) : d));
        } else if (payload.eventType === 'DELETE') {
          setDepartments(prev => prev.filter(d => d.id !== payload.old.id));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setTasks(prev => [...prev, mapTask(payload.new, [])]);
        } else if (payload.eventType === 'UPDATE') {
          setTasks(prev => prev.map(t => t.id === payload.new.id ? mapTask(payload.new, t.subtasks) : t));
        } else if (payload.eventType === 'DELETE') {
          setTasks(prev => prev.filter(t => t.id !== payload.old.id));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subtasks' }, (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const st = payload.new;
          setTasks(prev => prev.map(t => {
            if (t.id !== st.task_id) return t;
            const existing = t.subtasks.filter(s => s.id !== st.id);
            return { ...t, subtasks: [...existing, { id: st.id, title: st.title, completed: st.completed, assignee_id: st.assignee_id, priority: st.priority, status: st.status }] };
          }));
        } else if (payload.eventType === 'DELETE') {
          setTasks(prev => prev.map(t => ({ ...t, subtasks: t.subtasks.filter(s => s.id !== payload.old.id) })));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bills' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setBills(prev => [...prev, mapBill(payload.new)]);
        } else if (payload.eventType === 'UPDATE') {
          setBills(prev => prev.map(b => b.id === payload.new.id ? mapBill(payload.new) : b));
        } else if (payload.eventType === 'DELETE') {
          setBills(prev => prev.filter(b => b.id !== payload.old.id));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'documents' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setDocuments(prev => [...prev, mapDocument(payload.new)]);
        } else if (payload.eventType === 'UPDATE') {
          setDocuments(prev => prev.map(d => d.id === payload.new.id ? mapDocument(payload.new) : d));
        } else if (payload.eventType === 'DELETE') {
          setDocuments(prev => prev.filter(d => d.id !== payload.old.id));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'task_comments' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const c = payload.new as any;
          setTaskComments(prev => [...prev, { id: c.id, task_id: c.task_id, author_id: c.author_id || "", body: c.body, created_at: c.created_at }]);
        } else if (payload.eventType === 'DELETE') {
          setTaskComments(prev => prev.filter(c => c.id !== payload.old.id));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activities' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const a = payload.new as any;
          setActivities(prev => [{ id: a.id, event_id: a.event_id, user_id: a.user_id || "", description: a.description, link_text: a.link_text, created_at: a.created_at, type: a.type, target: a.target }, ...prev]);
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${auth.user.id}` }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setNotifications(prev => [mapNotification(payload.new), ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setNotifications(prev => prev.map(n => n.id === payload.new.id ? mapNotification(payload.new) : n));
        } else if (payload.eventType === 'DELETE') {
          setNotifications(prev => prev.filter(n => n.id !== payload.old.id));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'team_members' }, () => {
        refreshTeamMembers();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [auth.user?.id, orgId]);

  // Fetch team members
  const refreshTeamMembers = useCallback(async () => {
    if (!auth.user) return;
    const { data: members } = await supabase.from("team_members").select("*");
    if (members) {
      setTeamMembers(members as TeamMember[]);
      const userIds = members.map((m: any) => m.user_id);
      if (userIds.length > 0) {
        const { data: profs } = await supabase.from("profiles").select("*").in("id", userIds);
        if (profs) {
          const mapped: Profile[] = profs.map((p: any) => ({
            id: p.id,
            name: p.name || "",
            email: p.email || "",
            phone: p.phone || "",
            role: (members.find((m: any) => m.user_id === p.id) as any)?.role === "admin" ? "sa" as Role : "dept_member" as Role,
            avatar_color: p.avatar_color || "#4338ca",
            dept_name: p.dept_name || undefined,
          }));
          setTeamProfiles(mapped);
          setProfiles(prev => {
            const existing = new Set(prev.map(p => p.id));
            const newOnes = mapped.filter(p => !existing.has(p.id));
            return [...prev, ...newOnes];
          });
        }
      }
    }
  }, [auth.user?.id]);

  useEffect(() => {
    if (auth.user) refreshTeamMembers();
  }, [auth.user?.id]);

  // Fetch orgs
  useEffect(() => {
    if (!orgId) return;
    supabase.from("organisations").select("*").then(({ data }) => {
      if (data && data.length > 0) {
        setOrganisations(data.map((o: any) => ({
          id: o.id, name: o.name, logo: o.logo, active: o.id === orgId,
        })));
      }
    });
  }, [orgId]);

  // Sync currentUser with auth profile
  useEffect(() => {
    if (auth.profile) {
      const u = buildCurrentUser();
      setCurrentUser(u);
      setProfiles(prev => {
        const exists = prev.find(p => p.id === u.id);
        if (!exists) return [u, ...prev];
        return prev.map(p => p.id === u.id ? u : p);
      });
    }
  }, [auth.profile, auth.role]);

  // === DB mutation helpers ===

  const addEvent = async (event: Omit<Event, "id">): Promise<Event | null> => {
    if (!orgId) return null;
    const { data, error } = await supabase.from("events").insert({
      org_id: orgId,
      name: event.name,
      location: event.location,
      start_date: event.start_date,
      end_date: event.end_date,
      setup_date: event.setup_date || null,
      teardown_date: event.teardown_date || null,
      estimated_budget: event.estimated_budget,
      status: event.status,
      poc_id: event.poc_id || null,
      created_by: event.created_by || null,
      image_url: event.image_url || null,
    }).select().single();
    if (error) { console.error("addEvent error:", error); return null; }
    return data ? mapEvent(data) : null;
  };

  const updateEvent = async (id: string, updates: Partial<Event>) => {
    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.location !== undefined) dbUpdates.location = updates.location;
    if (updates.start_date !== undefined) dbUpdates.start_date = updates.start_date;
    if (updates.end_date !== undefined) dbUpdates.end_date = updates.end_date;
    if (updates.setup_date !== undefined) dbUpdates.setup_date = updates.setup_date;
    if (updates.teardown_date !== undefined) dbUpdates.teardown_date = updates.teardown_date;
    if (updates.estimated_budget !== undefined) dbUpdates.estimated_budget = updates.estimated_budget;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.image_url !== undefined) dbUpdates.image_url = updates.image_url;
    if (updates.poc_id !== undefined) dbUpdates.poc_id = updates.poc_id;
    dbUpdates.updated_at = new Date().toISOString();
    await supabase.from("events").update(dbUpdates).eq("id", id);
  };

  const addDepartment = async (dept: Omit<Department, "id">): Promise<Department | null> => {
    const { data, error } = await supabase.from("departments").insert({
      event_id: dept.event_id,
      name: dept.name,
      head_id: dept.head_id || null,
      allocated_budget: dept.allocated_budget,
      spent: dept.spent,
      notes: dept.notes,
      member_ids: dept.member_ids || [],
    }).select().single();
    if (error) { console.error("addDepartment error:", error); return null; }
    return data ? mapDepartment(data) : null;
  };

  const updateDepartment = async (id: string, updates: Partial<Department>) => {
    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.head_id !== undefined) dbUpdates.head_id = updates.head_id;
    if (updates.allocated_budget !== undefined) dbUpdates.allocated_budget = updates.allocated_budget;
    if (updates.spent !== undefined) dbUpdates.spent = updates.spent;
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
    if (updates.member_ids !== undefined) dbUpdates.member_ids = updates.member_ids;
    await supabase.from("departments").update(dbUpdates).eq("id", id);
  };

  const deleteDepartment = async (id: string) => {
    await supabase.from("departments").delete().eq("id", id);
  };

  const addTask = async (task: Omit<Task, "id" | "subtasks" | "created_at">): Promise<Task | null> => {
    const { data, error } = await supabase.from("tasks").insert({
      event_id: task.event_id,
      dept_id: task.dept_id || null,
      title: task.title,
      description: task.description,
      assignee_id: task.assignee_id || null,
      deadline: task.deadline || null,
      priority: task.priority,
      status: task.status,
      created_by: task.created_by || null,
      labels: task.labels || [],
    }).select().single();
    if (error) { console.error("addTask error:", error); return null; }
    return data ? mapTask(data, []) : null;
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    const dbUpdates: any = {};
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.assignee_id !== undefined) dbUpdates.assignee_id = updates.assignee_id;
    if (updates.deadline !== undefined) dbUpdates.deadline = updates.deadline;
    if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.dept_id !== undefined) dbUpdates.dept_id = updates.dept_id;
    if (updates.labels !== undefined) dbUpdates.labels = updates.labels;
    dbUpdates.updated_at = new Date().toISOString();
    await supabase.from("tasks").update(dbUpdates).eq("id", id);
  };

  const deleteTask = async (id: string) => {
    await supabase.from("tasks").delete().eq("id", id);
  };

  const addBill = async (bill: Partial<Bill>): Promise<Bill | null> => {
    const { data, error } = await supabase.from("bills").insert({
      event_id: bill.event_id!,
      dept_id: bill.dept_id || null,
      vendor_name: bill.vendor_name || "",
      description: bill.description || "",
      amount: bill.amount || 0,
      advance_amount: bill.advance_amount || 0,
      invoice_number: bill.invoice_number || "",
      status: bill.status || "pending",
      advance_status: bill.advance_status || "not-given",
      submitted_by: bill.submitted_by || null,
      category: bill.category || null,
      due_date: bill.due_date || null,
    }).select().single();
    if (error) { console.error("addBill error:", error); return null; }
    return data ? mapBill(data) : null;
  };

  const updateBill = async (id: string, updates: Partial<Bill>) => {
    const dbUpdates: any = {};
    if (updates.vendor_name !== undefined) dbUpdates.vendor_name = updates.vendor_name;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.amount !== undefined) dbUpdates.amount = updates.amount;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.advance_status !== undefined) dbUpdates.advance_status = updates.advance_status;
    if (updates.advance_amount !== undefined) dbUpdates.advance_amount = updates.advance_amount;
    if (updates.category !== undefined) dbUpdates.category = updates.category;
    if (updates.due_date !== undefined) dbUpdates.due_date = updates.due_date;
    if (updates.paid_date !== undefined) dbUpdates.paid_date = updates.paid_date;
    if (updates.settled_by !== undefined) dbUpdates.settled_by = updates.settled_by;
    if (updates.settled_at !== undefined) dbUpdates.settled_at = updates.settled_at;
    if (updates.dept_verified_by !== undefined) dbUpdates.dept_verified_by = updates.dept_verified_by;
    if (updates.dept_verified_at !== undefined) dbUpdates.dept_verified_at = updates.dept_verified_at;
    if (updates.ca_approved_by !== undefined) dbUpdates.ca_approved_by = updates.ca_approved_by;
    if (updates.ca_approved_at !== undefined) dbUpdates.ca_approved_at = updates.ca_approved_at;
    if (updates.invoice_number !== undefined) dbUpdates.invoice_number = updates.invoice_number;
    await supabase.from("bills").update(dbUpdates).eq("id", id);
  };

  const deleteBill = async (id: string) => {
    await supabase.from("bills").delete().eq("id", id);
  };

  const addDocument = async (doc: Partial<Document>): Promise<Document | null> => {
    const { data, error } = await supabase.from("documents").insert({
      event_id: doc.event_id!,
      dept_id: doc.dept_id || null,
      name: doc.name || "",
      folder: doc.folder || "",
      file_url: doc.file_url || "",
      file_size: doc.file_size || "",
      uploaded_by: doc.uploaded_by || null,
      description: doc.description || null,
      visibility: doc.visibility || "internal",
    }).select().single();
    if (error) { console.error("addDocument error:", error); return null; }
    return data ? mapDocument(data) : null;
  };

  const deleteDocument = async (id: string) => {
    await supabase.from("documents").delete().eq("id", id);
  };

  const addComment = async (comment: Omit<TaskComment, "id" | "created_at">) => {
    await supabase.from("task_comments").insert({
      task_id: comment.task_id,
      author_id: comment.author_id || null,
      body: comment.body,
    });
  };

  const addActivity = async (activity: Omit<Activity, "id" | "created_at">) => {
    await supabase.from("activities").insert({
      event_id: activity.event_id,
      user_id: activity.user_id || null,
      description: activity.description,
      link_text: activity.link_text || null,
      type: activity.type || null,
      target: activity.target || null,
    });
  };

  const markNotificationRead = async (id: string) => {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
  };

  const markAllNotificationsRead = async () => {
    if (!auth.user) return;
    await supabase.from("notifications").update({ read: true }).eq("user_id", auth.user.id).eq("read", false);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

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

  const getProfile = (id: string) => profileList.find(p => p.id === id) || teamProfilesList.find(p => p.id === id) || (id === currentUser.id ? currentUser : undefined);
  const getEvent = (id: string) => eventList.find(e => e.id === id);
  const getDepartment = (id: string) => deptList.find(d => d.id === id);
  const getDeptsByEvent = (eventId: string) => deptList.filter(d => d.event_id === eventId);
  const getTasksByEvent = (eventId: string) => taskList.filter(t => t.event_id === eventId);
  const getTasksByDept = (deptId: string) => taskList.filter(t => t.dept_id === deptId);
  const getCommentsByTask = (taskId: string) => commentList.filter(c => c.task_id === taskId);
  const getBillsByEvent = (eventId: string) => billList.filter(b => b.event_id === eventId);
  const getBillEditLogs = (billId: string) => editLogs.filter(l => l.bill_id === billId);
  const getDocsByEvent = (eventId: string) => docList.filter(d => d.event_id === eventId);
  const getActivitiesByEvent = (eventId: string) => activityList.filter(a => a.event_id === eventId);
  const getUserNotifications = () => notifs;

  return (
    <MockDataContext.Provider value={{
      currentUser, setCurrentUser, isAuthenticated, setIsAuthenticated,
      hasSelectedRole, setHasSelectedRole,
      profiles: profileList, setProfiles, subscription: defaultSubscription,
      events: eventList, setEvents: setEvents as any, departments: deptList, setDepartments: setDepartments as any,
      tasks: taskList, taskComments: commentList, bills: billList, billEditLogs: editLogs,
      documents: docList, setDocuments: setDocuments as any, activities: activityList,
      deptHealth: [], notifications: notifs,
      organisations: orgList, setOrganisations,
      setNotifications: setNotifications as any, setTasks: setTasks as any, setBills: setBills as any, setBillEditLogs, setTaskComments: setTaskComments as any,
      teamMembers: teamMembersList, teamProfiles: teamProfilesList, refreshTeamMembers,
      login, signup, logout, selectRole,
      getProfile, getEvent, getDepartment, getDeptsByEvent, getTasksByEvent, getTasksByDept,
      getCommentsByTask, getBillsByEvent, getBillEditLogs, getDocsByEvent, getActivitiesByEvent, getUserNotifications,
      isFreePlan: false,
      addEvent, updateEvent,
      addDepartment, updateDepartment, deleteDepartment,
      addTask, updateTask, deleteTask,
      addBill, updateBill, deleteBill,
      addDocument, deleteDocument,
      addComment, addActivity,
      markNotificationRead, markAllNotificationsRead,
      orgId,
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
