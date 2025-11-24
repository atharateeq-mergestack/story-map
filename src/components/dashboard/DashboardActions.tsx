'use client';

import { PlusIcon } from 'lucide-react';
import Link from 'next/link';
import { BulkUploadButton } from './BulkUploadButton';
import { TourFilterMenu } from './TourFilterMenu';
import type { TourFilters } from './TourFilterBar';
import { Button } from '@/components/ui/button';

type DashboardActionsProps = {
  filters: TourFilters;
  onFiltersChange: (filters: TourFilters) => void;
};

export function DashboardActions({ filters, onFiltersChange }: DashboardActionsProps) {
  return (
    <div className="flex items-center gap-2">
      <TourFilterMenu filters={filters} onFiltersChange={onFiltersChange} />
      <BulkUploadButton />
      <Link href="/dashboard/tours/new">
        <Button className="shadow-md hover:shadow-lg transition-all duration-300">
          <PlusIcon className="size-4 mr-2" />
          Create New Tour
        </Button>
      </Link>
    </div>
  );
}

