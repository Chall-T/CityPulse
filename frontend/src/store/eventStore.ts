import { create } from 'zustand';
import { api } from '../lib/axios';

export type Category = {
    id: string;
    name: string;
    emoji?: string;

};

export type Event = {
    id: string;
    title: string;
    description: string;
    imageUrl?: string;
    dateTime: string;
    location: string;
    categories: Category[];
};

type EventStore = {
    events: Event[];
    nextCursor: number | null;
    loading: boolean;
    fetchEvents: () => Promise<void>;
};

export const useEventStore = create<EventStore>((set) => ({
    events: [],
    loading: false,
    nextCursor: null,
    fetchEvents: async () => {
        set({ loading: true });
        try {
            const response = await api.get('/events');
            set({ events: response.data.data, loading: false, nextCursor: response.data.nextCursor });
        } catch (error) {
            console.error('Failed to fetch events', error);
            set({ loading: false });
        }
    },
}));