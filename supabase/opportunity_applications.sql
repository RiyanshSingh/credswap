-- Opportunity Applications (interest tracking)

CREATE TABLE IF NOT EXISTS public.opportunity_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID REFERENCES public.opportunities(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  college TEXT,
  branch TEXT,
  year_of_study TEXT,
  portfolio_url TEXT,
  linkedin_url TEXT,
  status TEXT DEFAULT 'submitted',
  source TEXT DEFAULT 'external',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS opportunity_applications_unique
  ON public.opportunity_applications (opportunity_id, email);

ALTER TABLE public.opportunity_applications ENABLE ROW LEVEL SECURITY;

-- Allow anyone to submit interest
DROP POLICY IF EXISTS "Public can submit opportunity application" ON public.opportunity_applications;
CREATE POLICY "Public can submit opportunity application"
  ON public.opportunity_applications FOR INSERT
  WITH CHECK (true);

-- Allow authenticated users to view their own submissions
DROP POLICY IF EXISTS "Users can view own opportunity applications" ON public.opportunity_applications;
CREATE POLICY "Users can view own opportunity applications"
  ON public.opportunity_applications FOR SELECT
  USING (
    auth.uid() = user_id
    OR (user_id IS NULL AND email = (auth.jwt() ->> 'email'))
  );

-- No public update/delete (admin via RPC)

-- Admin RPCs
CREATE OR REPLACE FUNCTION public.admin_get_opportunity_applications(
  p_username TEXT,
  p_password TEXT
)
RETURNS TABLE (
  id UUID,
  opportunity_id UUID,
  opportunity_title TEXT,
  opportunity_type TEXT,
  name TEXT,
  email TEXT,
  phone TEXT,
  college TEXT,
  branch TEXT,
  year_of_study TEXT,
  portfolio_url TEXT,
  linkedin_url TEXT,
  status TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_valid BOOLEAN;
BEGIN
  SELECT public.login_admin(p_username, p_password) INTO v_is_valid;
  IF NOT v_is_valid THEN
    RAISE EXCEPTION 'Invalid admin credentials';
  END IF;

  RETURN QUERY
  SELECT
    a.id,
    a.opportunity_id,
    o.title,
    o.type,
    a.name,
    a.email,
    a.phone,
    a.college,
    a.branch,
    a.year_of_study,
    a.portfolio_url,
    a.linkedin_url,
    a.status,
    a.created_at
  FROM public.opportunity_applications a
  JOIN public.opportunities o ON o.id = a.opportunity_id
  ORDER BY a.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_update_opportunity_application_status(
  p_id UUID,
  p_status TEXT,
  p_username TEXT,
  p_password TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_valid BOOLEAN;
BEGIN
  SELECT public.login_admin(p_username, p_password) INTO v_is_valid;
  IF NOT v_is_valid THEN
    RAISE EXCEPTION 'Invalid admin credentials';
  END IF;

  UPDATE public.opportunity_applications
  SET status = p_status
  WHERE id = p_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_delete_opportunity_application(
  p_id UUID,
  p_username TEXT,
  p_password TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_valid BOOLEAN;
BEGIN
  SELECT public.login_admin(p_username, p_password) INTO v_is_valid;
  IF NOT v_is_valid THEN
    RAISE EXCEPTION 'Invalid admin credentials';
  END IF;

  DELETE FROM public.opportunity_applications WHERE id = p_id;
  RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_get_opportunity_applications(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_opportunity_application_status(UUID, TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_opportunity_application(UUID, TEXT, TEXT) TO anon, authenticated;
