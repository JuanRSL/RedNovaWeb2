export interface User {
  _id: string;
  id?: string;
  username: string;
  email: string;
  roles: string[];
  followingUsers: string[];
  followingSubforums: string[];
  followingForums: string[];
  moderatedSubforums: string[];
  moderatedPosts: string[];
  moderatedComments: string[];
  createdAt: string;
  updatedAt: string;
}

export interface UserSummary {
  _id: string;
  username: string;
  roles?: string[];
}

export interface AuthResponse {
  message: string;
  token: string;
  user: {
    id: string;
    username: string;
    email: string;
    roles: string[];
  };
}

export interface LoginRequest {
  identifier: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  roles?: string[];
}

export interface UpdateProfileRequest {
  email?: string;
  currentPassword?: string;
  newPassword?: string;
}

export interface FollowResponse {
  message: string;
}
