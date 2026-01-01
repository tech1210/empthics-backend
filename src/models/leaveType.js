import { Schema, model } from 'mongoose';

const LeaveTypeSchema = new Schema(
  {
    orgId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    name: { type: String, required: true }, // Privilege Leave
    code: { type: String, required: true }, // PL
    description: String,

    annualQuota: { type: Number, default: 0 },

    expiryPeriod: {
      type: String,
      enum: ['YEARLY', 'QUARTERLY', 'MONTHLY'],
      default: 'YEARLY',
    },

    carryForward: {
      enabled: { type: Boolean, default: false },
      maxDays: { type: Number, default: 0 },
    },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const LeaveType = model('LeaveType', LeaveTypeSchema);

export default LeaveType;
