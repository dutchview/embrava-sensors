import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { WorkplaceTable } from '@/components/workplaces/workplace-table';
import { Plus } from 'lucide-react';

export default function WorkplacesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Workplaces</h1>
          <p className="text-muted-foreground">
            Manage workspace configurations linked to Embrava Desk Signs
          </p>
        </div>
        <Button asChild>
          <Link href="/workplaces/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Workplace
          </Link>
        </Button>
      </div>
      <WorkplaceTable />
    </div>
  );
}
