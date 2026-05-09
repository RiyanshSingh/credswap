export interface Profile {
    id: string;
    full_name: string | null;
    email: string | null;
    avatar_url: string | null;
    bio: string | null;
    college: string | null;
    branch: string | null;
    semester: string | null;
    linkedin?: string | null;
    github?: string | null;
    portfolio?: string | null;
    resume_link?: string | null;
    skills?: string | null;
    headline?: string | null;
    graduation_year?: string | null;
    current_position?: string | null;
    spoken_languages?: string[] | null;
    interests?: string[] | null;
    created_at: string;
}

export interface Note {
    id: string;
    title: string;
    description: string | null;
    category: string;
    subject?: string;
    author?: string;
    college: string | null;
    branch: string | null;
    semester: string | null;
    file_url: string | null;
    downloads: number;
    user_id: string;
    created_at: string;
    status: 'pending' | 'approved' | 'rejected';
    is_deletion_requested: boolean;
    deletion_reason?: string | null;
    type?: string;
    thumbnail?: string;
    rating?: number;
    profiles?: Profile;
}

export interface Event {
    id: string;
    title: string;
    description: string | null;
    date: string;
    time: string;
    venue: string;
    organizer: string;
    organizer_bio?: string;
    category: string;
    image_url: string | null;
    is_featured: boolean;
    user_id: string | null;
    status: 'pending' | 'approved' | 'rejected';

    // New Comprehensive Fields
    subtitle?: string;
    mode?: 'Offline' | 'Online' | 'Hybrid';
    start_date?: string;
    end_date?: string;
    start_time?: string;
    end_time?: string;
    target_audience?: string;
    level?: 'Beginner' | 'Intermediate' | 'Advanced';
    registration_required?: boolean;
    registration_link?: string;
    registration_deadline?: string;
    entry_fee?: string;
    max_participants?: number;
    contact_details?: string;
    guest_speaker?: string;
    prize_details?: string;
    certificate_details?: string;
    sponsors?: string;
    event_stage?: 'Upcoming' | 'Ongoing' | 'Completed';
    hashtags?: string[];

    created_at: string;
    attendees?: number;
    capacity?: number;
}

export interface BlogPost {
    id: string;
    title: string;
    slug: string;
    excerpt?: string | null;
    content: string;
    cover_image_url?: string | null;
    og_image_url?: string | null;
    category?: string | null;
    type?: string | null; // blog | news
    tags?: string[] | null;
    author_name?: string | null;
    author_title?: string | null;
    author_avatar_url?: string | null;
    status?: 'draft' | 'published' | 'archived' | string;
    is_featured?: boolean;
    published_at?: string | null;
    created_at: string;
    updated_at?: string | null;
    seo_title?: string | null;
    seo_description?: string | null;
    canonical_url?: string | null;
    reading_time?: number | null;
    gallery_urls?: string[] | null;
    source_links?: string[] | null;
    views?: number;
}

export interface MarketplaceItem {
    id: string;
    title: string;
    description: string | null;
    price: number;
    category: string;
    image_url: string | null;
    seller_id: string;
    status: 'pending' | 'approved' | 'rejected' | 'sold';
    seller_name?: string;
    seller_email?: string;
    seller_avatar?: string;
    created_at: string;
    profiles?: Profile;
}


export interface Room {
    id: string;
    title: string;
    description: string | null;
    price: number;
    location: string;
    type: string;
    images: string[] | null;
    user_id: string;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    profiles?: Profile;
}

export interface RoadmapEnrollment {
    id: string;
    user_id: string;
    roadmap_id: string;
    enrolled_at: string;
}

export interface RoadmapProgress {
    id: string;
    user_id: string;
    roadmap_id: string;
    video_id: string;
    is_completed: boolean;
    completed_at: string;
    last_watched_at: string;
}
