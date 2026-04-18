-- =========================================================
-- ENUMS
-- =========================================================
CREATE TYPE public.app_role AS ENUM ('hiring_party', 'worker', 'admin');
CREATE TYPE public.vetting_status AS ENUM ('applicant', 'pending_review', 'verified', 'verified_pro', 'rejected');
CREATE TYPE public.transportation_type AS ENUM ('own_vehicle', 'public_transit', 'none');
CREATE TYPE public.budget_type AS ENUM ('hourly', 'flat');
CREATE TYPE public.job_status AS ENUM ('draft', 'open', 'in_progress', 'completed', 'canceled');
CREATE TYPE public.application_status AS ENUM ('submitted', 'accepted', 'declined', 'withdrawn');
CREATE TYPE public.verification_decision AS ENUM ('pending', 'approved', 'rejected', 'needs_more_info');
CREATE TYPE public.reviewer_role AS ENUM ('hiring_party', 'worker');
CREATE TYPE public.admin_target_type AS ENUM ('worker', 'hiring_party', 'job');

-- =========================================================
-- TIMESTAMP TRIGGER FN
-- =========================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- =========================================================
-- PROFILES (shared basics)
-- =========================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER profiles_set_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- USER ROLES (separate table — security critical)
-- =========================================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin')
$$;

-- =========================================================
-- AUTO-CREATE PROFILE + ROLE ON SIGNUP
-- =========================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  selected_role public.app_role;
BEGIN
  INSERT INTO public.profiles (user_id, full_name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'phone', '')
  );

  selected_role := COALESCE(
    (NEW.raw_user_meta_data ->> 'role')::public.app_role,
    'worker'
  );

  -- Never allow self-assigning admin
  IF selected_role = 'admin' THEN
    selected_role := 'worker';
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, selected_role);

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================================
-- HIRING PARTY PROFILES
-- =========================================================
CREATE TABLE public.hiring_party_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  contact_name TEXT,
  company_type TEXT,
  service_area TEXT,
  phone TEXT,
  email TEXT,
  about TEXT,
  payment_method_ref TEXT,
  suspended BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.hiring_party_profiles ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER hpp_set_updated_at BEFORE UPDATE ON public.hiring_party_profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- WORKER PROFILES
-- =========================================================
CREATE TABLE public.worker_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  city TEXT,
  service_radius_miles INT DEFAULT 25,
  bio TEXT,
  skills TEXT[] DEFAULT '{}',
  work_history JSONB DEFAULT '[]'::jsonb,
  availability JSONB DEFAULT '{}'::jsonb,
  transportation public.transportation_type DEFAULT 'own_vehicle',
  profile_photo_url TEXT,
  vetting_status public.vetting_status NOT NULL DEFAULT 'applicant',
  suspended BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.worker_profiles ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER wp_set_updated_at BEFORE UPDATE ON public.worker_profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- WORKER REFERENCES
