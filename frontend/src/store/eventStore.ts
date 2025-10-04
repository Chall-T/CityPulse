import { create } from 'zustand';
import type { Category } from '../types/category';
import type { Event, ClusterPin, MapPin } from '../types';
import { apiClient } from '../lib/ApiClient';


type DateRange = {
    from: string;
    to: string;
};

type EventStore = {
    events: Event[];
    loading: boolean;
    nextCursor: string | null;
    fetchEvents: (reset?: boolean, filters?: { categoryIds?: string[]; search?: string; sort?: 'desc' | 'asc' | 'score', fromDate?: string, toDate?: string }) => Promise<void>;
    fetchEventById: (id: string) => Promise<Event | null>;
    reset: () => void;
};

export const useEventStore = create<EventStore>((set, get) => ({
    events: [],
    loading: false,
    nextCursor: null,

    fetchEvents: async (
        reset = false,
        filters?: { categoryIds?: string[]; search?: string; sort?: 'desc' | 'asc' | 'score', fromDate?: string, toDate?: string }
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
    fetchEventById: async (id: string) => {
        const { events } = get();

        const existing = events.find(event => event.id === id);
        if (existing) return existing;

        try {
            const response = await apiClient.getEventById(id);
            const event = response.data;

            set({ events: [...events, event] });
            return event;
        } catch (error) {
            console.error(`Failed to fetch event with ID: ${id}`, error);
            return null;
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




type SortOption = 'desc' | 'asc' | 'score';

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

export interface ClusterPinWithZoom extends ClusterPin {
    zoom: number;
}

type ClusterStore = {
    clusters: ClusterPinWithZoom[];
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
const getClusterKey = (cluster: ClusterPin): string => {
    return `${cluster.lat}_${cluster.lng}_${cluster.geohash ?? ''}`;
};



export const useClusterStore = create<ClusterStore>((set, get) => ({
    clusters: [],
    loading: false,
    fetchedAreas: new Set<string>(),
    categoriesFilter: [],

    fetchClusters: async ({ minLat, maxLat, minLng, maxLng, zoom, categoryIds, force = false }) => {
        const boundsKey = generateBoundsKey(minLat, maxLat, minLng, maxLng, zoom, categoryIds);
        const { fetchedAreas, clusters } = get();

        if (!force && fetchedAreas.has(boundsKey)) return;

        set({ loading: true });

        try {
            const params: any = {
                minLat: Number(minLat),
                maxLat: Number(maxLat),
                minLng: Number(minLng),
                maxLng: Number(maxLng),
            };

            if (categoryIds?.length) {
                params.categoryIds = categoryIds.join(',');
            }

            const res = await apiClient.getEventsCluster(params);
            const newClusters = res.data?.clusters ?? [];

            const clusterMap = new Map<string, ClusterPinWithZoom>();

            // Keep only clusters at current zoom level
            for (const cluster of clusters) {
                if (cluster.zoom !== zoom) continue;
                const key = getClusterKey(cluster);
                clusterMap.set(key, cluster);
            }

            // Add/overwrite with new clusters
            for (const cluster of newClusters) {
                const key = getClusterKey(cluster);
                clusterMap.set(key, cluster);
            }

            set({
                clusters: Array.from(clusterMap.values()),
                loading: false,
                fetchedAreas: new Set([...fetchedAreas, boundsKey]),
            });
        } catch (error) {
            console.error('Failed to fetch clusters', error);
            set({ loading: false });
        }
    },

    setCategoriesFilter: (categories) => {
        set({
            categoriesFilter: categories,
            clusters: [],
            fetchedAreas: new Set(),
        });
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



type MapPinsStore = {
    pins: MapPin[];
    loading: boolean;
    fetchedAreas: FetchedArea[];
    currentBounds: Bounds | null;
    fetchPins: (params: FetchParams) => Promise<void>;
    reset: () => void;
};

type Bounds = {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
};

type FetchedArea = {
    bounds: Bounds;
    categoryIds: string[];
};

type FetchParams = Bounds & {
    categoryIds?: string[];
    force?: boolean;
    fromDate?: string;
    toDate?: string
};



function subtractAreas(
    requested: Bounds,
    fetchedAreas: FetchedArea[],
    currentCategoryIds: string[]
): Bounds[] {
    // Filter fetchedAreas by matching categoryIds exactly (order-independent)
    const requestedCatKey = currentCategoryIds.slice().sort().join(',');

    const matchingAreas = fetchedAreas.filter(area =>
        area.categoryIds.slice().sort().join(',') === requestedCatKey
    );

    // Start with full requested area as missing
    let missingAreas: Bounds[] = [requested];

    // For each fetched area, subtract its bounds from all missing areas
    for (const fetched of matchingAreas) {
        const newMissing: Bounds[] = [];

        for (const area of missingAreas) {
            // Calculate overlap
            const overlapMinLat = Math.max(area.minLat, fetched.bounds.minLat);
            const overlapMaxLat = Math.min(area.maxLat, fetched.bounds.maxLat);
            const overlapMinLng = Math.max(area.minLng, fetched.bounds.minLng);
            const overlapMaxLng = Math.min(area.maxLng, fetched.bounds.maxLng);

            const overlaps = overlapMinLat < overlapMaxLat && overlapMinLng < overlapMaxLng;

            if (!overlaps) {
                // No overlap, keep whole area
                newMissing.push(area);
                continue;
            }

            // Cut out overlap rectangle from area, resulting in up to 4 rectangles:

            // Top strip
            if (area.minLat < overlapMinLat) {
                newMissing.push({
                    minLat: area.minLat,
                    maxLat: overlapMinLat,
                    minLng: area.minLng,
                    maxLng: area.maxLng,
                });
            }

            // Bottom strip
            if (area.maxLat > overlapMaxLat) {
                newMissing.push({
                    minLat: overlapMaxLat,
                    maxLat: area.maxLat,
                    minLng: area.minLng,
                    maxLng: area.maxLng,
                });
            }

            // Left strip
            if (area.minLng < overlapMinLng) {
                newMissing.push({
                    minLat: Math.max(area.minLat, overlapMinLat),
                    maxLat: Math.min(area.maxLat, overlapMaxLat),
                    minLng: area.minLng,
                    maxLng: overlapMinLng,
                });
            }

            // Right strip
            if (area.maxLng > overlapMaxLng) {
                newMissing.push({
                    minLat: Math.max(area.minLat, overlapMinLat),
                    maxLat: Math.min(area.maxLat, overlapMaxLat),
                    minLng: overlapMaxLng,
                    maxLng: area.maxLng,
                });
            }
        }

        missingAreas = newMissing;
    }

    return missingAreas;
}


export const useMapPinsStore = create<MapPinsStore>((set, get) => ({
  pins: [],
  loading: false,
  fetchedAreas: [], // Array now
  currentBounds: null,

  fetchPins: async (params) => {
    const { minLat, maxLat, minLng, maxLng, categoryIds, force = false, fromDate, toDate } = params;
    const bounds = { minLat, maxLat, minLng, maxLng };
    const { fetchedAreas, pins: existingPins } = get();
    set({ currentBounds: bounds });

    // fetchedAreas is already an array, no need to convert
    const areasToFetch = force
      ? [bounds]
      : subtractAreas(bounds, fetchedAreas, categoryIds || []);
    console.log("areas to fetch:");
    console.table(areasToFetch);

    if (areasToFetch.length === 0) return;

    set({ loading: true });

    try {
      const allNewPins: MapPin[] = [];

      for (const area of areasToFetch) {
        const fetchParams: any = {
          minLat: Number(area.minLat),
          maxLat: Number(area.maxLat),
          minLng: Number(area.minLng),
          maxLng: Number(area.maxLng),
        };

        if (categoryIds?.length) {
          fetchParams.categoryIds = categoryIds.join(',');
        }
        if (fromDate) fetchParams.fromDate = fromDate;
        if (toDate) fetchParams.toDate = toDate;
        const res = await apiClient.getMapPins(fetchParams);
        const newPins = res.data?.pins ?? [];
        allNewPins.push(...newPins);
      }

      // Merge new pins with existing ones, removing duplicates
      const pinMap = new Map<string, MapPin>();
      existingPins.forEach(pin => pinMap.set(pin.id, pin));
      allNewPins.forEach(pin => pinMap.set(pin.id, pin));
      const newPinsArray = Array.from(pinMap.values());

      // Append newly fetched areas to fetchedAreas array
      const newFetchedAreas = [...fetchedAreas];
      areasToFetch.forEach(area => {
        newFetchedAreas.push({ bounds: area, categoryIds: categoryIds || [] });
      });

      const pinsChanged = newPinsArray.length !== existingPins.length ||
        newPinsArray.some((pin, i) => pin.id !== existingPins[i]?.id);

      if (pinsChanged) {
        set({
          pins: newPinsArray,
          fetchedAreas: newFetchedAreas,
          loading: false,
        });
      } else {
        set({ loading: false, fetchedAreas: newFetchedAreas });
      }
    } catch (error) {
      console.error('Failed to fetch pins', error);
      set({ loading: false });
    }
  },

  reset: () => {
    set({
      pins: [],
      loading: false,
      fetchedAreas: [],
    });
  },
}));
