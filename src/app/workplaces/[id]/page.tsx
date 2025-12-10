'use client';

import { use } from 'react';
import { useWorkplace } from '@/lib/hooks/use-workplaces';
import { WorkplaceForm } from '@/components/workplaces/workplace-form';
import { WorkplaceBookings } from '@/components/workplaces/workplace-bookings';
import { WorkplaceEvents } from '@/components/workplaces/workplace-events';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Calendar, Activity } from 'lucide-react';

interface EditWorkplacePageProps {
  params: Promise<{ id: string }>;
}

export default function EditWorkplacePage({ params }: EditWorkplacePageProps) {
  const { id } = use(params);
  const { workplace, isLoading, isError } = useWorkplace(id);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-5 w-96 mt-2" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (isError || !workplace) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Workplace Not Found</h1>
          <p className="text-muted-foreground">
            The requested workplace could not be found.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{workplace.deskName}</h1>
        <p className="text-muted-foreground">
          DeskSignID: {workplace.deskSignId}
        </p>
      </div>

      <Tabs defaultValue="configuration" className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="configuration" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configuration
          </TabsTrigger>
          <TabsTrigger value="bookings" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Bookings
          </TabsTrigger>
          <TabsTrigger value="events" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Events
          </TabsTrigger>
        </TabsList>

        <TabsContent value="configuration" className="mt-6">
          <WorkplaceForm workplace={workplace} isEditing />
        </TabsContent>

        <TabsContent value="bookings" className="mt-6">
          <WorkplaceBookings workplaceId={id} deskSignId={workplace.deskSignId} />
        </TabsContent>

        <TabsContent value="events" className="mt-6">
          <WorkplaceEvents workplaceId={id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
