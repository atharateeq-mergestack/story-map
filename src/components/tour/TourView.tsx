'use client';

import { useEffect, useState } from 'react';
import { TourViewDesktop } from './desktop/TourViewDesktop';
import { TourViewMobile } from './mobile/TourViewMobile';

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
  accountForMainNav?: boolean;
};

/**
 * TourView Component
 *
 * Conditionally renders mobile or desktop version based on screen size (≤1000px = mobile)
 */
export function TourView({ tour, destinationsByDate, dates, accountForMainNav = false }: TourViewProps) {
  // Detect screen size for mobile/desktop rendering
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect
      setIsMobile(window.innerWidth <= 1000);
    };

    // Check on mount
    checkScreenSize();

    // Listen for resize events
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Render mobile version for screens ≤1000px
  if (isMobile) {
    return <TourViewMobile tour={tour} destinationsByDate={destinationsByDate} dates={dates} accountForMainNav={accountForMainNav} />;
  }

  // Desktop version
  return <TourViewDesktop tour={tour} destinationsByDate={destinationsByDate} dates={dates} accountForMainNav={accountForMainNav} />;
}
