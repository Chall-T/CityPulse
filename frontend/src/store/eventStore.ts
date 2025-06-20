import { create } from 'zustand';
import type { Category } from '../types/category';
import type { Event, ClusterPin } from '../types';
import { apiClient } from '../lib/ApiClient';


type DateRange = {
    from: string;
    to: string;
};

type EventStore = {
    events: Event[];
    loading: boolean;
    nextCursor: string | null;
    categoriesFilter: string[];
    searchFilter: string;
    dateRange: DateRange;
    setDateRangeFilter: (range: DateRange) => void;
    fetchEvents: (reset?: boolean, filters?: { categories?: string[]; search?: string; sort?: 'desc' | 'asc', fromDate?: string, toDate?: string }) => Promise<void>;
    setCategoriesFilter: (categories: string[]) => void;
    setSearchFilter: (search: string) => void;
    reset: () => void;
};

export const useEventStore = create<EventStore>((set, get) => ({
    events: [],
    loading: false,
    nextCursor: null,
    categoriesFilter: [],
    searchFilter: '',
    dateRange: { from: "", to: "" },

    fetchEvents: async (
        reset = false,
        filters?: { categories?: string[]; search?: string; sort?: 'desc' | 'asc', fromDate?: string, toDate?: string }
    ) => {
        // inside fetchEvents
        const { nextCursor, events } = get();
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
            if (filters?.fromDate) params.fromDate = filters.fromDate;
            if (filters?.toDate) params.toDate = filters.toDate;

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
    setDateRangeFilter: (range) => set({ dateRange: range }),
    reset: () => set({
        events: [],
        loading: false,
        nextCursor: null,
        categoriesFilter: [],
        searchFilter: '',
        dateRange: { from: '', to: '' },
    }),
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
    reset: () => void;
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
    reset: () => set({
        categories: [],
        selectedCategories: [],
        search: '',
        sort: 'desc',
        loading: false,
    }),
}));


type ClusterStore = {
    clusters: ClusterPin[];
    loading: boolean;
    fetchedAreas: Set<string>;
    fetchClusters: (params: {
        minLat: number;
        maxLat: number;
        minLng: number;
        maxLng: number;
        zoom: number;
        categoryIds?: string[];
        force?: boolean;
    }) => Promise<void>;
    reset: () => void;
};



function generateBoundsKey(
    minLat: number,
    maxLat: number,
    minLng: number,
    maxLng: number,
    zoom: number,
    categoryIds?: string[]
): string {
    const catKey = categoryIds?.sort().join(',') || '';
    return `${minLat.toFixed(2)}-${maxLat.toFixed(2)}:${minLng.toFixed(2)}-${maxLng.toFixed(2)}@z=${zoom}|cats=${catKey}`;
}

export const useClusterStore = create<ClusterStore>((set, get) => ({
    clusters: [],
    loading: false,
    fetchedAreas: new Set(),

    fetchClusters: async ({ minLat, maxLat, minLng, maxLng, zoom, categoryIds, force = false }) => {
        const key = generateBoundsKey(minLat, maxLat, minLng, maxLng, zoom, categoryIds);
        const { fetchedAreas } = get();

        if (!force && fetchedAreas.has(key)) {
            return;
        }

        try {
            const params: any = {
                minLat: Number(minLat),
                maxLat: Number(maxLat),
                minLng: Number(minLng),
                maxLng: Number(maxLng),
                categoryIds: [],
                zoom: Number(zoom),
            };

            if (categoryIds && categoryIds.length > 0) params.categoryIds = categoryIds.join(',');
            if (zoom) params.zoom = zoom;

            const res = await apiClient.getEventsCluster(params);
            const existingClusters = get().clusters;

            set({
                clusters: [...existingClusters, ...res.data],
                loading: false,
                fetchedAreas: new Set([...fetchedAreas, key]),
            });
        } catch (error) {
            console.error('Failed to fetch clusters', error);
            set({ loading: false });
        }
    },

    reset: () => {
        set({
            clusters: [],
            loading: false,
            fetchedAreas: new Set(),
        });
    },
}));