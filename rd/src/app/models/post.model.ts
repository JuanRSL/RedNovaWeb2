export interface Post {
  id: string;

  title: string;
  content: string;

  author: {
    id: string;
    username: string;
  };

  forum: {
    id: string;
    name: string;
    slug?: string;
    description?: string;
  };

  subforum: {
    id: string;
    name: string;
    slug?: string;
    description?: string;
  };

  comments: string[];
  upvotes: string[];
  downvotes: string[];

  score: number;
  createdAt: string;
}