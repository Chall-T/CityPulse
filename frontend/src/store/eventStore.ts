import { create } from 'zustand';
import type { Category } from '../types/category';
import type { Event, ClusterPin, MapPin } from '../types';
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
    fetchedAreas: Map<string, { bounds: Bounds; categoryIds: string[] }>;
    categoriesFilter: string[];
    fetchPins: (params: FetchParams) => Promise<void>;
    setCategoriesFilter: (categories: string[]) => void;
    reset: () => void;
};

type Bounds = {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
};

type FetchParams = Bounds & {
    categoryIds?: string[];
    force?: boolean;
};

function boundsToKey(bounds: Bounds, categoryIds?: string[]): string {
    const catKey = categoryIds?.sort().join(',') || '';
    return `${bounds.minLat.toFixed(2)}-${bounds.maxLat.toFixed(2)}:${bounds.minLng.toFixed(2)}-${bounds.maxLng.toFixed(2)}@cats=${catKey}`;
}

function getMissingAreas(
    requested: Bounds,
    existingAreas: { bounds: Bounds; categoryIds: string[] }[],
    currentCategoryIds?: string[]
): Bounds[] {
    if (!existingAreas.length || !currentCategoryIds) return [requested];

    const requestedKey = currentCategoryIds.sort().join(',');
    const matchingAreas = existingAreas.filter(
        area => area.categoryIds.sort().join(',') === requestedKey
    );

    if (!matchingAreas.length) return [requested];

    let missingAreas: Bounds[] = [requested];

    for (const fetched of matchingAreas) {
        const nextMissing: Bounds[] = [];

        for (const area of missingAreas) {
            // No overlap at all? Keep this area.
            const doesNotOverlap =
                fetched.bounds.maxLat <= area.minLat ||
                fetched.bounds.minLat >= area.maxLat ||
                fetched.bounds.maxLng <= area.minLng ||
                fetched.bounds.minLng >= area.maxLng;

            if (doesNotOverlap) {
                nextMissing.push(area);
                continue;
            }

            // Break the remaining area into parts outside the fetched one
            const { minLat, maxLat, minLng, maxLng } = area;

            // Top strip
            if (fetched.bounds.minLat > minLat) {
                nextMissing.push({
                    minLat,
                    maxLat: Math.min(fetched.bounds.minLat, maxLat),
                    minLng,
                    maxLng,
                });
            }

            // Bottom strip
            if (fetched.bounds.maxLat < maxLat) {
                nextMissing.push({
                    minLat: Math.max(fetched.bounds.maxLat, minLat),
                    maxLat,
                    minLng,
                    maxLng,
                });
            }

            // Left strip
            if (fetched.bounds.minLng > minLng) {
                const stripMinLat = Math.max(minLat, fetched.bounds.minLat);
                const stripMaxLat = Math.min(maxLat, fetched.bounds.maxLat);
                if (stripMinLat < stripMaxLat) {
                    nextMissing.push({
                        minLat: stripMinLat,
                        maxLat: stripMaxLat,
                        minLng,
                        maxLng: fetched.bounds.minLng,
                    });
                }
            }

            // Right strip
            if (fetched.bounds.maxLng < maxLng) {
                const stripMinLat = Math.max(minLat, fetched.bounds.minLat);
                const stripMaxLat = Math.min(maxLat, fetched.bounds.maxLat);
                if (stripMinLat < stripMaxLat) {
                    nextMissing.push({
                        minLat: stripMinLat,
                        maxLat: stripMaxLat,
                        minLng: fetched.bounds.maxLng,
                        maxLng,
                    });
                }
            }
        }

        missingAreas = nextMissing;
    }

    return missingAreas;
}

export const useMapPinsStore = create<MapPinsStore>((set, get) => ({
    pins: [],
    loading: false,
    fetchedAreas: new Map(),
    categoriesFilter: [],

    fetchPins: async (params) => {
        const { minLat, maxLat, minLng, maxLng, categoryIds, force = false } = params;
        const bounds = { minLat, maxLat, minLng, maxLng };
        const { fetchedAreas, pins: existingPins } = get();
        console.log("really fetching pins for bounds:", bounds, "with categories:", categoryIds);
        // Convert existing fetched areas to array for comparison
        const fetchedAreasArray = Array.from(fetchedAreas.values());

        // Get areas that need to be fetched
        const areasToFetch = force 
            ? [bounds] 
            : getMissingAreas(bounds, fetchedAreasArray, categoryIds);
        console.log("areas to fetch:", areasToFetch);
        console.table(areasToFetch);

        if (areasToFetch.length === 0) return;

        set({ loading: true });

        try {
            const allNewPins: MapPin[] = [];
            const newFetchedAreas = new Map(fetchedAreas);

            for (const area of areasToFetch) {
                const areaKey = boundsToKey(area, categoryIds);
                const fetchParams: any = {
                    minLat: Number(area.minLat),
                    maxLat: Number(area.maxLat),
                    minLng: Number(area.minLng),
                    maxLng: Number(area.maxLng),
                };

                if (categoryIds?.length) {
                    fetchParams.categoryIds = categoryIds.join(',');
                }

                const res = await apiClient.getMapPins(fetchParams);
                const newPins = res.data?.pins ?? [];
                allNewPins.push(...newPins);

                // Record this fetched area
                newFetchedAreas.set(areaKey, {
                    bounds: area,
                    categoryIds: categoryIds || [],
                });
            }

            // Merge new pins with existing ones, removing duplicates
            const pinMap = new Map<string, MapPin>();
            existingPins.forEach(pin => pinMap.set(pin.id, pin));
            allNewPins.forEach(pin => pinMap.set(pin.id, pin));

            set({
                pins: Array.from(pinMap.values()),
                loading: false,
                fetchedAreas: newFetchedAreas,
            });
        } catch (error) {
            console.error('Failed to fetch pins', error);
            set({ loading: false });
        }
    },

    setCategoriesFilter: (categories) => {
        set({
            categoriesFilter: categories,
            pins: [],
            fetchedAreas: new Map(), // Clear fetched areas when categories change
        });
    },

    reset: () => {
        set({
            pins: [],
            loading: false,
            fetchedAreas: new Map(),
            categoriesFilter: [],
        });
    },
}));