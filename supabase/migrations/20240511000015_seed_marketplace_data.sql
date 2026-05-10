-- Seed marketplace items for itsyourriyansh@gmail.com
DO $$
DECLARE
    v_seller_id UUID;
BEGIN
    -- Get the seller ID
    SELECT id INTO v_seller_id FROM public.profiles WHERE email = 'itsyourriyansh@gmail.com' LIMIT 1;

    IF v_seller_id IS NOT NULL THEN
        -- BOOKS
        INSERT INTO public.marketplace_items (title, price, category, description, image_url, seller_id, status, listing_type) VALUES
        ('Engineering Physics Textbook', 450, 'Books', 'Latest edition, very good condition. No markings.', 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800', v_seller_id, 'approved', 'sell'),
        ('Calculus by Stewart', 1200, 'Books', 'Hardcover edition. Essential for first-year engineering.', 'https://images.unsplash.com/photo-1543004218-ee141104975a?auto=format&fit=crop&q=80&w=800', v_seller_id, 'approved', 'sell'),
        ('GATE 2024 Prep Guide', 800, 'Books', 'Complete guide for Mechanical Engineering. Includes previous year papers.', 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=800', v_seller_id, 'approved', 'sell'),
        ('Python Programming', 350, 'Books', 'Beginner to advanced level. Great for placement prep.', 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&q=80&w=800', v_seller_id, 'approved', 'sell'),
        ('Atomic Habits', 300, 'Books', 'International bestseller. Must read for every student.', 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=800', v_seller_id, 'approved', 'sell'),
        ('Organic Chemistry Notes', 150, 'Books', 'Handwritten, well-organized notes for Semester 2.', 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&q=80&w=800', v_seller_id, 'approved', 'sell');

        -- ELECTRONICS
        INSERT INTO public.marketplace_items (title, price, category, description, image_url, seller_id, status, listing_type) VALUES
        ('Boat Rockerz 450 Headphones', 1200, 'Electronics', 'Black color, 15 hours battery life. Almost new.', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=800', v_seller_id, 'approved', 'sell'),
        ('Mi Powerbank 10000mAh', 800, 'Electronics', 'Dual USB output. Fast charging supported.', 'https://images.unsplash.com/photo-1609592424089-989218635839?auto=format&fit=crop&q=80&w=800', v_seller_id, 'approved', 'sell'),
        ('Logitech Wireless Mouse', 600, 'Electronics', 'Compact design, long battery life. Perfect for laptops.', 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&q=80&w=800', v_seller_id, 'approved', 'sell'),
        ('LED Study Lamp', 400, 'Electronics', '3 color modes, rechargeable. USB cable included.', 'https://images.unsplash.com/photo-1534073828943-f801091bb18c?auto=format&fit=crop&q=80&w=800', v_seller_id, 'approved', 'sell'),
        ('Casio Scientific Calculator', 1100, 'Electronics', 'Model fx-991ES Plus. Allowed in all exams.', 'https://images.unsplash.com/photo-1611078489935-0cb964de46d6?auto=format&fit=crop&q=80&w=800', v_seller_id, 'approved', 'sell'),
        ('HP Laptop Charger (65W)', 900, 'Electronics', 'Original charger, standard pin. Works with most HP models.', 'https://images.unsplash.com/photo-1585333127302-d29314483713?auto=format&fit=crop&q=80&w=800', v_seller_id, 'approved', 'sell');

        -- FURNITURE
        INSERT INTO public.marketplace_items (title, price, category, description, image_url, seller_id, status, listing_type) VALUES
        ('Foldable Study Table', 700, 'Furniture', 'Space-saving design, wood finish. Very stable.', 'https://images.unsplash.com/photo-1530099486328-e021101a494a?auto=format&fit=crop&q=80&w=800', v_seller_id, 'approved', 'sell'),
        ('Ergonomic Office Chair', 2500, 'Furniture', 'Adjustable height, mesh back. Great for long study sessions.', 'https://images.unsplash.com/photo-1505797149-43b00fe00827?auto=format&fit=crop&q=80&w=800', v_seller_id, 'approved', 'sell'),
        ('Small Wooden Bookshelf', 1000, 'Furniture', '3 tiers, compact size. Fits in dorn rooms easily.', 'https://images.unsplash.com/photo-1594620302200-9a762244a156?auto=format&fit=crop&q=80&w=800', v_seller_id, 'approved', 'sell'),
        ('Comfortable Bean Bag', 1500, 'Furniture', 'Large size, filled with high-quality beans. Navy blue.', 'https://images.unsplash.com/photo-1592078615290-033ee584e267?auto=format&fit=crop&q=80&w=800', v_seller_id, 'approved', 'sell'),
        ('Bedside Lamp Stand', 500, 'Furniture', 'Modern design, metal base. Shade included.', 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&q=80&w=800', v_seller_id, 'approved', 'sell'),
        ('Plastic Storage Rack', 400, 'Furniture', '4 tiers, lightweight. Good for snacks or shoes.', 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=800', v_seller_id, 'approved', 'sell');

        -- STATIONERY
        INSERT INTO public.marketplace_items (title, price, category, description, image_url, seller_id, status, listing_type) VALUES
        ('Parker Vector Fountain Pen', 450, 'Stationery', 'Classic design, black ink. Comes with gift box.', 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&q=80&w=800', v_seller_id, 'approved', 'sell'),
        ('Set of 10 Notebooks', 500, 'Stationery', 'Single line, 200 pages each. High-quality paper.', 'https://images.unsplash.com/photo-1531346878377-a5be20888e57?auto=format&fit=crop&q=80&w=800', v_seller_id, 'approved', 'sell'),
        ('Engineering Drawing Board', 1500, 'Stationery', 'A1 size, sturdy wood. Includes parallel bar.', 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&q=80&w=800', v_seller_id, 'approved', 'sell'),
        ('Scientific Instrument Box', 350, 'Stationery', 'Includes compass, protractor, and scales.', 'https://images.unsplash.com/photo-1544640808-32ca72ac7f67?auto=format&fit=crop&q=80&w=800', v_seller_id, 'approved', 'sell'),
        ('Neon Sticky Notes Pack', 150, 'Stationery', '5 colors, 100 sheets each. Extra sticky.', 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&q=80&w=800', v_seller_id, 'approved', 'sell'),
        ('Whiteboard Marker Set', 200, 'Stationery', 'Pack of 4 colors. Refillable.', 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&q=80&w=800', v_seller_id, 'approved', 'sell');

        -- OTHER
        INSERT INTO public.marketplace_items (title, price, category, description, image_url, seller_id, status, listing_type) VALUES
        ('Decathlon Rockrider Cycle', 6500, 'Other', '7 speed gears, front suspension. Used for 1 year.', 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&q=80&w=800', v_seller_id, 'approved', 'sell'),
        ('Non-slip Yoga Mat', 600, 'Other', '6mm thickness, eco-friendly material. Carry strap included.', 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=800', v_seller_id, 'approved', 'sell'),
        ('Badminton Rackets Pair', 1200, 'Other', 'Yonex Muscle Power series. Includes cover and shuttles.', 'https://images.unsplash.com/photo-1613912660100-349079f829f0?auto=format&fit=crop&q=80&w=800', v_seller_id, 'approved', 'sell'),
        ('Prestige Electric Kettle', 900, 'Other', '1.5L capacity, auto cut-off. Great for making tea/maggi.', 'https://images.unsplash.com/photo-1594212699903-ec8a3ecc50f1?auto=format&fit=crop&q=80&w=800', v_seller_id, 'approved', 'sell'),
        ('Adjustable Dumbbells (10kg)', 1800, 'Other', 'Set of 2. Cast iron plates.', 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&q=80&w=800', v_seller_id, 'approved', 'sell'),
        ('Pigeon Induction Cooktop', 2200, 'Other', '7 preset menus, touch control. Efficient cooking.', 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&q=80&w=800', v_seller_id, 'approved', 'sell');
    END IF;
END $$;
