import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase, Employee } from '@/lib/db';
import { z } from 'zod';

// Validation schema for creating/updating an employee
const employeeSchema = z.object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: z.string().email('Invalid email address'),
    employeeId: z.string().min(1, 'Employee ID is required'),
    badgeNumber: z.string().min(1, 'Badge number is required'),
});

/**
 * GET /api/employees
 *
 * List all employees.
 */
export async function GET() {
    try {
        await connectToDatabase();
        const employees = await Employee.find({}).sort({ createdAt: -1 });
        return NextResponse.json(employees);
    } catch (error) {
        console.error('Error fetching employees:', error);
        return NextResponse.json(
            { error: 'Failed to fetch employees' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/employees
 *
 * Create a new employee.
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validate input
        const validationResult = employeeSchema.safeParse(body);
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

        // Check if email already exists
        const existingEmail = await Employee.findOne({
            email: validationResult.data.email,
        });

        if (existingEmail) {
            return NextResponse.json(
                { error: 'An employee with this email already exists' },
                { status: 409 }
            );
        }

        // Check if employeeId already exists
        const existingEmployeeId = await Employee.findOne({
            employeeId: validationResult.data.employeeId,
        });

        if (existingEmployeeId) {
            return NextResponse.json(
                { error: 'An employee with this employee ID already exists' },
                { status: 409 }
            );
        }

        // Check if badgeNumber already exists
        const existingBadgeNumber = await Employee.findOne({
            badgeNumber: validationResult.data.badgeNumber,
        });

        if (existingBadgeNumber) {
            return NextResponse.json(
                { error: 'An employee with this badge number already exists' },
                { status: 409 }
            );
        }

        // Create employee
        const employee = new Employee(validationResult.data);
        await employee.save();

        return NextResponse.json(employee, { status: 201 });
    } catch (error) {
        console.error('Error creating employee:', error);
        return NextResponse.json(
            { error: 'Failed to create employee' },
            { status: 500 }
        );
    }
}
