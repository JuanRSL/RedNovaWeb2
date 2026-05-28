export interface Forum {
  _id: string;
  name: string;
  slug: string;
  description: string;
  moderators: string[]; // User IDs
  subforums: Array<{
    _id: string;
    name: string;
    slug: string;
    description: string;
  }>;
  isPrivate: boolean;
  createdAt: string;
}

export interface CreateForumRequest {
  name: string;
  slug: string;
  description?: string;
  isPrivate?: boolean;
}