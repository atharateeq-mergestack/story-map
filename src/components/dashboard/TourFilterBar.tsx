'use client';

import { CalendarIcon, FilterIcon, SearchIcon, XIcon } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export type TourFilters = {
  search: string;
  filterCreatedDate: string;
  filterStartDate: string;
  filterEndDate: string;
};

type TourFilterBarProps = {
  filters: TourFilters;
  onFiltersChange: (filters: TourFilters) => void;
};

export function TourFilterBar({ filters, onFiltersChange }: TourFilterBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);

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

  return (
    <Card className="border-2">
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Header with Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FilterIcon className="size-5 text-primary" />
              <h3 className="font-semibold text-lg">Filters</h3>
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-2">
                  {Object.values(filters).filter(v => v !== '').length}
                  {' '}
                  active
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <XIcon className="size-4 mr-1" />
                  Clear All
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? 'Collapse' : 'Expand'}
              </Button>
            </div>
          </div>

          {/* Semantic Search - Always Visible */}
          <div className="space-y-2">
            <Label htmlFor="search" className="flex items-center gap-2">
              <SearchIcon className="size-4" />
              Search Tours
            </Label>
            <Input
              id="search"
              placeholder="Search by name, description, start location, end location, or status..."
              value={filters.search}
              onChange={e => handleFilterChange('search', e.target.value)}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Searches across tour name, description, locations, and status
            </p>
          </div>

          {/* Expanded Date Filters */}
          {isExpanded && (
            <div className="space-y-4 pt-4 border-t">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="filter-created-date" className="flex items-center gap-2">
                    <CalendarIcon className="size-4" />
                    Filter by Created Date
                  </Label>
                  <Input
                    id="filter-created-date"
                    type="date"
                    value={filters.filterCreatedDate}
                    onChange={e => handleFilterChange('filterCreatedDate', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="filter-start-date" className="flex items-center gap-2">
                    <CalendarIcon className="size-4" />
                    Filter by Start Date
                  </Label>
                  <Input
                    id="filter-start-date"
                    type="date"
                    value={filters.filterStartDate}
                    onChange={e => handleFilterChange('filterStartDate', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="filter-end-date" className="flex items-center gap-2">
                    <CalendarIcon className="size-4" />
                    Filter by End Date
                  </Label>
                  <Input
                    id="filter-end-date"
                    type="date"
                    value={filters.filterEndDate}
                    onChange={e => handleFilterChange('filterEndDate', e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
