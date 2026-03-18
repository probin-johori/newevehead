
-- Add remaining tables to realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.subtasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bill_edit_logs;

-- Create notification trigger function for task assignments
CREATE OR REPLACE FUNCTION public.notify_task_assignment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _event_name TEXT;
  _assigner_name TEXT;
BEGIN
  IF TG_OP = 'INSERT' AND NEW.assignee_id IS NOT NULL THEN
    SELECT e.name INTO _event_name FROM public.events e WHERE e.id = NEW.event_id;
    SELECT p.name INTO _assigner_name FROM public.profiles p WHERE p.id = NEW.created_by;
    
    IF NEW.assignee_id != COALESCE(NEW.created_by, '00000000-0000-0000-0000-000000000000') THEN
      INSERT INTO public.notifications (user_id, type, message, related_event_id, related_task_id, link_to)
      VALUES (
        NEW.assignee_id,
        'task_assigned',
        COALESCE(_assigner_name, 'Someone') || ' assigned you to "' || NEW.title || '" in ' || COALESCE(_event_name, 'an event'),
        NEW.event_id,
        NEW.id,
        '/events/' || NEW.event_id || '?tab=tasks'
      );
    END IF;
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.assignee_id IS DISTINCT FROM OLD.assignee_id THEN
    SELECT e.name INTO _event_name FROM public.events e WHERE e.id = NEW.event_id;
    
    IF NEW.assignee_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, type, message, related_event_id, related_task_id, link_to)
      VALUES (NEW.assignee_id, 'task_assigned',
        'You were assigned to "' || NEW.title || '" in ' || COALESCE(_event_name, 'an event'),
        NEW.event_id, NEW.id, '/events/' || NEW.event_id || '?tab=tasks');
    END IF;
    
    IF OLD.assignee_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, type, message, related_event_id, related_task_id, link_to)
      VALUES (OLD.assignee_id, 'task_unassigned',
        'You were unassigned from "' || NEW.title || '" in ' || COALESCE(_event_name, 'an event'),
        NEW.event_id, NEW.id, '/events/' || NEW.event_id || '?tab=tasks');
    END IF;
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status AND NEW.assignee_id IS NOT NULL THEN
    SELECT e.name INTO _event_name FROM public.events e WHERE e.id = NEW.event_id;
    INSERT INTO public.notifications (user_id, type, message, related_event_id, related_task_id, link_to)
    VALUES (NEW.assignee_id, 'task_status',
      '"' || NEW.title || '" status changed to ' || NEW.status,
      NEW.event_id, NEW.id, '/events/' || NEW.event_id || '?tab=tasks');
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_task_change
  AFTER INSERT OR UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_task_assignment();

-- Make notification insert policy more permissive for DB triggers
DROP POLICY IF EXISTS "Authenticated can insert notifications" ON public.notifications;
CREATE POLICY "Authenticated can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);
