'use client';

import type { TourFilters } from './TourFilterBar';
import { CalendarIcon, SearchIcon, XIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type TourFilterMenuProps = {
  filters: TourFilters;
  onFiltersChange: (filters: TourFilters) => void;
};

export function TourFilterMenu({ filters, onFiltersChange }: TourFilterMenuProps) {
  const handleFilterChange = (key: keyof TourFilters, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      filterCreatedDate: '',
      filterStartDate: '',
      filterEndDate: '',
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== '');
  const activeFilterCount = Object.values(filters).filter(v => v !== '').length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={hasActiveFilters ? 'default' : 'outline'}
          className="shadow-md hover:shadow-lg transition-all duration-300"
        >
          <SearchIcon className="size-4 mr-2" />
          <span className="hidden sm:block">Filters</span>
          {hasActiveFilters && (
            <Badge variant="secondary" className="ml-2">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[calc(100vw-2rem)] sm:w-80 p-4">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <DropdownMenuLabel className="text-base font-semibold">Filters</DropdownMenuLabel>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-7 text-xs text-muted-foreground hover:text-foreground"
              >
                <XIcon className="size-3 mr-1" />
                Clear All
              </Button>
            )}
          </div>

          <DropdownMenuSeparator />

          {/* Search Bar */}
          <div className="space-y-2">
            <Label htmlFor="menu-search" className="flex items-center gap-2 text-sm">
              <SearchIcon className="size-4" />
              Search Tours
            </Label>
            <Input
              id="menu-search"
              placeholder="Search by name, description, locations, or status..."
              value={filters.search}
              onChange={e => handleFilterChange('search', e.target.value)}
              className="w-full"
              onClick={e => e.stopPropagation()}
              onKeyDown={e => e.stopPropagation()}
            />
          </div>

          <DropdownMenuSeparator />

          {/* Date Filters */}
          <div className="space-y-3">
            <DropdownMenuLabel className="text-sm font-medium">Date Filters</DropdownMenuLabel>

            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="menu-filter-start-date" className="flex items-center gap-2 text-xs">
                  <CalendarIcon className="size-3" />
                  Start Date
                </Label>
                <Input
                  id="menu-filter-start-date"
                  type="date"
                  value={filters.filterStartDate}
                  onChange={e => handleFilterChange('filterStartDate', e.target.value)}
                  className="w-full text-sm"
                  onClick={e => e.stopPropagation()}
                  onKeyDown={e => e.stopPropagation()}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="menu-filter-end-date" className="flex items-center gap-2 text-xs">
                  <CalendarIcon className="size-3" />
                  End Date
                </Label>
                <Input
                  id="menu-filter-end-date"
                  type="date"
                  value={filters.filterEndDate}
                  onChange={e => handleFilterChange('filterEndDate', e.target.value)}
                  className="w-full text-sm"
                  onClick={e => e.stopPropagation()}
                  onKeyDown={e => e.stopPropagation()}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="menu-filter-created-date" className="flex items-center gap-2 text-xs">
                  <CalendarIcon className="size-3" />
                  Created Date
                </Label>
                <Input
                  id="menu-filter-created-date"
                  type="date"
                  value={filters.filterCreatedDate}
                  onChange={e => handleFilterChange('filterCreatedDate', e.target.value)}
                  className="w-full text-sm"
                  onClick={e => e.stopPropagation()}
                  onKeyDown={e => e.stopPropagation()}
                />
              </div>
            </div>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
