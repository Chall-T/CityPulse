

export type User = {
  id: string;
  email: string;
  name: string;
  username: string;
  avatarUrl: string | null;
  bio: string | null;
  createdAt: string;
  updatedAt: string;
};

export type UpdateUser = {
  name: string;
  username: string;
  avatarUrl: string | null;
  bio: string | null;
};

export type SafeUser = {
  id: string;
  name: string;
  username: string;
  avatarUrl: string | null;
  bio: string | null;
  createdAt: string;
  updatedAt: string;
}