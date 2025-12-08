"use client";

import { use } from "react";
import { EmployeeForm } from "@/components/employees/employee-form";
import { useEmployee } from "@/lib/hooks";
import { Skeleton } from "@/components/ui/skeleton";

export default function EditEmployeePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { employee, isLoading } = useEmployee(id);

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="max-w-2xl">
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Employee not found</h1>
          <p className="text-muted-foreground mt-2">
            The employee you're looking for doesn't exist.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Edit Employee</h1>
        <p className="text-muted-foreground mt-2">
          Update employee information and RFID badge
        </p>
      </div>

      <div className="max-w-2xl">
        <EmployeeForm employee={employee} isEditing />
      </div>
    </div>
  );
}
