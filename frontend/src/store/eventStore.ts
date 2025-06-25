import { create } from 'zustand';
import type { Category } from '../types/category';
import type { Event, ClusterPin } from '../types';
import { apiClient } from '../lib/ApiClient';
import { includes } from 'lodash';


type DateRange = {
    from: string;
    to: string;
};

type EventStore = {
    events: Event[];
    loading: boolean;
    nextCursor: string | null;
    fetchEvents: (reset?: boolean, filters?: { categoryIds?: string[]; search?: string; sort?: 'desc' | 'asc', fromDate?: string, toDate?: string }) => Promise<void>;
    reset: () => void;
};

export const useEventStore = create<EventStore>((set, get) => ({
    events: [],
    loading: false,
    nextCursor: null,

    fetchEvents: async (
        reset = false,
        filters?: { categoryIds?: string[]; search?: string; sort?: 'desc' | 'asc', fromDate?: string, toDate?: string }
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
            if (filters?.categoryIds && filters.categoryIds.length > 0) params.categoryIds = filters.categoryIds.join(',');
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
    reset: () => set({
        events: [],
        loading: false,
        nextCursor: null,
    }),
}
)
);




type SortOption = 'desc' | 'asc';

type FilterParams = 
    'categoryIds' |
    'search' |
    'sort' |
    'fromDate' |
    'toDate' 


type FilterStore = {
    categories: Category[];
    selectedCategories: string[];
    search: string;
    sort: SortOption;
    loading: boolean;
    dateRange: DateRange;
    searchFilter: string;
    setDateRangeFilter: (range: DateRange) => void;
    fetchCategories: () => Promise<void>;
    toggleCategory: (id: string) => void;
    setSearch: (value: string) => void;
    setSelectedCategories: (categories: string[]) => void,
    setSort: (value: SortOption) => void;
    setSearchFilter: (search: string) => void;
    getParamString: (params: FilterParams[]) => string;
    reset: () => void;
};


export const useFilterStore = create<FilterStore>((set, get) => ({
    categories: [],
    selectedCategories: [],
    search: '',
    sort: 'desc',
    loading: false,
    dateRange: { from: "", to: "" },
    searchFilter: '',

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
    setDateRangeFilter: (range) => set({ dateRange: range }),
    setSearchFilter: (search) => {
        set({ searchFilter: search });
    },
    getParamString: (params: FilterParams[]) => {
        const { selectedCategories, search, sort, dateRange } = get();
        const paramString: Record<string, string> = {};
        if (params.includes('categoryIds') && selectedCategories.length > 0) {
            paramString.categoryIds = selectedCategories.join(',');
        }
        if (params.includes('search') && search.trim()) {
            paramString.search = search.trim();
        }
        if (params.includes('sort') && sort) {
            paramString.sort = sort;
        }
        if (params.includes('fromDate') && dateRange.from) {
            paramString.fromDate = dateRange.from;
        }
        if (params.includes('toDate') && dateRange.to) {
            paramString.toDate = dateRange.to;
        }
        const queryString = new URLSearchParams(paramString).toString();
        return queryString ? `?${queryString}` : "";
    },
    reset: () => set({
        categories: [],
        selectedCategories: [],
        search: '',
        sort: 'desc',
        loading: false,
        dateRange: { from: "", to: "" },
        searchFilter: '',
    }),
}));


type ClusterStore = {
    clusters: ClusterPin[];
    loading: boolean;
    fetchedAreas: Set<string>;
    categoriesFilter: string[];
    fetchClusters: (params: {
        minLat: number;
        maxLat: number;
        minLng: number;
        maxLng: number;
        zoom: number;
        categoryIds?: string[];
        force?: boolean;
    }) => Promise<void>;
    setCategoriesFilter: (categories: string[]) => void;
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
    categoriesFilter: [],

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
    setCategoriesFilter: (categories) => {
        set({ categoriesFilter: categories, clusters: [], fetchedAreas: new Set() });
    },
    reset: () => {
        set({
            clusters: [],
            loading: false,
            fetchedAreas: new Set(),
            categoriesFilter: [],
        });
    },
}));