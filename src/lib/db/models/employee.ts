import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IEmployee extends Document {
    firstName: string;
    lastName: string;
    email: string;
    employeeId: string;
    badgeNumber: string;
    createdAt: Date;
    updatedAt: Date;
}

const EmployeeSchema = new Schema<IEmployee>(
    {
        firstName: {
            type: String,
            required: true,
            trim: true,
        },
        lastName: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
            index: true,
        },
        employeeId: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            index: true,
        },
        badgeNumber: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            index: true,
        },
    },
    {
        timestamps: true,
        collection: 'employees',
    }
);

// Prevent model recompilation in development
export const Employee: Model<IEmployee> =
    mongoose.models.Employee || mongoose.model<IEmployee>('Employee', EmployeeSchema);