-- =========================================================
CREATE TABLE public.worker_references (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_profile_id UUID NOT NULL REFERENCES public.worker_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  company TEXT,
  phone TEXT NOT NULL,
  relationship TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.worker_references ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- VERIFICATION SUBMISSIONS
-- =========================================================
CREATE TABLE public.verification_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_profile_id UUID NOT NULL REFERENCES public.worker_profiles(id) ON DELETE CASCADE,
  id_doc_url TEXT,
  background_check_consent BOOLEAN NOT NULL DEFAULT false,
  terms_accepted BOOLEAN NOT NULL DEFAULT false,
  situational_test_responses JSONB DEFAULT '{}'::jsonb,
  decision public.verification_decision NOT NULL DEFAULT 'pending',
  admin_feedback TEXT,
  reviewer_id UUID REFERENCES auth.users(id),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.verification_submissions ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER vs_set_updated_at BEFORE UPDATE ON public.verification_submissions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- JOBS
-- =========================================================
CREATE TABLE public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hiring_party_id UUID NOT NULL REFERENCES public.hiring_party_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  date_needed DATE,
  start_time TIME,
  estimated_duration_hours NUMERIC,
  budget_type public.budget_type NOT NULL DEFAULT 'hourly',
  budget_amount NUMERIC NOT NULL,
  address TEXT,
  city TEXT,
  photos TEXT[] DEFAULT '{}',
  workers_needed INT NOT NULL DEFAULT 1,
  required_skills TEXT[] DEFAULT '{}',
  status public.job_status NOT NULL DEFAULT 'draft',
  accepted_worker_id UUID REFERENCES public.worker_profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER jobs_set_updated_at BEFORE UPDATE ON public.jobs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_jobs_status ON public.jobs(status);
CREATE INDEX idx_jobs_city ON public.jobs(city);
CREATE INDEX idx_jobs_date ON public.jobs(date_needed);

-- =========================================================
-- JOB APPLICATIONS
-- =========================================================
CREATE TABLE public.job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  worker_profile_id UUID NOT NULL REFERENCES public.worker_profiles(id) ON DELETE CASCADE,
  proposed_amount NUMERIC NOT NULL,
  message TEXT,
  availability_confirmed BOOLEAN NOT NULL DEFAULT false,
  status public.application_status NOT NULL DEFAULT 'submitted',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (job_id, worker_profile_id)
);
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER ja_set_updated_at BEFORE UPDATE ON public.job_applications
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- MESSAGE THREADS + MESSAGES
-- =========================================================
CREATE TABLE public.message_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  hiring_party_id UUID NOT NULL REFERENCES public.hiring_party_profiles(id) ON DELETE CASCADE,
  worker_profile_id UUID NOT NULL REFERENCES public.worker_profiles(id) ON DELETE CASCADE,
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (job_id, worker_profile_id)
);
ALTER TABLE public.message_threads ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES public.message_threads(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_messages_thread ON public.messages(thread_id, created_at);

-- =========================================================
-- REVIEWS
-- =========================================================
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reviewee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reviewer_role public.reviewer_role NOT NULL,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  text TEXT,
  reliability_score INT CHECK (reliability_score BETWEEN 1 AND 5),
  communication_score INT CHECK (communication_score BETWEEN 1 AND 5),
  professionalism_score INT CHECK (professionalism_score BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (job_id, reviewer_id)
);
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- ADMIN NOTES
-- =========================================================
CREATE TABLE public.admin_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type public.admin_target_type NOT NULL,
  target_id UUID NOT NULL,
  admin_id UUID NOT NULL REFERENCES auth.users(id),
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.admin_notes ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- RLS POLICIES
-- =========================================================

-- profiles: anyone can view, owner can update/insert
CREATE POLICY "Profiles viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- user_roles: users see own roles, admins see all
CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id OR public.is_admin(auth.uid()));
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- hiring_party_profiles
CREATE POLICY "HPP viewable by everyone" ON public.hiring_party_profiles FOR SELECT USING (true);
CREATE POLICY "HPP owner insert" ON public.hiring_party_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "HPP owner update" ON public.hiring_party_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "HPP admin all" ON public.hiring_party_profiles FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- worker_profiles
CREATE POLICY "WP viewable by everyone" ON public.worker_profiles FOR SELECT USING (true);
CREATE POLICY "WP owner insert" ON public.worker_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "WP owner update" ON public.worker_profiles FOR UPDATE USING (auth.uid() = user_id AND vetting_status NOT IN ('verified','verified_pro','rejected'))
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "WP admin all" ON public.worker_profiles FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- worker_references: owner manages, public can view (helps vetting visibility)
CREATE POLICY "Refs viewable by everyone" ON public.worker_references FOR SELECT USING (true);
CREATE POLICY "Refs owner manage" ON public.worker_references FOR ALL
  USING (EXISTS (SELECT 1 FROM public.worker_profiles wp WHERE wp.id = worker_profile_id AND wp.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.worker_profiles wp WHERE wp.id = worker_profile_id AND wp.user_id = auth.uid()));
CREATE POLICY "Refs admin all" ON public.worker_references FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- verification_submissions: owner can read/insert/update own; admin all
CREATE POLICY "VS owner read" ON public.verification_submissions FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.worker_profiles wp WHERE wp.id = worker_profile_id AND wp.user_id = auth.uid()));
CREATE POLICY "VS owner insert" ON public.verification_submissions FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.worker_profiles wp WHERE wp.id = worker_profile_id AND wp.user_id = auth.uid()));
CREATE POLICY "VS owner update" ON public.verification_submissions FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.worker_profiles wp WHERE wp.id = worker_profile_id AND wp.user_id = auth.uid()) AND decision = 'pending');
CREATE POLICY "VS admin all" ON public.verification_submissions FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- jobs: open jobs viewable by all authenticated; owner manages own
CREATE POLICY "Jobs public view open" ON public.jobs FOR SELECT
  USING (status IN ('open','in_progress','completed') OR EXISTS (SELECT 1 FROM public.hiring_party_profiles hpp WHERE hpp.id = hiring_party_id AND hpp.user_id = auth.uid()) OR public.is_admin(auth.uid()));
