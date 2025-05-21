
import type { Category } from './category';

export type Creator = {
  id: string;
  name: string;
  username: string;
  avatarUrl: string | null;
};

export type Event = {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
  dateTime: string;
  location: string;
  createdAt: string;
  categories: Category[];
  creator?: Creator;
};

