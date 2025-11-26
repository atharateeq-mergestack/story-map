'use client';

import type { TourFilters } from './TourFilterBar';
import { PlusIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NavigationLink } from '@/components/ui/navigation-link';
import { BulkUploadButton } from './BulkUploadButton';
import { TourFilterMenu } from './TourFilterMenu';

type DashboardActionsProps = {
  filters: TourFilters;
  onFiltersChange: (filters: TourFilters) => void;
};

export function DashboardActions({ filters, onFiltersChange }: DashboardActionsProps) {
  return (
    <div className="flex items-center gap-2">
      <TourFilterMenu filters={filters} onFiltersChange={onFiltersChange} />
      <BulkUploadButton />
      <NavigationLink href="/dashboard/tours/new" message="Creating new tour...">
        <Button className="shadow-md hover:shadow-lg transition-all duration-300">
          <PlusIcon className="size-4 mr-2" />
          <span className="hidden sm:block">Create New Tour </span>
        </Button>
      </NavigationLink>
    </div>
  );
}
