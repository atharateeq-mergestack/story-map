'use client';

import { X } from 'lucide-react';
import moment from 'moment';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Text } from '@/components/ui/common/Text';
import { cn, formatDate } from '@/lib/utils';
import { Env } from '@/libs/Env';
import destinationController from '@/store/destinationController';
import { DestinationCard } from '../DestinationCard';
import { TourHero } from '../TourHero';
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

type TourViewDesktopProps = {
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
 * TourViewDesktop Component
 *
 * Desktop version of tour view with destinations organized by date. Two view modes:
 * - Overview: destination cards
 * - Detail: expanded panels when a destination is selected
 */
export function TourViewDesktop({ tour, destinationsByDate, dates }: TourViewDesktopProps) {
  // State: activeDate (current date in nav), selectedDestinationId (triggers detail mode), topDestinationId (top panel in detail view)
  const selectedDestinationId = destinationController.useScopeState('selectedDestinationId')[0];
  const activeDate = destinationController.useScopeState('activeDate')[0];
  const [topDestinationId, setTopDestinationId] = useState<string | null>(null);

  // Refs for scroll tracking and preventing unnecessary updates
  const prevTopDestinationIdRef = useRef<string | null>(null);
  const scrollHandlerRef = useRef<(() => void) | null>(null);
  const prevScrollYRef = useRef<number>(0);
  const isAutoScrollingRef = useRef<boolean>(false);
  const autoScrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isProgrammaticSelectionRef = useRef<boolean>(false);
  const lastScrollTimeRef = useRef<number>(0);
  const lastScrollYRef = useRef<number>(0);
  const lastScrollDirectionRef = useRef<'up' | 'down' | null>(null);

  // DOM refs: nav (date nav bar), daySectionRefs (date detection), destinationRefs (cards), detailPanelRefs (panels)
  const navRef = useRef<HTMLDivElement>(null);
  const daySectionRefs = useRef<Record<string, HTMLDivElement>>({});
  const destinationRefs = useRef<Record<string, HTMLDivElement>>({});
  const detailPanelRefs = useRef<Record<string, HTMLDivElement>>({});
  const mapboxToken = Env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

  const allDestinations = dates.flatMap(date => destinationsByDate[date] || []);
  const totalDays = calculateTotalDays(tour.startDate, tour.endDate);

  // Get selected destination object from ID
  const selectedDestination = selectedDestinationId
    ? allDestinations.find(d => d.id === selectedDestinationId) || null
    : null;

  // Initialize activeDate to first date on mount
  useEffect(() => {
    if (!activeDate && dates.length > 0) {
      destinationController.setActiveDate(dates[0] ?? null);
    }
    // Init scroll position
    prevScrollYRef.current = window.scrollY;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Clear selectedDestinationId if its date doesn't match activeDate
  useEffect(() => {
    if (!activeDate || !selectedDestinationId) {
      return;
    }

    const destination = allDestinations.find(d => d.id === selectedDestinationId);
    // Clear selection if date mismatch
    if (destination && destination.date !== activeDate) {
      destinationController.clearSelectedDestination();
      // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect
      setTopDestinationId(null);
      prevTopDestinationIdRef.current = null;
    }
  }, [activeDate, selectedDestinationId, allDestinations]);

  // Track top destination panel in detail view as user scrolls (only runs when selectedDestination is set)
  useEffect(() => {
    if (!selectedDestination) {
      // Clean up when exiting detail view
      if (scrollHandlerRef.current) {
        window.removeEventListener('scroll', scrollHandlerRef.current);
        scrollHandlerRef.current = null;
      }
      prevTopDestinationIdRef.current = null;
      return;
    }

    // Get destinations for selected day
    const dayDestinations = destinationsByDate[selectedDestination.date] || [];
    if (dayDestinations.length === 0) {
      return;
    }

    // Reset tracking on selection change
    prevTopDestinationIdRef.current = null;

    const handleScroll = () => {
      // Skip updates if destination was set programmatically (not by user scroll)
      if (isProgrammaticSelectionRef.current) {
        return;
      }

      // 2️⃣ Capture current scroll values
      const currentTime = Date.now();
      const currentScrollY = window.scrollY;

      const SCROLL_EPSILON = 2;

      const deltaY = currentScrollY - lastScrollYRef.current;

      const isStationary = Math.abs(deltaY) < SCROLL_EPSILON;

      // Update direction ONLY when user actually scrolls
      if (!isStationary) {
        lastScrollDirectionRef.current
          = deltaY > 0 ? 'down' : 'up';
      }

      // Effective direction (stationary inherits last direction)
      const effectiveScrollDirection = isStationary
        ? lastScrollDirectionRef.current
        : deltaY > 0
          ? 'down'
          : 'up';

      const isScrollingDownOrStationary
        = effectiveScrollDirection === 'down';

      // 4️⃣ Fast-scroll guard (uses old ref values — correct)
      const timeDelta = currentTime - lastScrollTimeRef.current;
      const scrollDelta = Math.abs(deltaY);

      // 5️⃣ Update scroll refs AFTER calculations
      lastScrollTimeRef.current = currentTime;
      lastScrollYRef.current = currentScrollY;

      // 6️⃣ Skip if scrolling too fast
      if (timeDelta > 0 && timeDelta < 100 && scrollDelta > 200) {
        return;
      }

      // 7️⃣ Check current date section visibility
      const selectedDateSection
        = daySectionRefs.current[selectedDestination.date];
      if (!selectedDateSection) {
        return;
      }

      const sectionRect = selectedDateSection.getBoundingClientRect();
      if (sectionRect.bottom < 0 || sectionRect.top > window.innerHeight) {
        return;
      }

      // 🔟 LAST-DESTINATION GUARD (USES DIRECTION)
      const isLastDestination
        = selectedDestinationId
          === dayDestinations[dayDestinations.length - 1]?.id;
      if (isLastDestination && isScrollingDownOrStationary) {
        return;
      }

      let topPanelId: string | null = null;
      let minTop = Infinity; // Closest panel to viewport top

      // Find panel closest to viewport top
      dayDestinations.forEach((dest) => {
        const panel = detailPanelRefs.current[dest.id];
        if (panel) {
          const rect = panel.getBoundingClientRect();
          if (rect.top >= 0 && rect.top < minTop && rect.bottom > 0) {
            minTop = rect.top;
            topPanelId = dest.id;
          }
        }
      });

      // Fallback: use first panel if none at top
      if (!topPanelId && dayDestinations.length > 0) {
        topPanelId = dayDestinations[0]?.id || null;
      }

      // 1️⃣1️⃣ Update only if changed
      if (topPanelId !== prevTopDestinationIdRef.current && topPanelId) {
        prevTopDestinationIdRef.current = topPanelId;
        // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect
        setTopDestinationId(topPanelId);
        destinationController.setSelectedDestination(topPanelId);
      }
    };

    // Store handler for cleanup
    scrollHandlerRef.current = handleScroll;

    // Init scroll tracking
    lastScrollTimeRef.current = Date.now();
    lastScrollYRef.current = window.scrollY;

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDestination, destinationsByDate]);

  // Check if all destinations for a day have scrolled past viewport
  const areAllDestinationsScrolledPast = useCallback((date: string, isDetailMode: boolean): boolean => {
    const dayDestinations = destinationsByDate[date] || [];
    if (dayDestinations.length === 0) {
      // If no destinations, check if day section is past
      const daySection = daySectionRefs.current[date];
      if (!daySection) {
        return true;
      }
      const sectionRect = daySection.getBoundingClientRect();
      return sectionRect.bottom < 0;
    }

    // Check if any destination still visible (panels in detail mode, cards in overview)
    const refsToCheck = isDetailMode ? detailPanelRefs.current : destinationRefs.current;

    for (const dest of dayDestinations) {
      const element = refsToCheck[dest.id];
      if (element) {
        const rect = element.getBoundingClientRect();
        // If visible, day hasn't scrolled past
        if (rect.bottom > 0) {
          return false;
        }
      }
    }

    // All scrolled past
    return true;
  }, [destinationsByDate]);

  // Date navigation: updates activeDate based on scroll, blocks updates until all destinations of current day scroll past
  useEffect(() => {
    const handleScroll = () => {
      // Skip updates if destination was set programmatically (not by user scroll)
      if (isProgrammaticSelectionRef.current) {
        return;
      }

      const currentScrollY = window.scrollY;
      const isScrollingDown = currentScrollY > prevScrollYRef.current;
      const scrollDelta = Math.abs(currentScrollY - prevScrollYRef.current);
      prevScrollYRef.current = currentScrollY;

      // Reset auto-scroll flag if user scrolling
      if (scrollDelta > 10 && isAutoScrollingRef.current) {
        isAutoScrollingRef.current = false;
        if (autoScrollTimeoutRef.current) {
          clearTimeout(autoScrollTimeoutRef.current);
          autoScrollTimeoutRef.current = null;
        }
      }

      const isAutoScrolling = isAutoScrollingRef.current;

      // Find day section at top of viewport
      let currentActiveIndex = 0;
      for (let i = 0; i < dates.length; i++) {
        const key = dates[i] as keyof typeof daySectionRefs.current;
        const section = daySectionRefs.current[key];
        if (section) {
          const rect = section.getBoundingClientRect();
          // Active if within 100px of top
          if (rect.top <= 100) {
            currentActiveIndex = i;
          }
        }
      }
      const candidateActiveDate = dates[currentActiveIndex] || null;

      // Block activeDate update when scrolling down until all destinations scroll past (allow immediate update when scrolling up)
      if (activeDate && isScrollingDown) {
        const isDetailMode = selectedDestination?.date === activeDate;
        const allDestinationsPast = areAllDestinationsScrolledPast(activeDate, isDetailMode);

        // Block update if still scrolling through destinations
        if (!allDestinationsPast) {
          return;
        }
      }

      // Update activeDate if all destinations past and date changed
      if (candidateActiveDate && activeDate !== candidateActiveDate) {
        // Clear selection if moving to different date
        if (!isAutoScrolling && selectedDestination && selectedDestination.date !== candidateActiveDate) {
          destinationController.clearSelectedDestination();
          // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect
          setTopDestinationId(null);
          prevTopDestinationIdRef.current = null;
        }

        // Update activeDate
        destinationController.setActiveDate(candidateActiveDate);
      }
    };

    // Attach scroll listener with passive flag for better performance
    window.addEventListener('scroll', handleScroll, { passive: true });
    // Call immediately to set initial state
    handleScroll();

    // Cleanup: Remove scroll listener when component unmounts or dependencies change
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (autoScrollTimeoutRef.current) {
        clearTimeout(autoScrollTimeoutRef.current);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDate]);

  // Handle destination card click: enter detail mode, update state, scroll to panel
  const handleDestinationClick = (destination: Destination) => {
    // Set flag to prevent scroll handler from updating selection
    isProgrammaticSelectionRef.current = true;

    destinationController.setSelectedDestination(destination.id);
    destinationController.setActiveDate(destination.date);
    setTopDestinationId(destination.id);

    // Scroll to panel after DOM updates
    setTimeout(() => {
      const firstPanel = detailPanelRefs.current[destination.id];
      if (firstPanel) {
        const navHeight = navRef.current?.offsetHeight || 0;
        const elementPosition = firstPanel.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({
          top: elementPosition - navHeight + 5,
          behavior: 'smooth',
        });
        // Clear flag after scroll completes
        setTimeout(() => {
          isProgrammaticSelectionRef.current = false;
        }, 600);
      } else {
        // If panel not found, clear flag immediately
        isProgrammaticSelectionRef.current = false;
      }
    }, 100);
  };

  // Handle map marker click: same as destination click
  const handleMarkerClick = (destinationId: string) => {
    const destination = allDestinations.find(d => d.id === destinationId);
    if (!destination) {
      return;
    }

    // Set flag to prevent scroll handler from updating selection
    isProgrammaticSelectionRef.current = true;

    destinationController.setSelectedDestination(destination.id);
    destinationController.setActiveDate(destination.date);
    setTopDestinationId(destination.id);

    // Scroll to panel after DOM updates
    setTimeout(() => {
      const firstPanel = detailPanelRefs.current[destination.id];
      if (firstPanel) {
        const navHeight = navRef.current?.offsetHeight || 0;
        const elementPosition = firstPanel.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({
          top: elementPosition - navHeight + 5,
          behavior: 'smooth',
        });
        // Clear flag after scroll completes
        setTimeout(() => {
          isProgrammaticSelectionRef.current = false;
        }, 600);
      } else {
        // If panel not found, clear flag immediately
        isProgrammaticSelectionRef.current = false;
      }
    }, 100);
  };

  // Exit detail view: clear selection to return to overview mode
  const handleBackToOverview = () => {
    destinationController.clearSelectedDestination();
    setTopDestinationId(null);
  };

  // Handle date nav click: scroll to day section, update activeDate, ensure overview mode
  const handleDateClick = (date: string) => {
    isProgrammaticSelectionRef.current = true;
    const section = daySectionRefs.current[date];
    if (section) {
      const navHeight = navRef.current?.offsetHeight || 0;
      const elementPosition = section.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top: elementPosition - navHeight + 5,
        behavior: 'smooth',
      });
      destinationController.setActiveDate(date);
      // Return to overview mode
      destinationController.clearSelectedDestination();
      setTopDestinationId(null);
    }
    setTimeout(() => {
      isProgrammaticSelectionRef.current = false;
    }, 600);
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
      <TourHero
        tour={tour}
        totalDays={totalDays}
        backgroundImageUrl="/worldwide-tour.jpg"
      />
      {dates.length > 0 && (
        <nav
          ref={navRef}
          className="sticky top-[-8px] z-40 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 shadow-sm"
        >
          <div className="container mx-auto px-3 sm:px-4">
            <div className="flex h-14 sm:h-16 items-center gap-2 sm:gap-3 overflow-x-auto py-2">
              {dates.map((date) => {
                const isActive = activeDate === date;
                return (
                  <Button
                    key={date}
                    variant={isActive ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleDateClick(date)}
                    className={cn(
                      'whitespace-nowrap shrink-0 flex items-center gap-2 px-3 sm:px-4 h-9 sm:h-10 transition-all',
                      isActive && 'shadow-md',
                    )}
                  >
                    <span className="text-xs sm:text-sm font-medium">
                      {formatDate(date)}
                    </span>
                  </Button>
                );
              })}
            </div>
          </div>
        </nav>
      )}

      <div className="">
        {dates.map((date, dayIndex) => {
          const dayDestinations = destinationsByDate[date] || [];
          const dayNumber = dayIndex + 1;
          // isDaySelected: true = detail mode (panels), false = overview mode (cards)
          const isDaySelected = selectedDestination?.date === date;

          return (
            <section
              key={date}
              ref={(el: HTMLDivElement | null) => {
                if (el) {
                  daySectionRefs.current[date] = el;
                }
              }}
            >
              {/* Sticky Day Heading */}
              <div className="sticky top-0 bg-background z-10 border-b border-foreground/10 p-1">
                <div className="flex items-center gap-3 sm:gap-4">
                  {/* Day Number Badge */}
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary text-primary-foreground font-bold text-lg sm:text-xl shrink-0">
                    {dayNumber}
                  </div>

                  {/* Date Text */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                    <span className="text-sm sm:text-base font-medium text-muted-foreground uppercase tracking-wide">
                      Day
                      {' '}
                      {dayNumber}
                    </span>
                    <span className="hidden sm:inline text-muted-foreground">•</span>
                    <span className="text-base sm:text-lg font-semibold text-foreground">
                      {formatDate(date)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col lg:flex-row">
                {/* Left Panel: Destinations / Detail Panel */}
                <div className="relative w-full lg:w-[30%] order-2 lg:order-1 space-y-3 sm:space-y-4">
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
                          // isTop: panel at top of viewport (for highlighting and map sync)
                          const isTop = topDestinationId === destination.id;
                          const isActive = selectedDestinationId === destination.id;

                          // Blur all panels except top one in detail view for visual focus
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
                              {/* Toggle between detail mode (panels) and overview mode (cards) based on selectedDestinationId */}
                              {isDaySelected
                                ? (
                                    // Detail mode: expanded panel
                                    <div
                                      ref={detailPanelRefCallback}
                                      className="overflow-hidden"
                                    >
                                      <DestinationDetailPanel
                                        destination={destination}
                                        isBlurred={shouldBlur}
                                        isTop={isTop}
                                      />
                                    </div>
                                  )
                                : (
                                    // Overview mode: compact card
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

                  {/* Close button: visible in detail mode */}
                  {isDaySelected && (
                    <div className="sticky bottom-4 z-50 flex justify-center mt-4">
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={handleBackToOverview}
                        className="gap-2 rounded-full shadow-lg"
                      >
                        <X size={20} />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Right Panel: Map */}
                <div className="w-full lg:w-[70%] relative order-1 lg:order-2">
                  <div
                    className="sticky top-15"
                    style={{
                      height: 'calc(100vh - 4rem)',
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
