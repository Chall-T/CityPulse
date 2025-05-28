import { create } from 'zustand'
import type { Event } from '../types/event'
import type { Category } from '../types/category'
import type { User } from '../types/user'
import { apiClient } from '../lib/ApiClient'
type APIStore = {
  // ─── EVENTS ─────────────────────────────
  events: Event[] | null
  eventsLoading: boolean
  eventsError: string | null
  fetchEventsIfNeeded: () => Promise<void>
  clearEvents: () => void

  // ─── CATEGORIES ────────────────────────
  categories: Category[] | null
  categoriesLoading: boolean
  categoriesError: string | null
  fetchCategoriesIfNeeded: () => Promise<void>
  clearCategories: () => void

  // ─── CURRENT USER ──────────────────────
  user: User | null
  userLoading: boolean
  userError: string | null
  fetchUserIfNeeded: () => Promise<void>
  clearUser: () => void
}

export const useApiStore = create<APIStore>((set, get) => ({
  // ─── EVENTS SLICE ───────────────────────
  events: null,
  eventsLoading: false,
  eventsError: null,

  fetchEventsIfNeeded: async () => {
    const { events, eventsLoading } = get()
    // If already loading or already have data, do nothing
    if (eventsLoading || events !== null) return

    set({ eventsLoading: true, eventsError: null })
    try {
      const res = await apiClient.getEvents()
      // assume response.data.data is Event[]
      set({
        events: res.data.data,
        eventsLoading: false,
      })
    } catch (err: any) {
      set({
        eventsError: err?.message || 'Failed to fetch events',
        eventsLoading: false,
      })
    }
  },

  clearEvents: () => {
    set({ events: null, eventsError: null })
  },

  // ─── CATEGORIES SLICE ────────────────────
  categories: null,
  categoriesLoading: false,
  categoriesError: null,

  fetchCategoriesIfNeeded: async () => {
    const { categories, categoriesLoading } = get()
    if (categoriesLoading || categories !== null) return

    set({ categoriesLoading: true, categoriesError: null })
    try {
      const res = await apiClient.getCategories()
      // assume response.data is Category[]
      set({
        categories: res.data,
        categoriesLoading: false,
      })
    } catch (err: any) {
      set({
        categoriesError: err?.message || 'Failed to fetch categories',
        categoriesLoading: false,
      })
    }
  },

  clearCategories: () => {
    set({ categories: null, categoriesError: null })
  },

  // ─── USER SLICE ─────────────────────────
  user: null,
  userLoading: false,
  userError: null,

  fetchUserIfNeeded: async () => {
    const { user, userLoading } = get()
    if (userLoading || user !== null) return

    set({ userLoading: true, userError: null })
    try {
      const res = await apiClient.getCurrentUser()
      // assume response.data.user is User
      set({
        user: res.data.user,
        userLoading: false,
      })
    } catch (err: any) {
      set({
        userError: err?.message || 'Failed to fetch user',
        userLoading: false,
      })
    }
  },

  clearUser: () => {
    set({ user: null, userError: null })
  },
}))