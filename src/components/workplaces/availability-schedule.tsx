'use client';

import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { DayAvailability } from '@/lib/db';

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
const DAY_LABELS: Record<(typeof DAYS)[number], string> = {
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
  sun: 'Sunday',
};

interface AvailabilityScheduleProps {
  values: Record<(typeof DAYS)[number], DayAvailability>;
  onChange: (day: (typeof DAYS)[number], value: DayAvailability) => void;
}

export function AvailabilitySchedule({
  values,
  onChange,
}: AvailabilityScheduleProps) {
  const handleToggle = (day: (typeof DAYS)[number], enabled: boolean) => {
    const current = values[day];
    onChange(day, [enabled ? 'true' : 'false', current[1], current[2]]);
  };

  const handleStartChange = (day: (typeof DAYS)[number], time: string) => {
    const current = values[day];
    // Convert HH:mm to HH:mm:ss
    const formattedTime = time ? `${time}:00` : '00:00:00';
    onChange(day, [current[0], formattedTime, current[2]]);
  };

  const handleEndChange = (day: (typeof DAYS)[number], time: string) => {
    const current = values[day];
    // Convert HH:mm to HH:mm:ss
    const formattedTime = time ? `${time}:00` : '00:00:00';
    onChange(day, [current[0], current[1], formattedTime]);
  };

  // Convert HH:mm:ss to HH:mm for input display
  const formatTimeForInput = (time: string) => {
    return time.slice(0, 5);
  };

  return (
    <div className="space-y-4">
      <Label className="text-base font-semibold">Availability Schedule</Label>
      <div className="space-y-3">
        {DAYS.map((day) => {
          const [enabled, start, end] = values[day];
          const isEnabled = enabled === 'true';

          return (
            <div
              key={day}
              className="flex items-center gap-4 p-3 rounded-md border"
            >
              <div className="w-24">
                <Label className="text-sm">{DAY_LABELS[day]}</Label>
              </div>
              <Switch
                checked={isEnabled}
                onCheckedChange={(checked) => handleToggle(day, checked)}
              />
              <div className="flex items-center gap-2 flex-1">
                <Input
                  type="time"
                  value={formatTimeForInput(start)}
                  onChange={(e) => handleStartChange(day, e.target.value)}
                  disabled={!isEnabled}
                  className="w-32"
                />
                <span className="text-muted-foreground">to</span>
                <Input
                  type="time"
                  value={formatTimeForInput(end)}
                  onChange={(e) => handleEndChange(day, e.target.value)}
                  disabled={!isEnabled}
                  className="w-32"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
