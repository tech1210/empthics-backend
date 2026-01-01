import { Schema, model } from 'mongoose';

const LeaveSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },

    orgId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      required: true,
    },

    reason: {
      type: String,
      required: true,
    },

    // Approved, Pending, Rejected
    status: {
      type: String,
      default: 'Approved',
    },
  },
  { timestamps: true }
);

const Leave = model('Leave', LeaveSchema);

export default Leave;
