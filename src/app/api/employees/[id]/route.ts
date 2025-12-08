import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase, Employee } from '@/lib/db';
import { z } from 'zod';

// Validation schema for updating an employee
const employeeUpdateSchema = z.object({
    firstName: z.string().min(1, 'First name is required').optional(),
    lastName: z.string().min(1, 'Last name is required').optional(),
    email: z.string().email('Invalid email address').optional(),
    employeeId: z.string().min(1, 'Employee ID is required').optional(),
    badgeNumber: z.string().min(1, 'Badge number is required').optional(),
});

/**
 * GET /api/employees/[id]
 *
 * Get a single employee by ID.
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await connectToDatabase();

        const employee = await Employee.findById(id);

        if (!employee) {
            return NextResponse.json(
                { error: 'Employee not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(employee);
    } catch (error) {
        console.error('Error fetching employee:', error);
        return NextResponse.json(
            { error: 'Failed to fetch employee' },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/employees/[id]
 *
 * Update an employee.
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();

        // Validate input
        const validationResult = employeeUpdateSchema.safeParse(body);
        if (!validationResult.success) {
            return NextResponse.json(
                {
                    error: 'Validation failed',
                    details: validationResult.error.flatten().fieldErrors,
                },
                { status: 400 }
            );
        }

        await connectToDatabase();

        const employee = await Employee.findById(id);

        if (!employee) {
            return NextResponse.json(
                { error: 'Employee not found' },
                { status: 404 }
            );
        }

        // Check for unique constraints
        if (validationResult.data.email && validationResult.data.email !== employee.email) {
            const existingEmail = await Employee.findOne({
                email: validationResult.data.email,
                _id: { $ne: id },
            });

            if (existingEmail) {
                return NextResponse.json(
                    { error: 'An employee with this email already exists' },
                    { status: 409 }
                );
            }
        }

        if (validationResult.data.employeeId && validationResult.data.employeeId !== employee.employeeId) {
            const existingEmployeeId = await Employee.findOne({
                employeeId: validationResult.data.employeeId,
                _id: { $ne: id },
            });

            if (existingEmployeeId) {
                return NextResponse.json(
                    { error: 'An employee with this employee ID already exists' },
                    { status: 409 }
                );
            }
        }

        if (validationResult.data.badgeNumber && validationResult.data.badgeNumber !== employee.badgeNumber) {
            const existingBadgeNumber = await Employee.findOne({
                badgeNumber: validationResult.data.badgeNumber,
                _id: { $ne: id },
            });

            if (existingBadgeNumber) {
                return NextResponse.json(
                    { error: 'An employee with this badge number already exists' },
                    { status: 409 }
                );
            }
        }

        // Update employee
        Object.assign(employee, validationResult.data);
        await employee.save();

        return NextResponse.json(employee);
    } catch (error) {
        console.error('Error updating employee:', error);
        return NextResponse.json(
            { error: 'Failed to update employee' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/employees/[id]
 *
 * Delete an employee.
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await connectToDatabase();

        const employee = await Employee.findByIdAndDelete(id);

        if (!employee) {
            return NextResponse.json(
                { error: 'Employee not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting employee:', error);
        return NextResponse.json(
            { error: 'Failed to delete employee' },
            { status: 500 }
        );
    }
}
