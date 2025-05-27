// import { create } from 'zustand';
// import { persist } from 'zustand/middleware';
// import { api } from '../lib/axios';
// import { ErrorCodes } from '../constants/errorCodes';
// import type { User } from '../types';

// const useUserStore = create((set, get) => ({
//   user: null,
//   lastFetched: null,
//   loading: false,
//   error: null,

//   // Main fetch function with logic
//   fetchUser: async ({ force = false, maxAgeMinutes = 5 } = {}) => {
//     const { user, lastFetched } = get();

//     // Custom logic: skip fetch if recent data exists
//     const now = Date.now();
//     const isFresh = lastFetched && (now - lastFetched < maxAgeMinutes * 60 * 1000);

//     if (user && isFresh && !force) {
//       console.log('✅ Serving cached user data');
//       return user;
//     }

//     try {
//       set({ loading: true, error: null });

//       const freshUser = await fetchUserFromAPI();

//       set({
//         user: freshUser,
//         lastFetched: Date.now(),
//         loading: false,
//       });

//       console.log('🌐 Fetched user from API');
//       return freshUser;
//     } catch (error) {
//       set({ error, loading: false });
//       console.error('❌ Failed to fetch user:', error);
//       throw error;
//     }
//   },

//   clearUser: () => set({ user: null, lastFetched: null }),
// }));

// export default useUserStore;