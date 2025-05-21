import React, { useState, useEffect } from "react";
import { useFilterStore } from "../store/eventStore";
import { useEventStore } from "../store/eventStore";
import { useSearchParams } from "react-router-dom";

const EventFilters = () => {
  const {
    categories,
    selectedCategories,
    search,
    sort,
    toggleCategory,
    setSearch,
    setSort,
    clearFilters,
    fetchCategories,
    setSelectedCategories,
  } = useFilterStore();

  const { setCategoriesFilter, setSearchFilter, fetchEvents } = useEventStore();

  const [localSearch, setLocalSearch] = useState('');
  const [localSelectedCategories, setLocalSelectedCategories] = useState<string[]>([]);
  const [localSort, setLocalSort] = useState<'newest' | 'oldest'>('newest');

  const [searchParams, setSearchParams] = useSearchParams();

  // On mount: read URL params into local state + fetch categories
  useEffect(() => {
    fetchCategories();

    // Get filters from URL
    const urlCategories = searchParams.get('categories');
    const urlSearch = searchParams.get('search') || '';
    const urlSort = (searchParams.get('sort') as 'newest' | 'oldest') || 'newest';

    const parsedCats = urlCategories ? urlCategories.split(',').filter(Boolean) : [];

    // Update local UI state
    setLocalSearch(urlSearch);
    setLocalSelectedCategories(parsedCats);
    setLocalSort(urlSort);

    // Also update store (for shared state across app)
    setSelectedCategories(parsedCats);
    setSearch(urlSearch);
    setSort(urlSort);
    setSearchFilter(urlSearch);
    setCategoriesFilter(parsedCats);

    // ✅ Only send ONE fetch with raw values
    fetchEvents(true, {
      categories: parsedCats,
      search: urlSearch,
      sort: urlSort,
    });
  }, []); // only runs once



  // useEffect(() => {
  //   // only run on first mount after values are populated
  //   if (localSelectedCategories || localSearch || localSort) {
  //     fetchEvents(true, {
  //       categories: localSelectedCategories,
  //       search: localSearch,
  //       sort: localSort,
  //     });
  //   }
  // }, [localSelectedCategories, localSearch, localSort]);

  // Handle category toggling locally
  const onToggleCategory = (id: string) => {
    if (localSelectedCategories.includes(id)) {
      setLocalSelectedCategories(localSelectedCategories.filter((c) => c !== id));
    } else {
      setLocalSelectedCategories([...localSelectedCategories, id]);
    }
  };

  // On submit: update store, update URL, fetch events
  const handleSubmit = () => {
    setSearch(localSearch);
    setCategoriesFilter(localSelectedCategories);
    setSearchFilter(localSearch);
    setSort(localSort);

    // Update URL
    const params: any = {};
    if (localSelectedCategories.length) params.categories = localSelectedCategories.join(',');
    if (localSearch.trim()) params.search = localSearch.trim();
    if (localSort && localSort !== 'newest') params.sort = localSort;

    setSearchParams(params, { replace: true });

    // ✅ Trigger actual fetch
    fetchEvents(true, {
      categories: localSelectedCategories,
      search: localSearch,
      sort: localSort,
    });
  };


  // On clear: reset all filters + URL + fetch
  const handleClear = () => {
    setLocalSearch('');
    setLocalSelectedCategories([]);
    setLocalSort('newest');

    clearFilters();
    setCategoriesFilter([]);
    setSearchFilter('');
    setSort('newest');

    setSearchParams({}, { replace: true });
    fetchEvents(true, {
      categories: localSelectedCategories,
      search: localSearch,
      sort: sort,
    });
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <input
        type="text"
        placeholder="Search events..."
        value={localSearch}
        onChange={(e) => setLocalSearch(e.target.value)}
        className="input input-bordered w-full px-4 py-2 border rounded-lg"
      />

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onToggleCategory(cat.id)}
            className={`px-3 py-1 rounded-full text-sm border transition ${localSelectedCategories.includes(cat.id)
              ? "bg-blue-600 text-white border-blue-600"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
          >
            {cat.emoji} {cat.name}
          </button>
        ))}
      </div>

      {/* Sort */}
      <select
        value={localSort}
        onChange={(e) => setLocalSort(e.target.value as "newest" | "oldest")}
        className="select select-bordered px-3 py-2 rounded-lg w-full max-w-xs"
      >
        <option value="newest">Newest</option>
        <option value="oldest">Oldest</option>
      </select>

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        className="btn btn-primary w-full py-2 mt-2"
      >
        Apply Filters
      </button>

      {/* Clear Filters */}
      <button
        onClick={handleClear}
        className="mt-2 text-sm text-red-600 hover:underline"
      >
        Clear all filters
      </button>
    </div>
  );
};

export default EventFilters;
