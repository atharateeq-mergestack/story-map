'use client';

import type React from 'react';

import { ArrowRight, Calendar, MapPin } from 'lucide-react';
import { Heading } from '@/components/ui/common/Heading';
import { Text } from '@/components/ui/common/Text';
import { formatDate } from '@/lib/utils';

type Tour = {
  id: string;
  name: string;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  startLocation: string | null;
  endLocation: string | null;
};

type TourHeroProps = {
  tour: Tour;
  totalDays: number;
  backgroundImageUrl?: string;
};

export const TourHero = ({
  ref,
  tour,
  totalDays,
  backgroundImageUrl,
}: TourHeroProps & { ref?: React.RefObject<HTMLDivElement | null> }) => {
  return (
    <section
      ref={ref}
      className="relative min-h-screen w-full flex items-center justify-center overflow-hidden"
      style={
        backgroundImageUrl
          ? {
              backgroundImage: `linear-gradient(135deg, rgba(53, 78, 104, 0.75) 0%, rgba(61, 98, 81, 0.75) 100%), url('${backgroundImageUrl}')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }
          : undefined
      }
    >
      {!backgroundImageUrl && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/5 to-background" />
      )}

      <div className="relative z-10 w-full px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex justify-center mb-8 sm:mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
              <span className="w-2 h-2 rounded-full bg-accent"></span>
              <Text size="sm" className="text-white/80 font-medium">
                Unforgettable Journey
              </Text>
            </div>
          </div>

          <div className="text-center space-y-6 mb-12 sm:mb-16">
            <Heading
              level={1}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white text-balance leading-tight"
            >
              {tour.name}
            </Heading>

            {tour.description && (
              <Text className="text-lg sm:text-xl md:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed text-balance">
                {tour.description}
              </Text>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {/* Route Card */}
            {tour.startLocation && tour.endLocation && (
              <div className="group bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 sm:p-8 hover:bg-white/15 transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-white/20 text-white mt-1">
                    <MapPin size={24} />
                  </div>
                  <div className="flex-1">
                    <Text size="sm" className="text-white/60 uppercase tracking-wide font-semibold mb-4">
                      Route
                    </Text>
                    <div className="flex items-center gap-3 text-white">
                      <div className="flex-1">
                        <Text size="sm" className="text-white/70 mb-1">
                          From
                        </Text>
                        <Text className="font-semibold text-lg text-white">{tour.startLocation}</Text>
                      </div>
                      <ArrowRight size={20} className="text-white/50 shrink-0 mt-6" />
                      <div className="flex-1">
                        <Text size="sm" className="text-white/70 mb-1">
                          To
                        </Text>
                        <Text className="font-semibold text-lg text-white">{tour.endLocation}</Text>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Dates Card */}
            {tour.startDate && tour.endDate && (
              <div className="group bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 sm:p-8 hover:bg-white/15 transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-white/20 text-white mt-1">
                    <Calendar size={24} />
                  </div>
                  <div className="flex-1">
                    <Text size="sm" className="text-white/60 uppercase tracking-wide font-semibold mb-4">
                      Timeline
                    </Text>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Text size="sm" className="text-white/70">
                          Start
                        </Text>
                        <Text className="font-semibold text-white">{formatDate(tour.startDate)}</Text>
                      </div>
                      {totalDays > 0 && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Text size="sm" className="text-white/70">
                              Duration
                            </Text>
                          </div>
                          <Text className="font-semibold text-accent">
                            {totalDays}
                            {' '}
                            {totalDays === 1 ? 'Day' : 'Days'}
                          </Text>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <Text size="sm" className="text-white/70">
                          End
                        </Text>
                        <Text className="font-semibold text-white">{formatDate(tour.endDate)}</Text>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

TourHero.displayName = 'TourHero';
