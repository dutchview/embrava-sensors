"use client";

import { EmployeeForm } from "@/components/employees/employee-form";

export default function NewEmployeePage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Create Employee</h1>
        <p className="text-muted-foreground mt-2">
          Add a new employee with RFID badge information
        </p>
      </div>

      <div className="max-w-2xl">
        <EmployeeForm />
      </div>
    </div>
  );
}
