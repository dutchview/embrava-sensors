import mongoose, { Schema, Document, Model } from 'mongoose';

// Booking subdocument interface
export interface IBooking {
  id: string;
  startTime: Date | null;
  endTime: Date | null;
  badgeNumber: string;
  employeeId: string;
  action: 'CREATE' | 'UPDATE' | 'CHECKIN' | 'CHECKOUT' | 'CLEANED';
  deskId: string;
}

// Status subdocument interface
export interface IStatus {
  state: 'AVAILABLE' | 'AWAY' | 'BUSY' | 'DND' | 'ONCALL' | 'OFFLINE';
  value: number;
}

// Main Event interface
export interface IEvent extends Document {
  dateCreated: Date;
  deskSignId: string;
  booking: IBooking | null;
  status: IStatus | null;
  rawPayload: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

// Booking subdocument schema
const BookingSchema = new Schema<IBooking>(
  {
    id: { type: String, default: '' },
    startTime: { type: Date, default: null },
    endTime: { type: Date, default: null },
    badgeNumber: { type: String, default: '' },
    employeeId: { type: String, default: '' },
    action: {
      type: String,
      enum: ['CREATE', 'UPDATE', 'CHECKIN', 'CHECKOUT', 'CLEANED'],
      required: true,
    },
    deskId: { type: String, default: '' },
  },
  { _id: false }
);

// Status subdocument schema
const StatusSchema = new Schema<IStatus>(
  {
    state: {
      type: String,
      enum: ['AVAILABLE', 'AWAY', 'BUSY', 'DND', 'ONCALL', 'OFFLINE'],
      required: true,
    },
    value: { type: Number, min: 0, max: 5, required: true },
  },
  { _id: false }
);

// Main Event schema
const EventSchema = new Schema<IEvent>(
  {
    dateCreated: { type: Date, required: true, index: true },
    deskSignId: { type: String, required: true, index: true },
    booking: { type: BookingSchema, default: null },
    status: { type: StatusSchema, default: null },
    rawPayload: { type: Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: true,
    collection: 'events',
  }
);

// Compound index for efficient queries
EventSchema.index({ dateCreated: -1, deskSignId: 1 });

// Prevent model recompilation in development
export const Event: Model<IEvent> =
  mongoose.models.Event || mongoose.model<IEvent>('Event', EventSchema);
