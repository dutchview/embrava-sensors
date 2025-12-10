import mongoose, { Schema, Document, Model } from 'mongoose';

// Day availability tuple: [enabled: "true"|"false", startTime: "HH:mm:ss", endTime: "HH:mm:ss"]
export type DayAvailability = [string, string, string];

// Main Workplace interface
export interface IWorkplace extends Document {
  deskId: string;
  deskSignId: string;
  deskName: string;
  neighborhood: string;
  floor: string;
  building: string;
  timezone: string;
  mon: DayAvailability;
  tue: DayAvailability;
  wed: DayAvailability;
  thu: DayAvailability;
  fri: DayAvailability;
  sat: DayAvailability;
  sun: DayAvailability;
  createdAt: Date;
  updatedAt: Date;
}

// Validator for day availability array
const dayAvailabilityValidator = {
  validator: (v: string[]) => v.length === 3,
  message: 'Day availability must have exactly 3 elements: [enabled, startTime, endTime]',
};

// Default day availability (disabled)
const defaultDayAvailability: DayAvailability = ['false', '00:00:00', '23:59:00'];

// Default working hours (enabled, all day)
const defaultWorkingHours: DayAvailability = ['true', '00:00:00', '23:59:00'];

// Day availability schema options
const DayAvailabilitySchemaOptions = {
  type: [String],
  validate: dayAvailabilityValidator,
  default: defaultDayAvailability,
};

const WorkplaceSchema = new Schema<IWorkplace>(
  {
    deskId: {
      type: String,
      required: true,
      unique: true,
      default: () => new mongoose.Types.ObjectId().toString(),
    },
    deskSignId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    deskName: { type: String, required: true },
    neighborhood: { type: String, default: '' },
    floor: { type: String, default: '' },
    building: { type: String, default: '' },
    timezone: { type: String, default: 'Europe/Amsterdam' },
    mon: { ...DayAvailabilitySchemaOptions, default: defaultWorkingHours },
    tue: { ...DayAvailabilitySchemaOptions, default: defaultWorkingHours },
    wed: { ...DayAvailabilitySchemaOptions, default: defaultWorkingHours },
    thu: { ...DayAvailabilitySchemaOptions, default: defaultWorkingHours },
    fri: { ...DayAvailabilitySchemaOptions, default: defaultWorkingHours },
    sat: { ...DayAvailabilitySchemaOptions, default: defaultWorkingHours },
    sun: { ...DayAvailabilitySchemaOptions, default: defaultWorkingHours },
  },
  {
    timestamps: true,
    collection: 'workplaces',
  }
);

// Prevent model recompilation in development
export const Workplace: Model<IWorkplace> =
  mongoose.models.Workplace || mongoose.model<IWorkplace>('Workplace', WorkplaceSchema);
