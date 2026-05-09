-- Add views_count to opportunities and create increment function

ALTER TABLE public.opportunities 
ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;

-- Function to safely increment views
CREATE OR REPLACE FUNCTION public.increment_opportunity_views(target_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.opportunities
  SET views_count = views_count + 1
  WHERE id = target_id;
END;
$$;

-- Function to get interest count (applications)
CREATE OR REPLACE FUNCTION public.get_opportunity_interest_count(target_id UUID)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count integer;
BEGIN
  SELECT count(*) INTO v_count
  FROM public.opportunity_applications
  WHERE opportunity_id = target_id;
  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_opportunity_views(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_opportunity_interest_count(UUID) TO anon, authenticated;
