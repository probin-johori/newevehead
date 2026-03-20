
-- Add dept_ids array column to tasks for multi-department support
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS dept_ids uuid[] DEFAULT '{}';

-- Backfill dept_ids from existing dept_id
UPDATE public.tasks SET dept_ids = ARRAY[dept_id] WHERE dept_id IS NOT NULL AND (dept_ids IS NULL OR dept_ids = '{}');

-- Create trigger to auto-create activity records for all major changes
CREATE OR REPLACE FUNCTION public.auto_activity_on_task_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _user_name TEXT;
  _desc TEXT;
BEGIN
  SELECT name INTO _user_name FROM public.profiles WHERE id = COALESCE(NEW.created_by, NEW.assignee_id);
  
  IF TG_OP = 'INSERT' THEN
    _desc := 'created task "' || NEW.title || '"';
    INSERT INTO public.activities (event_id, user_id, description, type)
    VALUES (NEW.event_id, COALESCE(NEW.created_by, NEW.assignee_id), _desc, 'status');
  END IF;
  
  IF TG_OP = 'UPDATE' THEN
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      INSERT INTO public.activities (event_id, user_id, description, type)
      VALUES (NEW.event_id, COALESCE(NEW.assignee_id, NEW.created_by), 'changed status of "' || NEW.title || '" to ' || NEW.status, 'status');
    END IF;
    IF NEW.assignee_id IS DISTINCT FROM OLD.assignee_id AND NEW.assignee_id IS NOT NULL THEN
      SELECT name INTO _user_name FROM public.profiles WHERE id = NEW.assignee_id;
      INSERT INTO public.activities (event_id, user_id, description, type)
      VALUES (NEW.event_id, NEW.assignee_id, 'was assigned to "' || NEW.title || '"', 'assign');
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_task_activity
  AFTER INSERT OR UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.auto_activity_on_task_change();

-- Auto-create activity on bill changes
CREATE OR REPLACE FUNCTION public.auto_activity_on_bill_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.activities (event_id, user_id, description, type)
    VALUES (NEW.event_id, NEW.submitted_by, 'added billing item "' || NEW.description || '" for ' || NEW.vendor_name, 'billing');
  END IF;
  IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.activities (event_id, user_id, description, type)
    VALUES (NEW.event_id, COALESCE(NEW.settled_by, NEW.submitted_by), 'changed bill "' || NEW.description || '" status to ' || NEW.status, 'billing');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_bill_activity
  AFTER INSERT OR UPDATE ON public.bills
  FOR EACH ROW EXECUTE FUNCTION public.auto_activity_on_bill_change();

-- Auto-create activity on comment
CREATE OR REPLACE FUNCTION public.auto_activity_on_comment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _task RECORD;
BEGIN
  SELECT * INTO _task FROM public.tasks WHERE id = NEW.task_id;
  IF FOUND THEN
    INSERT INTO public.activities (event_id, user_id, description, type)
    VALUES (_task.event_id, NEW.author_id, 'commented on "' || _task.title || '"', 'comment');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_comment_activity
  AFTER INSERT ON public.task_comments
  FOR EACH ROW EXECUTE FUNCTION public.auto_activity_on_comment();

-- Auto-create activity on document upload
CREATE OR REPLACE FUNCTION public.auto_activity_on_document()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.activities (event_id, user_id, description, type)
    VALUES (NEW.event_id, NEW.uploaded_by, 'uploaded document "' || NEW.name || '"', 'upload');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_document_activity
  AFTER INSERT ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.auto_activity_on_document();

-- Auto-create activity on department changes
CREATE OR REPLACE FUNCTION public.auto_activity_on_dept_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.activities (event_id, user_id, description, type)
    VALUES (NEW.event_id, NEW.head_id, 'added department "' || NEW.name || '"', 'edit');
  END IF;
  IF TG_OP = 'UPDATE' AND NEW.allocated_budget IS DISTINCT FROM OLD.allocated_budget THEN
    INSERT INTO public.activities (event_id, user_id, description, type)
    VALUES (NEW.event_id, NEW.head_id, 'updated budget for "' || NEW.name || '"', 'edit');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_dept_activity
  AFTER INSERT OR UPDATE ON public.departments
  FOR EACH ROW EXECUTE FUNCTION public.auto_activity_on_dept_change();

-- Notify on event creation to all org members
CREATE OR REPLACE FUNCTION public.notify_event_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _member RECORD;
  _creator_name TEXT;
BEGIN
  SELECT name INTO _creator_name FROM public.profiles WHERE id = NEW.created_by;
  
  FOR _member IN SELECT user_id FROM public.team_members WHERE org_id = NEW.org_id AND user_id != NEW.created_by
  LOOP
    INSERT INTO public.notifications (user_id, type, message, related_event_id, link_to)
    VALUES (
      _member.user_id, 'event',
      COALESCE(_creator_name, 'Someone') || ' created a new event "' || NEW.name || '"',
      NEW.id, '/events/' || NEW.id
    );
  END LOOP;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_event_created
  AFTER INSERT ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.notify_event_created();

-- Notify on document upload to relevant dept members
CREATE OR REPLACE FUNCTION public.notify_document_uploaded()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _uploader_name TEXT;
  _event_name TEXT;
  _member_id UUID;
  _dept RECORD;
BEGIN
  SELECT name INTO _uploader_name FROM public.profiles WHERE id = NEW.uploaded_by;
  SELECT name INTO _event_name FROM public.events WHERE id = NEW.event_id;
  
  IF NEW.dept_id IS NOT NULL THEN
    SELECT * INTO _dept FROM public.departments WHERE id = NEW.dept_id;
    IF FOUND AND _dept.member_ids IS NOT NULL THEN
      FOREACH _member_id IN ARRAY _dept.member_ids LOOP
        IF _member_id != NEW.uploaded_by THEN
          INSERT INTO public.notifications (user_id, type, message, related_event_id, link_to)
          VALUES (_member_id, 'document', COALESCE(_uploader_name, 'Someone') || ' uploaded "' || NEW.name || '" in ' || COALESCE(_event_name, 'an event'), NEW.event_id, '/events/' || NEW.event_id || '?tab=documents');
        END IF;
      END LOOP;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_document
  AFTER INSERT ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.notify_document_uploaded();
