-- Add is_featured column to opportunities
ALTER TABLE IF EXISTS public.opportunities ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;

-- Update the UPSERT RPC to handle is_featured
DROP FUNCTION IF EXISTS public.admin_upsert_opportunity;
CREATE OR REPLACE FUNCTION public.admin_upsert_opportunity(
    p_username TEXT,
    p_password TEXT,
    p_data JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_is_valid BOOLEAN;
    v_id UUID;
    v_now TIMESTAMPTZ := NOW();
BEGIN
    SELECT public.login_admin(p_username, p_password) INTO v_is_valid;
    IF NOT v_is_valid THEN
        RAISE EXCEPTION 'Invalid admin credentials';
    END IF;

    INSERT INTO public.opportunities (
        id, slug, title, company, company_logo, category, type, work_mode, location, industry, duration,
        stipend_text, stipend_min, stipend_max, stipend_currency, work_hours, employment_type, experience,
        eligibility, education, required_skills, branches_allowed, year_of_study, age_limit, description,
        introduction, program_overview, domains, eligibility_criteria, how_to_apply, faqs, apply_by,
        posted_at, updated_at, valid_through, openings, open_method, application_fee, apply_url, is_paid,
        is_featured,
        show_header, show_role_overview, show_eligibility_skills,
        show_introduction, show_program_overview, show_domains, show_eligibility_criteria, show_how_to_apply, show_faqs,
        show_listing_details, show_share, created_at
    )
    SELECT
        COALESCE(r.id, gen_random_uuid()),
        r.slug,
        r.title,
        r.company,
        r.company_logo,
        r.category,
        COALESCE(r.type, 'Internship'),
        r.work_mode,
        r.location,
        r.industry,
        r.duration,
        r.stipend_text,
        r.stipend_min,
        r.stipend_max,
        COALESCE(r.stipend_currency, 'INR'),
        r.work_hours,
        r.employment_type,
        r.experience,
        r.eligibility,
        r.education,
        COALESCE(r.required_skills, '[]'::jsonb),
        COALESCE(r.branches_allowed, '[]'::jsonb),
        r.year_of_study,
        r.age_limit,
        r.description,
        r.introduction,
        r.program_overview,
        COALESCE(r.domains, '[]'::jsonb),
        COALESCE(r.eligibility_criteria, '[]'::jsonb),
        COALESCE(r.how_to_apply, '[]'::jsonb),
        COALESCE(r.faqs, '[]'::jsonb),
        r.apply_by,
        COALESCE(r.posted_at, (v_now)::date),
        COALESCE(r.updated_at, (v_now)::date),
        r.valid_through,
        r.openings,
        r.open_method,
        r.application_fee,
        r.apply_url,
        COALESCE(r.is_paid, false),
        COALESCE(r.is_featured, false),
        COALESCE(r.show_header,
        COALESCE(r.show_role_overview,
        COALESCE(r.show_eligibility_skills,
        COALESCE(r.show_introduction,
        COALESCE(r.show_program_overview,
        COALESCE(r.show_domains,
        COALESCE(r.show_eligibility_criteria,
        COALESCE(r.show_how_to_apply,
        COALESCE(r.show_faqs,
        COALESCE(r.show_listing_details,
        COALESCE(r.show_share,
        COALESCE(r.created_at, v_now)
    FROM jsonb_populate_record(NULL::public.opportunities, p_data) AS r
    ON CONFLICT (id) DO UPDATE SET
        slug = COALESCE(EXCLUDED.slug, public.opportunities.slug),
        title = COALESCE(EXCLUDED.title, public.opportunities.title),
        company = COALESCE(EXCLUDED.company, public.opportunities.company),
        company_logo = COALESCE(EXCLUDED.company_logo, public.opportunities.company_logo),
        category = COALESCE(EXCLUDED.category, public.opportunities.category),
        type = COALESCE(EXCLUDED.type, public.opportunities.type),
        work_mode = COALESCE(EXCLUDED.work_mode, public.opportunities.work_mode),
        location = COALESCE(EXCLUDED.location, public.opportunities.location),
        industry = COALESCE(EXCLUDED.industry, public.opportunities.industry),
        duration = COALESCE(EXCLUDED.duration, public.opportunities.duration),
        stipend_text = COALESCE(EXCLUDED.stipend_text, public.opportunities.stipend_text),
        stipend_min = COALESCE(EXCLUDED.stipend_min, public.opportunities.stipend_min),
        stipend_max = COALESCE(EXCLUDED.stipend_max, public.opportunities.stipend_max),
        stipend_currency = COALESCE(EXCLUDED.stipend_currency, public.opportunities.stipend_currency),
        work_hours = COALESCE(EXCLUDED.work_hours, public.opportunities.work_hours),
        employment_type = COALESCE(EXCLUDED.employment_type, public.opportunities.employment_type),
        experience = COALESCE(EXCLUDED.experience, public.opportunities.experience),
        eligibility = COALESCE(EXCLUDED.eligibility, public.opportunities.eligibility),
        education = COALESCE(EXCLUDED.education, public.opportunities.education),
        required_skills = COALESCE(EXCLUDED.required_skills, public.opportunities.required_skills),
        branches_allowed = COALESCE(EXCLUDED.branches_allowed, public.opportunities.branches_allowed),
        year_of_study = COALESCE(EXCLUDED.year_of_study, public.opportunities.year_of_study),
        age_limit = COALESCE(EXCLUDED.age_limit, public.opportunities.age_limit),
        description = COALESCE(EXCLUDED.description, public.opportunities.description),
        introduction = COALESCE(EXCLUDED.introduction, public.opportunities.introduction),
        program_overview = COALESCE(EXCLUDED.program_overview, public.opportunities.program_overview),
        domains = COALESCE(EXCLUDED.domains, public.opportunities.domains),
        eligibility_criteria = COALESCE(EXCLUDED.eligibility_criteria, public.opportunities.eligibility_criteria),
        how_to_apply = COALESCE(EXCLUDED.how_to_apply, public.opportunities.how_to_apply),
        faqs = COALESCE(EXCLUDED.faqs, public.opportunities.faqs),
        apply_by = COALESCE(EXCLUDED.apply_by, public.opportunities.apply_by),
        posted_at = COALESCE(EXCLUDED.posted_at, public.opportunities.posted_at),
        updated_at = COALESCE(EXCLUDED.updated_at, (NOW())::date),
        valid_through = COALESCE(EXCLUDED.valid_through, public.opportunities.valid_through),
        openings = COALESCE(EXCLUDED.openings, public.opportunities.openings),
        open_method = COALESCE(EXCLUDED.open_method, public.opportunities.open_method),
        application_fee = COALESCE(EXCLUDED.application_fee, public.opportunities.application_fee),
        apply_url = COALESCE(EXCLUDED.apply_url, public.opportunities.apply_url),
        is_paid = COALESCE(EXCLUDED.is_paid, public.opportunities.is_paid),
        is_featured = COALESCE(EXCLUDED.is_featured, public.opportunities.is_featured),
        show_header = COALESCE(EXCLUDED.show_header, public.opportunities.show_header),
        show_role_overview = COALESCE(EXCLUDED.show_role_overview, public.opportunities.show_role_overview),
        show_eligibility_skills = COALESCE(EXCLUDED.show_eligibility_skills, public.opportunities.show_eligibility_skills),
        show_introduction = COALESCE(EXCLUDED.show_introduction, public.opportunities.show_introduction),
        show_program_overview = COALESCE(EXCLUDED.show_program_overview, public.opportunities.show_program_overview),
        show_domains = COALESCE(EXCLUDED.show_domains, public.opportunities.show_domains),
        show_eligibility_criteria = COALESCE(EXCLUDED.show_eligibility_criteria, public.opportunities.show_eligibility_criteria),
        show_how_to_apply = COALESCE(EXCLUDED.show_how_to_apply, public.opportunities.show_how_to_apply),
        show_faqs = COALESCE(EXCLUDED.show_faqs, public.opportunities.show_faqs),
        show_listing_details = COALESCE(EXCLUDED.show_listing_details, public.opportunities.show_listing_details),
        show_share = COALESCE(EXCLUDED.show_share, public.opportunities.show_share)
    RETURNING id INTO v_id;

    RETURN v_id;
END;
$$;

-- CREATE OR REPLACE FUNCTION to set an opportunity as featured (and un-feature others of same type)
DROP FUNCTION IF EXISTS public.admin_set_opportunity_featured;
CREATE OR REPLACE FUNCTION public.admin_set_opportunity_featured(
    p_opportunity_id UUID,
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
    v_type TEXT;
BEGIN
    -- 1. Verify Admin
    SELECT public.login_admin(p_username, p_password) INTO v_is_valid;
    IF NOT v_is_valid THEN
        RAISE EXCEPTION 'Invalid admin credentials';
    END IF;

    -- 2. Get the type of the target opportunity
    SELECT type INTO v_type FROM public.opportunities WHERE id = p_opportunity_id;
    
    IF v_type IS NULL THEN
        RAISE EXCEPTION 'Opportunity not found';
    END IF;

    -- 3. Check if it's already featured (to toggle off)
    IF EXISTS (SELECT 1 FROM public.opportunities WHERE id = p_opportunity_id AND is_featured = TRUE) THEN
        UPDATE public.opportunities SET is_featured = FALSE WHERE id = p_opportunity_id;
        RETURN jsonb_build_object('success', true, 'featured', false);
    END IF;

    -- 4. Un-feature all other opportunities of the same type
    UPDATE public.opportunities 
    SET is_featured = FALSE 
    WHERE type = v_type AND is_featured = TRUE;

    -- 5. Feature the target opportunity
    UPDATE public.opportunities 
    SET is_featured = TRUE 
    WHERE id = p_opportunity_id;

    RETURN jsonb_build_object('success', true, 'featured';
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.admin_upsert_opportunity(TEXT, TEXT, JSONB) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_opportunity_featured(UUID, TEXT, TEXT) TO anon, authenticated;
