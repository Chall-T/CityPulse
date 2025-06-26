import React, { useState, useEffect } from "react";
import { useFilterStore, useMapPinsStore } from "../store/eventStore";
import { useSearchParams } from "react-router-dom";
import { DateRangePicker } from "rsuite";
import { CheckPicker } from "rsuite";
import "rsuite/dist/rsuite.min.css";
import {
  addMonths,
  startOfMonth,
  endOfMonth,
  endOfWeek,
} from "date-fns";
import useIsMobile from "../hooks/useMobile";

const today = new Date();
today.setHours(0, 0, 0, 0);

type DateRange = [Date, Date];

type RangeType = {
  label: React.ReactNode;
  value: DateRange | ((value: DateRange) => DateRange);
};

const customRanges: RangeType[] = [
  {
    label: "This Week",
    value: () => [today, endOfWeek(today, { weekStartsOn: 1 })],
  },
  {
    label: "This Month",
    value: () => [today, endOfMonth(today)],
  },
  {
    label: "Next Month",
    value: () => {
      const next = addMonths(new Date(), 1);
      return [startOfMonth(next), endOfMonth(next)];
    },
  },
];

const EventFilters: React.FC = () => {
  const isMobile = useIsMobile();

  const {
    categories,
    selectedCategories,
    setSelectedCategories,
    setDateRangeFilter,
    reset,
    fetchCategories,
  } = useFilterStore();

  const {
    fetchPins,
    currentBounds,
    reset: resetPins,
  } = useMapPinsStore();

  const [searchParams, setSearchParams] = useSearchParams();

  // Local UI state
  const [dateRange, setDateRange] = useState<[Date, Date] | null>(null);

  useEffect(() => {
    fetchCategories();

    const urlCats = searchParams.get("categoryIds");
    const urlFrom = searchParams.get("fromDate") || "";
    const urlTo = searchParams.get("toDate") || "";
    const parsedCats = urlCats ? urlCats.split(",").filter(Boolean) : [];

    if (urlFrom && urlTo) {
      setDateRange([new Date(urlFrom), new Date(urlTo)]);
    }
    setSelectedCategories(parsedCats);
    setDateRangeFilter({ from: urlFrom, to: urlTo });
  }, []);

  const handleSubmit = async () => {
    const [start, end] = dateRange ?? [null, null];

    if ((start && start < today) || (end && end < today)) {
      alert("Please select a valid date range starting from today.");
      return;
    }

    const fromDate = start ? start.toISOString().split("T")[0] : "";
    const toDate = end ? end.toISOString().split("T")[0] : "";

    setDateRangeFilter({ from: fromDate, to: toDate });

    const params: Record<string, string> = {};
    if (categories.length > 0)
      params.categoryIds = selectedCategories.join(",");
    if (fromDate) params.fromDate = fromDate;
    if (toDate) params.toDate = toDate;

    setSearchParams(params, { replace: true });

    if (currentBounds?.minLat
      && currentBounds?.maxLat
      && currentBounds?.minLng
      && currentBounds?.maxLng
    ) {
      await resetPins();
      await fetchPins({
        minLat: currentBounds?.minLat,
        maxLat: currentBounds?.maxLat,
        minLng: currentBounds?.minLng,
        maxLng: currentBounds?.maxLng,
        categoryIds: selectedCategories,
        fromDate: fromDate,
        toDate: toDate,
      });
    }
  };

  const handleClear = () => {
    setDateRange(null);

    reset();
    setSelectedCategories([]);
    setDateRangeFilter({ from: "", to: "" });

    setSearchParams({}, { replace: true });

  };

  return (
    <div className="space-y-6">


      <div className="flex flex-col md:flex-row items-center gap-4 w-full">

        <DateRangePicker
          {...(isMobile ? { showOneCalendar: true } : {})}
          value={dateRange}
          onChange={(range) =>
            range === null
              ? setDateRange(null)
              : setDateRange(range as [Date, Date])
          }
          appearance="default"
          placement="auto"
          cleanable
          shouldDisableDate={(date) => date < today}
          ranges={customRanges}
          menuStyle={{ zIndex: 20000 }}
          style={{ width: "100%", minWidth: 200 }}
        />

        <CheckPicker
          className="custom-picker-colour"
          data={categories.map((cat) => ({
            label: `${cat.emoji} ${cat.name}`,
            value: cat.id,
          }))}
          menuStyle={{ zIndex: 20000 }}
          value={selectedCategories}
          onChange={setSelectedCategories}
          onOpen={() => {
            if (categories.length === 0) fetchCategories();
          }}
          onSearch={() => {
            if (categories.length === 0) fetchCategories();
          }}
          placeholder="Select categories"
          style={{ width: "100%", minWidth: 224 }}
        />
      </div>

      <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
        <button
          onClick={handleSubmit}
          className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Apply Filters
        </button>
        <button
          onClick={handleClear}
          className="w-full sm:w-auto mt-2 sm:mt-0 px-6 py-2 text-red-600 hover:underline"
        >
          Clear All
        </button>
      </div>
    </div>
  );
};

export default EventFilters;