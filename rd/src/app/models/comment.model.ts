export interface Comment {
  _id: string;
  content: string;
  author: {
    _id: string;
    username: string;
    roles?: string[];
  };
  post: string;
  parentComment: string | null;
  upvotes: string[];
  downvotes: string[];
  createdAt: string;
}

export interface CommentsResponse {
  totalComments: number;
  currentPage: number;
  totalPages: number;
  comments: Comment[];
}

export interface CreateCommentRequest {
  content: string;
  postId: string;
  parentComment?: string;
}

export interface VoteResponse {
  message: string;
  upvotes: number;
  downvotes: number;
}