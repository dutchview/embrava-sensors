"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useWorkplaces, useEmployees } from "@/lib/hooks";

export function BookingForm() {
  const router = useRouter();
  const { workplaces, isLoading: loadingWorkplaces } = useWorkplaces();
  const { employees, isLoading: loadingEmployees } = useEmployees();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get default times: 9am today and 5pm today
  const getDefaultStartTime = () => {
    const now = new Date();
    now.setHours(9, 0, 0, 0);
    return now.toISOString().slice(0, 16);
  };

  const getDefaultEndTime = () => {
    const now = new Date();
    now.setHours(17, 0, 0, 0);
    return now.toISOString().slice(0, 16);
  };

  const [formData, setFormData] = useState({
    deskSignId: "",
    employeeId: "",
    startTime: getDefaultStartTime(),
    endTime: getDefaultEndTime(),
  });

  const selectedEmployee = employees.find(
    (emp) => emp._id === formData.employeeId
  );

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!selectedEmployee) {
      toast.error("Please select an employee");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          deskSignId: formData.deskSignId,
          firstName: selectedEmployee.firstName,
          lastName: selectedEmployee.lastName,
          startTime: formData.startTime,
          endTime: formData.endTime,
          badgeNumber: selectedEmployee.badgeNumber,
          employeeId: selectedEmployee.employeeId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create booking");
      }

      toast.success("Booking created successfully");
      router.push("/bookings");
      router.refresh();
    } catch (error) {
      console.error("Error creating booking:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create booking"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = loadingWorkplaces || loadingEmployees;

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-6">
            {/* Workplace Selection */}
            <div className="space-y-2">
              <Label htmlFor="deskSignId">Workplace *</Label>
              <Select
                value={formData.deskSignId}
                onValueChange={(value) => handleChange("deskSignId", value)}
                disabled={isLoading}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a workplace" />
                </SelectTrigger>
                <SelectContent>
                  {workplaces.map((workplace) => (
                    <SelectItem
                      key={workplace.deskSignId}
                      value={workplace.deskSignId}
                    >
                      {workplace.deskName} ({workplace.deskSignId})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Employee Selection */}
            <div className="space-y-2">
              <Label htmlFor="employeeId">Employee *</Label>
              <Select
                value={formData.employeeId}
                onValueChange={(value) => handleChange("employeeId", value)}
                disabled={isLoading}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee._id} value={employee._id}>
                      {employee.firstName} {employee.lastName} ({employee.email}
                      )
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedEmployee && (
                <p className="text-xs text-muted-foreground">
                  Badge: {selectedEmployee.badgeNumber} | ID:{" "}
                  {selectedEmployee.employeeId}
                </p>
              )}
            </div>

            {/* Time Selection */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time *</Label>
                <Input
                  id="startTime"
                  type="datetime-local"
                  value={formData.startTime}
                  onChange={(e) => handleChange("startTime", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endTime">End Time *</Label>
                <Input
                  id="endTime"
                  type="datetime-local"
                  value={formData.endTime}
                  onChange={(e) => handleChange("endTime", e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={isSubmitting || isLoading}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create Booking
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/bookings")}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
