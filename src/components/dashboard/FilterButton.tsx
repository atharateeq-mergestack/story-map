'use client';

import { FilterIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

type FilterButtonProps = {
  showFilters: boolean;
  onToggle: () => void;
};

export function FilterButton({ showFilters, onToggle }: FilterButtonProps) {
  return (
    <Button
      variant={showFilters ? 'default' : 'outline'}
      onClick={onToggle}
      className="shadow-md hover:shadow-lg transition-all duration-300"
    >
      <FilterIcon className="size-4 mr-2" />
      {showFilters ? 'Hide Filters' : 'Filters'}
    </Button>
  );
}

