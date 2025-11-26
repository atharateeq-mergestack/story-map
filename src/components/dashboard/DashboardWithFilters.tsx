'use client';

import type { TourFilters } from './TourFilterBar';
import { createContext, use, useMemo, useState } from 'react';
import { DashboardActions } from './DashboardActions';
import { ToursTableWrapper } from './ToursTableWrapper';

type Tour = {
  id: string;
  name: string;
  description: string | null;
  status: 'active' | 'inactive';
  startDate: string | null;
  endDate: string | null;
  startLocation: string | null;
  endLocation: string | null;
  createdAt: Date | string;
};

type DashboardWithFiltersProps = {
  tours: Tour[];
  activeTourId: string | null;
};

const FilterContext = createContext<{
  filters: TourFilters;
  setFilters: (filters: TourFilters) => void;
} | null>(null);

function FilterProvider({ children }: { children: React.ReactNode }) {
  const [filters, setFilters] = useState<TourFilters>({
    search: '',
    filterCreatedDate: '',
    filterStartDate: '',
    filterEndDate: '',
  });
  const value = useMemo(() => ({ filters, setFilters }), [filters]);
  return (
    <FilterContext value={value}>
      {children}
    </FilterContext>
  );
}

function useFilterState() {
  const context = use(FilterContext);
  if (!context) {
    throw new Error('useFilterState must be used within FilterProvider');
  }
  return context;
}

export function DashboardActionsOnly() {
  const { filters, setFilters } = useFilterState();
  return <DashboardActions filters={filters} onFiltersChange={setFilters} />;
}

export function DashboardWithFilters({ tours, activeTourId }: DashboardWithFiltersProps) {
  const { filters } = useFilterState();

  return (
    <ToursTableWrapper
      tours={tours}
      activeTourId={activeTourId}
      filters={filters}
    />
  );
}

export function DashboardFilterProvider({ children }: { children: React.ReactNode }) {
  return <FilterProvider>{children}</FilterProvider>;
}
