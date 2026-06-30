-- Row Level Security Policies for XUM AI
-- Version: 1.0

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity_logs ENABLE ROW LEVEL SECURITY;

-- 1. Users Policies
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');

-- 2. Tasks Policies
CREATE POLICY "Anyone can view active tasks" ON public.tasks
  FOR SELECT USING (status = 'active');

CREATE POLICY "Creators can view their tasks" ON public.tasks
  FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Creators can insert tasks" ON public.tasks
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Creators can update their tasks" ON public.tasks
  FOR UPDATE USING (auth.uid() = created_by OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');

-- 3. Submissions Policies
CREATE POLICY "Users can view own submissions" ON public.submissions
  FOR SELECT USING (auth.uid() = user_id OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Users can create submissions" ON public.submissions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. Transactions Policies
CREATE POLICY "Users can view own transactions" ON public.transactions
  FOR SELECT USING (auth.uid() = user_id OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');

-- 5. Withdrawals Policies
CREATE POLICY "Users can view own withdrawals" ON public.withdrawals
  FOR SELECT USING (auth.uid() = user_id OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Users can create withdrawals" ON public.withdrawals
  FOR INSERT WITH CHECK (auth.uid() = user_id AND (SELECT balance FROM public.users WHERE id = auth.uid()) >= amount);

-- 6. Achievements Policies
CREATE POLICY "Anyone can view achievements" ON public.achievements
  FOR SELECT USING (true);

CREATE POLICY "Users can view own unlocked achievements" ON public.user_achievements
  FOR SELECT USING (auth.uid() = user_id);

-- 7. Notifications Policies
CREATE POLICY "Users can view and update own notifications" ON public.notifications
  FOR ALL USING (auth.uid() = user_id);

-- 8. Activity Logs Policies
CREATE POLICY "Users can view own activity logs" ON public.user_activity_logs
  FOR SELECT USING (auth.uid() = user_id OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');
