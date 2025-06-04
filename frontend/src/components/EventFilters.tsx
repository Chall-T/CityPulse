import React, { useState, useEffect } from "react";
import { useFilterStore, useEventStore } from "../store/eventStore";
import { useSearchParams } from "react-router-dom";
import { DateRangePicker } from 'rsuite';
import SearchIcon from '@rsuite/icons/Search';
import { Input, InputGroup, InputPicker, CheckPicker } from 'rsuite';
import 'rsuite/dist/rsuite.min.css';
import { addMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';

const today = new Date();
today.setHours(0, 0, 0, 0);

type DateRange = [Date, Date];

type RangeType = {
  label: React.ReactNode;
  value: DateRange | ((value: DateRange) => DateRange);
};


const customRanges: RangeType[] = [
  {
    label: 'This Week',
    value: () => {
      return [
        today,
        endOfWeek(today, { weekStartsOn: 1 }),
      ];
    },
  },
  {
    label: 'This Month',
    value: () => {
      return [today, endOfMonth(today)];
    },
  },
  {
    label: 'Next Month',
    value: () => {
      const next = addMonths(new Date(), 1);
      return [startOfMonth(next), endOfMonth(next)];
    },
  },
];


const EventFilters: React.FC = () => {
  const {
    categories,
    selectedCategories,
    search,
    sort,
    setSearch,
    setSort,
    setSelectedCategories,
    clearFilters,
    fetchCategories,
  } = useFilterStore();
  const { setCategoriesFilter, setSearchFilter, setDateRangeFilter, fetchEvents } = useEventStore();

  const [searchParams, setSearchParams] = useSearchParams();

  // Local UI state
  const [localSearch, setLocalSearch] = useState<string>("");
  const [localSelectedCategories, setLocalSelectedCategories] = useState<string[]>([]);
  const [localSort, setLocalSort] = useState<"desc" | "asc">("desc");
  const [dateRange, setDateRange] = useState<[Date, Date] | null>(null);


  useEffect(() => {
    fetchCategories();

    const urlCats = searchParams.get("categories");
    const urlSearch = searchParams.get("search") || "";
    const urlSort = (searchParams.get("sort") as "desc" | "asc") || "desc";
    const urlFrom = searchParams.get("fromDate") || "";
    const urlTo = searchParams.get("toDate") || "";

    const parsedCats = urlCats
      ? urlCats.split(",").filter((c) => c.trim() !== "")
      : [];

    // Update local UI state
    setLocalSearch(urlSearch);
    setLocalSelectedCategories(parsedCats);
    setLocalSort(urlSort);

    if (urlFrom && urlTo) {
      setDateRange([new Date(urlFrom), new Date(urlTo)]);
    }

    // Update global store
    setSelectedCategories(parsedCats);
    setSearch(urlSearch);
    setSort(urlSort);
    setDateRangeFilter({ from: urlFrom, to: urlTo });
    setSearchFilter(urlSearch);
    setCategoriesFilter(parsedCats);

    // Fetch initial events with all filters
    fetchEvents(true, {
      categories: parsedCats,
      search: urlSearch,
      sort: urlSort,
      fromDate: urlFrom,
      toDate: urlTo,
    });
  }, []);

  // // Toggle a category on/off in local state
  // const onToggleCategory = (id: string) => {
  //   setLocalSelectedCategories((prev) =>
  //     prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
  //   );
  // };

  // When "Apply Filters" is clicked
  const handleSubmit = () => {

    // Update global store
    const [start, end] = dateRange ?? [null, null];

    if ((start && start < today) || (end && end < today)) {
      alert("Please select a valid date range starting from today.");
      return;
    }
    const fromDate = start ? start.toISOString().split("T")[0] : "";
    const toDate = end ? end.toISOString().split("T")[0] : "";

    setSearch(localSearch);
    setSearchFilter(localSearch);
    setCategoriesFilter(localSelectedCategories);
    setSelectedCategories(localSelectedCategories);
    setSort(localSort);
    setDateRangeFilter({ from: fromDate, to: toDate });

    // Build query params
    const params: Record<string, string> = {};
    if (localSelectedCategories.length)
      params.categories = localSelectedCategories.join(",");
    if (localSearch.trim()) params.search = localSearch.trim();
    if (localSort && localSort !== "desc") params.sort = localSort;
    if (fromDate) params.fromDate = fromDate;
    if (toDate) params.toDate = toDate;

    setSearchParams(params, { replace: true });

    // Refetch events with filters
    fetchEvents(true, {
      categories: localSelectedCategories,
      search: localSearch,
      sort: localSort,
      fromDate,
      toDate,
    });
  };

  // When "Clear all filters" is clicked
  const handleClear = () => {
    setLocalSearch("");
    setLocalSelectedCategories([]);
    setLocalSort("desc");
    setDateRange(null);

    clearFilters();
    setCategoriesFilter([]);
    setSearchFilter("");
    setSort("desc");
    setDateRangeFilter({ from: "", to: "" });

    setSearchParams({}, { replace: true });

    fetchEvents(true, {
      categories: [],
      search: "",
      sort: "desc",
      fromDate: "",
      toDate: "",
    });
  };

  return (
    <div className="space-y-6">
      <InputGroup inside className="">
        <Input placeholder="Search events..." value={localSearch} onChange={(value) => setLocalSearch(value)} />
        <InputGroup.Button>
          <SearchIcon />
        </InputGroup.Button>
      </InputGroup>

      {/* Category Filter */}
      {/* <div className="flex flex-wrap justify-between gap-2">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onToggleCategory(cat.id)}
            className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm border transition
              ${localSelectedCategories.includes(cat.id)
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300"
              }`}
          >
            <span>{cat.emoji}</span>
            <span>{cat.name}</span>
          </button>
        ))}
      </div> */}

      {/* Sort & Date Filter Row */}
      <div className="flex flex-col md:flex-row items-center gap-4">

        <InputPicker
          className="custom-sort-picker"
          data={[
            { label: "Newest First", value: "desc" },
            { label: "Oldest First", value: "asc" }
          ]}
          style={{ width: '100%', maxWidth: 224 }}
          value={localSort}
          onChange={(value) => setLocalSort(value as "desc" | "asc")}
          cleanable={false}
        />

        <div className="w-full md:w-auto" style={{ flexShrink: 0, flexGrow: 0, minWidth: 224 }}>
          <DateRangePicker
            value={dateRange}
            onChange={(range) => {
              if (range === null) {
                setDateRange(null);
              } else if (range.length === 2) {
                setDateRange(range as [Date, Date]);
              }
            }}
            appearance="default"
            placement="auto"
            cleanable={true}
            shouldDisableDate={(date) => {
              return date < today;
            }}
            ranges={customRanges}
            style={{ width: "224px" }}
          />
        </div>

        <div className="w-full md:w-auto flex-1">
          {/* Categories */}
          <CheckPicker
            data={categories.map(cat => ({
              label: `${cat.emoji} ${cat.name}`,
              value: cat.id,
            }))}
            value={localSelectedCategories}
            onChange={setLocalSelectedCategories}
            onOpen={() => {
              if (categories.length === 0) {
                fetchCategories();
              }
            }}
            onSearch={() => {
              if (categories.length === 0) {
                fetchCategories();
              }
            }}
            placeholder="Select categories"
            style={{ width: "100%" }}
          />
        </div>
      </div>


      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
        <button
          onClick={handleSubmit}
          className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          Apply Filters
        </button>
        <button
          onClick={handleClear}
          className="w-full sm:w-auto mt-2 sm:mt-0 px-6 py-2 text-red-600 hover:underline focus:outline-none"
        >
          Clear All
        </button>
      </div>
    </div>
  );
};

export default EventFilters;
