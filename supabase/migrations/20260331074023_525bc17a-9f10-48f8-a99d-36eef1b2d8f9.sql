
-- Recreate the trigger on auth.users to call handle_new_user on signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Also recreate all the other missing triggers
CREATE OR REPLACE TRIGGER trg_notify_event_created
  AFTER INSERT ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_event_created();

CREATE OR REPLACE TRIGGER trg_notify_event_updated
  AFTER UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_event_updated();

CREATE OR REPLACE TRIGGER trg_notify_task_assignment
  AFTER INSERT OR UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_task_assignment();

CREATE OR REPLACE TRIGGER trg_auto_activity_on_task_change
  AFTER INSERT OR UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_activity_on_task_change();

CREATE OR REPLACE TRIGGER trg_notify_comment_added
  AFTER INSERT ON public.task_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_comment_added();

CREATE OR REPLACE TRIGGER trg_notify_mention_in_comment
  AFTER INSERT ON public.task_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_mention_in_comment();

CREATE OR REPLACE TRIGGER trg_auto_activity_on_comment
  AFTER INSERT ON public.task_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_activity_on_comment();

CREATE OR REPLACE TRIGGER trg_notify_bill_change
  AFTER UPDATE ON public.bills
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_bill_change();

CREATE OR REPLACE TRIGGER trg_auto_activity_on_bill_change
  AFTER INSERT OR UPDATE ON public.bills
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_activity_on_bill_change();

CREATE OR REPLACE TRIGGER trg_notify_document_uploaded
  AFTER INSERT ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_document_uploaded();

CREATE OR REPLACE TRIGGER trg_auto_activity_on_document
  AFTER INSERT ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_activity_on_document();

CREATE OR REPLACE TRIGGER trg_notify_dept_member_added
  AFTER UPDATE ON public.departments
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_dept_member_added();

CREATE OR REPLACE TRIGGER trg_auto_activity_on_dept_change
  AFTER INSERT OR UPDATE ON public.departments
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_activity_on_dept_change();
