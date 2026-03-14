import { createContext, useContext, useState, useCallback, ReactNode } from "react";

export type Role = "sa" | "org" | "dept_head" | "dept_member";
export type Plan = "free" | "pro" | "business";
export type EventStatus = "planning" | "active" | "completed" | "archived";
export type TaskStatus = "not-started" | "in-progress" | "blocked" | "completed" | "backlog" | "in-review";
export type TaskPriority = "low" | "normal" | "high" | "urgent";
export type BillStatus = "pending" | "dept-verified" | "ca-approved" | "settled" | "rejected";
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
}

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
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

// --- SEED DATA ---
const profiles: Profile[] = [
  { id: "u1", name: "Aarav Singh", email: "aarav@zerohour.io", phone: "+91 98765 43210", role: "dept_head", avatar_color: "#7c3aed", dept_name: "Stage & AV" },
  { id: "u2", name: "Kavya Nair", email: "kavya@zerohour.io", phone: "+91 98765 43211", role: "dept_head", avatar_color: "#dc2626", dept_name: "Lighting" },
  { id: "u3", name: "Rohan Das", email: "rohan@zerohour.io", phone: "+91 98765 43212", role: "dept_head", avatar_color: "#16a34a", dept_name: "Catering" },
  { id: "u4", name: "Sana Kapoor", email: "sana@zerohour.io", phone: "+91 98765 43213", role: "dept_member", avatar_color: "#d97706", dept_name: "Catering" },
  { id: "u5", name: "Priya Sharma", email: "priya@zerohour.io", phone: "+91 98765 43214", role: "org", avatar_color: "#2563eb", dept_name: "Operations" },
  { id: "u6", name: "Arjun Mehta", email: "arjun@zerohour.io", phone: "+91 98765 43215", role: "sa", avatar_color: "#4f46e5", dept_name: "Administration" },
  { id: "u7", name: "Sumit Patel", email: "sumit@zerohour.io", phone: "+91 98765 43216", role: "sa", avatar_color: "#4338ca", dept_name: "Administration" },
];

const subscription: Subscription = {
  id: "sub1", org_id: "u7", plan: "pro", slots_total: 4, slots_used: 4,
};

const organisations: Organisation[] = [
  { id: "org1", name: "Zero Hour Events", active: true },
  { id: "org2", name: "Stellar Productions", active: false },
  { id: "org3", name: "Moonlight Creatives", active: false },
];

const events: Event[] = [
  { id: "e1", name: "Diwali Grand Gala", location: "NSCI, Mumbai", start_date: "2026-03-15", end_date: "2026-03-17", setup_date: "2026-03-13", teardown_date: "2026-03-18", estimated_budget: 2500000, status: "active", poc_id: "u5", created_by: "u7" },
  { id: "e2", name: "Mumbai Tech Summit 2025", location: "Jio Convention Centre", start_date: "2026-04-10", end_date: "2026-04-12", setup_date: "2026-04-08", teardown_date: "2026-04-13", estimated_budget: 1800000, status: "planning", poc_id: "u5", created_by: "u7" },
  { id: "e3", name: "Bengaluru Startup Expo", location: "Bangalore International Exhibition Centre", start_date: "2026-05-01", end_date: "2026-05-03", setup_date: "2026-04-29", teardown_date: "2026-05-04", estimated_budget: 1200000, status: "planning", poc_id: "u5", created_by: "u7" },
  { id: "e4", name: "Delhi Fashion Week", location: "Pragati Maidan, New Delhi", start_date: "2026-06-05", end_date: "2026-06-08", setup_date: "2026-06-03", teardown_date: "2026-06-09", estimated_budget: 3000000, status: "planning", poc_id: "u5", created_by: "u7" },
];

