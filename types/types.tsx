export type Report = {
  title: string;
  sourceUrl: string;
  sourceType: ClaimSource;
  userDescription: string; // false reason
  supportingEvidence: string;
};

// post for the detailed page
export type Post = {
  id: number;
  title: string;
  sourceType: ClaimSource;
  sourceUrl: string;
  imgUrl: string;
  credibility: string;
  transparency: string;
  aiSummary: string;
  score: number;
  time: Date;
  comments: Comment[];
};

export type Comment = {
  user: User;
  userDescription: string | null;
  supportingEvidence: string | null;
  comment: string | null;
};

export type User = {
  id: number;
  name: string;
};

// for listing page
export type Categories = {
  category: Category;
  totalPostCount: number;
  posts: Post[];
};

export type Category = {
  id: number;
  slug: string;
  name: string;
};

// type for home page popular claim (summaries of popular posts)
export type PopularClaim = {
  title: string;
  imgUrl: string;
  posts: Post[];
};

export enum ClaimSource {
  TIKTOK = 'TIKTOK',
  X = 'X',
  FACEBOOK = 'FACEBOOK',
}

// For listing page
export type TrendingTopic = {
  title: string;
  imgUrl: string;
  susCount: number;
};
