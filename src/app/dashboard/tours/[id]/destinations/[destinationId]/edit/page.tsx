import { and, eq } from 'drizzle-orm';
import { ArrowLeftIcon } from 'lucide-react';
import { notFound } from 'next/navigation';
import { EditDestinationForm } from '@/components/dashboard/EditDestinationForm';
import { Button } from '@/components/ui/button';
import { NavigationLink } from '@/components/ui/navigation-link';
import { db } from '@/db';
import { destinations } from '@/db/schema';

async function getDestination(id: string) {
  try {
    const destination = await db
      .select()
      .from(destinations)
      .where(and(eq(destinations.id, id), eq(destinations.isDeleted, false)))
      .limit(1);
    return destination[0] || null;
  } catch (error) {
    console.error('Error fetching destination:', error);
    return null;
  }
}

export default async function EditDestinationPage({
  params,
}: {
  params: Promise<{ id: string; destinationId: string }>;
}) {
  const { id: tourId, destinationId } = await params;
  const destination = await getDestination(destinationId);

  if (!destination) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background-secondary to-background p-4 sm:p-6 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6 sm:space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <NavigationLink href={`/dashboard/tours/${tourId}`} message="Loading...">
            <Button variant="outline" size="sm" className="shadow-sm hover:shadow-md transition-all duration-300 text-xs sm:text-sm w-full sm:w-auto">
              <ArrowLeftIcon className="size-3 sm:size-4 mr-1.5 sm:mr-2" />
              Back to Tour
            </Button>
          </NavigationLink>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Edit Destination</h1>
        </div>

        <EditDestinationForm destination={destination} tourId={tourId} />
      </div>
    </div>
  );
}