const departments: Department[] = [
  { id: "d1", event_id: "e1", name: "Stage & AV", head_id: "u1", allocated_budget: 300000, spent: 252000, notes: "Main stage setup & sound" },
  { id: "d2", event_id: "e1", name: "Lighting", head_id: "u2", allocated_budget: 200000, spent: 214000, notes: "LED panels & ambient lighting" },
  { id: "d3", event_id: "e1", name: "Catering", head_id: "u3", allocated_budget: 600000, spent: 120000, notes: "500 pax multi-cuisine" },
  { id: "d4", event_id: "e1", name: "Logistics", head_id: "u4", allocated_budget: 350000, spent: 77000, notes: "Transport & venue prep" },
  { id: "d5", event_id: "e1", name: "Security", head_id: "u5", allocated_budget: 200000, spent: 0, notes: "40 guards, 3 shifts" },
  { id: "d6", event_id: "e1", name: "Hospitality", head_id: "u5", allocated_budget: 300000, spent: 81000, notes: "Guest relations & VIP" },
  { id: "d7", event_id: "e1", name: "IT & Tech Support", head_id: "u6", allocated_budget: 250000, spent: 50000, notes: "WiFi, streaming, AV tech" },
  { id: "d8", event_id: "e1", name: "Marketing & Branding", head_id: "u6", allocated_budget: 300000, spent: 210000, notes: "Social media, signage, branding" },
];

const tasks: Task[] = [
  {
    id: "t1", event_id: "e1", dept_id: "d1", title: "Install front truss rig", description: "Set up the front truss rigging system for main stage lighting and speaker mounts.",
    assignee_id: "u1", deadline: "2026-03-01", priority: "high", status: "in-progress", created_by: "u7", created_at: "2026-02-15T10:00:00Z",
    labels: ["stage", "setup"],
    subtasks: [
      { id: "st1", title: "Source truss hardware from vendor", completed: true },
      { id: "st2", title: "Transport truss to venue", completed: true },
      { id: "st3", title: "Assemble ground support structure", completed: false },
      { id: "st4", title: "Hoist and secure to ceiling mounts", completed: true },
      { id: "st5", title: "Safety inspection sign-off", completed: false },
    ],
  },
  {
    id: "t2", event_id: "e1", dept_id: "d1", title: "Main stage sound check", description: "Full sound check of all speaker arrays, monitors, and microphone lines.",
    assignee_id: "u2", deadline: "2026-03-01", priority: "urgent", status: "not-started", created_by: "u7", created_at: "2026-02-16T10:00:00Z",
    labels: ["sound"],
    subtasks: [
      { id: "st6", title: "Test main PA system", completed: false },
      { id: "st7", title: "Test monitor wedges on stage", completed: false },
      { id: "st8", title: "Test wireless microphones", completed: false },
      { id: "st9", title: "Test IEM system", completed: false },
      { id: "st10", title: "Final mix check with artist", completed: false },
    ],
  },
  {
    id: "t3", event_id: "e1", dept_id: "d3", title: "Finalise menu with Chef Kumar", description: "Confirm final menu selections, dietary options, and presentation style.",
    assignee_id: "u3", deadline: "2026-11-05", priority: "normal", status: "in-progress", created_by: "u7", created_at: "2026-02-14T10:00:00Z",
    labels: ["catering"],
    subtasks: [
      { id: "st11", title: "Review menu options", completed: true },
      { id: "st12", title: "Tasting session", completed: true },
      { id: "st13", title: "Finalize dietary accommodations", completed: false },
      { id: "st14", title: "Confirm presentation style", completed: false },
      { id: "st15", title: "Sign contract with Chef Kumar", completed: false },
    ],
  },
  {
    id: "t4", event_id: "e1", dept_id: "d3", title: "Crockery rental arrangement", description: "Arrange rental of crockery, cutlery, and glassware for 500 guests.",
    assignee_id: "u4", deadline: "2025-09-25", priority: "high", status: "blocked", created_by: "u7", created_at: "2026-02-10T10:00:00Z",
    labels: ["logistics"],
    subtasks: [
      { id: "st16", title: "Get quotes from 3 vendors", completed: true },
      { id: "st17", title: "Select vendor and negotiate", completed: true },
      { id: "st18", title: "Confirm delivery date", completed: false },
      { id: "st19", title: "Arrange storage at venue", completed: false },
      { id: "st20", title: "Quality check on delivery", completed: false },
    ],
  },
  {
    id: "t5", event_id: "e1", dept_id: "d6", title: "Guest registration setup", description: "Set up registration desks, badge printing, and guest check-in flow.",
    assignee_id: "u5", deadline: "2026-11-01", priority: "high", status: "not-started", created_by: "u7", created_at: "2026-02-12T10:00:00Z",
    labels: ["hospitality"],
    subtasks: [
      { id: "st21", title: "Design registration badges", completed: false },
      { id: "st22", title: "Set up check-in tablets", completed: false },
      { id: "st23", title: "Brief registration volunteers", completed: false },
      { id: "st24", title: "Test badge printing", completed: false },
      { id: "st25", title: "Prepare guest list spreadsheet", completed: false },
    ],
  },
  {
    id: "t6", event_id: "e1", dept_id: "d6", title: "VIP lounge preparation", description: "Prepare the VIP lounge area with refreshments, seating, and branding.",
    assignee_id: "u5", deadline: "2026-11-01", priority: "high", status: "backlog", created_by: "u7", created_at: "2026-02-13T10:00:00Z",
    labels: ["VIP"],
    subtasks: [
      { id: "st26", title: "Arrange premium seating", completed: false },
      { id: "st27", title: "Order VIP refreshments", completed: false },
      { id: "st28", title: "Set up VIP signage", completed: false },
      { id: "st29", title: "Coordinate VIP hostesses", completed: false },
    ],
  },
  {
    id: "t7", event_id: "e1", dept_id: "d2", title: "LED panel configuration", description: "Configure all LED panels for the main stage backdrop.",
    assignee_id: "u2", deadline: "2026-03-12", priority: "normal", status: "in-review", created_by: "u7", created_at: "2026-02-20T10:00:00Z",
    labels: ["lighting"],
    subtasks: [
      { id: "st30", title: "Map LED panels to content server", completed: true },
      { id: "st31", title: "Test color calibration", completed: true },
      { id: "st32", title: "Run full show sequence", completed: false },
    ],
  },
  {
    id: "t8", event_id: "e1", dept_id: "d7", title: "WiFi network deployment", description: "Deploy WiFi access points across the venue for staff and guests.",
    assignee_id: "u6", deadline: "2026-03-13", priority: "normal", status: "completed", created_by: "u7", created_at: "2026-02-18T10:00:00Z",
    labels: ["IT"],
    subtasks: [
      { id: "st33", title: "Survey venue for AP placement", completed: true },
      { id: "st34", title: "Install access points", completed: true },
      { id: "st35", title: "Configure network security", completed: true },
    ],
  },
];

