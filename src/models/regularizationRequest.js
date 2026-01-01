import { Schema, model } from 'mongoose';

const RegularizationRequestSchema = new Schema(
  {
    employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    orgId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    attendance: { type: Schema.Types.ObjectId, ref: 'Attendance' },

    date: { type: Date, required: true },
    reason: { type: String, required: true },

    // Original times
    originalInTime: { type: Date },
    originalOutTime: { type: Date },

    // Requested new times
    requestedInTime: { type: Date, required: true },
    requestedOutTime: { type: Date, required: true },

    status: {
      type: String,
      enum: ['Pending', 'Accepted', 'Rejected'],
      default: 'Pending',
    },

    remarks: { type: String },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

const RegularizationRequest = model(
  'RegularizationRequest',
  RegularizationRequestSchema
);
export default RegularizationRequest;
