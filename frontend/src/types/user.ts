import type {Event} from "./event"
type Rsvps = {
  id: string
  userId: string
  eventId: string
  event: Event
  createdAt: string;
}

export type User = {
  id: string;
  email: string;
  name: string;
  username: string;
  avatarUrl: string | null;
  bio: string | null;
  role: "USER" | "MODERATOR" | "ADMIN";
  createdAt: string;
  updatedAt: string;
  rsvps: Rsvps[];
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
  role: "USER" | "MODERATOR" | "ADMIN";
  createdAt: string;
  updatedAt: string;
}