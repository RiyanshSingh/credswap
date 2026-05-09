-- COMMUNITY & CLUBS FEATURE

-- 1. Create Communities Table (Colleges, Clubs, Groups)
CREATE TABLE IF NOT EXISTS communities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    type TEXT CHECK (type IN ('college', 'club', 'branch')) NOT NULL,
    description TEXT,
    image_url TEXT,
    members_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(name, type) -- Prevent duplicates
);

-- 2. Create Community Posts Table
CREATE TABLE IF NOT EXISTS community_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    image_url TEXT,
    likes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;

-- Policies
-- Communities are public to view
CREATE POLICY "Public can view communities" 
ON communities FOR SELECT 
USING (true);

-- Posts are public to view (for now, or restrict to members later)
CREATE POLICY "Public can view community posts" 
ON community_posts FOR SELECT 
USING (true);

-- Authenticated users can create posts
CREATE POLICY "Authenticated users can create posts" 
ON community_posts FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 3. Seed Data
INSERT INTO communities (name, type, description, members_count) VALUES
-- Colleges (Bhopal)
('Acropolis Institute of Technology & Research, Bhopal', 'college', 'Official community for Acropolis Institute students.', 120),
('All Saints College of Engineering, Bhopal', 'college', 'Connect with peers from All Saints Engineering.', 85),
('All Saints College of Technology, Bhopal', 'college', 'Official group for All Saints Tech students.', 90),
('Bansal College of Engineering, Mandideep, Bhopal', 'college', 'Community for Bansal College of Engineering.', 150),
('Bansal Institute of Research & Technology, Bhopal', 'college', 'Research and Tech community for Bansal Institute.', 110),
('Bansal Institute of Science & Technology, Bhopal', 'college', 'Science & Tech group for Bansal Institute.', 130),
('Bhabha Engineering Research Institute, Bhopal', 'college', 'Official community for Bhabha Engineering.', 95),
('Bhopal Institute of Technology, Bangrasia, Bhopal', 'college', 'Connect with BIT Bangrasia students.', 80),
('Bhopal Institute of Technology & Science, Bhojpur Road, Bhopal', 'college', 'BIT Science & Tech community.', 100),
('Central Institute of Agricultural Engineering, Berasia Road, Bhopal', 'college', 'CIAE Student Community.', 70),
('Central Institute of Plastic Engineering & Technology, Bhopal', 'college', 'CIPET Bhopal Official Group.', 65),
('Crescent College of Technology, Nabi Bagh, Bhopal', 'college', 'Crescent College Student Community.', 60),
('Globus Engineering College, Bhojpur Road, Bhopal', 'college', 'Globus Engineering Official Group.', 75),
('Gyan Ganga Institute of Technology & Management, Raisen Road, Bhopal', 'college', 'Gyan Ganga ITM Community.', 140),
('IES College of Technology, Ratibad, Bhopal', 'college', 'IES College Official Group.', 200),
('JN College of Technology, Chouksey Nagar, Bhopal', 'college', 'JNCT Student Community.', 110),
('Lakshminarayan College of Technology & Science, Raisen Road, Bhopal', 'college', 'LNCTS Official Community.', 300),
('Lakshminarayan College of Technology, Bhopal', 'college', 'LNCT Main Campus Community.', 450),
('Maulana Azad National Institute of Technology, Bhopal', 'college', 'MANIT Bhopal Official Community.', 600),
('NRI Institute of Information Science & Technology, Raisen Road, Bhopal', 'college', 'NIIST Student Group.', 180),
('Oriental Institute of Science & Technology, Bhopal', 'college', 'OIST Bhopal Community.', 350),
('Patel College of Science & Technology, Ratibad, Bhopal', 'college', 'Patel College Official Group.', 120),
('Radharaman Engineering College, Ratibad, Bhopal', 'college', 'REC Bhopal Community.', 160),
('Radharaman Institute of Technology & Science, Ratibad, Bhopal', 'college', 'RITS Student Group.', 140),
('Rajeev Gandhi Prodyogiki Mahavidyalaya, Kolar Road, Bhopal', 'college', 'RGPM Official Community.', 90),
('RKDF College of Engineering, Misrod Bhopal Road, Bhopal', 'college', 'RKDF Engineering Group.', 110),
('RKDF Institute of Science & Technology, Misrod, Bhopal', 'college', 'RKDF Sci & Tech Community.', 100),
('Sagar Institute of Research & Technology, Bhopal', 'college', 'SIRT Bhopal Official Community.', 250),
('Shree Institute of Science & Technology, Abbas Nagar, Bhopal', 'college', 'SIST Student Group.', 80),
('Swami Vivekanand College of Science & Technology, Bhopal', 'college', 'SVCST Official Community.', 95),
('Technocrats Institute of Technology, Bhel, Bhopal', 'college', 'TIT Bhopal Student Group.', 400),
('Thakral College of Technology, Patel Nagar, Bhopal', 'college', 'Thakral College Community.', 85),
('Truba Institute of Engineering & Information Technology, Bhopal', 'college', 'Truba Institute Official Group.', 170),
('VNS Institute of Technology, Vidya Vihar Barkheda Nathu, Bhopal', 'college', 'VNSIT Student Community.', 90),

-- Clubs
('Coding Club', 'club', 'For algorithms, development, and hackathons.', 500),
('Robotics Club', 'club', 'Building the future with bots and automation.', 250),
('Literary Society', 'club', 'For poets, writers, and debate enthusiasts.', 180),
('Sports Club', 'club', 'Cricket, Football, and general fitness.', 300),
('Photography Club', 'club', 'Capturing moments and mastering lenses.', 150),
('Entrepreneurship Cell', 'club', 'Fostering innovation and startups.', 220)

ON CONFLICT (name, type) DO UPDATE 
SET description = EXCLUDED.description;
