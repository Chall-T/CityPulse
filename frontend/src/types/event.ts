
import type { Category } from './category';

export type Creator = {
  id: string;
  name: string;
  username: string;
  avatarUrl: string | null;
};

type Coords = {
  type: string
  coordinates: [number, number]
}

export type Event = {
  id: string;
  status: 'ACTIVE' | 'CANCELD';
  title: string;
  description: string;
  imageUrl: string | null;
  dateTime: string;
  capacity: number | null;
  location: string;
  createdAt: string;
  categories: Category[];
  creator?: Creator;
  coords?: Coords;
};

export type EventCreate = {
  title: string;
  description: string;
  imageUrl: string | null;
  dateTime: string;
  lat: number | null;
  lng: number | null;
  capacity: number | null;
  location: string;
  categoryIds: string[];
};

export type ClusterPin = {
  geohash: string;
  count: number;
  lat: number;
  lng: number;
};

export type MapPin = {
  id: string;
  lat: number;
  lng: number;
}