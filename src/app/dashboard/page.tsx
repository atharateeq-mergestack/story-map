import { and, desc, eq } from 'drizzle-orm';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import {
  DashboardActionsOnly,
  DashboardFilterProvider,
  DashboardWithFilters,
} from '@/components/dashboard/DashboardWithFilters';
import { AnimatedWrapper } from '@/components/ui/animated';
import { db } from '@/db';
import { tours } from '@/db/schema';

async function getTours() {
  try {
    const allTours = await db
      .select()
      .from(tours)
      .where(eq(tours.isDeleted, false))
      .orderBy(desc(tours.createdAt));
    return allTours;
  } catch (error) {
    console.error('Error fetching tours:', error);
    return [];
  }
}

async function getActiveTourId() {
  try {
    const activeTour = await db
      .select({ id: tours.id })
      .from(tours)
      .where(and(eq(tours.status, 'active'), eq(tours.isDeleted, false)))
      .limit(1);
    return activeTour[0]?.id || null;
  } catch {
    return null;
  }
}

export default async function DashboardPage() {
  const allTours = await getTours();
  const activeTourId = await getActiveTourId();

  return (
    <div className="min-h-screen bg-linear-to-br from-background via-background-secondary to-background p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 md:space-y-8">
        <DashboardFilterProvider>
          {/* Header */}
          <AnimatedWrapper direction="down" delay={0}>
            <div className="flex flex-col md:flex-row items-start justify-between gap-4">
              <DashboardHeader />
              <div className="flex w-full md:w-auto justify-end md:justify-end">
                <DashboardActionsOnly />
              </div>
            </div>
          </AnimatedWrapper>

          {/* Tours Table with Filters */}
          <AnimatedWrapper direction="up" delay={100}>
            <DashboardWithFilters tours={allTours} activeTourId={activeTourId} />
          </AnimatedWrapper>
        </DashboardFilterProvider>
      </div>
    </div>
  );
}