CREATE POLICY "Jobs owner insert" ON public.jobs FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.hiring_party_profiles hpp WHERE hpp.id = hiring_party_id AND hpp.user_id = auth.uid()));
CREATE POLICY "Jobs owner update" ON public.jobs FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.hiring_party_profiles hpp WHERE hpp.id = hiring_party_id AND hpp.user_id = auth.uid()));
CREATE POLICY "Jobs owner delete" ON public.jobs FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.hiring_party_profiles hpp WHERE hpp.id = hiring_party_id AND hpp.user_id = auth.uid()));
CREATE POLICY "Jobs admin all" ON public.jobs FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- job_applications: worker creates/updates own; hiring party for that job can view; admin all
CREATE POLICY "JA worker view own" ON public.job_applications FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.worker_profiles wp WHERE wp.id = worker_profile_id AND wp.user_id = auth.uid()));
CREATE POLICY "JA hp view for own jobs" ON public.job_applications FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.jobs j JOIN public.hiring_party_profiles hpp ON hpp.id = j.hiring_party_id WHERE j.id = job_id AND hpp.user_id = auth.uid()));
CREATE POLICY "JA worker insert" ON public.job_applications FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.worker_profiles wp WHERE wp.id = worker_profile_id AND wp.user_id = auth.uid()));
CREATE POLICY "JA worker update" ON public.job_applications FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.worker_profiles wp WHERE wp.id = worker_profile_id AND wp.user_id = auth.uid()));
CREATE POLICY "JA hp update for own jobs" ON public.job_applications FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.jobs j JOIN public.hiring_party_profiles hpp ON hpp.id = j.hiring_party_id WHERE j.id = job_id AND hpp.user_id = auth.uid()));
CREATE POLICY "JA admin all" ON public.job_applications FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- message_threads: only participants
CREATE POLICY "MT participants view" ON public.message_threads FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.hiring_party_profiles hpp WHERE hpp.id = hiring_party_id AND hpp.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.worker_profiles wp WHERE wp.id = worker_profile_id AND wp.user_id = auth.uid())
    OR public.is_admin(auth.uid())
  );
CREATE POLICY "MT participants insert" ON public.message_threads FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.hiring_party_profiles hpp WHERE hpp.id = hiring_party_id AND hpp.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.worker_profiles wp WHERE wp.id = worker_profile_id AND wp.user_id = auth.uid())
  );
CREATE POLICY "MT participants update" ON public.message_threads FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.hiring_party_profiles hpp WHERE hpp.id = hiring_party_id AND hpp.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.worker_profiles wp WHERE wp.id = worker_profile_id AND wp.user_id = auth.uid())
  );

-- messages: only thread participants
CREATE POLICY "Msg participants view" ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.message_threads t
      LEFT JOIN public.hiring_party_profiles hpp ON hpp.id = t.hiring_party_id
      LEFT JOIN public.worker_profiles wp ON wp.id = t.worker_profile_id
      WHERE t.id = thread_id AND (hpp.user_id = auth.uid() OR wp.user_id = auth.uid())
    ) OR public.is_admin(auth.uid())
  );
CREATE POLICY "Msg participants insert" ON public.messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND EXISTS (
      SELECT 1 FROM public.message_threads t
      LEFT JOIN public.hiring_party_profiles hpp ON hpp.id = t.hiring_party_id
      LEFT JOIN public.worker_profiles wp ON wp.id = t.worker_profile_id
      WHERE t.id = thread_id AND (hpp.user_id = auth.uid() OR wp.user_id = auth.uid())
    )
  );

-- reviews: viewable by all, only completed-job participants can create
CREATE POLICY "Reviews viewable by everyone" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Reviews participants insert" ON public.reviews FOR INSERT
  WITH CHECK (
    reviewer_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.jobs j
      LEFT JOIN public.hiring_party_profiles hpp ON hpp.id = j.hiring_party_id
      LEFT JOIN public.worker_profiles wp ON wp.id = j.accepted_worker_id
      WHERE j.id = job_id AND j.status = 'completed'
        AND (hpp.user_id = auth.uid() OR wp.user_id = auth.uid())
    )
  );
CREATE POLICY "Reviews admin all" ON public.reviews FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- admin_notes: admin only
CREATE POLICY "Admin notes admin all" ON public.admin_notes FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- =========================================================
-- STORAGE BUCKETS
-- =========================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('job-photos', 'job-photos', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('verification-docs', 'verification-docs', false) ON CONFLICT DO NOTHING;

-- avatars: public read, owner write (folder = user_id)
CREATE POLICY "Avatars public read" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Avatars owner insert" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Avatars owner update" ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Avatars owner delete" ON storage.objects FOR DELETE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- job-photos: public read, owner write
CREATE POLICY "Job photos public read" ON storage.objects FOR SELECT USING (bucket_id = 'job-photos');
CREATE POLICY "Job photos owner insert" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'job-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Job photos owner update" ON storage.objects FOR UPDATE
  USING (bucket_id = 'job-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Job photos owner delete" ON storage.objects FOR DELETE
  USING (bucket_id = 'job-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- verification-docs: private, owner + admin
CREATE POLICY "Verif docs owner read" ON storage.objects FOR SELECT
  USING (bucket_id = 'verification-docs' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.is_admin(auth.uid())));
CREATE POLICY "Verif docs owner insert" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'verification-docs' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Verif docs owner update" ON storage.objects FOR UPDATE
  USING (bucket_id = 'verification-docs' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Verif docs owner delete" ON storage.objects FOR DELETE
  USING (bucket_id = 'verification-docs' AND auth.uid()::text = (storage.foldername(name))[1]);