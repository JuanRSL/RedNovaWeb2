import { UserSummary } from './user.model';

export interface Subforum {
  id: string;

  name: string;
  slug: string;
  description?: string;

  forum: {
    id: string;
    name?: string;
  };

  moderators: UserSummary[];
  followers: UserSummary[];

  rules: string[];

  isPrivate: boolean;

  createdAt: string;
}