const taskComments: TaskComment[] = [
  { id: "tc1", task_id: "t1", author_id: "u1", body: "Truss hardware has been sourced from Stagecraft India. Delivery expected by March 10th.", created_at: "2026-02-18T14:00:00Z" },
  { id: "tc2", task_id: "t1", author_id: "u7", body: "Great. Make sure we have insurance cover for the transport.", created_at: "2026-02-19T09:30:00Z" },
  { id: "tc3", task_id: "t4", author_id: "u4", body: "Vendor is asking for advance payment. Waiting on budget approval.", created_at: "2026-02-19T10:00:00Z" },
  { id: "tc4", task_id: "t4", author_id: "u6", body: "Budget approved. Please proceed with the advance.", created_at: "2026-02-19T15:00:00Z" },
  { id: "tc5", task_id: "t3", author_id: "u3", body: "Chef Kumar confirmed 320 pax for main course. Vegetarian options added.", created_at: "2026-02-20T11:00:00Z" },
  { id: "tc6", task_id: "t7", author_id: "u2", body: "Color calibration complete. Running final sequence tomorrow.", created_at: "2026-02-22T16:00:00Z" },
];

const bills: Bill[] = [
  {
    id: "b1", event_id: "e1", dept_id: "d2", vendor_name: "AV Rentals India", description: "LED panel rental and AV equipment for main stage",
    amount: 95000, advance_amount: 40000, bill_file_url: "av_rentals_inv_001.pdf", invoice_number: "AVR-2026-001",
    status: "dept-verified", advance_status: "advance-given", category: "Equipment",
    submitted_by: "u1", dept_verified_by: "u2", ca_approved_by: null, settled_by: null,
    submitted_at: "2026-02-20T10:00:00Z", dept_verified_at: "2026-02-21T14:00:00Z", ca_approved_at: null, settled_at: null,
    due_date: "2026-03-10",
  },
  {
    id: "b2", event_id: "e1", dept_id: "d3", vendor_name: "Chef Kumar Catering", description: "Advance for catering supplies and raw materials",
    amount: 520000, advance_amount: 200000, bill_file_url: "chef_kumar_inv_045.pdf", invoice_number: "CKC-2026-045",
    status: "pending", advance_status: "advance-given", category: "Catering",
    submitted_by: "u3", dept_verified_by: null, ca_approved_by: null, settled_by: null,
    submitted_at: "2026-02-25T09:00:00Z", dept_verified_at: null, ca_approved_at: null, settled_at: null,
    due_date: "2026-03-05",
  },
  {
    id: "b3", event_id: "e1", dept_id: "d2", vendor_name: "LightMasters Pvt Ltd", description: "Complete lighting setup and ambient design for venue",
    amount: 280000, advance_amount: 100000, bill_file_url: "lightmasters_inv_112.pdf", invoice_number: "LM-2026-112",
    status: "settled", advance_status: "settled", category: "Lighting",
    submitted_by: "u1", dept_verified_by: "u2", ca_approved_by: "u6", settled_by: "u7",
    submitted_at: "2026-02-10T11:00:00Z", dept_verified_at: "2026-02-11T10:00:00Z", ca_approved_at: "2026-02-12T09:00:00Z", settled_at: "2026-02-13T09:00:00Z",
    due_date: "2026-02-15", paid_date: "2026-02-13",
  },
  {
    id: "b4", event_id: "e1", dept_id: "d1", vendor_name: "ProSound Systems", description: "Sound system rental for main stage and breakout rooms",
    amount: 380000, advance_amount: 150000, bill_file_url: "prosound_inv_089.pdf", invoice_number: "PSS-2026-089",
    status: "pending", advance_status: "advance-given", category: "Equipment",
    submitted_by: "u2", dept_verified_by: null, ca_approved_by: null, settled_by: null,
    submitted_at: "2026-02-26T10:00:00Z", dept_verified_at: null, ca_approved_at: null, settled_at: null,
    due_date: "2026-03-12",
  },
  {
    id: "b5", event_id: "e1", dept_id: "d4", vendor_name: "TransLogix India", description: "Transport vehicles for equipment and staff shuttle",
    amount: 45000, advance_amount: 15000, bill_file_url: "translogix_inv_033.pdf", invoice_number: "TLI-2026-033",
    status: "ca-approved", advance_status: "advance-given", category: "Transport",
    submitted_by: "u4", dept_verified_by: "u4", ca_approved_by: "u6", settled_by: null,
    submitted_at: "2026-02-22T10:00:00Z", dept_verified_at: "2026-02-23T10:00:00Z", ca_approved_at: "2026-02-24T10:00:00Z", settled_at: null,
    due_date: "2026-03-01",
  },
];

