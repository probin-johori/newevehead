-- Auto-setup: when a new user is created, assign SA role and create org + team_member
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _org_name TEXT;
  _org_id UUID;
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    NEW.email
  );

  -- Auto-assign SA role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'sa')
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Create org if org_name provided in metadata
  _org_name := NEW.raw_user_meta_data->>'org_name';
  IF _org_name IS NOT NULL AND _org_name != '' THEN
    INSERT INTO public.organisations (name, created_by, active)
    VALUES (_org_name, NEW.id, true)
    RETURNING id INTO _org_id;

    INSERT INTO public.team_members (user_id, org_id, role, invited_by)
    VALUES (NEW.id, _org_id, 'admin', NEW.id);
  END IF;

  RETURN NEW;
END;
$$;

-- Add notification triggers for comments
CREATE OR REPLACE FUNCTION public.notify_comment_added()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _task RECORD;
  _commenter_name TEXT;
  _event_name TEXT;
BEGIN
  SELECT * INTO _task FROM public.tasks WHERE id = NEW.task_id;
  IF NOT FOUND THEN RETURN NEW; END IF;
  
  SELECT name INTO _commenter_name FROM public.profiles WHERE id = NEW.author_id;
  SELECT name INTO _event_name FROM public.events WHERE id = _task.event_id;
  
  -- Notify task assignee if comment is from someone else
  IF _task.assignee_id IS NOT NULL AND _task.assignee_id != NEW.author_id THEN
    INSERT INTO public.notifications (user_id, type, message, related_event_id, related_task_id, link_to)
    VALUES (
      _task.assignee_id, 'comment',
      COALESCE(_commenter_name, 'Someone') || ' commented on "' || _task.title || '"',
      _task.event_id, _task.id, '/events/' || _task.event_id || '?tab=tasks'
    );
  END IF;
  
  -- Notify task creator if different from commenter and assignee
  IF _task.created_by IS NOT NULL AND _task.created_by != NEW.author_id AND _task.created_by != COALESCE(_task.assignee_id, '00000000-0000-0000-0000-000000000000') THEN
    INSERT INTO public.notifications (user_id, type, message, related_event_id, related_task_id, link_to)
    VALUES (
      _task.created_by, 'comment',
      COALESCE(_commenter_name, 'Someone') || ' commented on "' || _task.title || '"',
      _task.event_id, _task.id, '/events/' || _task.event_id || '?tab=tasks'
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_comment_added
  AFTER INSERT ON public.task_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_comment_added();

-- Notify when someone is added to an event (department member)
CREATE OR REPLACE FUNCTION public.notify_dept_member_added()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _old_members UUID[];
  _new_members UUID[];
  _added UUID;
  _event_name TEXT;
  _dept_name TEXT;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    _old_members := COALESCE(OLD.member_ids, '{}');
    _new_members := COALESCE(NEW.member_ids, '{}');
    
    SELECT e.name INTO _event_name FROM public.events e WHERE e.id = NEW.event_id;
    _dept_name := NEW.name;
    
    -- Find newly added members
    FOREACH _added IN ARRAY _new_members LOOP
      IF NOT (_added = ANY(_old_members)) THEN
        INSERT INTO public.notifications (user_id, type, message, related_event_id, link_to)
        VALUES (
          _added, 'team',
          'You were added to ' || _dept_name || ' department in ' || COALESCE(_event_name, 'an event'),
          NEW.event_id, '/events/' || NEW.event_id || '?tab=departments'
        );
      END IF;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_dept_member_change
  AFTER UPDATE ON public.departments
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_dept_member_added();

-- Notify when bill status changes
CREATE OR REPLACE FUNCTION public.notify_bill_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _event_name TEXT;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status AND NEW.submitted_by IS NOT NULL THEN
    SELECT e.name INTO _event_name FROM public.events e WHERE e.id = NEW.event_id;
    INSERT INTO public.notifications (user_id, type, message, related_event_id, link_to)
    VALUES (
      NEW.submitted_by, 'billing',
      'Bill "' || NEW.description || '" status changed to ' || NEW.status,
      NEW.event_id, '/billing?event=' || NEW.event_id
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_bill_change
  AFTER UPDATE ON public.bills
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_bill_change();