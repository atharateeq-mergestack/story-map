'use client';

import { ToursTable } from './ToursTable';
import type { TourFilters } from './TourFilterBar';

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

type ToursTableWrapperProps = {
  tours: Tour[];
  activeTourId: string | null;
  filters: TourFilters;
};

export function ToursTableWrapper({ tours, activeTourId, filters }: ToursTableWrapperProps) {
  return (
    <ToursTable
      tours={tours}
      activeTourId={activeTourId}
      filters={filters}
    />
  );
}

