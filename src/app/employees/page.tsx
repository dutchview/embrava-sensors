"use client";

import { Button } from "@/components/ui/button";
import { EmployeeTable } from "@/components/employees/employee-table";
import { useEmployees } from "@/lib/hooks";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function EmployeesPage() {
  const router = useRouter();
  const { employees, isLoading, mutate } = useEmployees();

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <Skeleton className="h-8 w-32 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-40" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Employees</h1>
          <p className="text-muted-foreground mt-2">
            Manage employees and their RFID badges for Embrava check-ins
          </p>
        </div>
        <Button onClick={() => router.push("/employees/new")}>
          <Plus className="mr-2 h-4 w-4" />
          Add Employee
        </Button>
      </div>

      <EmployeeTable employees={employees} onDelete={mutate} />
    </div>
  );
}
