'use client';

import moment from 'moment';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Heading } from '@/components/ui/common/Heading';
import { Text } from '@/components/ui/common/Text';
import { formatDate } from '@/lib/utils';
import { Env } from '@/libs/Env';
import destinationController from '@/store/destinationController';
import { DestinationCard } from './DestinationCard';
import { DestinationDetailPanel } from './DestinationDetailPanel';
import { TourMap } from './TourMap';

type Destination = {
  id: string;
  name: string;
  date: string;
  timeSlot: {
    start_time: string;
    end_time: string;
    slot_label?: string;
  } | null;
  coordinate: { lat: number; lng: number } | null;
  description: string | null;
  images?: string[];
};

type Tour = {
  id: string;
  name: string;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  startLocation: string | null;
  endLocation: string | null;
};

type TourViewProps = {
  tour: Tour;
  destinationsByDate: Record<string, Destination[]>;
  dates: string[];
};

function calculateTotalDays(startDate: string | null, endDate: string | null): number {
  if (!startDate || !endDate) {
    return 0;
  }
  const start = moment(startDate);
  const end = moment(endDate);
  if (!start.isValid() || !end.isValid()) {
    return 0;
  }
  return end.diff(start, 'days') + 1;
}

/**
 * TourView Component
 *
 * Displays a tour with its destinations organized by date. The component has two main view modes:
 * 1. Overview Mode: Shows destination cards in a list format
 * 2. Detail Mode: When a destination is selected, all destinations for that day expand into detail panels
 *
 * Key Features:
 * - Scroll-based date navigation (updates active date as user scrolls)
 * - Scroll-based destination tracking in detail view (tracks which panel is at the top)
 * - Interactive map with markers that sync with selected destinations
 * - Toggle between overview (cards) and detail (panels) views
 */
