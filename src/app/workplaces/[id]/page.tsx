'use client';

import { use } from 'react';
import { useWorkplace } from '@/lib/hooks/use-workplaces';
import { WorkplaceForm } from '@/components/workplaces/workplace-form';
import { Skeleton } from '@/components/ui/skeleton';

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
        <h1 className="text-3xl font-bold tracking-tight">Edit Workplace</h1>
        <p className="text-muted-foreground">
          Update configuration for {workplace.deskName}
        </p>
      </div>
      <WorkplaceForm workplace={workplace} isEditing />
    </div>
  );
}
