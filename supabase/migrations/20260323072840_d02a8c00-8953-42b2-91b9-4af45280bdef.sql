
-- Create only the missing triggers (drop if exists first to be safe)
DROP TRIGGER IF EXISTS trg_notify_task_assignment ON public.tasks;
DROP TRIGGER IF EXISTS trg_notify_comment_added ON public.task_comments;
DROP TRIGGER IF EXISTS trg_notify_mention_in_comment ON public.task_comments;
DROP TRIGGER IF EXISTS trg_notify_bill_change ON public.bills;
DROP TRIGGER IF EXISTS trg_notify_dept_member_added ON public.departments;
DROP TRIGGER IF EXISTS trg_notify_event_created ON public.events;
DROP TRIGGER IF EXISTS trg_notify_event_updated ON public.events;
DROP TRIGGER IF EXISTS trg_notify_document_uploaded ON public.documents;
DROP TRIGGER IF EXISTS trg_auto_activity_task ON public.tasks;
DROP TRIGGER IF EXISTS trg_auto_activity_bill ON public.bills;
DROP TRIGGER IF EXISTS trg_auto_activity_comment ON public.task_comments;
DROP TRIGGER IF EXISTS trg_auto_activity_document ON public.documents;
DROP TRIGGER IF EXISTS trg_auto_activity_dept ON public.departments;
DROP TRIGGER IF EXISTS trg_handle_new_user ON auth.users;

CREATE TRIGGER trg_notify_task_assignment AFTER INSERT OR UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION notify_task_assignment();
CREATE TRIGGER trg_notify_comment_added AFTER INSERT ON public.task_comments FOR EACH ROW EXECUTE FUNCTION notify_comment_added();
CREATE TRIGGER trg_notify_mention_in_comment AFTER INSERT ON public.task_comments FOR EACH ROW EXECUTE FUNCTION notify_mention_in_comment();
CREATE TRIGGER trg_notify_bill_change AFTER UPDATE ON public.bills FOR EACH ROW EXECUTE FUNCTION notify_bill_change();
CREATE TRIGGER trg_notify_dept_member_added AFTER UPDATE ON public.departments FOR EACH ROW EXECUTE FUNCTION notify_dept_member_added();
CREATE TRIGGER trg_notify_event_created AFTER INSERT ON public.events FOR EACH ROW EXECUTE FUNCTION notify_event_created();
CREATE TRIGGER trg_notify_event_updated AFTER UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION notify_event_updated();
CREATE TRIGGER trg_notify_document_uploaded AFTER INSERT ON public.documents FOR EACH ROW EXECUTE FUNCTION notify_document_uploaded();
CREATE TRIGGER trg_auto_activity_task AFTER INSERT OR UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION auto_activity_on_task_change();
CREATE TRIGGER trg_auto_activity_bill AFTER INSERT OR UPDATE ON public.bills FOR EACH ROW EXECUTE FUNCTION auto_activity_on_bill_change();
CREATE TRIGGER trg_auto_activity_comment AFTER INSERT ON public.task_comments FOR EACH ROW EXECUTE FUNCTION auto_activity_on_comment();
CREATE TRIGGER trg_auto_activity_document AFTER INSERT ON public.documents FOR EACH ROW EXECUTE FUNCTION auto_activity_on_document();
CREATE TRIGGER trg_auto_activity_dept AFTER INSERT OR UPDATE ON public.departments FOR EACH ROW EXECUTE FUNCTION auto_activity_on_dept_change();
CREATE TRIGGER trg_handle_new_user AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();
