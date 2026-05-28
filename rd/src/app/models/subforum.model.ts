export interface Subforum {
  _id: string;
  id?: string;
  name: string;
  slug?: string;
  description?: string;
  forum: string; 
  createdAt?: Date;
  updatedAt?: Date;
  postCount?: number;
  subscriberCount?: number;
  rules?: string[];
  moderators?: string[];
}

export interface CreateSubforumDto {
  name: string;
  slug?: string;
  description?: string;
  forumId: string; 
}