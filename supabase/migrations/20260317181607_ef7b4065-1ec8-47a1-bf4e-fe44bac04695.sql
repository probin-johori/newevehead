
-- Organisations table
CREATE TABLE public.organisations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  logo TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.organisations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view their orgs" ON public.organisations FOR SELECT TO authenticated
USING (id IN (SELECT public.get_user_org_ids(auth.uid())));

CREATE POLICY "Admins can insert orgs" ON public.organisations FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'sa') OR public.has_role(auth.uid(), 'org'));

CREATE POLICY "Admins can update orgs" ON public.organisations FOR UPDATE TO authenticated
USING (id IN (SELECT public.get_user_org_ids(auth.uid())) AND (public.has_role(auth.uid(), 'sa') OR public.has_role(auth.uid(), 'org')));

-- Events table
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL,
  name TEXT NOT NULL,
  location TEXT NOT NULL DEFAULT '',
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE NOT NULL DEFAULT CURRENT_DATE,
  setup_date DATE,
  teardown_date DATE,
  estimated_budget NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'planning',
  poc_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view events" ON public.events FOR SELECT TO authenticated
USING (org_id IN (SELECT public.get_user_org_ids(auth.uid())));

CREATE POLICY "Admins can insert events" ON public.events FOR INSERT TO authenticated
WITH CHECK (org_id IN (SELECT public.get_user_org_ids(auth.uid())));

CREATE POLICY "Admins can update events" ON public.events FOR UPDATE TO authenticated
USING (org_id IN (SELECT public.get_user_org_ids(auth.uid())));

CREATE POLICY "Admins can delete events" ON public.events FOR DELETE TO authenticated
USING (org_id IN (SELECT public.get_user_org_ids(auth.uid())) AND (public.has_role(auth.uid(), 'sa') OR public.has_role(auth.uid(), 'org')));

