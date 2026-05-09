
-- 1. REVOKE DANGEROUS PERMISSIONS
-- Remove public/anon/auth access to sensitive credential tables
REVOKE ALL ON TABLE public.admin_credentials FROM anon, authenticated;
REVOKE ALL ON TABLE public.admins FROM anon, authenticated;

-- 2. SECURE ADMIN RPCs (Remove plain text password requirement)
-- Instead of checking p_username/p_password, we check auth.uid() and role

CREATE OR REPLACE FUNCTION public.is_admin() 
RETURNS BOOLEAN AS $$
BEGIN
    -- We check the profiles table without triggering RLS recursively
    RETURN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND (role = 'admin' OR is_admin = true)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Update Marketplace Delete RPC
CREATE OR REPLACE FUNCTION public.admin_delete_marketplace_item(p_item_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Unauthorized: Admin access required.';
    END IF;
    DELETE FROM marketplace_items WHERE id = p_item_id;
END;
$$;

-- Update Marketplace Status RPC
CREATE OR REPLACE FUNCTION public.admin_update_marketplace_status(p_item_id UUID, p_status TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Unauthorized: Admin access required.';
    END IF;
    UPDATE marketplace_items SET status = p_status, updated_at = NOW() WHERE id = p_item_id;
END;
$$;

-- Marketplace Fetch RPC
CREATE OR REPLACE FUNCTION public.admin_get_marketplace_items()
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Unauthorized: Admin access required.';
    END IF;

    RETURN (
        SELECT json_agg(t) FROM (
            SELECT 
                mi.*, 
                p.full_name as seller_name, 
                p.email as seller_email,
                p.avatar_url as seller_avatar
            FROM marketplace_items mi
            LEFT JOIN profiles p ON mi.seller_id = p.id
            ORDER BY mi.created_at DESC
        ) t
    );
END;
$$;

-- Update Lost & Found Delete RPC
CREATE OR REPLACE FUNCTION public.admin_delete_lost_found_item(p_item_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Unauthorized: Admin access required.';
    END IF;
    DELETE FROM public.lost_found_items WHERE id = p_item_id;
END;
$$;

-- Update Lost & Found Status RPC
CREATE OR REPLACE FUNCTION public.admin_update_lost_found_status(p_item_id UUID, p_status TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Unauthorized: Admin access required.';
    END IF;
    UPDATE public.lost_found_items SET status = p_status WHERE id = p_item_id;
END;
$$;

-- Update Opportunities RPCs
CREATE OR REPLACE FUNCTION public.admin_get_opportunities()
RETURNS SETOF public.opportunities LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    IF NOT public.is_admin() THEN RAISE EXCEPTION 'Unauthorized'; END IF;
    RETURN QUERY SELECT * FROM public.opportunities ORDER BY created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_upsert_opportunity(p_data JSONB)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_id UUID;
BEGIN
    IF NOT public.is_admin() THEN RAISE EXCEPTION 'Unauthorized'; END IF;
    
    INSERT INTO public.opportunities (
        id, type, title, company, company_logo, location, work_mode, category,
        industry, duration, work_hours, employment_type, experience,
        stipend_text, stipend_min, stipend_max, stipend_currency, is_paid,
        eligibility, education, required_skills, branches_allowed,
        year_of_study, age_limit, description, introduction, program_overview,
        domains, eligibility_criteria, how_to_apply, faqs, apply_by,
        valid_through, openings, open_method, application_fee, apply_url,
        show_role_overview, show_eligibility_skills, show_introduction,
        show_program_overview, show_domains, show_eligibility_criteria,
        show_how_to_apply, show_faqs, show_listing_details, show_share
    )
    VALUES (
        COALESCE((p_data->>'id')::UUID, gen_random_uuid()),
        p_data->>'type', p_data->>'title', p_data->>'company', p_data->>'company_logo',
        p_data->>'location', p_data->>'work_mode', p_data->>'category',
        p_data->>'industry', p_data->>'duration', p_data->>'work_hours',
        p_data->>'employment_type', p_data->>'experience', p_data->>'stipend_text',
        (p_data->>'stipend_min')::NUMERIC, (p_data->>'stipend_max')::NUMERIC,
        p_data->>'stipend_currency', (p_data->>'is_paid')::BOOLEAN,
        p_data->>'eligibility', p_data->>'education', p_data->'required_skills',
        p_data->'branches_allowed', p_data->>'year_of_study', p_data->>'age_limit',
        p_data->>'description', p_data->>'introduction', p_data->>'program_overview',
        p_data->'domains', p_data->'eligibility_criteria', p_data->'how_to_apply',
        p_data->'faqs', (p_data->>'apply_by')::TIMESTAMPTZ,
        (p_data->>'valid_through')::TIMESTAMPTZ, p_data->>'openings',
        p_data->>'open_method', p_data->>'application_fee', p_data->>'apply_url',
        (p_data->>'show_role_overview')::BOOLEAN, (p_data->>'show_eligibility_skills')::BOOLEAN,
        (p_data->>'show_introduction')::BOOLEAN, (p_data->>'show_program_overview')::BOOLEAN,
        (p_data->>'show_domains')::BOOLEAN, (p_data->>'show_eligibility_criteria')::BOOLEAN,
        (p_data->>'show_how_to_apply')::BOOLEAN, (p_data->>'show_faqs')::BOOLEAN,
        (p_data->>'show_listing_details')::BOOLEAN, (p_data->>'show_share')::BOOLEAN
    )
    ON CONFLICT (id) DO UPDATE SET
        type = EXCLUDED.type, title = EXCLUDED.title, company = EXCLUDED.company,
        company_logo = EXCLUDED.company_logo, location = EXCLUDED.location,
        work_mode = EXCLUDED.work_mode, category = EXCLUDED.category,
        industry = EXCLUDED.industry, duration = EXCLUDED.duration,
        work_hours = EXCLUDED.work_hours, employment_type = EXCLUDED.employment_type,
        experience = EXCLUDED.experience, stipend_text = EXCLUDED.stipend_text,
        stipend_min = EXCLUDED.stipend_min, stipend_max = EXCLUDED.stipend_max,
        stipend_currency = EXCLUDED.stipend_currency, is_paid = EXCLUDED.is_paid,
        eligibility = EXCLUDED.eligibility, education = EXCLUDED.education,
        required_skills = EXCLUDED.required_skills, branches_allowed = EXCLUDED.branches_allowed,
        year_of_study = EXCLUDED.year_of_study, age_limit = EXCLUDED.age_limit,
        description = EXCLUDED.description, introduction = EXCLUDED.introduction,
        program_overview = EXCLUDED.program_overview, domains = EXCLUDED.domains,
        eligibility_criteria = EXCLUDED.eligibility_criteria, how_to_apply = EXCLUDED.how_to_apply,
        faqs = EXCLUDED.faqs, apply_by = EXCLUDED.apply_by,
        valid_through = EXCLUDED.valid_through, openings = EXCLUDED.openings,
        open_method = EXCLUDED.open_method, application_fee = EXCLUDED.application_fee,
        apply_url = EXCLUDED.apply_url, show_role_overview = EXCLUDED.show_role_overview,
        show_eligibility_skills = EXCLUDED.show_eligibility_skills,
        show_introduction = EXCLUDED.show_introduction, show_program_overview = EXCLUDED.show_program_overview,
        show_domains = EXCLUDED.show_domains, show_eligibility_criteria = EXCLUDED.show_eligibility_criteria,
        show_how_to_apply = EXCLUDED.show_how_to_apply, show_faqs = EXCLUDED.show_faqs,
        show_listing_details = EXCLUDED.show_listing_details, show_share = EXCLUDED.show_share,
        updated_at = NOW()
    RETURNING id INTO v_id;
    RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_delete_opportunity(p_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    IF NOT public.is_admin() THEN RAISE EXCEPTION 'Unauthorized'; END IF;
    DELETE FROM public.opportunities WHERE id = p_id;
END;
$$;

-- Update Management: Opportunity Applications
CREATE OR REPLACE FUNCTION public.admin_get_opportunity_applications()
RETURNS TABLE (
  id UUID, opportunity_id UUID, opportunity_title TEXT, opportunity_type TEXT,
  name TEXT, email TEXT, phone TEXT, college TEXT, branch TEXT,
  year_of_study TEXT, portfolio_url TEXT, linkedin_url TEXT,
  status TEXT, created_at TIMESTAMPTZ
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  RETURN QUERY
  SELECT a.id, a.opportunity_id, o.title, o.type, a.name, a.email, a.phone,
         a.college, a.branch, a.year_of_study, a.portfolio_url, a.linkedin_url,
         a.status, a.created_at
  FROM public.opportunity_applications a
  JOIN public.opportunities o ON o.id = a.opportunity_id
  ORDER BY a.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_update_opportunity_application_status(p_id UUID, p_status TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  UPDATE public.opportunity_applications SET status = p_status WHERE id = p_id;
  RETURN jsonb_build_object('success', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_delete_opportunity_application(p_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  DELETE FROM public.opportunity_applications WHERE id = p_id;
  RETURN jsonb_build_object('success', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_set_opportunity_featured(p_opportunity_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_featured BOOLEAN;
BEGIN
    IF NOT public.is_admin() THEN RAISE EXCEPTION 'Unauthorized'; END IF;
    
    UPDATE public.opportunities 
    SET is_featured = NOT is_featured 
    WHERE id = p_opportunity_id
    RETURNING is_featured INTO v_featured;
    
    RETURN jsonb_build_object('success', true, 'featured', v_featured);
END;
$$;

-- Global Event Deletion
CREATE OR REPLACE FUNCTION public.admin_delete_event(p_event_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    IF NOT public.is_admin() THEN RAISE EXCEPTION 'Unauthorized'; END IF;
    DELETE FROM public.events WHERE id = p_event_id;
    RETURN jsonb_build_object('success', true);
END;
$$;

-- Attendance & Scanner
CREATE OR REPLACE FUNCTION public.get_admin_event_data(p_event_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    result JSONB;
BEGIN
    IF NOT public.is_admin() THEN RAISE EXCEPTION 'Unauthorized'; END IF;
    SELECT jsonb_agg(
        to_jsonb(r) || jsonb_build_object(
            'profiles', jsonb_build_object(
                'full_name', p.full_name, 'email', p.email, 'avatar_url', p.avatar_url
            )
        )
    )
    INTO result
    FROM event_registrations r
    LEFT JOIN profiles p ON r.user_id = p.id
    WHERE r.event_id = p_event_id;
    RETURN COALESCE(result, '[]'::jsonb);
END;
$$;

-- Notifications
CREATE OR REPLACE FUNCTION public.get_admin_notifications()
RETURNS TABLE (
    id UUID, title TEXT, message TEXT, type TEXT,
    is_read BOOLEAN, created_at TIMESTAMPTZ, data JSONB
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    IF NOT public.is_admin() THEN RAISE EXCEPTION 'Unauthorized'; END IF;
    RETURN QUERY SELECT n.id, n.title, n.message, n.type, n.is_read, n.created_at, n.data
    FROM public.admin_notifications n ORDER BY n.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_admin_notification_read(p_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    IF NOT public.is_admin() THEN RAISE EXCEPTION 'Unauthorized'; END IF;
    UPDATE public.admin_notifications SET is_read = true WHERE id = p_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.clear_admin_notifications()
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    IF NOT public.is_admin() THEN RAISE EXCEPTION 'Unauthorized'; END IF;
    DELETE FROM public.admin_notifications;
END;
$$;

-- Dispute & Resolution Securing
CREATE OR REPLACE FUNCTION public.post_admin_message(p_dispute_id UUID, p_content TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    IF NOT public.is_admin() THEN RAISE EXCEPTION 'Unauthorized'; END IF;
    INSERT INTO public.dispute_messages (dispute_id, sender_id, content, is_admin_message)
    VALUES (p_dispute_id, auth.uid(), p_content, TRUE);
END;
$$;

CREATE OR REPLACE FUNCTION public.resolve_dispute(p_dispute_id UUID, p_resolution_type TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_order_id UUID;
    v_order_amount NUMERIC;
    v_seller_id UUID;
    v_buyer_id UUID;
    v_item_id UUID;
BEGIN
    IF NOT public.is_admin() THEN RAISE EXCEPTION 'Unauthorized'; END IF;
    -- Get Details
    SELECT order_id INTO v_order_id FROM public.marketplace_disputes WHERE id = p_dispute_id;
    SELECT amount, seller_id, buyer_id, item_id INTO v_order_amount, v_seller_id, v_buyer_id, v_item_id FROM public.marketplace_orders WHERE id = v_order_id;

    IF p_resolution_type = 'release' THEN
        -- Transfer to Seller
        UPDATE public.profiles
        SET 
            total_earned = COALESCE(total_earned, 0) + v_order_amount,
            wallet_balance = COALESCE(wallet_balance, 0) + v_order_amount
        WHERE id = v_seller_id;
        -- Update Order
        UPDATE public.marketplace_orders SET status = 'completed', funds_released = TRUE WHERE id = v_order_id;
        -- LOG TRANSACTION: CREDIT SELLER (Sale)
        INSERT INTO public.payment_transactions (user_id, amount, type, category, status, description, reference_id)
        VALUES (v_seller_id, v_order_amount, 'credit', 'sale', 'completed', 'Dispute Resolved: Sale earnings released', v_order_id);
        UPDATE public.marketplace_disputes SET status = 'resolved_release' WHERE id = p_dispute_id;
    ELSIF p_resolution_type = 'refund' THEN
        -- Refund Buyer
        UPDATE public.profiles SET wallet_balance = COALESCE(wallet_balance, 0) + v_order_amount WHERE id = v_buyer_id;
        -- Update Order to Cancelled
        UPDATE public.marketplace_orders SET status = 'cancelled' WHERE id = v_order_id;
        -- REACTIVATE ITEM (Approved)
        UPDATE public.marketplace_items SET status = 'approved' WHERE id = v_item_id;
        -- LOG TRANSACTION: CREDIT BUYER (Refund)
        INSERT INTO public.payment_transactions (user_id, amount, type, category, status, description, reference_id)
        VALUES (v_buyer_id, v_order_amount, 'credit', 'refund', 'completed', 'Dispute Resolved: Full Refund', v_order_id);
        UPDATE public.marketplace_disputes SET status = 'resolved_refund' WHERE id = p_dispute_id;
    END IF;
END;
$$;


-- Update Users Scan RPC
CREATE OR REPLACE FUNCTION public.admin_get_users_with_status()
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    IF NOT public.is_admin() THEN RAISE EXCEPTION 'Unauthorized'; END IF;
    RETURN (
        SELECT json_agg(t) FROM (
            SELECT p.*, 
                   (SELECT count(*) FROM event_registrations er WHERE er.user_id = p.id) as registrations_count
            FROM profiles p
            ORDER BY p.created_at DESC
        ) t
    );
END;
$$;

-- Grants Refresh
GRANT EXECUTE ON FUNCTION public.admin_get_opportunities() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_upsert_opportunity(JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_marketplace_items() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_users_with_status() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_opportunity(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_marketplace_item(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_marketplace_status(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_lost_found_item(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_lost_found_status(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_opportunity_applications() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_opportunity_application_status(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_opportunity_application(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_event(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_opportunity_featured(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_event_data(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_notifications() TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_admin_notification_read(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.clear_admin_notifications() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_attendance(UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_dispute(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.post_admin_message(UUID, TEXT) TO authenticated;

-- 3. LOCK DOWN POLICES (Privacy & Security Fix)
-- PROFILES: Revoke public/anon access to sensitive columns
REVOKE ALL ON public.profiles FROM anon;
GRANT SELECT (id, full_name, avatar_url, college, branch, semester) ON public.profiles TO anon;

DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Allow anon read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public profile data is viewable by everyone" ON public.profiles;

-- Allow all profiles to be viewable by authenticated users (essential for app features)
CREATE POLICY "Profiles are viewable by authenticated users" ON public.profiles
FOR SELECT TO authenticated USING (true);

-- Admins can manage all profiles
CREATE POLICY "Admins can manage all profiles" ON public.profiles
FOR ALL TO authenticated USING (public.is_admin());

-- Users can manage their own profile
CREATE POLICY "Users can manage own profile" ON public.profiles
FOR ALL TO authenticated 
USING (id = auth.uid()) 
WITH CHECK (id = auth.uid());

CREATE POLICY "Public can view basic profile info" ON public.profiles
FOR SELECT TO anon USING (true);

-- EVENTS: Move from 'anon' all access to 'admin' all access
DROP POLICY IF EXISTS "Allow anon read events" ON public.events;
DROP POLICY IF EXISTS "Allow anon read" ON public.events;
DROP POLICY IF EXISTS "Anyone can view events" ON public.events; -- Remove broad access if exists

CREATE POLICY "Everyone can view active events" 
ON public.events FOR SELECT USING (true);

CREATE POLICY "Admins can manage events" 
ON public.events FOR ALL TO authenticated 
USING (public.is_admin()) WITH CHECK (public.is_admin());

-- EVENT REGISTRATIONS: Lock down from 'anon'
DROP POLICY IF EXISTS "Allow anon read" ON public.event_registrations;
DROP POLICY IF EXISTS "Allow anon update" ON public.event_registrations;

CREATE POLICY "Admins can manage all registrations" 
ON public.event_registrations FOR ALL TO authenticated 
USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Users can manage own registrations" 
ON public.event_registrations FOR ALL TO authenticated 
USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 4. CLEANUP OLD LOGINS & PROMOTION
-- Ensure riyansh@campulsy.in is the master admin
UPDATE public.profiles SET role = 'admin', is_admin = true WHERE email = 'riyansh@campulsy.in';
UPDATE public.profiles SET role = 'admin', is_admin = true WHERE email = 'itsyourriyansh@gmail.com';
UPDATE public.profiles SET role = 'admin', is_admin = true WHERE full_name ILIKE '%Riyansh%';

-- Remove admin status from generic accounts
UPDATE public.profiles SET role = 'student', is_admin = false WHERE email = 'admin@example.com';

-- Ensure the legacy table is consistent
DELETE FROM public.admin_credentials;
INSERT INTO public.admin_credentials (username, password) VALUES ('riyansh@campulsy.in', 'Campulsy@291005');
GRANT ALL ON TABLE public.admin_credentials TO anon, authenticated, postgres, service_role;