const documents: Document[] = [
  { id: "doc1", event_id: "e1", dept_id: "d1", name: "Truss Layout v3.pdf", folder: "Layouts", file_url: "", file_size: "8.1 MB", uploaded_by: "u1", uploaded_at: "2026-09-12T10:00:00Z" },
  { id: "doc2", event_id: "e1", dept_id: null, name: "Main Contract – NSCI.pdf", folder: "Contracts", file_url: "", file_size: "2.4 MB", uploaded_by: "u5", uploaded_at: "2026-09-10T14:00:00Z" },
  { id: "doc3", event_id: "e1", dept_id: null, name: "Fire Safety Permit.pdf", folder: "Permits", file_url: "", file_size: "1.2 MB", uploaded_by: "u5", uploaded_at: "2026-09-15T09:00:00Z" },
  { id: "doc4", event_id: "e1", dept_id: "d3", name: "Catering Menu Final.pdf", folder: "Other", file_url: "", file_size: "0.8 MB", uploaded_by: "u3", uploaded_at: "2026-09-20T11:00:00Z" },
];

const activities: Activity[] = [
  { id: "a1", event_id: "e1", user_id: "u1", type: "billing", description: "submitted a reimbursement to AV Rentals India · ₹95K", target: "AV Rentals India", created_at: new Date(Date.now() - 1 * 3600000).toISOString() },
  { id: "a2", event_id: "e1", user_id: "u2", type: "comment", description: "added a comment on Stage Wiring task", target: "Stage Wiring", created_at: new Date(Date.now() - 2 * 3600000).toISOString() },
  { id: "a3", event_id: "e1", user_id: "u1", type: "reply", description: "replied to Priya's comment", target: "Lighting Setup", created_at: new Date(Date.now() - 3 * 3600000).toISOString() },
  { id: "a4", event_id: "e1", user_id: "u3", type: "status", description: "updated the catering headcount to 320", created_at: new Date(Date.now() - 5 * 3600000).toISOString() },
  { id: "a5", event_id: "e1", user_id: "u5", type: "mention", description: "was mentioned in Lighting Setup thread", target: "@Rohit Sharma", created_at: new Date(Date.now() - 8 * 3600000).toISOString() },
  { id: "a6", event_id: "e1", user_id: "u2", type: "status", description: "marked LED Panel Configuration as complete", target: "LED Panel Configuration", created_at: new Date(Date.now() - 12 * 3600000).toISOString() },
  { id: "a7", event_id: "e1", user_id: "u7", type: "assign", description: "assigned Guest Registration to Priya Sharma", target: "Guest Registration", created_at: new Date(Date.now() - 24 * 3600000).toISOString() },
  { id: "a8", event_id: "e1", user_id: "u4", type: "edit", description: "edited their comment on Crockery Rental", target: "Crockery Rental", created_at: new Date(Date.now() - 28 * 3600000).toISOString() },
  { id: "a9", event_id: "e1", user_id: "u6", type: "deadline", description: "changed deadline on Sound Check from Dec 3 to Dec 5", target: "Sound Check", created_at: new Date(Date.now() - 48 * 3600000).toISOString() },
  { id: "a10", event_id: "e1", user_id: "u1", type: "upload", description: "uploaded Truss Layout v3.pdf to Stage & AV dept", target: "Truss Layout v3.pdf", created_at: new Date(Date.now() - 72 * 3600000).toISOString() },
];

