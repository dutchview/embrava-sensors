import { EventList } from '@/components/events/event-list';

export default function EventsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Events</h1>
        <p className="text-muted-foreground">
          View incoming events from Embrava sensors. Events refresh automatically.
        </p>
      </div>
      <EventList />
    </div>
  );
}