export function TourView({ tour, destinationsByDate, dates }: TourViewProps) {
  // State Management:
  // - activeDate: From destinationController store - The currently visible/active date in the date navigation bar
  // - selectedDestinationId: From destinationController store - controls detail panel view
  //   When set, switches the view to "detail mode" for that destination's day
  //   This causes all destinations for that day to expand into detail panels instead of cards
  // - topDestinationId: In detail view, tracks which destination panel is currently at the top
  //   of the viewport (used for blurring panels below it)
  const selectedDestinationId = destinationController.useScopeState('selectedDestinationId')[0];
  const activeDate = destinationController.useScopeState('activeDate')[0];
  const [topDestinationId, setTopDestinationId] = useState<string | null>(null);

  // Use refs to track previous values and prevent unnecessary re-renders
  const prevTopDestinationIdRef = useRef<string | null>(null);
  const scrollHandlerRef = useRef<(() => void) | null>(null);

  // Refs for DOM elements:
  // - heroRef: Hero section at the top
  // - navRef: Sticky navigation bar with date buttons
  // - daySectionRefs: Each day section (used for scroll-based date detection)
  // - destinationRefs: Each destination card container
  // - detailPanelRefs: Each destination detail panel (used for scroll-based panel tracking)
  const heroRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const daySectionRefs = useRef<Record<string, HTMLDivElement>>({});
  const destinationRefs = useRef<Record<string, HTMLDivElement>>({});
  const detailPanelRefs = useRef<Record<string, HTMLDivElement>>({});
  const mapboxToken = Env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

  const allDestinations = dates.flatMap(date => destinationsByDate[date] || []);
  const totalDays = calculateTotalDays(tour.startDate, tour.endDate);

  // Derive selectedDestination from selectedDestinationId using the store
  const selectedDestination = selectedDestinationId
    ? allDestinations.find(d => d.id === selectedDestinationId) || null
    : null;

  /**
   * useEffect: Initialize activeDate on mount
   * Sets the initial active date to the first date if not already set
   */
  useEffect(() => {
    if (!activeDate && dates.length > 0) {
      destinationController.setActiveDate(dates[0]);
    }
  }, [activeDate, dates]);

  /**
   * useEffect: Reset selectedDestinationId when activeDate changes
   * If the selected destination's date doesn't match the new active date, clear the selection
   */
  useEffect(() => {
    if (!activeDate || !selectedDestinationId) {
      return;
    }

    const destination = allDestinations.find(d => d.id === selectedDestinationId);
    // If selected destination exists but its date doesn't match active date, clear selection
    if (destination && destination.date !== activeDate) {
      destinationController.clearSelectedDestination();
      setTopDestinationId(null);
      prevTopDestinationIdRef.current = null;
    }
  }, [activeDate, selectedDestinationId, allDestinations]);

  /**
   * Scroll Handler for Detail View Mode
   *
   * This effect only runs when selectedDestination is set (detail view is active).
   * It tracks which destination detail panel is currently at the top of the viewport
   * as the user scrolls through the expanded detail panels.
   *
   * IMPORTANT: This handler only works when the user is still on the same date as the
   * selectedDestination. If the user scrolls to a different date, the date navigation
   * handler will clear the selectedDestination, and this handler will stop running.
   *
   * How it works:
   * 1. When a destination is selected, all destinations for that day expand into detail panels
   * 2. As the user scrolls, this handler checks the position of each detail panel
   * 3. It finds the panel with the smallest positive top value (closest to top of viewport)
   * 4. Updates topDestinationId and activeDestinationId to sync the map highlight
   * 5. Panels below the top one are blurred for visual focus
   *
   * The selectedDestination state controls the view mode:
   * - null = Overview mode (shows destination cards)
   * - Destination object = Detail mode (shows detail panels for that day)
   */
  useEffect(() => {
    // Only run this scroll handler when in detail view mode
    if (!selectedDestination) {
      // Clean up previous scroll handler if switching out of detail view
      if (scrollHandlerRef.current) {
        window.removeEventListener('scroll', scrollHandlerRef.current);
        scrollHandlerRef.current = null;
      }
      prevTopDestinationIdRef.current = null;
      return;
    }

    // Get all destinations for the selected destination's day
    const dayDestinations = destinationsByDate[selectedDestination.date] || [];
    if (dayDestinations.length === 0) {
      return;
    }

    // Reset previous tracking when selectedDestination changes
    prevTopDestinationIdRef.current = null;

    const handleScroll = () => {
      // Check if we're still on the same date section
      // If not, the date navigation handler will clear selectedDestination
      const selectedDateSection = daySectionRefs.current[selectedDestination.date];
      if (!selectedDateSection) {
        return;
      }

      const sectionRect = selectedDateSection.getBoundingClientRect();
      // If the selected date section is not visible or far from viewport, don't update
      // This prevents updates when user has scrolled to a different date
      if (sectionRect.bottom < 0 || sectionRect.top > window.innerHeight) {
        return;
      }

      let topPanelId: string | null = null;
      let minTop = Infinity; // Track the smallest top value (closest to viewport top)

      // Iterate through all destination panels for this day
      dayDestinations.forEach((dest) => {
        const panel = detailPanelRefs.current[dest.id];
        if (panel) {
          const rect = panel.getBoundingClientRect();
          // Check if this panel is visible and at the top of the viewport
          // rect.top >= 0: Panel is at or below the top of viewport
          // rect.top < minTop: This panel is closer to the top than previous ones
          // rect.bottom > 0: Panel is at least partially visible (not scrolled past)
          if (rect.top >= 0 && rect.top < minTop && rect.bottom > 0) {
            minTop = rect.top;
            topPanelId = dest.id;
          }
        }
      });

      // Fallback: If no panel is at the top (e.g., scrolled to top of page), use the first one
      if (!topPanelId && dayDestinations.length > 0) {
        topPanelId = dayDestinations[0]?.id || null;
      }

      // Update state only if the top panel has actually changed (prevents unnecessary re-renders)
      // Use ref to track previous value instead of state dependency
      if (topPanelId !== prevTopDestinationIdRef.current && topPanelId) {
        prevTopDestinationIdRef.current = topPanelId;
        setTopDestinationId(topPanelId);
        destinationController.setSelectedDestination(topPanelId); // Sync map highlight
      }
    };

    // Store handler reference for cleanup
    scrollHandlerRef.current = handleScroll;

    // Attach scroll listener with passive flag for better performance
    window.addEventListener('scroll', handleScroll, { passive: true });
    // Call immediately to set initial state
    handleScroll();

    // Cleanup: Remove scroll listener when component unmounts or dependencies change
    return () => {
      if (scrollHandlerRef.current) {
        window.removeEventListener('scroll', scrollHandlerRef.current);
        scrollHandlerRef.current = null;
      }
    };
  }, [selectedDestination, destinationsByDate]);

  /**
   * Scroll Handler for Date Navigation
   *
   * This effect handles scroll-based date navigation in the sticky nav bar.
   * It ALWAYS runs, regardless of whether a destination is selected.
   *
   * How it works:
   * 1. As user scrolls, checks which day section is closest to the top of viewport
   * 2. Updates activeDate to highlight the corresponding date button in the nav bar
   * 3. Uses a threshold of 100px from top to determine the active section
   * 4. If a destination is selected and user scrolls to a different date,
   *    it clears the selectedDestination to exit detail view
   *
   * This allows users to scroll between dates even when in detail view.
   * When they scroll to a different date, the detail view is automatically cleared.
   */
  useEffect(() => {
    const handleScroll = () => {
      let currentActiveIndex = 0;
      // Find which day section is currently at the top of the viewport
      for (let i = 0; i < dates.length; i++) {
        const key = dates[i] as keyof typeof daySectionRefs.current;
        const section = daySectionRefs.current[key];
        if (section) {
          const rect = section.getBoundingClientRect();
          // If section's top is within 100px of viewport top, it's the active section
          // We keep updating currentActiveIndex as we find sections that meet this criteria
          // The last one found (closest to top) will be the active one
          if (rect.top <= 100) {
            currentActiveIndex = i;
          }
        }
      }
      const newActiveDate = dates[currentActiveIndex] || null;

      // If a destination is selected and user has scrolled to a different date,
      // clear the selected destination to exit detail view
      if (selectedDestination && newActiveDate && selectedDestination.date !== newActiveDate) {
        destinationController.clearSelectedDestination();
        setTopDestinationId(null);
        prevTopDestinationIdRef.current = null;
      }

      // Only update state if the date has actually changed (prevents unnecessary re-renders)
      if (activeDate !== newActiveDate) {
        destinationController.setActiveDate(newActiveDate);
      }
    };

    // Attach scroll listener with passive flag for better performance
    window.addEventListener('scroll', handleScroll, { passive: true });
    // Call immediately to set initial state
    handleScroll();

    // Cleanup: Remove scroll listener when component unmounts or dependencies change
    return () => window.removeEventListener('scroll', handleScroll);
  }, [dates, selectedDestination]);

  /**
   * Handles clicking on a destination card
   *
   * When a destination is clicked:
   * 1. Sets selectedDestination - This switches the view to "detail mode"
   *    - All destinations for that day will expand into detail panels
   *    - The scroll handler for detail view will start tracking which panel is at the top
   * 2. Sets selectedDestinationId in store - Highlights this destination on the map
   * 3. Sets topDestinationId - Marks this as the initial top panel
   * 4. Sets activeDate - Updates the date nav to show this destination's date
   * 5. Scrolls to the destination's detail panel
   *
   * Note: Only updates selectedDestination if it's actually different to prevent unnecessary re-renders
   */
  const handleDestinationClick = (destination: Destination) => {
    destinationController.setSelectedDestination(destination.id);
    destinationController.setActiveDate(destination.date);
    setTopDestinationId(destination.id);

    // Scroll to the first destination panel after a brief delay
    // This ensures the DOM has updated with the new detail panels
    setTimeout(() => {
      const firstPanel = detailPanelRefs.current[destination.id];
      if (firstPanel) {
        const navHeight = navRef.current?.offsetHeight || 0;
        const elementPosition = firstPanel.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({
          top: elementPosition - navHeight - 20,
          behavior: 'smooth',
        });
      }
    }, 100);
  };

  /**
   * Handles clicking on a map marker
   *
   * Similar to handleDestinationClick, but triggered from the map.
   * Scrolls to the day section containing the destination.
   *
   * Note: Only updates selectedDestination if it's actually different to prevent unnecessary re-renders
   */
  const handleMarkerClick = (destinationId: string) => {
    const destination = allDestinations.find(d => d.id === destinationId);
    if (!destination) {
      return;
    }
    destinationController.setSelectedDestination(destination.id);
    destinationController.setActiveDate(destination.date);
    setTopDestinationId(destination.id);

    // Scroll to the first destination panel after a brief delay
    // This ensures the DOM has updated with the new detail panels
    setTimeout(() => {
      const firstPanel = detailPanelRefs.current[destination.id];
      if (firstPanel) {
        const navHeight = navRef.current?.offsetHeight || 0;
        const elementPosition = firstPanel.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({
          top: elementPosition - navHeight - 20,
          behavior: 'smooth',
        });
      }
    }, 100);
  };

  /**
   * Exits detail view and returns to overview mode
   *
   * Setting selectedDestination to null switches back to overview mode:
   * - All detail panels collapse back into destination cards
   * - The date navigation scroll handler becomes active again
   * - The detail view scroll handler stops running
   */
  const handleBackToOverview = () => {
    destinationController.clearSelectedDestination();
    setTopDestinationId(null);
  };

  /**
   * Handles clicking on a date button in the navigation bar
   *
   * When a date is clicked:
   * 1. Scrolls to that day's section
   * 2. Sets activeDate to highlight the button
   * 3. Clears selectedDestination to ensure we're in overview mode
   *    (This ensures clicking a date always shows the card view, not detail panels)
   */
  const handleDateClick = (date: string) => {
    const section = daySectionRefs.current[date];
    if (section) {
      const navHeight = navRef.current?.offsetHeight || 0;
      const elementPosition = section.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top: elementPosition - navHeight - 20,
        behavior: 'smooth',
      });
      destinationController.setActiveDate(date);
      // Clear detail view state to return to overview mode
      destinationController.clearSelectedDestination();
      setTopDestinationId(null);
    }
  };

  if (!mapboxToken) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-2">
          <p className="text-muted-foreground">Mapbox access token is not configured.</p>
          <p className="text-sm text-muted-foreground">
            Please set NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN in your environment variables.
          </p>
        </div>
      </div>
    );
  }

  if (!mapboxToken.startsWith('pk.')) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-2">
          <p className="text-destructive font-medium">Invalid Mapbox token format</p>
          <p className="text-sm text-muted-foreground">Use a public access token (pk.*) with Mapbox GL.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section
        ref={heroRef}
        className="relative min-h-[40vh] sm:min-h-[50vh] md:min-h-[60vh] flex flex-col justify-end bg-muted/30"
      >
        <div className="relative z-10 container mx-auto px-4 sm:px-6 pb-6 sm:pb-8 pt-16 sm:pt-20 md:pt-24">
          <div className="max-w-3xl space-y-4 sm:space-y-6">
            <Heading
              level={1}
              size="5xl"
              weight="bold"
              className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-foreground"
            >
              {tour.name}
            </Heading>

            {tour.description && (
              <Text size="lg" color="muted" className="text-sm sm:text-base md:text-lg max-w-2xl">
                {tour.description}
              </Text>
            )}

            <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-3 sm:gap-4 text-xs sm:text-sm">
              {tour.startLocation && tour.endLocation && (
                <div className="flex flex-wrap items-center gap-2">
                  <Text weight="medium" className="text-xs sm:text-sm">
                    Going from
                  </Text>
                  <Text color="muted" className="text-xs sm:text-sm">
                    {tour.startLocation}
                  </Text>
                  <Text color="muted" className="text-xs sm:text-sm">
                    →
                  </Text>
                  <Text weight="medium" className="text-xs sm:text-sm">
                    Going to
                  </Text>
                  <Text color="muted" className="text-xs sm:text-sm">
                    {tour.endLocation}
                  </Text>
                </div>
              )}

              {tour.startDate && tour.endDate && (
                <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                  <div>
                    <Text size="sm" color="muted" className="text-xs">
                      Start Date
                    </Text>
                    <Text weight="medium" className="text-xs sm:text-sm">
                      {formatDate(tour.startDate)}
                    </Text>
                  </div>
                  <div>
                    <Text size="sm" color="muted" className="text-xs">
                      End Date
                    </Text>
                    <Text weight="medium" className="text-xs sm:text-sm">
                      {formatDate(tour.endDate)}
                    </Text>
                  </div>
                  {totalDays > 0 && (
                    <div>
                      <Text size="sm" color="muted" className="text-xs">
                        Total Days
                      </Text>
                      <Text weight="medium" className="text-xs sm:text-sm">
                        {totalDays}
                        {' '}
                        {totalDays === 1 ? 'Day' : 'Days'}
                      </Text>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

      </section>
      {dates.length > 0 && (
        <nav
          ref={navRef}
          className="sticky top-[-8px] z-40 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 shadow-sm"
        >
          <div className="container mx-auto px-3 sm:px-4">
            <div className="flex h-12 sm:h-14 md:h-16 items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1">
              {dates.map(date => (
                <Button
                  key={date}
                  variant={activeDate === date ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleDateClick(date)}
                  className="whitespace-nowrap text-xs sm:text-sm shrink-0"
                >
                  {formatDate(date)}
                </Button>
              ))}
            </div>
          </div>
        </nav>
      )}

      <div className="">
        {dates.map((date, dayIndex) => {
          const dayDestinations = destinationsByDate[date] || [];
          const dayNumber = dayIndex + 1;

          return (
            <section
              key={date}
              ref={(el: HTMLDivElement | null) => {
                if (el) {
                  daySectionRefs.current[date] = el;
                }
              }}
              className="mb-12 sm:mb-16"
            >
              {/* Sticky Day Heading */}
              <Heading
                level={2}
                size="2xl"
                weight="bold"
                className="mb-4 sm:mb-6 text-xl sm:text-2xl sticky top-0 bg-background z-10 py-2 border-b border-foreground/10"
              >
                Day
                {' '}
                {dayNumber}
                {' '}
                –
                {' '}
                {formatDate(date)}
              </Heading>

              <div className="flex flex-col lg:flex-row">
                {/* Left Panel: Destinations / Detail Panel */}
                <div className="w-full lg:w-[30%] order-2 lg:order-1 space-y-3 sm:space-y-4">
                  {dayDestinations.length === 0
                    ? (
                        <Card>
                          <CardContent className="p-4 sm:p-6 text-center">
                            <Text color="muted" className="text-sm sm:text-base">
                              No destinations for this day
                            </Text>
                          </CardContent>
                        </Card>
                      )
                    : (
                        dayDestinations.map((destination) => {
                          // View Mode Logic:
                          // - isDaySelected: true if this day matches the selectedDestination's date
                          //   When true, this day is in "detail mode" - all destinations show as detail panels
                          //   When false, this day is in "overview mode" - destinations show as cards
                          const isDaySelected = selectedDestination?.date === date;

                          // isTop: true if this destination's panel is currently at the top of viewport
                          // Used to highlight the active panel and sync with map
                          const isTop = topDestinationId === destination.id;
                          const isActive = selectedDestinationId === destination.id;

                          // Blur Effect Logic:
                          // When in detail view (isDaySelected = true), we blur all panels except the top one
                          // This creates a visual focus effect where only the top panel is fully visible
                          //
                          // How it works:
                          // 1. Find the index of the top destination panel
                          // 2. Find the index of the current destination
                          // 3. If current is not the top one (different index), it should be blurred
                          const topIndex = topDestinationId
                            ? dayDestinations.findIndex(d => d.id === topDestinationId)
                            : -1;
                          const currentIndex = dayDestinations.findIndex(d => d.id === destination.id);
                          const isNotTop = topIndex >= 0 && currentIndex !== topIndex;
                          const shouldBlur = isDaySelected && isNotTop && topDestinationId !== null;

                          const refCallback = (el: HTMLDivElement | null) => {
                            if (el) {
                              destinationRefs.current[destination.id] = el;
                            }
                          };

                          const detailPanelRefCallback = (el: HTMLDivElement | null) => {
                            if (el) {
                              detailPanelRefs.current[destination.id] = el;
                            }
                          };

                          return (
                            <div key={destination.id} ref={refCallback}>
                              {/*
                                View Mode Toggle:
                                The selectedDestination state controls which view is shown:

                                DETAIL MODE (isDaySelected = true):
                                - Triggered when selectedDestination is set and matches this day
                                - All destinations for this day expand into detail panels
                                - User can scroll through panels, with the top one highlighted
                                - Panels above and below the top one are blurred for visual focus
                                - The detail view scroll handler tracks which panel is at the top

                                OVERVIEW MODE (isDaySelected = false):
                                - Default state when selectedDestination is null or doesn't match this day
                                - Destinations display as compact cards
                                - Clicking a card triggers handleDestinationClick to enter detail mode
                              */}
                              {isDaySelected
                                ? (
                                    // DETAIL MODE: Show destination as expanded detail panel
                                    <div
                                      ref={detailPanelRefCallback}
                                      className="overflow-hidden"
                                    >
                                      <DestinationDetailPanel
                                        destination={destination}
                                        onClose={handleBackToOverview}
                                        isBlurred={shouldBlur}
                                        isTop={isTop}
                                      />
                                    </div>
                                  )
                                : (
                                    // OVERVIEW MODE: Show destination as compact card
                                    <div>
                                      <DestinationCard
                                        destination={destination}
                                        isActive={isActive}
                                        onClick={() => handleDestinationClick(destination)}
                                      />
                                    </div>
                                  )}
                            </div>
                          );
                        })
                      )}
                </div>

                {/* Right Panel: Map */}
                <div className="w-full lg:w-[70%] relative order-1 lg:order-2">
                  <div
                    className="sticky top-20 sm:top-24"
                    style={{
                      height: 'calc(100vh - 8rem)',
                      minHeight: '400px',
                    }}
                  >
                    <TourMap
                      destinations={dayDestinations}
                      mapboxAccessToken={mapboxToken}
                      onMarkerClick={handleMarkerClick}
                    />
                  </div>
                </div>
              </div>
            </section>
          );
        })}

      </div>
    </div>
  );
}
