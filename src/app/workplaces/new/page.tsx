import { WorkplaceForm } from '@/components/workplaces/workplace-form';

export default function NewWorkplacePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">New Workplace</h1>
        <p className="text-muted-foreground">
          Add a new workspace configuration for an Embrava Desk Sign
        </p>
      </div>
      <WorkplaceForm />
    </div>
  );
}
