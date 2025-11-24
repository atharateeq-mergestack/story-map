'use client';

import { createContext, useContext, useState } from 'react';
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

type DashboardContentProps = {
  tours: Tour[];
  activeTourId: string | null;
};

type FilterContextType = {
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
};

const FilterContext = createContext<FilterContextType | null>(null);

export function useFilterContext() {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error('useFilterContext must be used within FilterProvider');
  }
  return context;
}

function FilterProvider({ children }: { children: React.ReactNode }) {
  const [showFilters, setShowFilters] = useState(false);
  return (
    <FilterContext.Provider value={{ showFilters, setShowFilters }}>
      {children}
    </FilterContext.Provider>
  );
}

export function DashboardContentWrapper({ tours, activeTourId }: DashboardContentProps) {
  return (
    <FilterProvider>
      <DashboardActions />
      <ToursTableWrapper tours={tours} activeTourId={activeTourId} />
    </FilterProvider>
  );
}

function DashboardActions() {
  const { showFilters, setShowFilters } = useFilterContext();
  return <DashboardActions showFilters={showFilters} onToggleFilters={() => setShowFilters(!showFilters)} />;
}

function ToursTableWrapper({ tours, activeTourId }: DashboardContentProps) {
  const { showFilters, setShowFilters } = useFilterContext();
  return (
    <ToursTableWrapper
      tours={tours}
      activeTourId={activeTourId}
      showFilters={showFilters}
      onToggleFilters={() => setShowFilters(!showFilters)}
    />
  );
}

