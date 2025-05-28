import { create } from 'zustand';
import type { Category } from '../types/category';
import type { Event } from '../types';
import { apiClient } from '../lib/ApiClient';




type EventStore = {
    events: Event[];
    loading: boolean;
    nextCursor: string | null;
    categoriesFilter: string[];
    searchFilter: string;
    fetchEvents: (reset?: boolean, filters?: { categories?: string[]; search?: string; sort?: 'desc' | 'asc' } ) => Promise<void>;
    setCategoriesFilter: (categories: string[]) => void;
    setSearchFilter: (search: string) => void;
};

export const useEventStore = create<EventStore>((set, get) => ({
    events: [],
    loading: false,
    nextCursor: null,
    categoriesFilter: [],
    searchFilter: '',

    fetchEvents: async (
        reset = false,
        filters?: { categories?: string[]; search?: string; sort?: 'desc' | 'asc' }
    ) => {
        // inside fetchEvents
        const { nextCursor, events } = get();
        console.log('Fetching events with filters:', filters);
        if (reset) {
            set({ loading: true, nextCursor: null, events: [] });
        } else if (!nextCursor && events.length > 0) {
            return;
        } else {
            set({ loading: true });
        }

        try {
            const params: any = { limit: 20 };

            if (!reset && nextCursor) params.cursor = nextCursor;
            if (filters?.categories && filters.categories.length > 0) params.categories = filters.categories.join(',');
            if (filters?.search && filters.search.trim()) params.search = filters.search.trim();
            if (filters?.sort) params.sort = filters.sort;

            const response = await apiClient.getEvents(params);
            const newEvents = response.data.data;
            const newCursor = response.data.nextCursor;

            set({
                events: reset ? newEvents : [...events, ...newEvents],
                nextCursor: newCursor,
                loading: false,
            });
        } catch (error) {
            console.error('Failed to fetch events', error);
            set({ loading: false });
        }
    },

    setCategoriesFilter: (categories) => {
        set({ categoriesFilter: categories, nextCursor: null, events: [] });
    },

    setSearchFilter: (search) => {
        set({ searchFilter: search, nextCursor: null, events: [] });
    },
}
)
);




type SortOption = 'desc' | 'asc';

type FilterStore = {
    categories: Category[];
    selectedCategories: string[];
    search: string;
    sort: SortOption;
    loading: boolean;
    fetchCategories: () => Promise<void>;
    toggleCategory: (id: string) => void;
    setSearch: (value: string) => void;
    setSelectedCategories: (categories: string[]) => void,
    setSort: (value: SortOption) => void;
    clearFilters: () => void;
};

export const useFilterStore = create<FilterStore>((set, get) => ({
    categories: [],
    selectedCategories: [],
    search: '',
    sort: 'desc',
    loading: false,

    fetchCategories: async () => {
        set({ loading: true });
        try {
            const res = await apiClient.getCategories();
            set({ categories: res.data, loading: false });
        } catch (err) {
            console.error('Failed to fetch categories:', err);
            set({ loading: false });
        }
    },

    toggleCategory: (id) => {
        const { selectedCategories } = get();
        set({
            selectedCategories: selectedCategories.includes(id)
                ? selectedCategories.filter((c) => c !== id)
                : [...selectedCategories, id],
        });
    },
    setSelectedCategories: (categories: string[]) => {
        set({ selectedCategories: categories });
    },

    setSearch: (value) => set({ search: value }),
    setSort: (value) => set({ sort: value }),
    clearFilters: () =>
        set({
            selectedCategories: [],
            search: '',
            sort: 'desc',
        }),
}));