const deptHealthData: DeptHealth[] = [
  { name: "Stage & AV", tasksDone: 6, tasksTotal: 8, budgetPct: 84 },
  { name: "Lighting", tasksDone: 6, tasksTotal: 6, budgetPct: 107 },
  { name: "Catering", tasksDone: 3, tasksTotal: 10, budgetPct: 20 },
  { name: "Logistics", tasksDone: 2, tasksTotal: 5, budgetPct: 22 },
  { name: "Security", tasksDone: 0, tasksTotal: 4, budgetPct: 0 },
  { name: "Hospitality", tasksDone: 4, tasksTotal: 6, budgetPct: 27 },
  { name: "IT & Tech", tasksDone: 2, tasksTotal: 7, budgetPct: 20 },
  { name: "Marketing", tasksDone: 8, tasksTotal: 9, budgetPct: 70 },
];

const notifications: Notification[] = [
  { id: "n1", user_id: "u7", body: "Aarav Singh submitted a bill for AV Rentals India (₹95K)", type: "billing", read: false, created_at: new Date(Date.now() - 1 * 3600000).toISOString(), link_to: "/billing" },
  { id: "n2", user_id: "u7", body: "Kavya Nair added a comment on LED Panel Configuration", type: "comment", read: false, created_at: new Date(Date.now() - 3 * 3600000).toISOString(), link_to: "/tasks?task=t7" },
  { id: "n3", user_id: "u7", body: "Task 'Crockery rental arrangement' is overdue", type: "task_overdue", read: false, created_at: new Date(Date.now() - 8 * 3600000).toISOString(), link_to: "/tasks?task=t4" },
  { id: "n4", user_id: "u7", body: "Priya Sharma mentioned you in Guest Registration thread", type: "mention", read: true, created_at: new Date(Date.now() - 24 * 3600000).toISOString(), link_to: "/tasks?task=t5" },
  { id: "n5", user_id: "u7", body: "Budget for Catering dept has been updated to ₹6L", type: "billing", read: true, created_at: new Date(Date.now() - 48 * 3600000).toISOString(), link_to: "/events/e1?tab=budget" },
  { id: "n6", user_id: "u7", body: "Rohan Das completed 'Finalize menu options'", type: "task_completed", read: true, created_at: new Date(Date.now() - 72 * 3600000).toISOString(), link_to: "/tasks?task=t3" },
  { id: "n7", user_id: "u7", body: "New document uploaded: Fire Safety Permit.pdf", type: "document", read: true, created_at: new Date(Date.now() - 96 * 3600000).toISOString(), link_to: "/documents" },
  { id: "n8", user_id: "u7", body: "LightMasters bill marked as Settled", type: "billing", read: true, created_at: new Date(Date.now() - 120 * 3600000).toISOString(), link_to: "/billing" },
  { id: "n9", user_id: "u7", body: "Sana Kapoor joined the team as Dept Member", type: "team", read: true, created_at: new Date(Date.now() - 168 * 3600000).toISOString(), link_to: "/teams" },
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
  setEvents: (e: Event[]) => void;
  departments: Department[];
  tasks: Task[];
  taskComments: TaskComment[];
  bills: Bill[];
  documents: Document[];
  activities: Activity[];
  deptHealth: DeptHealth[];
  notifications: Notification[];
  organisations: Organisation[];
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
  getActivitiesByEvent: (eventId: string) => Activity[];
  getUserNotifications: () => Notification[];
  isFreePlan: boolean;
}

