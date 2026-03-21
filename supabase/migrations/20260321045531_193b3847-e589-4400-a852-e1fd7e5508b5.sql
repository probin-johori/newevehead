-- Create @mention notification trigger
CREATE OR REPLACE FUNCTION public.notify_mention_in_comment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE _mentioned_profile RECORD; _task RECORD; _commenter_name TEXT;
BEGIN
  SELECT * INTO _task FROM public.tasks WHERE id = NEW.task_id;
  IF NOT FOUND THEN RETURN NEW; END IF;
  SELECT name INTO _commenter_name FROM public.profiles WHERE id = NEW.author_id;
  FOR _mentioned_profile IN SELECT id, name FROM public.profiles WHERE NEW.body LIKE '%@' || name || '%' AND id != NEW.author_id
  LOOP
    INSERT INTO public.notifications (user_id, type, message, related_event_id, related_task_id, link_to)
    VALUES (_mentioned_profile.id, 'mention', COALESCE(_commenter_name, 'Someone') || ' mentioned you in "' || _task.title || '"', _task.event_id, _task.id, '/events/' || _task.event_id || '?tab=tasks');
  END LOOP;
  RETURN NEW;
END;
$$;

-- Create all missing triggers
DROP TRIGGER IF EXISTS trg_mention_notify ON public.task_comments;
CREATE TRIGGER trg_mention_notify AFTER INSERT ON public.task_comments FOR EACH ROW EXECUTE FUNCTION public.notify_mention_in_comment();

DROP TRIGGER IF EXISTS trg_task_assignment ON public.tasks;
CREATE TRIGGER trg_task_assignment AFTER INSERT OR UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.notify_task_assignment();

DROP TRIGGER IF EXISTS trg_comment_notify ON public.task_comments;
CREATE TRIGGER trg_comment_notify AFTER INSERT ON public.task_comments FOR EACH ROW EXECUTE FUNCTION public.notify_comment_added();

DROP TRIGGER IF EXISTS trg_bill_change ON public.bills;
CREATE TRIGGER trg_bill_change AFTER INSERT OR UPDATE ON public.bills FOR EACH ROW EXECUTE FUNCTION public.notify_bill_change();

DROP TRIGGER IF EXISTS trg_dept_member_added ON public.departments;
CREATE TRIGGER trg_dept_member_added AFTER UPDATE ON public.departments FOR EACH ROW EXECUTE FUNCTION public.notify_dept_member_added();

DROP TRIGGER IF EXISTS trg_event_created ON public.events;
CREATE TRIGGER trg_event_created AFTER INSERT ON public.events FOR EACH ROW EXECUTE FUNCTION public.notify_event_created();

DROP TRIGGER IF EXISTS trg_document_uploaded ON public.documents;
CREATE TRIGGER trg_document_uploaded AFTER INSERT ON public.documents FOR EACH ROW EXECUTE FUNCTION public.notify_document_uploaded();

DROP TRIGGER IF EXISTS trg_task_activity ON public.tasks;
CREATE TRIGGER trg_task_activity AFTER INSERT OR UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.auto_activity_on_task_change();

DROP TRIGGER IF EXISTS trg_bill_activity ON public.bills;
CREATE TRIGGER trg_bill_activity AFTER INSERT OR UPDATE ON public.bills FOR EACH ROW EXECUTE FUNCTION public.auto_activity_on_bill_change();

DROP TRIGGER IF EXISTS trg_comment_activity ON public.task_comments;
CREATE TRIGGER trg_comment_activity AFTER INSERT ON public.task_comments FOR EACH ROW EXECUTE FUNCTION public.auto_activity_on_comment();

DROP TRIGGER IF EXISTS trg_document_activity ON public.documents;
CREATE TRIGGER trg_document_activity AFTER INSERT ON public.documents FOR EACH ROW EXECUTE FUNCTION public.auto_activity_on_document();

DROP TRIGGER IF EXISTS trg_dept_activity ON public.departments;
CREATE TRIGGER trg_dept_activity AFTER INSERT OR UPDATE ON public.departments FOR EACH ROW EXECUTE FUNCTION public.auto_activity_on_dept_change();

-- Notify all org members on event updates
CREATE OR REPLACE FUNCTION public.notify_event_updated()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE _member RECORD; _changes TEXT := '';
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.name IS DISTINCT FROM OLD.name THEN _changes := _changes || 'name, '; END IF;
    IF NEW.location IS DISTINCT FROM OLD.location THEN _changes := _changes || 'location, '; END IF;
    IF NEW.start_date IS DISTINCT FROM OLD.start_date OR NEW.end_date IS DISTINCT FROM OLD.end_date THEN _changes := _changes || 'dates, '; END IF;
    IF NEW.estimated_budget IS DISTINCT FROM OLD.estimated_budget THEN _changes := _changes || 'budget, '; END IF;
    IF NEW.status IS DISTINCT FROM OLD.status THEN _changes := _changes || 'status, '; END IF;
    IF _changes = '' THEN RETURN NEW; END IF;
    _changes := rtrim(_changes, ', ');
    FOR _member IN SELECT DISTINCT tm.user_id FROM public.team_members tm WHERE tm.org_id = NEW.org_id
    LOOP
      INSERT INTO public.notifications (user_id, type, message, related_event_id, link_to)
      VALUES (_member.user_id, 'event', '"' || NEW.name || '" updated (' || _changes || ')', NEW.id, '/events/' || NEW.id);
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_event_updated ON public.events;
CREATE TRIGGER trg_event_updated AFTER UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.notify_event_updated();