"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import type { IEmployee } from "@/lib/db";
import { Loader2 } from "lucide-react";

interface EmployeeFormProps {
  employee?: IEmployee;
  isEditing?: boolean;
}

export function EmployeeForm({
  employee,
  isEditing = false,
}: EmployeeFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    firstName: employee?.firstName || "",
    lastName: employee?.lastName || "",
    email: employee?.email || "",
    employeeId: employee?.employeeId || "",
    badgeNumber: employee?.badgeNumber || "",
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const url = isEditing
        ? `/api/employees/${employee?._id}`
        : "/api/employees";
      const method = isEditing ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save employee");
      }

      toast.success(
        isEditing
          ? "Employee updated successfully"
          : "Employee created successfully"
      );
      router.push("/employees");
      router.refresh();
    } catch (error) {
      console.error("Error saving employee:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to save employee"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-6">
            {/* Personal Information */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleChange("firstName", e.target.value)}
                  required
                  placeholder="John"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleChange("lastName", e.target.value)}
                  required
                  placeholder="Doe"
                />
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                required
                placeholder="john.doe@example.com"
              />
            </div>

            {/* IDs */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="employeeId">Employee ID *</Label>
                <Input
                  id="employeeId"
                  value={formData.employeeId}
                  onChange={(e) => handleChange("employeeId", e.target.value)}
                  required
                  placeholder="EMP001"
                />
                <p className="text-xs text-muted-foreground">
                  Unique identifier for this employee
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="badgeNumber">Badge Number (RFID) *</Label>
                <Input
                  id="badgeNumber"
                  value={formData.badgeNumber}
                  onChange={(e) => handleChange("badgeNumber", e.target.value)}
                  required
                  placeholder="BADGE001"
                />
                <p className="text-xs text-muted-foreground">
                  RFID badge number for Embrava check-in
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isEditing ? "Update Employee" : "Create Employee"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/employees")}
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