-- Departments table
CREATE TABLE public.departments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  head_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  allocated_budget NUMERIC NOT NULL DEFAULT 0,
  spent NUMERIC NOT NULL DEFAULT 0,
  notes TEXT NOT NULL DEFAULT '',
  member_ids UUID[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view departments" ON public.departments FOR SELECT TO authenticated
USING (event_id IN (SELECT id FROM public.events WHERE org_id IN (SELECT public.get_user_org_ids(auth.uid()))));

CREATE POLICY "Admins can insert departments" ON public.departments FOR INSERT TO authenticated
WITH CHECK (event_id IN (SELECT id FROM public.events WHERE org_id IN (SELECT public.get_user_org_ids(auth.uid()))));

CREATE POLICY "Admins can update departments" ON public.departments FOR UPDATE TO authenticated
USING (event_id IN (SELECT id FROM public.events WHERE org_id IN (SELECT public.get_user_org_ids(auth.uid()))));

CREATE POLICY "Admins can delete departments" ON public.departments FOR DELETE TO authenticated
USING (event_id IN (SELECT id FROM public.events WHERE org_id IN (SELECT public.get_user_org_ids(auth.uid()))));

-- Tasks table
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  dept_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  assignee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  deadline DATE,
  priority TEXT NOT NULL DEFAULT 'normal',
  status TEXT NOT NULL DEFAULT 'not-started',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  labels TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view tasks" ON public.tasks FOR SELECT TO authenticated
USING (event_id IN (SELECT id FROM public.events WHERE org_id IN (SELECT public.get_user_org_ids(auth.uid()))));

CREATE POLICY "Org members can insert tasks" ON public.tasks FOR INSERT TO authenticated
WITH CHECK (event_id IN (SELECT id FROM public.events WHERE org_id IN (SELECT public.get_user_org_ids(auth.uid()))));

CREATE POLICY "Org members can update tasks" ON public.tasks FOR UPDATE TO authenticated
USING (event_id IN (SELECT id FROM public.events WHERE org_id IN (SELECT public.get_user_org_ids(auth.uid()))));

CREATE POLICY "Admins can delete tasks" ON public.tasks FOR DELETE TO authenticated
USING (event_id IN (SELECT id FROM public.events WHERE org_id IN (SELECT public.get_user_org_ids(auth.uid()))));

-- Subtasks table
CREATE TABLE public.subtasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  assignee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  priority TEXT DEFAULT 'normal',
  status TEXT DEFAULT 'not-started',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.subtasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view subtasks" ON public.subtasks FOR SELECT TO authenticated
USING (task_id IN (SELECT id FROM public.tasks WHERE event_id IN (SELECT id FROM public.events WHERE org_id IN (SELECT public.get_user_org_ids(auth.uid())))));

CREATE POLICY "Org members can insert subtasks" ON public.subtasks FOR INSERT TO authenticated
WITH CHECK (task_id IN (SELECT id FROM public.tasks WHERE event_id IN (SELECT id FROM public.events WHERE org_id IN (SELECT public.get_user_org_ids(auth.uid())))));

CREATE POLICY "Org members can update subtasks" ON public.subtasks FOR UPDATE TO authenticated
USING (task_id IN (SELECT id FROM public.tasks WHERE event_id IN (SELECT id FROM public.events WHERE org_id IN (SELECT public.get_user_org_ids(auth.uid())))));

CREATE POLICY "Org members can delete subtasks" ON public.subtasks FOR DELETE TO authenticated
USING (task_id IN (SELECT id FROM public.tasks WHERE event_id IN (SELECT id FROM public.events WHERE org_id IN (SELECT public.get_user_org_ids(auth.uid())))));

-- Task Comments
CREATE TABLE public.task_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view comments" ON public.task_comments FOR SELECT TO authenticated
USING (task_id IN (SELECT id FROM public.tasks WHERE event_id IN (SELECT id FROM public.events WHERE org_id IN (SELECT public.get_user_org_ids(auth.uid())))));

CREATE POLICY "Authenticated can insert comments" ON public.task_comments FOR INSERT TO authenticated
WITH CHECK (task_id IN (SELECT id FROM public.tasks WHERE event_id IN (SELECT id FROM public.events WHERE org_id IN (SELECT public.get_user_org_ids(auth.uid())))));

CREATE POLICY "Authors can delete their comments" ON public.task_comments FOR DELETE TO authenticated
USING (author_id = auth.uid());

-- Bills table
CREATE TABLE public.bills (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  dept_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  vendor_name TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  amount NUMERIC NOT NULL DEFAULT 0,
  advance_amount NUMERIC NOT NULL DEFAULT 0,
  bill_file_url TEXT DEFAULT '',
  invoice_number TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  advance_status TEXT NOT NULL DEFAULT 'not-given',
  category TEXT,
  due_date DATE,
  paid_date DATE,
  invoice_file TEXT,
  invoice_files TEXT[] DEFAULT '{}',
  submitted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  dept_verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ca_approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  settled_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  dept_verified_at TIMESTAMP WITH TIME ZONE,
  ca_approved_at TIMESTAMP WITH TIME ZONE,
  settled_at TIMESTAMP WITH TIME ZONE
);
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view bills" ON public.bills FOR SELECT TO authenticated
USING (event_id IN (SELECT id FROM public.events WHERE org_id IN (SELECT public.get_user_org_ids(auth.uid()))));

CREATE POLICY "Org members can insert bills" ON public.bills FOR INSERT TO authenticated
WITH CHECK (event_id IN (SELECT id FROM public.events WHERE org_id IN (SELECT public.get_user_org_ids(auth.uid()))));

CREATE POLICY "Org members can update bills" ON public.bills FOR UPDATE TO authenticated
USING (event_id IN (SELECT id FROM public.events WHERE org_id IN (SELECT public.get_user_org_ids(auth.uid()))));

CREATE POLICY "Admins can delete bills" ON public.bills FOR DELETE TO authenticated
USING (event_id IN (SELECT id FROM public.events WHERE org_id IN (SELECT public.get_user_org_ids(auth.uid()))));

-- Bill Edit Logs
CREATE TABLE public.bill_edit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bill_id UUID NOT NULL REFERENCES public.bills(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  field TEXT NOT NULL,
  old_value TEXT NOT NULL DEFAULT '',
  new_value TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.bill_edit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view bill logs" ON public.bill_edit_logs FOR SELECT TO authenticated
USING (bill_id IN (SELECT id FROM public.bills WHERE event_id IN (SELECT id FROM public.events WHERE org_id IN (SELECT public.get_user_org_ids(auth.uid())))));

CREATE POLICY "Org members can insert bill logs" ON public.bill_edit_logs FOR INSERT TO authenticated
WITH CHECK (bill_id IN (SELECT id FROM public.bills WHERE event_id IN (SELECT id FROM public.events WHERE org_id IN (SELECT public.get_user_org_ids(auth.uid())))));

-- Documents
CREATE TABLE public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  dept_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  folder TEXT NOT NULL DEFAULT '',
  file_url TEXT NOT NULL DEFAULT '',
  file_size TEXT NOT NULL DEFAULT '',
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  description TEXT,
  visibility TEXT DEFAULT 'internal'
);
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view documents" ON public.documents FOR SELECT TO authenticated
USING (event_id IN (SELECT id FROM public.events WHERE org_id IN (SELECT public.get_user_org_ids(auth.uid()))));

CREATE POLICY "Org members can insert documents" ON public.documents FOR INSERT TO authenticated
WITH CHECK (event_id IN (SELECT id FROM public.events WHERE org_id IN (SELECT public.get_user_org_ids(auth.uid()))));

CREATE POLICY "Org members can update documents" ON public.documents FOR UPDATE TO authenticated
USING (event_id IN (SELECT id FROM public.events WHERE org_id IN (SELECT public.get_user_org_ids(auth.uid()))));

CREATE POLICY "Org members can delete documents" ON public.documents FOR DELETE TO authenticated
USING (event_id IN (SELECT id FROM public.events WHERE org_id IN (SELECT public.get_user_org_ids(auth.uid()))));

-- Activities
CREATE TABLE public.activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  link_text TEXT,
  type TEXT,
  target TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view activities" ON public.activities FOR SELECT TO authenticated
USING (event_id IN (SELECT id FROM public.events WHERE org_id IN (SELECT public.get_user_org_ids(auth.uid()))));

CREATE POLICY "Org members can insert activities" ON public.activities FOR INSERT TO authenticated
WITH CHECK (event_id IN (SELECT id FROM public.events WHERE org_id IN (SELECT public.get_user_org_ids(auth.uid()))));

-- Notifications
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'general',
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  related_event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  related_task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  link_to TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "System can insert notifications" ON public.notifications FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can delete own notifications" ON public.notifications FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- Enable realtime on key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.departments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.task_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.team_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bills;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activities;
ALTER PUBLICATION supabase_realtime ADD TABLE public.documents;
