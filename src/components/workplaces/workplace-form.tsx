'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { AvailabilitySchedule } from './availability-schedule';
import { toast } from 'sonner';
import type { IWorkplace, DayAvailability } from '@/lib/db';
import { Loader2 } from 'lucide-react';

// Common timezones
const TIMEZONES = [
  'Europe/Amsterdam',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Singapore',
  'Australia/Sydney',
  'UTC',
];

interface WorkplaceFormProps {
  workplace?: IWorkplace;
  isEditing?: boolean;
}

const defaultAvailability: DayAvailability = ['true', '00:00:00', '23:59:00'];
const disabledAvailability: DayAvailability = ['false', '00:00:00', '23:59:00'];

export function WorkplaceForm({ workplace, isEditing = false }: WorkplaceFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    deskSignId: workplace?.deskSignId || '',
    deskName: workplace?.deskName || '',
    building: workplace?.building || '',
    floor: workplace?.floor || '',
    neighborhood: workplace?.neighborhood || '',
    timezone: workplace?.timezone || 'Europe/Amsterdam',
    mon: (workplace?.mon as DayAvailability) || defaultAvailability,
    tue: (workplace?.tue as DayAvailability) || defaultAvailability,
    wed: (workplace?.wed as DayAvailability) || defaultAvailability,
    thu: (workplace?.thu as DayAvailability) || defaultAvailability,
    fri: (workplace?.fri as DayAvailability) || defaultAvailability,
    sat: (workplace?.sat as DayAvailability) || defaultAvailability,
    sun: (workplace?.sun as DayAvailability) || defaultAvailability,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const url = isEditing
        ? `/api/workplaces/${workplace?._id}`
        : '/api/workplaces';

      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save workplace');
      }

      toast.success(
        isEditing ? 'Workplace updated successfully' : 'Workplace created successfully'
      );
      router.push('/workplaces');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAvailabilityChange = (
    day: 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun',
    value: DayAvailability
  ) => {
    setFormData((prev) => ({ ...prev, [day]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="deskSignId">DeskSignID *</Label>
              <Input
                id="deskSignId"
                value={formData.deskSignId}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, deskSignId: e.target.value }))
                }
                placeholder="e.g., 3196100023"
                required
              />
              <p className="text-xs text-muted-foreground">
                The unique ID of the Embrava Desk Sign sensor
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="deskName">Desk Name *</Label>
              <Input
                id="deskName"
                value={formData.deskName}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, deskName: e.target.value }))
                }
                placeholder="e.g., 22-03A"
                required
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="building">Building</Label>
              <Input
                id="building"
                value={formData.building}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, building: e.target.value }))
                }
                placeholder="e.g., 23 Downing"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="floor">Floor</Label>
              <Input
                id="floor"
                value={formData.floor}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, floor: e.target.value }))
                }
                placeholder="e.g., 22"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="neighborhood">Neighborhood</Label>
              <Input
                id="neighborhood"
                value={formData.neighborhood}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    neighborhood: e.target.value,
                  }))
                }
                placeholder="e.g., Workplace Strategy"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Select
              value={formData.timezone}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, timezone: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONES.map((tz) => (
                  <SelectItem key={tz} value={tz}>
                    {tz}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <AvailabilitySchedule
            values={{
              mon: formData.mon,
              tue: formData.tue,
              wed: formData.wed,
              thu: formData.thu,
              fri: formData.fri,
              sat: formData.sat,
              sun: formData.sun,
            }}
            onChange={handleAvailabilityChange}
          />
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? 'Update Workplace' : 'Create Workplace'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/workplaces')}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
