-- Ensure status column exists in notes
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notes' AND column_name = 'status') THEN 
        ALTER TABLE notes ADD COLUMN status text DEFAULT 'pending'; 
    END IF; 
END $$;

-- Clean up existing data to start fresh (optional, but ensures we don't have duplicates)
TRUNCATE TABLE notes, events, tasks CASCADE;

-- Insert Notes (matching mockData.ts but with valid UUIDs and status='approved')
INSERT INTO notes (id, title, subject, author, downloads, rating, semester, type, status, created_at) VALUES 
(gen_random_uuid(), 'Data Structures & Algorithms Complete Notes', 'Computer Science', 'Priya Sharma', 2450, 4.8, 'Sem 3', 'notes', 'approved', now()),
(gen_random_uuid(), 'Engineering Mathematics III', 'Mathematics', 'Rahul Verma', 1890, 4.6, 'Sem 3', 'notes', 'approved', now()),
(gen_random_uuid(), 'Digital Electronics Handwritten Notes', 'Electronics', 'Amit Kumar', 1650, 4.7, 'Sem 4', 'notes', 'approved', now()),
(gen_random_uuid(), 'Operating Systems - All Units', 'Computer Science', 'Sneha Patel', 1420, 4.5, 'Sem 5', 'notes', 'approved', now()),
(gen_random_uuid(), 'DBMS Previous Year Questions 2020-2024', 'Computer Science', 'Vikram Singh', 3200, 4.9, 'Sem 4', 'pyq', 'approved', now()),
(gen_random_uuid(), 'Physics PYQ with Solutions', 'Physics', 'Dr. Anjali Roy', 2100, 4.7, 'Sem 1', 'pyq', 'approved', now()),
(gen_random_uuid(), 'Computer Networks Complete Theory', 'Computer Science', 'Karan Mehta', 1800, 4.6, 'Sem 6', 'notes', 'approved', now()),
(gen_random_uuid(), 'Chemistry PYQ Collection 2019-2024', 'Chemistry', 'Neha Gupta', 1500, 4.4, 'Sem 2', 'pyq', 'approved', now()),
(gen_random_uuid(), 'Machine Learning Fundamentals', 'Computer Science', 'Aditya Joshi', 2800, 4.8, 'Sem 7', 'notes', 'approved', now()),
(gen_random_uuid(), 'Thermodynamics Solved Problems', 'Mechanical', 'Ravi Shankar', 1200, 4.5, 'Sem 3', 'notes', 'approved', now()),
(gen_random_uuid(), 'CAD/CAM PYQ with Solutions', 'Mechanical', 'Suresh Kumar', 980, 4.3, 'Sem 6', 'pyq', 'approved', now()),
(gen_random_uuid(), 'Discrete Mathematics Notes', 'Mathematics', 'Prof. Sharma', 2200, 4.7, 'Sem 2', 'notes', 'approved', now());

-- Insert Events
INSERT INTO events (id, title, date, time, venue, organizer, attendees, category, is_featured, created_at) VALUES
(gen_random_uuid(), 'TechFest 2025 - Annual Tech Festival', '25 Jan', '10:00 AM', 'Main Auditorium, BITS Pilani', 'Tech Club', 450, 'Festival', true, now()),
(gen_random_uuid(), 'Workshop: AI & Machine Learning', '18 Jan', '2:00 PM', 'Computer Lab 3', 'AI Society', 120, 'Workshop', false, now()),
(gen_random_uuid(), 'Hackathon: Code24', '20 Jan', '9:00 AM', 'Innovation Hub', 'Developer Club', 200, 'Hackathon', false, now()),
(gen_random_uuid(), 'Cultural Night: Resonance 2025', '28 Jan', '6:00 PM', 'Open Air Theatre', 'Cultural Committee', 800, 'Cultural', true, now()),
(gen_random_uuid(), 'Guest Lecture: Future of Quantum Computing', '22 Jan', '11:00 AM', 'Lecture Hall 1', 'Physics Society', 150, 'Seminar', false, now()),
(gen_random_uuid(), 'Inter-College Cricket Tournament', '30 Jan', '8:00 AM', 'Sports Ground', 'Sports Committee', 300, 'Sports', false, now()),
(gen_random_uuid(), 'Web Development Bootcamp', '15 Feb', '10:00 AM', 'Seminar Hall B', 'CodeX Club', 80, 'Workshop', false, now()),
(gen_random_uuid(), 'Robotics Competition - RoboWars', '5 Feb', '9:00 AM', 'Engineering Block', 'Robotics Club', 180, 'Competition', false, now()),
(gen_random_uuid(), 'Startup Pitch Competition', '12 Feb', '2:00 PM', 'Entrepreneurship Center', 'E-Cell', 100, 'Competition', false, now());

-- Insert Tasks
INSERT INTO tasks (id, title, description, reward, deadline, difficulty, type, completions, max_completions, created_at) VALUES
(gen_random_uuid(), 'Campus Ambassador Program', 'Represent StudyHub at your college and earn rewards for every referral.', 500, 'Ongoing', 'Easy', 'Offline', 45, 100, now()),
(gen_random_uuid(), 'Content Review Task', 'Review and verify uploaded notes for quality and accuracy.', 150, '2 days left', 'Medium', 'Online', 12, 20, now()),
(gen_random_uuid(), 'Social Media Promotion', 'Share StudyHub on your social media profiles and create engaging content about the platform.', 200, '5 days left', 'Easy', 'Online', 78, 150, now()),
(gen_random_uuid(), 'Video Tutorial Creation', 'Create educational video tutorials explaining complex topics in your field of study.', 1000, '1 week left', 'Hard', 'Online', 5, 15, now()),
(gen_random_uuid(), 'Campus Event Coverage', 'Cover and report on campus events, creating engaging content for our events section.', 350, 'Ongoing', 'Medium', 'Offline', 22, 50, now()),
(gen_random_uuid(), 'Notes Digitization', 'Help digitize handwritten notes by converting them to high-quality digital formats.', 100, '3 days left', 'Easy', 'Online', 30, 40, now()),
(gen_random_uuid(), 'PYQ Solutions Writing', 'Write detailed solutions for previous year question papers with step-by-step explanations.', 500, '1 week left', 'Hard', 'Online', 8, 25, now()),
(gen_random_uuid(), 'Bug Reporting & Feedback', 'Test the platform thoroughly and report bugs or provide constructive feedback for improvements.', 75, 'Ongoing', 'Easy', 'Online', 45, 100, now());
