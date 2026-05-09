-- 1. Add banner_url column if it doesn't exist
ALTER TABLE IF EXISTS public.opportunities ADD COLUMN IF NOT EXISTS banner_url TEXT;

-- 2. Update the RPC to allow inserting/updating banner_url
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
        id, slug, title, company, company_logo, banner_url, category, type, work_mode, location, industry, duration,
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
        r.banner_url,
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
        COALESCE(r.show_header, true),
        COALESCE(r.show_role_overview, true),
        COALESCE(r.show_eligibility_skills, true),
        COALESCE(r.show_introduction, true),
        COALESCE(r.show_program_overview, true),
        COALESCE(r.show_domains, true),
        COALESCE(r.show_eligibility_criteria, true),
        COALESCE(r.show_how_to_apply, true),
        COALESCE(r.show_faqs, true),
        COALESCE(r.show_listing_details, true),
        COALESCE(r.show_share, true),
        COALESCE(r.created_at, v_now)
    FROM jsonb_populate_record(NULL::public.opportunities, p_data) AS r
    ON CONFLICT (id) DO UPDATE SET
        slug = COALESCE(EXCLUDED.slug, public.opportunities.slug),
        title = COALESCE(EXCLUDED.title, public.opportunities.title),
        company = COALESCE(EXCLUDED.company, public.opportunities.company),
        company_logo = COALESCE(EXCLUDED.company_logo, public.opportunities.company_logo),
        banner_url = EXCLUDED.banner_url,
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
        experience = EXCLUDED.experience,
        eligibility = EXCLUDED.eligibility,
        education = EXCLUDED.education,
        required_skills = EXCLUDED.required_skills,
        branches_allowed = EXCLUDED.branches_allowed,
        year_of_study = EXCLUDED.year_of_study,
        age_limit = EXCLUDED.age_limit,
        description = EXCLUDED.description,
        introduction = EXCLUDED.introduction,
        program_overview = EXCLUDED.program_overview,
        domains = EXCLUDED.domains,
        eligibility_criteria = EXCLUDED.eligibility_criteria,
        how_to_apply = EXCLUDED.how_to_apply,
        faqs = EXCLUDED.faqs,
        apply_by = EXCLUDED.apply_by,
        posted_at = EXCLUDED.posted_at,
        updated_at = EXCLUDED.updated_at,
        valid_through = EXCLUDED.valid_through,
        openings = EXCLUDED.openings,
        open_method = EXCLUDED.open_method,
        application_fee = EXCLUDED.application_fee,
        apply_url = EXCLUDED.apply_url,
        is_paid = EXCLUDED.is_paid,
        is_featured = EXCLUDED.is_featured,
        show_header = EXCLUDED.show_header,
        show_role_overview = EXCLUDED.show_role_overview,
        show_eligibility_skills = EXCLUDED.show_eligibility_skills,
        show_introduction = EXCLUDED.show_introduction,
        show_program_overview = EXCLUDED.show_program_overview,
        show_domains = EXCLUDED.show_domains,
        show_eligibility_criteria = EXCLUDED.show_eligibility_criteria,
        show_how_to_apply = EXCLUDED.show_how_to_apply,
        show_faqs = EXCLUDED.show_faqs,
        show_listing_details = EXCLUDED.show_listing_details,
        show_share = EXCLUDED.show_share
    RETURNING id INTO v_id;

    RETURN v_id;
END;
$$;