const MockDataContext = createContext<MockDataContextType | null>(null);

export function MockDataProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<Profile>(profiles[6]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasSelectedRole, setHasSelectedRole] = useState(true);
  const [notifs, setNotifications] = useState(notifications);
  const [taskList, setTasks] = useState(tasks);
  const [commentList, setTaskComments] = useState(taskComments);
  const [billList, setBills] = useState(bills);
  const [eventList, setEvents] = useState(events);

  const login = useCallback((email: string, _password: string) => {
    const found = profiles.find(p => p.email === email);
    if (found) { setCurrentUser(found); } else { setCurrentUser(profiles[6]); }
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
  const getEvent = (id: string) => eventList.find(e => e.id === id);
  const getDepartment = (id: string) => departments.find(d => d.id === id);
  const getDeptsByEvent = (eventId: string) => departments.filter(d => d.event_id === eventId);
  const getTasksByEvent = (eventId: string) => taskList.filter(t => t.event_id === eventId);
  const getTasksByDept = (deptId: string) => taskList.filter(t => t.dept_id === deptId);
  const getCommentsByTask = (taskId: string) => commentList.filter(c => c.task_id === taskId);
  const getBillsByEvent = (eventId: string) => billList.filter(b => b.event_id === eventId);
  const getDocsByEvent = (eventId: string) => documents.filter(d => d.event_id === eventId);
  const getActivitiesByEvent = (eventId: string) => activities.filter(a => a.event_id === eventId);
  const getUserNotifications = () => notifs.filter(n => n.user_id === currentUser.id);

  return (
    <MockDataContext.Provider value={{
      currentUser, setCurrentUser, isAuthenticated, setIsAuthenticated,
      hasSelectedRole, setHasSelectedRole,
      profiles, subscription, events: eventList, setEvents, departments,
      tasks: taskList, taskComments: commentList, bills: billList, documents, activities, deptHealth: deptHealthData, notifications: notifs,
      organisations,
      setNotifications, setTasks, setBills, setTaskComments,
      login, signup, logout, selectRole,
      getProfile, getEvent, getDepartment, getDeptsByEvent, getTasksByEvent, getTasksByDept,
      getCommentsByTask, getBillsByEvent, getDocsByEvent, getActivitiesByEvent, getUserNotifications,
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
