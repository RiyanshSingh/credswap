export interface Roadmap {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  estimated_time: string;
  icon: string;
  slug: string;
  created_at: string;
  updated_at?: string;
  prerequisites?: string[] | string | null;
  skills_gained?: string[] | string | null;
  semesters?: string[];
}

export interface RoadmapSection {
  id: string;
  roadmap_id: string;
  section_title: string;
  section_order: number;
  created_at: string;
}

export interface RoadmapVideo {
  id: string;
  roadmap_id: string;
  section_id: string | null;
  title: string;
  youtube_link: string;
  thumbnail: string;
  duration: string;
  channel: string;
  video_order: number;
  created_at: string;
}
